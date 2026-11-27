// ============================================================
// Qué lotes de Recepción se pueden entregar a Trituración (actividad 1).
// ============================================================
import { esLegacy, type LoteAlmacenado } from "@/lib/recepcion/tipos";

export type Elegibilidad = { ok: true } | { ok: false; motivo: string };

/**
 * Solo un lote LIBERADO (incluido «Liberado con observaciones») con disposición
 * firmada y peso disponible no provisional.
 */
export function elegibilidad(l: LoteAlmacenado): Elegibilidad {
  if (esLegacy(l)) return { ok: false, motivo: "Formato anterior: sin peso disponible" };
  if (l.estado !== "LIBERADO") return { ok: false, motivo: l.estado };
  if (!l.disposicion || !l.disposicion.nombre.trim() || !l.disposicion.destino.trim()) {
    return { ok: false, motivo: "Sin disposición firmada" };
  }
  if (!l.pesoDisponible || l.pesoDisponible.provisional) {
    return { ok: false, motivo: "Peso disponible provisional (tara pendiente)" };
  }
  return { ok: true };
}
