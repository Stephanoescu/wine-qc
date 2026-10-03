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
  fisico: FisicoquimicaData
): { categoria: Categoria; observaciones: string[]; brixPromedio: number; phPromedio: number } {
  const obs: string[] = [];

  // Visual checks
  const podredumbre = parseFloat(visual.podredumbre) || 0;
  const bayasDaniadas = parseFloat(visual.bayasDaniadas) || 0;
  const deshidratacion = parseFloat(visual.deshidratacion) || 0;
  const bayasVerdes = parseFloat(visual.bayasVerdes) || 0;
  const materiaExtrana = parseFloat(visual.materiaExtrana) || 0;

  // Brix promedio
  const b1 = parseFloat(fisico.brix1) || 0;
  const b2 = parseFloat(fisico.brix2) || 0;
  const b3 = parseFloat(fisico.brix3) || 0;
  const brixPromedio = (b1 + b2 + b3) / 3;

  // pH promedio
  const p1 = parseFloat(fisico.ph1) || 0;
  const p2 = parseFloat(fisico.ph2) || 0;
  const phPromedio = (p1 + p2) / 2;

  let esNoConforme = false;
  let esObservado = false;

  // Inspección visual
  if (podredumbre > LIMITES_VISUAL.podredumbre.max) {
    obs.push(`Podredumbre/moho supera límite (${podredumbre}% > ${LIMITES_VISUAL.podredumbre.max}%)`);
    esNoConforme = true;
  }
  if (bayasDaniadas > LIMITES_VISUAL.bayasDaniadas.max) {
    obs.push(`Bayas dañadas supera límite (${bayasDaniadas}% > ${LIMITES_VISUAL.bayasDaniadas.max}%)`);
    esNoConforme = true;
  }
  if (deshidratacion > LIMITES_VISUAL.deshidratacion.max) {
    obs.push(`Deshidratación supera límite (${deshidratacion}% > ${LIMITES_VISUAL.deshidratacion.max}%)`);
    esNoConforme = true;
  }
  if (materiaExtrana > LIMITES_VISUAL.materiaExtrana.max) {
    obs.push(`Materia extraña supera límite (${materiaExtrana}% > ${LIMITES_VISUAL.materiaExtrana.max}%)`);
    esNoConforme = true;
  }
  if (bayasVerdes > LIMITES_VISUAL.bayasVerdes.observadoMax) {
    obs.push(`Bayas verdes no conforme (${bayasVerdes}% > ${LIMITES_VISUAL.bayasVerdes.observadoMax}%)`);
    esNoConforme = true;
  } else if (bayasVerdes > LIMITES_VISUAL.bayasVerdes.conformeMax) {
    obs.push(`Bayas verdes en rango observado (${bayasVerdes}%)`);
    esObservado = true;
  }

  // Fisicoquímica
  if (b1 > 0 && b2 > 0 && b3 > 0) {
    if (brixPromedio < LIMITES_FISICOQUIMICA.brix.min) {
      obs.push(`°Brix promedio bajo el mínimo (${brixPromedio.toFixed(2)} < ${LIMITES_FISICOQUIMICA.brix.min})`);
      esNoConforme = true;
    } else if (brixPromedio > LIMITES_FISICOQUIMICA.brix.max) {
      obs.push(`°Brix promedio sobre el máximo (${brixPromedio.toFixed(2)} > ${LIMITES_FISICOQUIMICA.brix.max})`);
      esNoConforme = true;
    }
  }

  if (p1 > 0 && p2 > 0) {
    if (phPromedio < LIMITES_FISICOQUIMICA.ph.min || phPromedio > LIMITES_FISICOQUIMICA.ph.max) {
      obs.push(`pH promedio fuera de rango (${phPromedio.toFixed(3)})`);
      esNoConforme = true;
    }
  }

  const categoria: Categoria = esNoConforme ? "C" : esObservado ? "B" : "A";
  return { categoria, observaciones: obs, brixPromedio, phPromedio };
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
