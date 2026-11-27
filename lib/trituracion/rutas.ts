import type { RegistroTrituracion } from "./tipos";

/** Enlace a un registro: en curso → asistente; cerrado → informe. */
export function enlaceRegistro(r: Pick<RegistroTrituracion, "id" | "estado">): string {
  const id = encodeURIComponent(r.id);
  return r.estado === "EN_CURSO" ? `/trituracion/${id}/registro` : `/trituracion/${id}`;
}

/** Inicio de un registro nuevo para un lote de Recepción. */
export function enlaceNuevoRegistro(loteId: string): string {
  return `/trituracion/nuevo?lote=${encodeURIComponent(loteId)}`;
}
