// ============================================================
// Almacén de lotes en localStorage (clave "wine_qc_lotes", la misma
// de la versión anterior: conviven lotes v2 y lotes en formato A/B/C).
// Las fotos viven en IndexedDB (ver fotos.ts). Solo en el cliente.
// ============================================================
import { borrarFotos } from "./fotos";
import { esLegacy, type LoteAlmacenado, type LoteV2 } from "./tipos";

const CLAVE_LOTES = "wine_qc_lotes";

export type Resultado = { ok: true } | { ok: false; error: string };

function esLoteValido(x: unknown): x is LoteAlmacenado {
  return typeof x === "object" && x !== null && typeof (x as { id?: unknown }).id === "string";
}

export function getLotes(): LoteAlmacenado[] {
  try {
    const raw = localStorage.getItem(CLAVE_LOTES);
    if (!raw) return [];
    const datos: unknown = JSON.parse(raw);
    return Array.isArray(datos) ? datos.filter(esLoteValido) : [];
  } catch {
    return [];
  }
}

export function getLote(id: string): LoteAlmacenado | null {
  return getLotes().find((l) => l.id === id) ?? null;
}

function escribir(lotes: LoteAlmacenado[]): Resultado {
  try {
    localStorage.setItem(CLAVE_LOTES, JSON.stringify(lotes));
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado." };
  }
}

function normalizarCodigo(c: string): string {
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
  lotes[i] = lote;
  return escribir(lotes);
}

/** Elimina el lote y sus fotos. */
export function deleteLote(id: string): Resultado {
  const lotes = getLotes();
  const lote = lotes.find((l) => l.id === id);
  const r = escribir(lotes.filter((l) => l.id !== id));
  if (r.ok && lote && !esLegacy(lote)) {
    borrarFotos(fotosDelLote(lote)).catch(() => {});
  }
  return r;
}

/** Sustituye todos los lotes (importación de respaldo). */
export function reemplazarLotes(lotes: LoteAlmacenado[]): Resultado {
  return escribir(lotes);
}

export function fotosDelLote(l: LoteV2): string[] {
  return l.cajas.parametros.flatMap((p) => p.fotoIds);
}
