// ============================================================
// Respaldo JSON (con fotos en base64) para /reportes.
// Versión 2: lotes de Recepción, registros de Trituración, versiones de
// la tabla de gaps, comprobaciones del Anexo B y bitácora de eliminaciones.
// Se importan también los respaldos de la versión 1 (solo lotes).
// Sirve también para pasar los datos de un dispositivo a otro.
// ============================================================
import {
  fotosDelLote,
  getEliminaciones,
  getLotes,
  reemplazarLotes,
  registrarEliminaciones,
  type Resultado,
} from "./almacen";
import { fechaLocalHoy } from "./borrador";
import { guardarFoto, obtenerFoto } from "./fotos";
import { esLegacy, type EntradaEliminacion, type LoteAlmacenado } from "./tipos";
import { tieneId } from "@/lib/almacen/local";
import { getRegistros, reemplazarRegistros } from "@/lib/trituracion/almacen";
import { getComprobaciones, getVersiones, reemplazarComprobaciones, reemplazarVersiones } from "@/lib/trituracion/config-gaps";
import { fotosDelRegistro } from "@/lib/trituracion/edicion";
import type { ComprobacionInicial, RegistroTrituracion, VersionTablaGaps } from "@/lib/trituracion/tipos";

export const FORMATO_RESPALDO = "wine-qc-respaldo";
export const VERSION_RESPALDO = 2;

export interface Respaldo {
  formato: typeof FORMATO_RESPALDO;
  version: number;
  exportadoEn: string;
  lotes: LoteAlmacenado[];
  /** id de foto → data URL (base64). */
  fotos: Record<string, string>;
  /** Bitácora de eliminaciones (solo en el respaldo completo; opcional). */
  eliminaciones?: EntradaEliminacion[];
  /** Desde la versión 2 (opcionales). */
  trituraciones?: RegistroTrituracion[];
  gapsVersiones?: VersionTablaGaps[];
  comprobaciones?: ComprobacionInicial[];
}

/** Respaldo parcial: solo los lotes y/o registros indicados (sin configuración ni bitácora). */
export interface AlcanceRespaldo {
  lotes?: LoteAlmacenado[];
  trituraciones?: RegistroTrituracion[];
}

// ─────────────────────────────────────────
// Exportar
// ─────────────────────────────────────────
function blobADataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error("No se pudo leer la foto."));
    r.readAsDataURL(blob);
  });
}

/** Respaldo completo (todo el dispositivo) o parcial (solo los lotes / registros indicados). */
export async function crearRespaldo(
  ahora = new Date(),
  alcance?: AlcanceRespaldo,
): Promise<{ respaldo: Respaldo; fotosFaltantes: number }> {
  const completo = !alcance;
  const lotes = alcance ? (alcance.lotes ?? []) : getLotes();
  const trituraciones = alcance ? (alcance.trituraciones ?? []) : getRegistros();
  const ids = [
    ...lotes.flatMap((l) => (esLegacy(l) ? [] : fotosDelLote(l))),
    ...trituraciones.flatMap((r) => fotosDelRegistro(r)),
  ];
  const fotos: Record<string, string> = {};
  let fotosFaltantes = 0;
  for (const id of ids) {
    try {
      const blob = await obtenerFoto(id);
      if (blob) fotos[id] = await blobADataUrl(blob);
      else fotosFaltantes++;
    } catch {
      fotosFaltantes++;
    }
  }
  return {
    respaldo: {
      formato: FORMATO_RESPALDO,
      version: VERSION_RESPALDO,
      exportadoEn: ahora.toISOString(),
      lotes,
      fotos,
      trituraciones,
      ...(completo
        ? { eliminaciones: getEliminaciones(), gapsVersiones: getVersiones(), comprobaciones: getComprobaciones() }
        : {}),
    },
    fotosFaltantes,
  };
}

/** wine-qc-respaldo-AAAA-MM-DD.json, o wine-qc-respaldo-<código>-AAAA-MM-DD.json para un solo lote. */
export function nombreArchivoRespaldo(ahora = new Date(), codigoLote?: string): string {
  const codigo = codigoLote ? `${codigoLote.trim().replace(/[^\w.-]+/g, "_")}-` : "";
  return `wine-qc-respaldo-${codigo}${fechaLocalHoy(ahora)}.json`;
}

/** Genera el respaldo (completo o parcial) y lo descarga como archivo. */
export async function descargarRespaldo(
  alcance?: AlcanceRespaldo,
): Promise<{ lotes: number; trituraciones: number; fotos: number; fotosFaltantes: number }> {
  const ahora = new Date();
  const { respaldo, fotosFaltantes } = await crearRespaldo(ahora, alcance);
  const codigo =
    alcance?.lotes?.length === 1 && !alcance.trituraciones?.length
      ? alcance.lotes[0].codigoLote
      : alcance?.trituraciones?.length === 1 && !alcance.lotes?.length
        ? `${alcance.trituraciones[0].codigoLote}-trituracion`
        : undefined;
  const blob = new Blob([JSON.stringify(respaldo)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivoRespaldo(ahora, codigo);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return {
    lotes: respaldo.lotes.length,
    trituraciones: respaldo.trituraciones?.length ?? 0,
    fotos: Object.keys(respaldo.fotos).length,
    fotosFaltantes,
  };
}

// ─────────────────────────────────────────
// Importar
// ─────────────────────────────────────────
const ERROR_FORMATO = "El archivo no es un respaldo válido de wine-qc.";

/** Lee y valida el contenido del archivo. Lanza un Error con mensaje en español si no es válido. */
export function analizarRespaldo(texto: string): Respaldo {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error(`${ERROR_FORMATO} No es un JSON legible.`);
  }
  const d = datos as Partial<Respaldo> | null;
  if (!d || typeof d !== "object" || d.formato !== FORMATO_RESPALDO) throw new Error(ERROR_FORMATO);
  if (typeof d.version !== "number" || d.version > VERSION_RESPALDO) {
    throw new Error("El respaldo es de una versión más nueva de la aplicación.");
  }
  if (!Array.isArray(d.lotes)) throw new Error(ERROR_FORMATO);
  const lotes = d.lotes.filter(
    (l): l is LoteAlmacenado =>
      typeof l === "object" && l !== null && typeof (l as { id?: unknown }).id === "string" && typeof (l as { codigoLote?: unknown }).codigoLote === "string",
  );
  if (lotes.length !== d.lotes.length) throw new Error(`${ERROR_FORMATO} Hay lotes con datos incompletos.`);
  const fotos: Record<string, string> = {};
  if (d.fotos && typeof d.fotos === "object") {
    for (const [id, url] of Object.entries(d.fotos)) {
      if (typeof url === "string" && url.startsWith("data:image/")) fotos[id] = url;
    }
  }
  const eliminaciones = Array.isArray(d.eliminaciones)
    ? d.eliminaciones.filter(
        (e): e is EntradaEliminacion =>
          !!e && typeof e.id === "string" && typeof e.codigoLote === "string" && typeof e.fecha === "string",
      )
    : [];
  const lista = <T,>(x: unknown, valido: (y: unknown) => y is T): T[] => (Array.isArray(x) ? x.filter(valido) : []);
  const trituraciones = lista(d.trituraciones, (y): y is RegistroTrituracion => tieneId(y) && typeof (y as { loteId?: unknown }).loteId === "string");
  const gapsVersiones = lista(d.gapsVersiones, (y): y is VersionTablaGaps => tieneId(y) && typeof (y as { version?: unknown }).version === "number");
  const comprobaciones = lista(d.comprobaciones, (y): y is ComprobacionInicial => tieneId(y) && typeof (y as { grupo?: unknown }).grupo === "string");
  return {
    formato: FORMATO_RESPALDO,
    version: d.version,
    exportadoEn: String(d.exportadoEn ?? ""),
    lotes,
    fotos,
    eliminaciones,
    trituraciones,
    gapsVersiones,
    comprobaciones,
  };
}

function marcaTiempo(l: LoteAlmacenado): string {
  if (esLegacy(l)) return l.savedAt ?? "";
  return l.updatedAt ?? l.savedAt ?? "";
}

export interface PlanImportacion {
  nuevos: LoteAlmacenado[];
  actualizados: LoteAlmacenado[];
  sinCambios: number;
  /** Lista final de lotes tras la fusión. */
  resultado: LoteAlmacenado[];
}

/** Fusión por id: agrega los nuevos y, si el id ya existe, conserva la versión más reciente. */
export function planificarImportacion(actuales: LoteAlmacenado[], entrantes: LoteAlmacenado[]): PlanImportacion {
  const porId = new Map(actuales.map((l) => [l.id, l]));
  const nuevos: LoteAlmacenado[] = [];
  const actualizados: LoteAlmacenado[] = [];
  let sinCambios = 0;
  for (const e of entrantes) {
    const actual = porId.get(e.id);
    if (!actual) {
      nuevos.push(e);
      porId.set(e.id, e);
    } else if (marcaTiempo(e) > marcaTiempo(actual)) {
      actualizados.push(e);
      porId.set(e.id, e);
    } else {
      sinCambios++;
    }
  }
  // Nuevos primero (como al registrar), luego el resto en su orden actual.
  const idsNuevos = new Set(nuevos.map((l) => l.id));
  const resultado = [...nuevos, ...[...porId.values()].filter((l) => !idsNuevos.has(l.id))];
  return { nuevos, actualizados, sinCambios, resultado };
}

function dataUrlABlob(url: string): Blob {
  const [meta, b64 = ""] = url.split(",");
  const tipo = /^data:([^;]+);base64$/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

export interface PlanGenerico<T> {
  nuevos: T[];
  actualizados: T[];
  sinCambios: number;
  resultado: T[];
}

/** Fusión por id que conserva la versión con la marca de tiempo más reciente. */
function fusionar<T extends { id: string }>(actuales: T[], entrantes: T[], marca: (x: T) => string): PlanGenerico<T> {
  const porId = new Map(actuales.map((x) => [x.id, x]));
  const nuevos: T[] = [];
  const actualizados: T[] = [];
  let sinCambios = 0;
  for (const e of entrantes) {
    const a = porId.get(e.id);
    if (!a) {
      nuevos.push(e);
      porId.set(e.id, e);
    } else if (marca(e) > marca(a)) {
      actualizados.push(e);
      porId.set(e.id, e);
    } else sinCambios++;
  }
  const idsNuevos = new Set(nuevos.map((x) => x.id));
  return { nuevos, actualizados, sinCambios, resultado: [...nuevos, ...[...porId.values()].filter((x) => !idsNuevos.has(x.id))] };
}

export interface PlanCompleto {
  lotes: PlanImportacion;
  trituraciones: PlanGenerico<RegistroTrituracion> & {
    /** Registros descartados porque el mismo lote ya tenía otro más reciente (un registro por lote). */
    descartadosPorLote: number;
  };
  versiones: PlanGenerico<VersionTablaGaps>;
  comprobaciones: PlanGenerico<ComprobacionInicial>;
}

export interface DatosActuales {
  lotes: LoteAlmacenado[];
  trituraciones: RegistroTrituracion[];
  versiones: VersionTablaGaps[];
  comprobaciones: ComprobacionInicial[];
}

export function datosActuales(): DatosActuales {
  return { lotes: getLotes(), trituraciones: getRegistros(), versiones: getVersiones(), comprobaciones: getComprobaciones() };
}

/** Plan de importación de todo el respaldo (fusión sin duplicados, gana lo más reciente). */
export function planificarImportacionCompleta(respaldo: Respaldo, actuales: DatosActuales): PlanCompleto {
  const lotes = planificarImportacion(actuales.lotes, respaldo.lotes);
  const t = fusionar(actuales.trituraciones, respaldo.trituraciones ?? [], (r) => r.updatedAt ?? "");
  // Un registro por lote: si dos ids distintos apuntan al mismo lote, queda el más reciente.
  const porLote = new Map<string, RegistroTrituracion>();
  for (const r of t.resultado) {
    const otro = porLote.get(r.loteId);
    if (!otro || (r.updatedAt ?? "") > (otro.updatedAt ?? "")) porLote.set(r.loteId, r);
  }
  const quedan = new Set([...porLote.values()].map((r) => r.id));
  const trituraciones = {
    nuevos: t.nuevos.filter((r) => quedan.has(r.id)),
    actualizados: t.actualizados.filter((r) => quedan.has(r.id)),
    sinCambios: t.sinCambios,
    resultado: t.resultado.filter((r) => quedan.has(r.id)),
    descartadosPorLote: t.resultado.length - quedan.size,
  };
  return {
    lotes,
    trituraciones,
    // Las versiones aprobadas no cambian: solo se agregan las que faltan.
    versiones: fusionar(actuales.versiones, respaldo.gapsVersiones ?? [], () => ""),
    comprobaciones: fusionar(actuales.comprobaciones, respaldo.comprobaciones ?? [], (c) => c.updatedAt ?? ""),
  };
}

/** Escribe todo lo fusionado y restaura las fotos de los lotes y registros nuevos o actualizados. */
export async function aplicarImportacion(
  plan: PlanCompleto,
  respaldo: Respaldo,
): Promise<Resultado & { fotosRestauradas?: number }> {
  let fotosRestauradas = 0;
  const ids = [
    ...[...plan.lotes.nuevos, ...plan.lotes.actualizados].flatMap((l) => (esLegacy(l) ? [] : fotosDelLote(l))),
    ...[...plan.trituraciones.nuevos, ...plan.trituraciones.actualizados].flatMap((r) => fotosDelRegistro(r)),
  ];
  for (const id of ids) {
    const url = respaldo.fotos[id];
    if (!url) continue;
    try {
      await guardarFoto(dataUrlABlob(url), id);
      fotosRestauradas++;
    } catch {
      // Foto dañada o sin espacio: el dato se importa igual y la foto se muestra como "no disponible".
    }
  }
  for (const r of [
    reemplazarLotes(plan.lotes.resultado),
    reemplazarRegistros(plan.trituraciones.resultado),
    reemplazarVersiones(plan.versiones.resultado),
    reemplazarComprobaciones(plan.comprobaciones.resultado),
  ]) {
    if (!r.ok) return r;
  }
  if (respaldo.eliminaciones?.length) registrarEliminaciones(respaldo.eliminaciones);
  return { ok: true, fotosRestauradas };
}
