// ============================================================
// MOCK DATA — Grape Reception Quality Control (Poka-Yoke)
// ============================================================

export type Categoria = "A" | "B" | "C" | null;

export interface IdentificacionData {
  proveedor: string;
  procedencia: string;
  fecha: string;
  hora: string;
  variedad: string;
  peso: string;
  codigoLote: string;
}

export interface InspeccionVisualData {
  podredumbre: string;
  bayasDaniadas: string;
  deshidratacion: string;
  bayasVerdes: string;
  materiaExtrana: string;
}

export interface FisicoquimicaData {
  brix1: string;
  brix2: string;
  brix3: string;
  ph1: string;
  ph2: string;
}

export interface InspeccionVisualGuardada {
  podredumbre: number;
  bayasDaniadas: number;
  deshidratacion: number;
  bayasVerdes: number;
  materiaExtrana: number;
}

export interface LoteGuardado {
  id: string;
  codigoLote: string;
  proveedor: string;
  procedencia: string;
  variedad: string;
  fecha: string;
  hora: string;
  peso: number;
  brixPromedio: number;
  phPromedio: number;
  categoria: Categoria;
  observaciones: string[];
  inspeccionVisual: InspeccionVisualGuardada;
  savedAt?: string;
}

// ─────────────────────────────────────────
// Límites de inspección visual
// ─────────────────────────────────────────
export const LIMITES_VISUAL = {
  podredumbre: { max: 3, label: "Podredumbre / Moho" },
  bayasDaniadas: { max: 6, label: "Bayas Dañadas" },
  deshidratacion: { max: 2, label: "Deshidratación" },
  bayasVerdes: { conformeMax: 3, observadoMax: 5, label: "Bayas Verdes" },
  materiaExtrana: { max: 3, label: "Materia Extraña" },
};

export const LIMITES_FISICOQUIMICA = {
  brix: { min: 16.0, max: 20.0 },
  ph: { min: 2.80, max: 3.65 },
};

// ─────────────────────────────────────────
// Variedades de uva
// ─────────────────────────────────────────
export const VARIEDADES_UVA = [
  "Cabernet Sauvignon",
  "Merlot",
  "Pinot Noir",
  "Chardonnay",
  "Sauvignon Blanc",
  "Carménère",
  "Syrah",
  "Borgoña Blanca",
  "Borgoña Negra",
  "Otra",
];


// ─────────────────────────────────────────
// Lógica de evaluación de categoría
// ─────────────────────────────────────────
export function evaluarCategoria(
  visual: InspeccionVisualData,
  fisico: FisicoquimicaData,
  pesoNeto: number
): {
  categoria: Categoria;
  observaciones: string[];
  brixPromedio: number;
  phPromedio: number;
  noConformeVisualCount: number;
} {
  const obs: string[] = [];

  // ── Convert kg weights → percentages ──────────────────
  const toKg = (s: string) => parseFloat(s) || 0;
  const toPct = (kg: number) => pesoNeto > 0 ? (kg / pesoNeto) * 100 : 0;

  const podredumbre_pct = toPct(toKg(visual.podredumbre));
  const bayasDaniadas_pct = toPct(toKg(visual.bayasDaniadas));
  const deshidratacion_pct = toPct(toKg(visual.deshidratacion));
  const bayasVerdes_pct = toPct(toKg(visual.bayasVerdes));
  const materiaExtrana_pct = toPct(toKg(visual.materiaExtrana));

  // ── Brix promedio ──────────────────────────────────────
  const b1 = parseFloat(fisico.brix1) || 0;
  const b2 = parseFloat(fisico.brix2) || 0;
  const b3 = parseFloat(fisico.brix3) || 0;
  const brixPromedio = (b1 + b2 + b3) / 3;

  // ── pH promedio ────────────────────────────────────────
  const p1 = parseFloat(fisico.ph1) || 0;
  const p2 = parseFloat(fisico.ph2) || 0;
  const phPromedio = (p1 + p2) / 2;

  // ── Count visual non-conforming parameters ─────────────
  let noConformeVisualCount = 0;
  let esObservadoVisual = false;

  if (podredumbre_pct > LIMITES_VISUAL.podredumbre.max) {
    obs.push(`Podredumbre/moho: ${podredumbre_pct.toFixed(2)}% (límite ≤ ${LIMITES_VISUAL.podredumbre.max}%) — No conforme - Revisar`);
    noConformeVisualCount++;
  }
  if (bayasDaniadas_pct > LIMITES_VISUAL.bayasDaniadas.max) {
    obs.push(`Bayas dañadas: ${bayasDaniadas_pct.toFixed(2)}% (límite ≤ ${LIMITES_VISUAL.bayasDaniadas.max}%) — No conforme - Revisar`);
    noConformeVisualCount++;
  }
  if (deshidratacion_pct > LIMITES_VISUAL.deshidratacion.max) {
    obs.push(`Deshidratación: ${deshidratacion_pct.toFixed(2)}% (límite ≤ ${LIMITES_VISUAL.deshidratacion.max}%) — No conforme - Revisar`);
    noConformeVisualCount++;
  }
  if (materiaExtrana_pct > LIMITES_VISUAL.materiaExtrana.max) {
    obs.push(`Materia extraña: ${materiaExtrana_pct.toFixed(2)}% (límite ≤ ${LIMITES_VISUAL.materiaExtrana.max}%) — No conforme - Revisar`);
    noConformeVisualCount++;
  }
  if (bayasVerdes_pct > LIMITES_VISUAL.bayasVerdes.observadoMax) {
    obs.push(`Bayas verdes: ${bayasVerdes_pct.toFixed(2)}% (límite ≤ ${LIMITES_VISUAL.bayasVerdes.observadoMax}%) — No conforme - Revisar`);
    noConformeVisualCount++;
  } else if (bayasVerdes_pct > LIMITES_VISUAL.bayasVerdes.conformeMax) {
    obs.push(`Bayas verdes en zona observada: ${bayasVerdes_pct.toFixed(2)}% (${LIMITES_VISUAL.bayasVerdes.conformeMax}–${LIMITES_VISUAL.bayasVerdes.observadoMax}%)`);
    esObservadoVisual = true;
  }

  // ── Fisicoquímica ──────────────────────────────────────
  let esNoConformeFisico = false;

  if (b1 > 0 && b2 > 0 && b3 > 0) {
    if (brixPromedio < LIMITES_FISICOQUIMICA.brix.min) {
      obs.push(`°Brix promedio bajo el mínimo: ${brixPromedio.toFixed(2)} (mínimo ${LIMITES_FISICOQUIMICA.brix.min})`);
      esNoConformeFisico = true;
    } else if (brixPromedio > LIMITES_FISICOQUIMICA.brix.max) {
      obs.push(`°Brix promedio sobre el máximo: ${brixPromedio.toFixed(2)} (máximo ${LIMITES_FISICOQUIMICA.brix.max})`);
      esNoConformeFisico = true;
    }
  }
  if (p1 > 0 && p2 > 0) {
    if (phPromedio < LIMITES_FISICOQUIMICA.ph.min || phPromedio > LIMITES_FISICOQUIMICA.ph.max) {
      obs.push(`pH promedio fuera de rango: ${phPromedio.toFixed(3)} (rango ${LIMITES_FISICOQUIMICA.ph.min}–${LIMITES_FISICOQUIMICA.ph.max})`);
      esNoConformeFisico = true;
    }
  }

  // ── Final categorization ───────────────────────────────
  // 3+ visual NC  OR  fisicoquímica NC  →  C
  // 1–2 visual NC  OR  bayas verdes observado  →  B
  // All OK  →  A
  let categoria: Categoria;
  if (noConformeVisualCount >= 3 || esNoConformeFisico) {
    categoria = "C";
  } else if (noConformeVisualCount >= 1 || esObservadoVisual) {
    categoria = "B";
  } else {
    categoria = "A";
  }

  return { categoria, observaciones: obs, brixPromedio, phPromedio, noConformeVisualCount };
}

// KPIs calculados del mock
export function calcularKPIs(lotes: LoteGuardado[]) {
  const total = lotes.length;
  const conformes = lotes.filter((l) => l.categoria === "A").length;
  const observados = lotes.filter((l) => l.categoria === "B").length;
  const rechazados = lotes.filter((l) => l.categoria === "C").length;
  const totalKg = lotes.reduce((a, b) => a + b.peso, 0);
  const tasaConformidad = total > 0 ? Math.round((conformes / total) * 100) : 0;
  return { total, conformes, observados, rechazados, totalKg, tasaConformidad };
}
