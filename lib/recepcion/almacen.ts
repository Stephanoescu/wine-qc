// ============================================================
// Almacén de lotes en localStorage (clave "wine_qc_lotes", la misma
// de la versión anterior: conviven lotes v2 y lotes en formato A/B/C).
// Las fotos viven en IndexedDB (ver fotos.ts). Solo en el cliente.
// ============================================================
import { escribirLista, leerLista, tieneId, type Resultado } from "@/lib/almacen/local";
import { borrarFotos } from "./fotos";
import { normalizarLoteV2 } from "./lote";
import { estadoLegacy } from "./reporte";
import { esLegacy, type EntradaEliminacion, type LoteAlmacenado, type LoteV2 } from "./tipos";

export type { Resultado } from "@/lib/almacen/local";

const CLAVE_LOTES = "wine_qc_lotes";
const CLAVE_ELIMINACIONES = "wine_qc_eliminaciones";

function esLoteValido(x: unknown): x is LoteAlmacenado {
  return tieneId(x);
}

/** Todos los lotes; los v2 se normalizan (peso disponible y bitácora en lotes anteriores). */
export function getLotes(): LoteAlmacenado[] {
  return leerLista(CLAVE_LOTES, esLoteValido).map((l) => (esLegacy(l) ? l : normalizarLoteV2(l)));
}

export function getLote(id: string): LoteAlmacenado | null {
  return getLotes().find((l) => l.id === id) ?? null;
}

function escribir(lotes: LoteAlmacenado[]): Resultado {
  return escribirLista(CLAVE_LOTES, lotes);
}

export function normalizarCodigo(c: string): string {
  return c.trim().toUpperCase();
}

/** ¿Hay otro lote con este código? (ignora mayúsculas y espacios) */
export function existeCodigo(codigo: string, exceptoId?: string): boolean {
  const c = normalizarCodigo(codigo);
  if (!c) return false;
  return getLotes().some((l) => l.id !== exceptoId && normalizarCodigo(l.codigoLote ?? "") === c);
}

/** Guarda un lote nuevo. Rechaza códigos de lote repetidos. */
export function saveLote(lote: LoteV2): Resultado {
  if (existeCodigo(lote.codigoLote, lote.id)) {
    return { ok: false, error: `Ya existe un lote con el código «${lote.codigoLote}».` };
  }
  return escribir([lote, ...getLotes().filter((l) => l.id !== lote.id)]);
}

/** Reemplaza un lote existente (mismo id). */
export function updateLote(lote: LoteV2): Resultado {
  const lotes = getLotes();
  const i = lotes.findIndex((l) => l.id === lote.id);
  if (i < 0) return { ok: false, error: "El lote ya no existe en este dispositivo." };
  if (existeCodigo(lote.codigoLote, lote.id)) {
    return { ok: false, error: `Ya existe otro lote con el código «${lote.codigoLote}».` };
  }
  lotes[i] = lote;
  return escribir(lotes);
}

/** Elimina el lote y sus fotos, y deja el motivo en la bitácora de eliminaciones. */
export function deleteLote(id: string, motivo: string, ahora: string): Resultado {
  const lotes = getLotes();
  const lote = lotes.find((l) => l.id === id);
  if (!lote) return { ok: false, error: "El lote ya no existe en este dispositivo." };
  const r = escribir(lotes.filter((l) => l.id !== id));
  if (!r.ok) return r;
  registrarEliminaciones([
    {
      id: lote.id,
      codigoLote: lote.codigoLote,
      estado: esLegacy(lote) ? estadoLegacy(lote) : lote.estado,
      motivo: motivo.trim(),
      fecha: ahora,
    },
  ]);
  if (!esLegacy(lote)) borrarFotos(fotosDelLote(lote)).catch(() => {});
  return r;
}

// ─────────────────────────────────────────
// Bitácora de eliminaciones
// ─────────────────────────────────────────
function esEliminacion(x: unknown): x is EntradaEliminacion {
  const e = x as Partial<EntradaEliminacion> | null;
  return !!e && typeof e.id === "string" && typeof e.codigoLote === "string" && typeof e.fecha === "string";
}

/** Más recientes primero. */
export function getEliminaciones(): EntradaEliminacion[] {
  return leerLista(CLAVE_ELIMINACIONES, esEliminacion).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** Agrega entradas a la bitácora sin duplicar (mismo lote y fecha). */
export function registrarEliminaciones(nuevas: EntradaEliminacion[]): void {
  const actuales = getEliminaciones();
  const claves = new Set(actuales.map((e) => `${e.id}|${e.fecha}`));
  const agregar = nuevas.filter((e) => esEliminacion(e) && !claves.has(`${e.id}|${e.fecha}`));
  if (agregar.length === 0) return;
  // Si no hay espacio, el lote ya se eliminó; la bitácora es auxiliar.
  escribirLista(CLAVE_ELIMINACIONES, [...agregar, ...actuales]);
}

/** Sustituye todos los lotes (importación de respaldo). */
export function reemplazarLotes(lotes: LoteAlmacenado[]): Resultado {
  return escribir(lotes);
}

export function fotosDelLote(l: LoteV2): string[] {
  return [...l.carga.observaciones.flatMap((o) => o.fotoIds ?? []), ...l.cajas.parametros.flatMap((p) => p.fotoIds)];
}
