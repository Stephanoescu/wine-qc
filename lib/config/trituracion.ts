// ============================================================
// Configuración del módulo «Despalillado, clasificación y trituración»
// ------------------------------------------------------------
// Criterios y valores por defecto (fuente: docs/sw-trituracion.md).
// No se define ningún gap en mm: la tabla estándar se aprueba en
// /configuracion/trituracion a partir de las comprobaciones del Anexo B.
// ============================================================

export type Grupo = "G" | "M" | "P";

/** Orden de presentación de los grupos (cribas de arriba hacia abajo). */
export const GRUPOS: readonly Grupo[] = ["G", "M", "P"];

/** Secuencia de trituración del proyecto (actividad 8, ítem 4): P, M y G. */
export const SECUENCIA_TRITURACION: readonly Grupo[] = ["P", "M", "G"];

/**
 * Actividad 9 — referencias internas a confirmar en las primeras visitas
 * (no son valores de la OIV). Los porcentajes se escalan si se revisan más o
 * menos de 100 bayas.
 */
export const CRITERIOS_ACT9 = {
  /** Bayas abiertas: al menos este % de las revisadas (90 de 100). */
  abiertasMinPct: 90,
  /** Bayas enteras: como máximo este % de las revisadas (10 de 100). */
  enterasMaxPct: 10,
  /** Semillas dañadas o fragmentos observados: como máximo. */
  semillasDaniadasMax: 0,
  /** Semillas íntegras revisadas: al menos (requisito para registrar el control). */
  semillasRevisadasMin: 100,
  /** Valores por defecto del formulario. */
  bayasRevisadasDefecto: 100,
  semillasRevisadasDefecto: 100,
} as const;

/** Anexo B (3): porción de referencia interna inicial, cuya suficiencia debe confirmarse para el modelo. */
export const MASA_PORCION_COMPROBACION_KG = 5.0;

/** Límites de entrada de los registros de trituración. */
export const LIMITES_TRITURACION = {
  gapMm: { min: 0, max: 50, minExclusivo: true },
  pesoRecipienteKg: { min: 0, max: 2000, minExclusivo: true },
  taraRecipienteKg: { min: 0, max: 500 },
  fraccionKg: { min: 0, max: 100000 },
  kgTriturados: { min: 0, max: 100000, minExclusivo: true },
  conteo: { min: 0, max: 10000, entero: true },
  masaPorcionKg: { min: 0, max: 1000, minExclusivo: true },
} as const;

/** Foto de las cribas de la bodega (actividad 4–5). Si no existe, se muestra un marcador y el diagrama. */
export const IMAGEN_CRIBAS = "/images/cribas.jpg";
