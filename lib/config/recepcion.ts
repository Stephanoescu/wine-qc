// ============================================================
// Configuración del módulo "Recepción y Evaluación de Uva"
// ------------------------------------------------------------
// TODOS los rangos, umbrales y límites del módulo viven aquí.
// Los componentes no deben llevar números fijos.
// ============================================================

/** Rangos de referencia para decidir Conforme / No conforme. */
export const RANGOS = {
  /** °Brix promedio aceptable (inclusive). */
  brix: { min: 18, max: 24 },
  /** pH promedio aceptable (inclusive). */
  ph: { min: 3.0, max: 3.5 },
  /** Acidez titulable en g/L como ácido tartárico (inclusive). */
  acidez: { min: 6, max: 10 },
  /** Temperatura de la uva: Conforme si la lectura es ≤ este valor (°C). */
  temperatura: { maxConforme: 20 },
} as const;

/**
 * Límites físicos de entrada. Un valor fuera de estos límites se bloquea
 * como "físicamente imposible" (distinto de "fuera de rango").
 * `minExclusivo: true` significa que el mínimo no está permitido (> min).
 */
export const LIMITES_ENTRADA = {
  numJabas: { min: 1, max: 10000, entero: true },
  pesoJabaKg: { min: 0, max: 100, minExclusivo: true },
  taraKg: { min: 0, max: 100, minExclusivo: true },
  temperaturaC: { min: -5, max: 50 },
  pesoBolsaBayasG: { min: 0, max: 5000, minExclusivo: true },
  separadoKg: { min: 0, max: 100000 },
  brix: { min: 0, max: 40 },
  ph: { min: 0, max: 14 },
  acidezGL: { min: 0, max: 30, minExclusivo: true },
} as const;

/**
 * pH: si la diferencia entre la lectura mayor y la menor de una ronda supera
 * este valor, se muestra un aviso informativo (no bloquea ni genera motivo).
 */
export const PH_DIFERENCIA_AVISO = 0.1;

/** Lecturas por ronda en los pasos 6 (°Brix) y 7 (pH). */
export const LECTURAS_POR_RONDA = { brix: 3, ph: 2 } as const;

/**
 * Tamaño mínimo de muestra según el total de jabas.
 * `hasta` es inclusive; `muestra: "todas"` inspecciona el total.
 */
export const TABLA_MUESTREO: ReadonlyArray<{ hasta: number; muestra: number | "todas" }> = [
  { hasta: 5, muestra: "todas" },
  { hasta: 100, muestra: 5 },
  { hasta: 300, muestra: 7 },
  { hasta: 500, muestra: 9 },
  { hasta: 1000, muestra: 10 },
  { hasta: Infinity, muestra: 15 },
];

/** Fotos de la inspección de cajas (paso 5). */
export const FOTOS = {
  maxPorParametro: 3,
  /** Lado mayor en píxeles tras la compresión. */
  maxLadoPx: 1280,
  /** Calidad JPEG (0–1). */
  calidadJpeg: 0.7,
} as const;

/** Variedades disponibles y la que se preselecciona. */
export const VARIEDADES_UVA = [
  "Borgoña Blanca",
  "Borgoña Negra",
  "Cabernet Sauvignon",
  "Merlot",
  "Pinot Noir",
  "Chardonnay",
  "Sauvignon Blanc",
  "Carménère",
  "Syrah",
  "Otra",
] as const;

export const VARIEDAD_POR_DEFECTO = "Borgoña Blanca";

/** Decimales con que se muestran los valores. */
export const DECIMALES = {
  kg: 2,
  porcentaje: 2,
  brix: 1,
  ph: 2,
  acidez: 2,
  temperatura: 1,
} as const;
