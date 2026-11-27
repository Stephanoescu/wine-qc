// ============================================================
// Respaldo JSON de los lotes (con fotos en base64) para /reportes.
// Sirve también para pasar los lotes de un dispositivo a otro.
// ============================================================
import { fotosDelLote, getLotes, reemplazarLotes, type Resultado } from "./almacen";
import { fechaLocalHoy } from "./borrador";
import { guardarFoto, obtenerFoto } from "./fotos";
import { esLegacy, type LoteAlmacenado } from "./tipos";

export const FORMATO_RESPALDO = "wine-qc-respaldo";
export const VERSION_RESPALDO = 1;

export interface Respaldo {
  formato: typeof FORMATO_RESPALDO;
  version: number;
  exportadoEn: string;
  lotes: LoteAlmacenado[];
  /** id de foto → data URL (base64). */
  fotos: Record<string, string>;
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

export async function crearRespaldo(ahora = new Date()): Promise<{ respaldo: Respaldo; fotosFaltantes: number }> {
  const lotes = getLotes();
  const fotos: Record<string, string> = {};
  let fotosFaltantes = 0;
  for (const l of lotes) {
    if (esLegacy(l)) continue;
    for (const id of fotosDelLote(l)) {
      try {
        const blob = await obtenerFoto(id);
        if (blob) fotos[id] = await blobADataUrl(blob);
        else fotosFaltantes++;
      } catch {
        fotosFaltantes++;
      }
    }
  }
  return {
    respaldo: {
      formato: FORMATO_RESPALDO,
      version: VERSION_RESPALDO,
      exportadoEn: ahora.toISOString(),
      lotes,
      fotos,
    },
    fotosFaltantes,
  };
}

export function nombreArchivoRespaldo(ahora = new Date()): string {
  return `wine-qc-respaldo-${fechaLocalHoy(ahora)}.json`;
}

/** Genera el respaldo y lo descarga como archivo. */
export async function descargarRespaldo(): Promise<{ lotes: number; fotos: number; fotosFaltantes: number }> {
  const ahora = new Date();
  const { respaldo, fotosFaltantes } = await crearRespaldo(ahora);
  const blob = new Blob([JSON.stringify(respaldo)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivoRespaldo(ahora);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { lotes: respaldo.lotes.length, fotos: Object.keys(respaldo.fotos).length, fotosFaltantes };
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
  return { formato: FORMATO_RESPALDO, version: d.version, exportadoEn: String(d.exportadoEn ?? ""), lotes, fotos };
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

/** Escribe los lotes fusionados y restaura las fotos de los lotes nuevos o actualizados. */
export async function aplicarImportacion(
  plan: PlanImportacion,
  respaldo: Respaldo,
): Promise<Resultado & { fotosRestauradas?: number }> {
  let fotosRestauradas = 0;
  for (const l of [...plan.nuevos, ...plan.actualizados]) {
    if (esLegacy(l)) continue;
    for (const id of fotosDelLote(l)) {
      const url = respaldo.fotos[id];
      if (!url) continue;
      try {
        await guardarFoto(dataUrlABlob(url), id);
        fotosRestauradas++;
      } catch {
        // Foto dañada o sin espacio: el lote se importa igual y la foto se muestra como "no disponible".
      }
    }
  }
  const r = reemplazarLotes(plan.resultado);
  return r.ok ? { ok: true, fotosRestauradas } : r;
}
