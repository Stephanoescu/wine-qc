// ============================================================
// Paso 6 — Entregar el producto y cerrar la operación (actividad 10).
// ============================================================
import { LIMITES_TRITURACION, SECUENCIA_TRITURACION, type Grupo } from "@/lib/config/trituracion";
import { CHECK_ACT10, CHECK_LIMPIEZA } from "@/lib/config/trituracion-textos";
import type { EstadoPaso } from "@/lib/recepcion/pasos";
import { formatear, redondear, validarNumero } from "@/lib/recepcion/validacion";
import { sellarFirmas } from "./firmas";
import { estadoPasoT1, estadoPasoT2, estadoPasoT3, estadoPasoT4, estadoPasoT5 } from "./pasos";
import { evaluarProceso } from "./proceso";
import type { EstadoRegistro, RegistroTrituracion } from "./tipos";

export interface SalidaEntregable {
  tanda: number;
  grupo: Grupo;
  triturado: number;
  /** Retenido sin autorización de entrega. */
  retenidoNoAutorizado: number;
  /** Lo que se puede entregar (salida autorizada). */
  entregable: number;
  entregado: number;
}

/** Salida de cada grupo triturado, por tanda y en el orden de trabajo. */
export function salidasEntregables(r: RegistroTrituracion): SalidaEntregable[] {
  const out: SalidaEntregable[] = [];
  for (const t of r.tandas) {
    for (const g of SECUENCIA_TRITURACION) {
      if (!t.proceso[g]) continue;
      const ev = evaluarProceso(t, g);
      const entregado = redondear(
        r.entrega.entregas
          .filter((e) => e.tanda === t.numero && e.grupo === g)
          .reduce((s, e) => s + (validarNumero(e.kg, LIMITES_TRITURACION.kgTriturados).valor ?? 0), 0),
      );
      out.push({
        tanda: t.numero,
        grupo: g,
        triturado: ev.kgTriturados ?? 0,
        retenidoNoAutorizado: ev.kgRetenidoNoAutorizado,
        entregable: ev.kgEntregable,
        entregado,
      });
    }
  }
  return out;
}

const kg = (n: number) => `${formatear(n, 2)} kg`;

function faltaLista(nombre: string, items: { id: string }[], checks: Record<string, boolean>): string | null {
  const n = items.filter((i) => checks[i.id]).length;
  return n === items.length ? null : `Marque todos los ítems de «${nombre}» (${n} de ${items.length})`;
}

/** Pasos 1 a 5 válidos (en la edición del informe se puede saltar entre pasos). */
export function pasosPreviosValidos(r: RegistroTrituracion): string[] {
  const nombres = ["Recibir lote", "Despalillar", "Salida del despalillado", "Clasificación", "Trituración"];
  return [estadoPasoT1, estadoPasoT2, estadoPasoT3, estadoPasoT4, estadoPasoT5]
    .map((f, i) => (f(r).valido ? null : `Revise el paso ${i + 1} (${nombres[i]})`))
    .filter((x): x is string => x !== null);
}

export function estadoPasoT6(r: RegistroTrituracion): EstadoPaso {
  const f: string[] = [...pasosPreviosValidos(r)];
  const l10 = faltaLista("Entregar el producto y cerrar la operación", CHECK_ACT10, r.checks);
  if (l10) f.push(l10);

  // Entregas: solo la salida autorizada; lo retenido sin disposición no se entrega.
  const salidas = salidasEntregables(r);
  for (const s of salidas) {
    const entregas = r.entrega.entregas.filter((e) => e.tanda === s.tanda && e.grupo === s.grupo);
    if (s.entregable > 0 && entregas.length === 0) f.push(`Registre la entrega de la tanda ${s.tanda}, grupo ${s.grupo}`);
    if (s.entregable <= 0 && entregas.length > 0) f.push(`Tanda ${s.tanda}, grupo ${s.grupo}: no hay salida autorizada para entregar`);
    if (s.entregado > s.entregable + 1e-9) {
      f.push(`Tanda ${s.tanda}, grupo ${s.grupo}: lo entregado (${kg(s.entregado)}) supera la salida autorizada (${kg(s.entregable)})`);
    }
  }
  for (const e of r.entrega.entregas) {
    const v = validarNumero(e.kg, LIMITES_TRITURACION.kgTriturados);
    if (v.valor === null || !e.hora || !e.destino.trim()) {
      f.push("Complete cantidad, hora y destino de cada entrega");
      break;
    }
  }

  const d = r.entrega.disposicionPorciones;
  if (!d.texto.trim() || !d.firma.nombre.trim()) f.push("Registre la disposición de Calidad o Enología de las porciones examinadas y las pruebas");

  const lim = faltaLista("Cierre de limpieza", CHECK_LIMPIEZA, r.checks);
  if (lim) f.push(lim);
  const li = r.entrega.limpieza;
  if (!li.responsable.nombre.trim() || !li.responsable.rol || !li.hora) f.push("Complete el responsable y la hora de la limpieza");
  if (!r.entrega.cierre.nombre.trim()) f.push("Indique quién cierra la operación (Producción)");
  return { valido: f.length === 0, faltantes: [...new Set(f)] };
}

/** Estado al cerrar: con retenidos si queda material retenido sin autorizar su entrega. */
export function estadoDeCierre(r: RegistroTrituracion): Exclude<EstadoRegistro, "EN_CURSO"> {
  return salidasEntregables(r).some((s) => s.retenidoNoAutorizado > 0) ? "CERRADO_CON_RETENIDOS" : "CERRADO";
}

/** Cierra la operación: sella las firmas y fija el estado final. */
export function cerrarRegistro(r: RegistroTrituracion, ahora: string): RegistroTrituracion {
  const e = estadoPasoT6(r);
  if (!e.valido) throw new Error(e.faltantes[0] ?? "Faltan datos para cerrar la operación.");
  return sellarFirmas({ ...r, estado: estadoDeCierre(r), cerradoEn: ahora, updatedAt: ahora }, ahora);
}
