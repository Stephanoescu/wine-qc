// ============================================================
// Vista común de lotes para /reportes (v2 y formato anterior A/B/C)
// ============================================================
import { RANGOS } from "@/lib/config/recepcion";
import { esLegacy, type EstadoLote, type LoteAlmacenado, type LoteLegacy } from "./tipos";

/** Formato anterior: A → LIBERADO, B → RETENIDO, C → RECHAZADO (sin categoría → RETENIDO). */
export function estadoLegacy(l: LoteLegacy): EstadoLote {
  if (l.categoria === "A") return "LIBERADO";
  if (l.categoria === "C") return "RECHAZADO";
  return "RETENIDO";
}

export interface FilaReporte {
  id: string;
  codigoLote: string;
  proveedor: string;
  origen: string;
  variedad: string;
  fecha: string;
  hora: string;
  numJabas: number | null;
  pesoNeto: number | null;
  pesoParcial: boolean;
  brix: number | null;
  ph: number | null;
  acidez: number | null;
  acidezPendiente: boolean;
  estado: EstadoLote;
  liberadoConObservaciones: boolean;
  /** Lote en formato anterior (A/B/C). */
  legacy: boolean;
  /** Para ordenar: fecha + hora de ingreso. */
  orden: string;
}

function numeroONull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function filaReporte(l: LoteAlmacenado): FilaReporte {
  if (esLegacy(l)) {
    return {
      id: l.id,
      codigoLote: l.codigoLote ?? "—",
      proveedor: l.proveedor ?? "",
      origen: l.procedencia ?? "",
      variedad: l.variedad ?? "",
      fecha: l.fecha ?? "",
      hora: l.hora ?? "",
      numJabas: null,
      pesoNeto: numeroONull(l.peso),
      pesoParcial: false,
      brix: numeroONull(l.brixPromedio),
      ph: numeroONull(l.phPromedio),
      acidez: null,
      acidezPendiente: false,
      estado: estadoLegacy(l),
      liberadoConObservaciones: false,
      legacy: true,
      orden: `${l.fecha ?? ""} ${l.hora ?? ""}`,
    };
  }
  return {
    id: l.id,
    codigoLote: l.codigoLote,
    proveedor: l.proveedor,
    origen: l.origen,
    variedad: l.variedad,
    fecha: l.fecha,
    hora: l.hora,
    numJabas: l.numJabas,
    pesoNeto: l.pesoNeto,
    pesoParcial: l.pesado.parcial,
    brix: l.brixPromedio,
    ph: l.phPromedio,
    acidez: l.acidezValor,
    acidezPendiente: l.acidez.pendiente,
    estado: l.estado,
    liberadoConObservaciones: !!l.liberadoConObservaciones,
    legacy: false,
    orden: `${l.fecha} ${l.hora}`,
  };
}

/** ¿El valor está en rango? null para lotes antiguos (se registraron con otros rangos) o sin valor. */
export function enRango(medida: "brix" | "ph" | "acidez", f: FilaReporte): boolean | null {
  const v = f[medida];
  if (f.legacy || v === null) return null;
  const r = RANGOS[medida];
  return v >= r.min && v <= r.max;
}

export function calcularKPIs(filas: FilaReporte[]) {
  const total = filas.length;
  const liberados = filas.filter((f) => f.estado === "LIBERADO").length;
  const retenidos = filas.filter((f) => f.estado === "RETENIDO").length;
  const rechazados = filas.filter((f) => f.estado === "RECHAZADO").length;
  const totalKg = filas.reduce((s, f) => s + (f.pesoNeto ?? 0), 0);
  const tasaLiberacion = total > 0 ? Math.round((liberados / total) * 100) : 0;
  return { total, liberados, retenidos, rechazados, totalKg, tasaLiberacion };
}
