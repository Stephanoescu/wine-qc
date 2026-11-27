// ============================================================
// Paso 5 — Triturar con la configuración correspondiente
// (actividades 7, 8 y 9). Funciones puras.
// ------------------------------------------------------------
// Por cada tanda cerrada, en orden, se trituran sus grupos en la
// secuencia P → M → G, omitiendo los de 0 kg, sin intercalar.
// ============================================================
import { ROL_ENOLOGIA } from "@/lib/config/roles";
import { LIMITES_TRITURACION, SECUENCIA_TRITURACION, type Grupo } from "@/lib/config/trituracion";
import { CHECK_ACT7, CHECK_ACT8 } from "@/lib/config/trituracion-textos";
import { formatear, redondear, validarNumero } from "@/lib/recepcion/validacion";
import { evaluarControl, type ResultadoControl } from "./control";
import { firmaVacia, gapDeGrupo } from "./config-gaps";
import { gruposATriturar, totalesTanda } from "./registro";
import type { ControlApertura, ProcesoGrupo, RegistroTrituracion, Retencion, Tanda, VersionTablaGaps } from "./tipos";

const kgTxt = (n: number) => `${formatear(n, 2)} kg`;

// ─────────────────────────────────────────
// Orden de trabajo
// ─────────────────────────────────────────
export type EstadoGrupoProceso = "completo" | "actual" | "pendiente" | "omitido";

export interface PosicionGrupo {
  tanda: number;
  grupo: Grupo;
  estado: EstadoGrupoProceso;
}

/** Grupos de cada tanda cerrada en el orden de trabajo, con su estado. Solo uno es «actual». */
export function ordenTrituracion(r: RegistroTrituracion): PosicionGrupo[] {
  const out: PosicionGrupo[] = [];
  let actualAsignado = false;
  for (const t of r.tandas) {
    if (!t.cerrada) continue;
    const conKg = new Set(gruposATriturar(t, SECUENCIA_TRITURACION));
    for (const g of SECUENCIA_TRITURACION) {
      if (!conKg.has(g)) {
        out.push({ tanda: t.numero, grupo: g, estado: "omitido" });
        continue;
      }
      if (grupoCompleto(t, g)) out.push({ tanda: t.numero, grupo: g, estado: "completo" });
      else if (!actualAsignado) {
        out.push({ tanda: t.numero, grupo: g, estado: "actual" });
        actualAsignado = true;
      } else out.push({ tanda: t.numero, grupo: g, estado: "pendiente" });
    }
  }
  return out;
}

export function grupoActual(r: RegistroTrituracion): PosicionGrupo | null {
  return ordenTrituracion(r).find((p) => p.estado === "actual") ?? null;
}

// ─────────────────────────────────────────
// Inicio del grupo: gap estándar (actividad 7)
// ─────────────────────────────────────────
export type InicioProceso = { ok: true; proceso: ProcesoGrupo } | { ok: false; motivo: "sin_tabla" | "no_establecido" | "no_aplica" };

/** Proceso nuevo del grupo con la copia del gap de la tabla vigente (la versión queda registrada). */
export function iniciarProceso(vigente: VersionTablaGaps | null, g: Grupo): InicioProceso {
  const gap = gapDeGrupo(vigente, g);
  if (!gap.ok) return { ok: false, motivo: gap.motivo };
  return {
    ok: true,
    proceso: {
      gap: {
        tablaVersionId: gap.version.id,
        tablaVersion: gap.version.version,
        estandarMm: gap.gapMm,
        posicion: gap.posicion,
        aplicadoMm: String(gap.gapMm).replace(".", ","),
        mantenimiento: { nombre: "", rol: "Mantenimiento", fecha: "" },
      },
      checks: {},
      inicio: "",
      fin: "",
      kgTriturados: "",
      controles: [],
      retenciones: [],
    },
  };
}

/** El gap aplicado coincide con el estándar del grupo (el operario no decide otro gap). */
export function gapAplicadoValido(p: ProcesoGrupo): { ok: boolean; error: string | null } {
  const v = validarNumero(p.gap.aplicadoMm, LIMITES_TRITURACION.gapMm);
  if (v.vacio) return { ok: false, error: "Obligatorio" };
  if (v.valor === null) return { ok: false, error: v.error };
  if (Math.abs(v.valor - p.gap.estandarMm) > 1e-9) return { ok: false, error: "distinto" };
  return { ok: true, error: null };
}

// ─────────────────────────────────────────
// Controles y retenciones (actividad 9)
// ─────────────────────────────────────────
export interface ControlEvaluado {
  control: ControlApertura;
  resultado: ResultadoControl;
  /** Último control conforme anterior a este (desde donde se retiene); null = desde el inicio. */
  ultimoConformeAnterior: ControlApertura | null;
  /** Retención que corresponde a este control (si es No conforme / No evaluable). */
  retencion: Retencion | null;
}

export function evaluarControles(p: ProcesoGrupo): ControlEvaluado[] {
  let ultimoConforme: ControlApertura | null = null;
  return p.controles.map((c) => {
    const resultado = evaluarControl(c).resultado;
    const ev: ControlEvaluado = {
      control: c,
      resultado,
      ultimoConformeAnterior: ultimoConforme,
      retencion: p.retenciones.find((x) => x.controlId === c.id) ?? null,
    };
    if (resultado === "conforme") ultimoConforme = c;
    return ev;
  });
}

export function retencionNueva(id: string, origen: Retencion["origen"], extra: Partial<Retencion> = {}): Retencion {
  return {
    id,
    origen,
    desdeControlId: "",
    kg: "",
    recipientes: "",
    descripcion: "",
    accion: null,
    correccion: "",
    conformidadProduccion: { nombre: "", rol: "Producción", fecha: "" },
    disposicion: { decision: null, texto: "", firma: { ...firmaVacia(), rol: ROL_ENOLOGIA } },
    ...extra,
  };
}

/** Qué falta en una retención para poder continuar. */
export function faltantesRetencion(rt: Retencion): string[] {
  const f: string[] = [];
  const kg = validarNumero(rt.kg, LIMITES_TRITURACION.kgTriturados);
  if (kg.valor === null) f.push("kg retenidos");
  if (!rt.recipientes.trim()) f.push("recipientes retenidos");
  if (rt.origen === "perdida_identificacion" && !rt.descripcion.trim()) f.push("descripción de la salida afectada");
  if (rt.origen === "control") {
    if (!rt.accion) f.push("acción (Revisión, Ajustar gap o Detener)");
    if (!rt.correccion.trim()) f.push("corrección");
    if (rt.accion === "ajuste_gap") {
      if (validarNumero(rt.ajusteGap?.nuevoMm ?? "", LIMITES_TRITURACION.gapMm).valor === null) f.push("nuevo gap (mm)");
      if (!rt.ajusteGap?.mantenimiento.nombre.trim()) f.push("Mantenimiento que ajustó el gap");
    }
  }
  if (!rt.conformidadProduccion.nombre.trim()) f.push("conformidad de Producción");
  if (!rt.disposicion.decision) f.push("decisión de Calidad o Enología (autorizar o no la entrega)");
  if (!rt.disposicion.texto.trim()) f.push("disposición del material retenido");
  if (!rt.disposicion.firma.nombre.trim()) f.push("firma de Calidad o Enología");
  return f;
}

// ─────────────────────────────────────────
// Evaluación del grupo
// ─────────────────────────────────────────
export interface EvaluacionProceso {
  completo: boolean;
  faltantes: string[];
  kgClasificado: number;
  kgTriturados: number | null;
  kgRetenidos: number;
  /** Retenido sin autorización de entrega (no se puede entregar). */
  kgRetenidoNoAutorizado: number;
  /** kg que se pueden entregar: triturado − retenido no autorizado. */
  kgEntregable: number;
  errorKg: string | null;
  errorGap: string | null;
  controles: ControlEvaluado[];
  /** Ajustes de gap registrados por Mantenimiento (desviaciones respecto de la tabla). */
  desviaciones: { nuevoMm: number; mantenimiento: string }[];
}

export function evaluarProceso(t: Tanda, g: Grupo): EvaluacionProceso {
  const kgClasificado = totalesTanda(t).grupos[g];
  const p = t.proceso[g];
  const vacio: EvaluacionProceso = {
    completo: false,
    faltantes: ["Inicie el grupo"],
    kgClasificado,
    kgTriturados: null,
    kgRetenidos: 0,
    kgRetenidoNoAutorizado: 0,
    kgEntregable: 0,
    errorKg: null,
    errorGap: null,
    controles: [],
    desviaciones: [],
  };
  if (!p) return vacio;

  const f: string[] = [];
  // Actividad 7
  const n7 = CHECK_ACT7.filter((i) => p.checks[i.id]).length;
  if (n7 < CHECK_ACT7.length) f.push(`Marque los ítems de «Aplicar el gap estándar» (${n7} de ${CHECK_ACT7.length})`);
  if (!p.gap.mantenimiento.nombre.trim()) f.push("Indique el Mantenimiento que aplicó el gap");
  const gv = gapAplicadoValido(p);
  const errorGap = gv.error === "distinto" ? "distinto" : gv.error;
  if (!gv.ok) f.push(gv.error === "distinto" ? "El gap aplicado debe ser el estándar de la tabla vigente" : "Registre el gap aplicado");

  // Actividad 8
  const n8 = CHECK_ACT8.filter((i) => p.checks[i.id]).length;
  if (n8 < CHECK_ACT8.length) f.push(`Marque los ítems de «Triturar las uvas del grupo» (${n8} de ${CHECK_ACT8.length})`);
  const kg = validarNumero(p.kgTriturados, LIMITES_TRITURACION.kgTriturados);
  let errorKg = kg.vacio ? null : kg.error;
  if (kg.valor !== null && kg.valor > kgClasificado + 1e-9) {
    errorKg = `No puede superar los kg clasificados del grupo (${kgTxt(kgClasificado)})`;
  }
  if (kg.vacio) f.push("Registre los kg triturados");
  else if (errorKg) f.push("Corrija los kg triturados");
  if (!p.inicio || !p.fin) f.push("Registre la hora de inicio y de fin");

  // Actividad 9
  const controles = evaluarControles(p);
  if (!p.controles.some((c) => c.momento === "inicio")) f.push("Registre el control de inicio");
  if (controles.some((c) => c.resultado === "incompleto")) f.push("Complete los controles registrados");
  for (const c of controles) {
    if (c.resultado === "no_conforme" || c.resultado === "no_evaluable") {
      if (!c.retencion) f.push(`Control de las ${c.control.hora || "—"}: registre el material retenido`);
    }
  }
  const ultimo = controles[controles.length - 1];
  if (!ultimo || ultimo.control.momento !== "final" || ultimo.resultado !== "conforme") {
    f.push("El último control debe ser el control final con resultado Conforme (repita el control tras corregir)");
  }

  // Retenciones (controles y pérdida de identificación)
  let kgRetenidos = 0;
  let kgRetenidoNoAutorizado = 0;
  for (const rt of p.retenciones) {
    const falta = faltantesRetencion(rt);
    if (falta.length) f.push(`Retención: complete ${falta.join(", ")}`);
    const v = validarNumero(rt.kg, LIMITES_TRITURACION.kgTriturados).valor ?? 0;
    kgRetenidos += v;
    if (rt.disposicion.decision !== "autorizar_entrega") kgRetenidoNoAutorizado += v;
  }
  kgRetenidos = redondear(kgRetenidos);
  kgRetenidoNoAutorizado = redondear(kgRetenidoNoAutorizado);
  if (kg.valor !== null && kgRetenidos > kg.valor + 1e-9) f.push("Los kg retenidos no pueden superar los kg triturados");

  const desviaciones = p.retenciones
    .filter((rt) => rt.accion === "ajuste_gap" && rt.ajusteGap)
    .map((rt) => ({
      nuevoMm: validarNumero(rt.ajusteGap!.nuevoMm, LIMITES_TRITURACION.gapMm).valor ?? 0,
      mantenimiento: rt.ajusteGap!.mantenimiento.nombre,
    }));

  const kgTriturados = errorKg ? null : kg.valor;
  return {
    completo: f.length === 0,
    faltantes: [...new Set(f)],
    kgClasificado,
    kgTriturados,
    kgRetenidos,
    kgRetenidoNoAutorizado,
    kgEntregable: kgTriturados === null ? 0 : Math.max(0, redondear(kgTriturados - kgRetenidoNoAutorizado)),
    errorKg,
    errorGap,
    controles,
    desviaciones,
  };
}

/** Un grupo está completo: gap aplicado, kg triturados, control de inicio y final conforme y retenciones resueltas. */
export function grupoCompleto(t: Tanda, g: Grupo): boolean {
  return evaluarProceso(t, g).completo;
}
