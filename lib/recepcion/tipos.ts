// ============================================================
// Modelo de datos del lote (formato v2) y del borrador del asistente
// ============================================================

import type { Rol } from "@/lib/config/roles";

export type EstadoLote = "LIBERADO" | "RETENIDO" | "RECHAZADO";

export type ClaveParametroVisual =
  | "podredumbre"
  | "bayasDaniadas"
  | "deshidratacion"
  | "bayasVerdes"
  | "materiaExtrana"
  | "olorVinagre";

// ─────────────────────────────────────────
// Lote guardado (formato v2)
// ─────────────────────────────────────────
export interface JabaPesada {
  numero: number;
  /** Lectura de la balanza. Si se usó la función TARA, ya es el neto. */
  pesoLleno: number;
  tara: number | null;
  neto: number | null;
  taraPendiente: boolean;
}

export interface ObsCarga {
  jaba: number;
  descripcion: string;
  /** Fotos en IndexedDB (desde la v2; los lotes anteriores no tienen). */
  fotoIds?: string[];
}

export interface LecturaTemp {
  jaba: number;
  temperatura: number;
  conforme: boolean;
}

export interface ParamVisual {
  clave: ClaveParametroVisual;
  observado: boolean;
  fotoIds: string[];
  comentario?: string;
}

export interface Ronda {
  lecturas: number[];
  promedio: number;
  conforme: boolean;
  /** Solo pH: lectura mayor − menor. */
  diferencia?: number;
}

export interface Motivo {
  paso: number;
  parametro: string;
  detalle: string;
  tipo: "observacion" | "fuera_rango" | "pendiente";
}

export interface Firma {
  nombre: string;
  /** Desde la v2; las firmas anteriores no lo tienen. */
  rol?: Rol;
  destino: string;
  motivo?: string;
  fecha: string;
}

export interface EntradaHistorial {
  estado: EstadoLote;
  fecha: string;
  por: string;
  rol?: Rol;
  nota?: string;
}

/** Entrada de la bitácora de cambios (solo lectura). */
export interface CambioBitacora {
  campo: string;
  anterior: string;
  nuevo: string;
  por: string;
  rol: Rol;
  motivo: string;
  /** ISO. */
  fecha: string;
}

/** Peso que Recepción entrega a Trituración (neto − descuentos). */
export interface PesoDisponible {
  kg: number;
  /** Hay taras pendientes: no se puede usar en Trituración hasta completarlas. */
  provisional: boolean;
  descuentos: { materiaExtranaKg: number; uvaDaniadaKg: number; bolsaMuestraKg: number };
}

export interface LoteV2 {
  version: 2;
  id: string;
  codigoLote: string;
  proveedor: string;
  origen: string;
  variedad: string;
  fecha: string;
  hora: string;
  numJabas: number;
  carga: { hayObservaciones: boolean; observaciones: ObsCarga[] };
  pesado: { usoFuncionTara: boolean; jabas: JabaPesada[]; pesoNetoTotal: number; parcial: boolean };
  muestreo: { jabasSeleccionadas: number[]; temperaturas: LecturaTemp[]; pesoBolsaBayasG: number };
  cajas: {
    parametros: ParamVisual[];
    /** Obligatoria si se observó algún parámetro. */
    decisionEnologia?: string;
    materiaExtranaKg: number;
    uvaDaniadaKg: number;
    contenidoInspeccionadoKg: number;
    /** Alguna jaba seleccionada tenía la tara pendiente: el contenido es parcial. */
    contenidoProvisional: boolean;
    materiaExtranaPct: number | null;
    uvaDaniadaPct: number | null;
  };
  /** 1 o 2 rondas (la 2.ª solo si la 1.ª quedó fuera de rango). */
  brix: { rondas: Ronda[]; conforme: boolean };
  /** `temperaturaJugo` solo existe en lotes guardados antes de la v2; ya no se registra ni se muestra. */
  ph: { rondas: Ronda[]; conforme: boolean; temperaturaJugo?: number };
  acidez: {
    metodo: string;
    puntoFinal: string;
    valor: number | null;
    pendiente: boolean;
    /** Solo si el valor está fuera de rango: el laboratorio confirmó el resultado. */
    confirmadoPorLab?: boolean;
    conforme: boolean | null;
  };
  estado: EstadoLote;
  estadoSugerido: EstadoLote;
  motivos: Motivo[];
  /** LIBERADO: "Autorizado por" + destino. */
  disposicion?: Firma;
  /** RECHAZADO, o liberación con observaciones (motivo obligatorio). */
  enologia?: Firma;
  liberadoConObservaciones?: boolean;
  /** RETENIDO en el asistente: quién registró (opcional). */
  responsable?: string;
  responsableRol?: Rol;
  /** Un lote LIBERADO pasó a RETENIDO por una edición posterior; requiere nueva decisión firmada. */
  retenidoPorEdicion?: { fecha: string; por: string; rol: Rol; motivo: string };
  pesoDisponible: PesoDisponible;
  /** Bitácora de cambios del informe (ediciones y pendientes completados). */
  bitacora: CambioBitacora[];
  historial: EntradaHistorial[];
  // Copias para la tabla de /reportes
  pesoNeto: number;
  brixPromedio: number | null;
  phPromedio: number | null;
  acidezValor: number | null;
  savedAt: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────
// Lote en formato anterior (A/B/C)
// ─────────────────────────────────────────
export interface LoteLegacy {
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
  categoria: "A" | "B" | "C" | null;
  observaciones: string[];
  inspeccionVisual?: Record<string, number>;
  savedAt?: string;
}

export type LoteAlmacenado = LoteV2 | LoteLegacy;

/** Registro de un lote eliminado (bitácora local). */
export interface EntradaEliminacion {
  /** Id del lote o del registro eliminado. */
  id: string;
  codigoLote: string;
  /** Estado que tenía al eliminarse (de Recepción o de Trituración). */
  estado: EstadoLote | "EN_CURSO" | "CERRADO" | "CERRADO_CON_RETENIDOS";
  /** Módulo del dato eliminado (sin valor = Recepción, entradas anteriores). */
  modulo?: "recepcion" | "trituracion";
  motivo: string;
  /** ISO. */
  fecha: string;
}

export function esLegacy(l: LoteAlmacenado): l is LoteLegacy {
  return !("version" in l);
}

// ─────────────────────────────────────────
// Borrador del asistente (valores tal como se escriben)
// ─────────────────────────────────────────
/** Cambiar este número descarta borradores guardados con un esquema incompatible. */
export const BORRADOR_ESQUEMA = 1;

export interface FilaObsCarga {
  /** Id estable para la lista en React. */
  id: string;
  jaba: string;
  descripcion: string;
  /** Fotos en IndexedDB (ver lib/recepcion/fotos.ts). */
  fotoIds: string[];
}

export interface FilaJaba {
  pesoLleno: string;
  tara: string;
  taraPendiente: boolean;
}

export interface IdentificacionBorrador {
  proveedor: string;
  origen: string;
  fecha: string;
  hora: string;
  variedad: string;
  numJabas: string;
  codigoLote: string;
}

export interface FilaMuestra {
  /** Id estable para la lista en React. */
  id: string;
  /** N° de jaba seleccionada (editable). */
  jaba: string;
  temperatura: string;
}

export interface ParamVisualBorrador {
  /** null = aún no se eligió "Se observa" / "No se observa". */
  observado: boolean | null;
  /** Ids de fotos guardadas en IndexedDB (ver lib/recepcion/fotos.ts). */
  fotoIds: string[];
  comentario: string;
}

export interface BorradorLote {
  esquema: number;
  paso: number;
  /** Casillas marcadas, por id de ítem (ver recepcion-textos.ts). */
  checks: Record<string, boolean>;
  identificacion: IdentificacionBorrador;
  carga: { hayObservaciones: boolean | null; observaciones: FilaObsCarga[] };
  /** `jabas[i]` corresponde a la jaba N° i+1. Puede tener más filas que numJabas. */
  pesado: { usoFuncionTara: boolean; jabas: FilaJaba[] };
  /** Paso 4: jabas seleccionadas (con su temperatura) y bolsa de bayas. */
  muestreo: { filas: FilaMuestra[]; pesoBolsaG: string };
  /** Paso 5: inspección de las cajas seleccionadas. */
  cajas: {
    parametros: Record<ClaveParametroVisual, ParamVisualBorrador>;
    decisionEnologia: string;
    materiaExtranaKg: string;
    uvaDaniadaKg: string;
  };
  /** Paso 6: rondas[0] = B1–B3, rondas[1] = B1'–B3' (solo cuenta si la 1.ª queda fuera de rango). */
  brix: { rondas: string[][] };
  /** Paso 7: rondas[0] = pH1–pH2, rondas[1] = pH1'–pH2'. */
  ph: { rondas: string[][] };
  /** Paso 8: resultado del laboratorio. */
  acidez: {
    /** El resultado aún no llega: se guarda el lote con la acidez pendiente. */
    pendiente: boolean;
    metodo: string;
    puntoFinal: string;
    valor: string;
    /** Respuesta a "¿El laboratorio confirmó el valor?" (solo fuera de rango). */
    confirmado: boolean | null;
  };
  /**
   * Paso 9. `estado` null = usar el sugerido. Los campos de firma se reutilizan
   * según el estado: LIBERADO → Autorizado por + Destino; RECHAZADO →
   * Confirmado por (Enología) + Motivo + Destino; RETENIDO → responsable opcional.
   */
  decision: { estado: EstadoLote | null; nombre: string; rol: Rol | ""; destino: string; motivo: string };
  /** Solo en modo edición: firma de quien edita. */
  edicion?: { por: string; rol: Rol | ""; motivo: string; trituracionInformada: boolean };
}
