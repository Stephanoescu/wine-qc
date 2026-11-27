// ============================================================
// Almacén de registros de trituración (localStorage).
// Fase 1: solo la consulta del vínculo con Recepción; la Fase 2
// agrega el modelo completo y la escritura.
// ============================================================
import { leerLista, tieneId } from "@/lib/almacen/local";

export const CLAVE_TRITURACIONES = "wine_qc_trituraciones";

export type EstadoTrituracion = "EN_CURSO" | "CERRADO" | "CERRADO_CON_RETENIDOS";

export interface VinculoTrituracion {
  id: string;
  loteId: string;
  estado: EstadoTrituracion;
}

function esVinculo(x: unknown): x is VinculoTrituracion {
  return tieneId(x) && typeof (x as { loteId?: unknown }).loteId === "string";
}

/** Registro de trituración vinculado a un lote de Recepción (hay uno como máximo). */
export function trituracionDeLote(loteId: string): VinculoTrituracion | null {
  return leerLista(CLAVE_TRITURACIONES, esVinculo).find((r) => r.loteId === loteId) ?? null;
}
