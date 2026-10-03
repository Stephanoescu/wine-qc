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

export interface LoteGuardado {
  id: string;
  codigoLote: string;
  proveedor: string;
  variedad: string;
  fecha: string;
  peso: number;
  brixPromedio: number;
  phPromedio: number;
  categoria: Categoria;
  observaciones: string[];
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
// Mock data — historial de lotes
// ─────────────────────────────────────────
export const LOTES_MOCK: LoteGuardado[] = [
  {
    id: "1",
    codigoLote: "LOT-2024-001",
    proveedor: "Viña Santa Rosa",
    variedad: "Cabernet Sauvignon",
    fecha: "2024-03-01",
    peso: 2400,
    brixPromedio: 18.2,
    phPromedio: 3.21,
    categoria: "A",
    observaciones: [],
  },
  {
    id: "2",
    codigoLote: "LOT-2024-002",
    proveedor: "Fundo El Condor",
    variedad: "Merlot",
    fecha: "2024-03-02",
    peso: 1850,
    brixPromedio: 17.8,
    phPromedio: 3.45,
    categoria: "A",
    observaciones: [],
  },
  {
    id: "3",
    codigoLote: "LOT-2024-003",
    proveedor: "Agricola Los Andes",
    variedad: "Chardonnay",
    fecha: "2024-03-03",
    peso: 3100,
    brixPromedio: 15.4,
    phPromedio: 3.70,
    categoria: "C",
    observaciones: ["°Brix bajo el rango mínimo", "pH fuera de rango"],
  },
  {
    id: "4",
    codigoLote: "LOT-2024-004",
    proveedor: "Viña El Roble",
    variedad: "Borgoña Blanca",
    fecha: "2024-03-04",
    peso: 2100,
    brixPromedio: 16.5,
    phPromedio: 3.10,
    categoria: "A",
    observaciones: [],
  },
  {
    id: "5",
    codigoLote: "LOT-2024-005",
    proveedor: "Agricola Maipo",
    variedad: "Syrah",
    fecha: "2024-03-05",
    peso: 1650,
    brixPromedio: 19.1,
    phPromedio: 3.55,
    categoria: "B",
    observaciones: ["Bayas verdes en rango observado (4.2%)"],
  },
  {
    id: "6",
    codigoLote: "LOT-2024-006",
    proveedor: "Fundo Las Palmas",
    variedad: "Carménère",
    fecha: "2024-03-06",
    peso: 2700,
    brixPromedio: 17.3,
    phPromedio: 3.30,
    categoria: "A",
    observaciones: [],
  },
  {
    id: "7",
    codigoLote: "LOT-2024-007",
    proveedor: "Viña Santa Rosa",
    variedad: "Pinot Noir",
    fecha: "2024-03-07",
    peso: 980,
    brixPromedio: 21.0,
    phPromedio: 3.80,
    categoria: "C",
    observaciones: ["°Brix supera el rango máximo", "pH fuera de rango"],
  },
  {
    id: "8",
    codigoLote: "LOT-2024-008",
    proveedor: "Cooperativa del Valle",
    variedad: "Sauvignon Blanc",
    fecha: "2024-03-08",
    peso: 2200,
    brixPromedio: 18.7,
    phPromedio: 3.40,
    categoria: "B",
    observaciones: ["Deshidratación en límite (1.9%)"],
  },
  {
    id: "9",
    codigoLote: "LOT-2024-009",
    proveedor: "Fundo El Condor",
    variedad: "Merlot",
    fecha: "2024-03-09",
    peso: 3400,
    brixPromedio: 16.9,
    phPromedio: 2.95,
    categoria: "A",
    observaciones: [],
  },
  {
    id: "10",
    codigoLote: "LOT-2024-010",
    proveedor: "Agricola Los Andes",
    variedad: "Cabernet Sauvignon",
    fecha: "2024-03-10",
    peso: 1900,
    brixPromedio: 18.4,
    phPromedio: 3.25,
    categoria: "A",
    observaciones: [],
  },
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
