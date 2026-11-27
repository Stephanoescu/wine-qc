// ============================================================
// Edición del informe de trituración (misma regla que Recepción A6):
// editado por, rol y motivo obligatorios; bitácora campo por campo;
// se recalcula el estado del registro. Funciones puras.
// ============================================================
import { GRUPOS, SECUENCIA_TRITURACION } from "@/lib/config/trituracion";
import type { Rol } from "@/lib/config/roles";
import type { CambioSinFirma } from "@/lib/recepcion/lote";
import { evaluarControl } from "./control";
import { estadoDeCierre, estadoPasoT6 } from "./cierre";
import { sellarFirmas } from "./firmas";
import { evaluarRecipiente, NOMBRE_FRACCION } from "./registro";
import type { FirmaRol, RegistroTrituracion } from "./tipos";

const firmaTxt = (f: FirmaRol) => (f.nombre.trim() ? `${f.nombre}${f.rol ? ` (${f.rol})` : ""}` : "—");
const siNo = (b: boolean | null) => (b === null ? "—" : b ? "Sí" : "No");

/** «campo → valor legible» de los datos registrados (para la bitácora). */
export function camposRegistro(r: RegistroTrituracion): Map<string, string> {
  const m = new Map<string, string>();
  const put = (k: string, v: string | number | null | undefined) => m.set(k, v === null || v === undefined || v === "" ? "—" : String(v));

  put("Registro A · hora de entrega", r.recepcion.horaEntrega);
  put("Registro A · recibe", firmaTxt(r.recepcion.recibe));
  put("Registro A · entregado por", firmaTxt(r.recepcion.entregadoPor));

  put("Despalillado · atasco, ruido o vibración", siNo(r.despalillado.anomalia));
  r.despalillado.incidencias.forEach((i, n) => put(`Incidencia ${n + 1}`, `${i.hora} · ${i.descripcion} · Mantenimiento: ${i.mantenimiento}`));

  r.salida.controles.forEach((c, n) => {
    const partes = [
      c.hora,
      c.resultado === "fruta_rota" ? `Fruta rota (${c.comentarioFrutaRota})` : c.resultado === "conforme" ? "Fruta conforme" : "—",
      `tallos: ${siNo(c.tallosObservados)}`,
    ];
    if (c.danio) partes.push(`daño: ${c.danio}`);
    if (c.detencion.solicitada) partes.push(`detenido; corrección: ${c.detencion.correccion}`);
    if (c.verificaProduccion.nombre) partes.push(`verifica: ${firmaTxt(c.verificaProduccion)}`);
    partes.push(`${c.fotoIds.length} foto(s)`);
    put(`Control de salida ${n + 1}`, partes.join(" · "));
  });

  for (const t of r.tandas) {
    const T = `Tanda ${t.numero}`;
    put(`${T} · estado`, t.cerrada ? "Cerrada" : "Abierta");
    for (const g of GRUPOS) {
      const d = t.grupos[g];
      if (d.noAparecio) put(`${T} · ${g}`, "No apareció (0 kg)");
      d.recipientes.forEach((rc, k) => {
        const e = evaluarRecipiente(rc);
        put(`${T} · ${g} · recipiente ${k + 1}`, `${rc.identificador} · bruto ${rc.brutoKg} − tara ${rc.taraKg} = ${e.neto ?? "—"} kg · ${rc.hora}`);
      });
    }
    t.fracciones.forEach((f, k) => put(`${T} · fracción ${k + 1}`, `${NOMBRE_FRACCION[f.tipo]} ${f.kg} kg · ${f.recipiente || "—"} · ${f.hora}`));
    for (const g of SECUENCIA_TRITURACION) {
      const p = t.proceso[g];
      if (!p) continue;
      const P = `${T} · grupo ${g}`;
      put(`${P} · gap aplicado`, `${p.gap.aplicadoMm} mm (estándar ${p.gap.estandarMm}, tabla v${p.gap.tablaVersion})`);
      put(`${P} · Mantenimiento`, firmaTxt(p.gap.mantenimiento));
      put(`${P} · kg triturados`, p.kgTriturados);
      put(`${P} · inicio`, p.inicio);
      put(`${P} · fin`, p.fin);
      p.controles.forEach((c, k) => {
        const res = evaluarControl(c).resultado;
        const datos = c.noEvaluable
          ? "No evaluable"
          : `${c.abiertas}/${c.bayasRevisadas} abiertas, ${c.enteras} enteras, ${c.semillasDaniadas}/${c.semillasRevisadas} semillas dañadas`;
        put(`${P} · control ${k + 1}`, `${c.momento} ${c.hora} · ${datos} · ${res}`);
      });
      p.retenciones.forEach((rt, k) => {
        const partes = [`${rt.kg} kg`, rt.recipientes, rt.accion ?? rt.origen];
        if (rt.correccion) partes.push(`corrección: ${rt.correccion}`);
        if (rt.ajusteGap) partes.push(`ajuste a ${rt.ajusteGap.nuevoMm} mm por ${rt.ajusteGap.mantenimiento.nombre}`);
        partes.push(`Producción: ${firmaTxt(rt.conformidadProduccion)}`);
        partes.push(`Calidad: ${rt.disposicion.decision ?? "—"} · ${rt.disposicion.texto} · ${firmaTxt(rt.disposicion.firma)}`);
        put(`${P} · retención ${k + 1}`, partes.join(" · "));
      });
    }
  }

  r.entrega.entregas.forEach((e, k) => put(`Entrega ${k + 1}`, `Tanda ${e.tanda} · ${e.grupo} · ${e.kg} kg · ${e.hora} · ${e.destino}`));
  put("Disposición de porciones examinadas y pruebas", `${r.entrega.disposicionPorciones.texto} · ${firmaTxt(r.entrega.disposicionPorciones.firma)}`);
  put("Limpieza · responsable", firmaTxt(r.entrega.limpieza.responsable));
  put("Limpieza · hora", r.entrega.limpieza.hora);
  put("Cierre · Producción", firmaTxt(r.entrega.cierre));
  put("Estado", r.estado);
  return m;
}

export function diffRegistro(antes: RegistroTrituracion, despues: RegistroTrituracion): CambioSinFirma[] {
  const a = camposRegistro(antes);
  const d = camposRegistro(despues);
  const out: CambioSinFirma[] = [];
  for (const k of new Set([...a.keys(), ...d.keys()])) {
    const va = a.get(k) ?? "—";
    const vd = d.get(k) ?? "—";
    if (va !== vd) out.push({ campo: k, anterior: va, nuevo: vd });
  }
  return out;
}

export interface FirmaEdicionRegistro {
  por: string;
  rol: Rol;
  motivo: string;
}

/** Registro resultante de la edición (sin guardar): estado recalculado y diferencias. */
export function previsualizarEdicionRegistro(antes: RegistroTrituracion, editado: RegistroTrituracion) {
  const recalc: RegistroTrituracion = {
    ...editado,
    bitacora: antes.bitacora,
    estado: antes.estado === "EN_CURSO" ? "EN_CURSO" : estadoDeCierre(editado),
  };
  return { registro: recalc, cambios: diffRegistro(antes, recalc) };
}

/** Faltantes para guardar la edición del informe. */
export function faltantesEdicionRegistro(antes: RegistroTrituracion, editado: RegistroTrituracion, firma: { por: string; rol: Rol | ""; motivo: string }): string[] {
  const f: string[] = [];
  if (antes.estado !== "EN_CURSO") f.push(...estadoPasoT6(editado).faltantes);
  if (previsualizarEdicionRegistro(antes, editado).cambios.length === 0) f.push("No hay cambios que guardar");
  if (!firma.por.trim() || !firma.rol || !firma.motivo.trim()) f.push("Complete Editado por, Rol y Motivo de la edición");
  return [...new Set(f)];
}

/** Aplica la edición: bitácora con la firma, estado recalculado y firmas nuevas selladas. */
export function aplicarEdicionRegistro(
  antes: RegistroTrituracion,
  editado: RegistroTrituracion,
  firma: FirmaEdicionRegistro,
  ahora: string,
): RegistroTrituracion {
  const falta = faltantesEdicionRegistro(antes, editado, firma);
  if (falta.length) throw new Error(falta[0]);
  const { registro, cambios } = previsualizarEdicionRegistro(antes, editado);
  return sellarFirmas(
    {
      ...registro,
      updatedAt: ahora,
      bitacora: [
        ...antes.bitacora,
        ...cambios.map((c) => ({ ...c, por: firma.por.trim(), rol: firma.rol, motivo: firma.motivo.trim(), fecha: ahora })),
      ],
    },
    ahora,
  );
}

/** Fotos del registro (controles de salida). */
export function fotosDelRegistro(r: RegistroTrituracion): string[] {
  return r.salida.controles.flatMap((c) => c.fotoIds);
}
