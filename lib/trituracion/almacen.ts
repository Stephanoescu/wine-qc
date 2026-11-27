// ============================================================
// Almacén de registros de trituración (localStorage, clave
// "wine_qc_trituraciones"). Un registro por lote de Recepción.
// Los componentes acceden solo a través de estas funciones.
// ============================================================
import { escribirLista, leerLista, tieneId, type Resultado } from "@/lib/almacen/local";
import { registrarEliminaciones } from "@/lib/recepcion/almacen";
import { borrarFotos } from "@/lib/recepcion/fotos";
import type { EstadoRegistro, RegistroTrituracion } from "./tipos";

export type { Resultado } from "@/lib/almacen/local";

export const CLAVE_TRITURACIONES = "wine_qc_trituraciones";

export type EstadoTrituracion = EstadoRegistro;

export interface VinculoTrituracion {
  id: string;
  loteId: string;
  estado: EstadoTrituracion;
}

function esRegistro(x: unknown): x is RegistroTrituracion {
  return tieneId(x) && typeof (x as { loteId?: unknown }).loteId === "string";
}

/** Más recientes primero. */
export function getRegistros(): RegistroTrituracion[] {
  return leerLista(CLAVE_TRITURACIONES, esRegistro).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export function getRegistro(id: string): RegistroTrituracion | null {
  return getRegistros().find((r) => r.id === id) ?? null;
}

export function getRegistroPorLote(loteId: string): RegistroTrituracion | null {
  return getRegistros().find((r) => r.loteId === loteId) ?? null;
}

/** Registro de trituración vinculado a un lote de Recepción (hay uno como máximo). */
export function trituracionDeLote(loteId: string): VinculoTrituracion | null {
  const r = getRegistroPorLote(loteId);
  return r ? { id: r.id, loteId: r.loteId, estado: r.estado } : null;
}

/** Crea o actualiza un registro. Rechaza un segundo registro para el mismo lote. */
export function saveRegistro(r: RegistroTrituracion): Resultado {
  const todos = getRegistros();
  const otroDelLote = todos.find((x) => x.loteId === r.loteId && x.id !== r.id);
  if (otroDelLote) return { ok: false, error: `El lote ${r.codigoLote} ya tiene un registro de trituración.` };
  return escribirLista(CLAVE_TRITURACIONES, [r, ...todos.filter((x) => x.id !== r.id)]);
}

/** Elimina el registro y sus fotos, y deja el motivo en la bitácora de eliminaciones. */
export function deleteRegistro(id: string, motivo: string, ahora: string): Resultado {
  const todos = getRegistros();
  const r = todos.find((x) => x.id === id);
  if (!r) return { ok: false, error: "El registro ya no existe en este dispositivo." };
  const res = escribirLista(
    CLAVE_TRITURACIONES,
    todos.filter((x) => x.id !== id),
  );
  if (!res.ok) return res;
  registrarEliminaciones([{ id: r.id, codigoLote: r.codigoLote, estado: r.estado, modulo: "trituracion", motivo: motivo.trim(), fecha: ahora }]);
  const fotos = r.salida.controles.flatMap((c) => c.fotoIds);
  if (fotos.length) borrarFotos(fotos).catch(() => {});
  return res;
}

/** Sustituye todos los registros (importación de respaldo). */
export function reemplazarRegistros(rs: RegistroTrituracion[]): Resultado {
  return escribirLista(CLAVE_TRITURACIONES, rs);
}
