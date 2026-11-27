// ============================================================
// Tabla estándar de gaps (versionada) y comprobaciones iniciales
// del Anexo B (Registro D): almacenamiento y reglas puras.
// ============================================================
import { escribirLista, leerLista, tieneId, type Resultado } from "@/lib/almacen/local";
import { GRUPOS, LIMITES_TRITURACION, type Grupo } from "@/lib/config/trituracion";
import { validarNumero } from "@/lib/recepcion/validacion";
import { evaluarControl } from "./control";
import type { ComprobacionInicial, FilaGap, FirmaRol, VersionTablaGaps } from "./tipos";

const CLAVE_VERSIONES = "wine_qc_gaps_versiones";
const CLAVE_COMPROBACIONES = "wine_qc_comprobaciones_gap";

// ─────────────────────────────────────────
// Almacenamiento
// ─────────────────────────────────────────
function esVersion(x: unknown): x is VersionTablaGaps {
  return tieneId(x) && typeof (x as { version?: unknown }).version === "number";
}
function esComprobacion(x: unknown): x is ComprobacionInicial {
  return tieneId(x) && typeof (x as { grupo?: unknown }).grupo === "string";
}

/** Versiones de la tabla, de la más reciente a la más antigua. */
export function getVersiones(): VersionTablaGaps[] {
  return leerLista(CLAVE_VERSIONES, esVersion).sort((a, b) => b.version - a.version);
}

/** Tabla vigente (la de mayor versión) o null si aún no hay ninguna aprobada. */
export function getVigente(): VersionTablaGaps | null {
  return getVersiones()[0] ?? null;
}

export function getVersion(id: string): VersionTablaGaps | null {
  return getVersiones().find((v) => v.id === id) ?? null;
}

/** Aprueba una nueva versión (las anteriores quedan en el historial, sin cambios). */
export function aprobarVersion(v: Omit<VersionTablaGaps, "version">): Resultado & { version?: VersionTablaGaps } {
  const errores = erroresVersion(v);
  if (errores.length) return { ok: false, error: errores[0] };
  const actuales = getVersiones();
  const nueva: VersionTablaGaps = { ...v, version: (actuales[0]?.version ?? 0) + 1 };
  const r = escribirLista(CLAVE_VERSIONES, [nueva, ...actuales]);
  return r.ok ? { ok: true, version: nueva } : r;
}

/** Reemplaza todas las versiones (importación de respaldo). */
export function reemplazarVersiones(vs: VersionTablaGaps[]): Resultado {
  return escribirLista(CLAVE_VERSIONES, vs);
}

export function getComprobaciones(): ComprobacionInicial[] {
  return leerLista(CLAVE_COMPROBACIONES, esComprobacion).sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
}

export function saveComprobacion(c: ComprobacionInicial): Resultado {
  const otras = getComprobaciones().filter((x) => x.id !== c.id);
  return escribirLista(CLAVE_COMPROBACIONES, [c, ...otras]);
}

export function deleteComprobacion(id: string): Resultado {
  return escribirLista(
    CLAVE_COMPROBACIONES,
    getComprobaciones().filter((x) => x.id !== id),
  );
}

export function reemplazarComprobaciones(cs: ComprobacionInicial[]): Resultado {
  return escribirLista(CLAVE_COMPROBACIONES, cs);
}

/** ¿La comprobación ya se usó en una versión aprobada? (entonces es de solo lectura) */
export function comprobacionUsada(id: string, versiones = getVersiones()): boolean {
  return versiones.some((v) => v.comprobacionIds.includes(id));
}

// ─────────────────────────────────────────
// Reglas
// ─────────────────────────────────────────
export type GapDeGrupo =
  | { ok: true; gapMm: number; posicion: string; version: VersionTablaGaps }
  | { ok: false; motivo: "sin_tabla" | "no_establecido" | "no_aplica" };

/**
 * Gap estándar de un grupo según la tabla vigente. Un gap vacío o NO APLICA no
 * autoriza un ajuste supuesto: el grupo no se puede triturar.
 */
export function gapDeGrupo(vigente: VersionTablaGaps | null, g: Grupo): GapDeGrupo {
  if (!vigente) return { ok: false, motivo: "sin_tabla" };
  const f = vigente.filas[g];
  if (!f || f.noAplica) return { ok: false, motivo: "no_aplica" };
  const v = validarNumero(f.gapMm, LIMITES_TRITURACION.gapMm);
  if (v.valor === null) return { ok: false, motivo: "no_establecido" };
  return { ok: true, gapMm: v.valor, posicion: f.posicion, version: vigente };
}

export function filaGapVacia(): FilaGap {
  return { gapMm: "", noAplica: false, posicion: "" };
}

/** Errores para aprobar una versión (los grupos vacíos se permiten: quedan bloqueados). */
export function erroresVersion(v: Omit<VersionTablaGaps, "version">): string[] {
  const e: string[] = [];
  for (const g of GRUPOS) {
    const f = v.filas[g];
    if (f.noAplica) continue;
    if (f.gapMm.trim() === "") continue;
    const n = validarNumero(f.gapMm, LIMITES_TRITURACION.gapMm);
    if (n.error) e.push(`Gap ${g}: ${n.error}`);
    if (!f.posicion.trim()) e.push(`Gap ${g}: indique la posición o marca de referencia`);
  }
  if (GRUPOS.every((g) => v.filas[g].noAplica || v.filas[g].gapMm.trim() === "")) {
    e.push("Establezca al menos un gap");
  }
  if (!v.equipoModelo.trim()) e.push("Complete Equipo y modelo");
  if (!v.configuracionVersion.trim()) e.push("Complete Configuración y versión");
  if (!v.responsableComprobacion.trim()) e.push("Complete Responsable de comprobación");
  if (!v.aprobacion.nombre.trim() || !v.aprobacion.rol) e.push("Complete quién aprueba (nombre y rol)");
  return e;
}

/** Resultado de una comprobación: último intento conforme (gap comprobado) o NO APLICA. */
export function resultadoComprobacion(
  c: ComprobacionInicial,
): { tipo: "no_aplica" } | { tipo: "comprobado"; gapMm: string; posicion: string } | { tipo: "sin_resultado" } {
  if (c.noAplica) return { tipo: "no_aplica" };
  const ultimo = c.intentos[c.intentos.length - 1];
  if (ultimo && evaluarControl(ultimo.control).resultado === "conforme" && ultimo.gapMm.trim()) {
    return { tipo: "comprobado", gapMm: ultimo.gapMm, posicion: ultimo.posicion };
  }
  return { tipo: "sin_resultado" };
}

/**
 * Propuesta de nueva versión con el gap comprobado de cada grupo (la comprobación
 * más reciente con resultado). Los grupos sin comprobación quedan vacíos.
 */
export function propuestaDesdeComprobaciones(comprobaciones: ComprobacionInicial[]): {
  filas: Record<Grupo, FilaGap>;
  comprobacionIds: string[];
  equipoModelo: string;
} {
  const filas = { G: filaGapVacia(), M: filaGapVacia(), P: filaGapVacia() } as Record<Grupo, FilaGap>;
  const ids: string[] = [];
  let equipoModelo = "";
  for (const g of GRUPOS) {
    const c = comprobaciones.find((x) => x.grupo === g && resultadoComprobacion(x).tipo !== "sin_resultado");
    if (!c) continue;
    const r = resultadoComprobacion(c);
    if (r.tipo === "no_aplica") filas[g] = { gapMm: "", noAplica: true, posicion: "" };
    if (r.tipo === "comprobado") filas[g] = { gapMm: r.gapMm, noAplica: false, posicion: r.posicion };
    ids.push(c.id);
    equipoModelo ||= c.equipoModelo;
  }
  return { filas, comprobacionIds: ids, equipoModelo };
}

export function firmaVacia(): FirmaRol {
  return { nombre: "", rol: "", fecha: "" };
}
