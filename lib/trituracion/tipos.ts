// ============================================================
// Modelo de datos del módulo «Despalillado, clasificación y trituración»
// ------------------------------------------------------------
// El registro EN_CURSO es su propio borrador (se autosalva), por eso los
// valores numéricos se guardan como texto tal como se escriben ("12,5");
// la lógica los interpreta con parseNumero/validarNumero.
// ============================================================
import type { Rol } from "@/lib/config/roles";
import type { Grupo } from "@/lib/config/trituracion";
import type { CambioBitacora } from "@/lib/recepcion/tipos";

export type { Grupo } from "@/lib/config/trituracion";
export type { CambioBitacora } from "@/lib/recepcion/tipos";

/** Firma con nombre, rol y fecha (ISO). */
export interface FirmaRol {
  nombre: string;
  rol: Rol | "";
  fecha: string;
}

// ─────────────────────────────────────────
// Configuración de gaps (sección 4.2 y Anexo B)
// ─────────────────────────────────────────
export interface FilaGap {
  /** Gap estándar en mm (texto); vacío = no establecido. */
  gapMm: string;
  /** El grupo no se presentó en la comprobación: NO APLICA. */
  noAplica: boolean;
  /** Posición o marca de referencia del ajuste. */
  posicion: string;
}

export interface VersionTablaGaps {
  id: string;
  /** Correlativo (1, 2, 3…). La vigente es la de mayor número. */
  version: number;
  filas: Record<Grupo, FilaGap>;
  equipoModelo: string;
  configuracionVersion: string;
  responsableComprobacion: string;
  aprobacion: FirmaRol;
  creadaEn: string;
  /** Comprobaciones del Anexo B de las que salió esta versión. */
  comprobacionIds: string[];
}

/** Control de apertura de piel e integridad de semillas (actividad 9; también en el Registro D). */
export interface ControlApertura {
  id: string;
  momento: "inicio" | "tras_parada" | "final" | "comprobacion";
  hora: string;
  bayasRevisadas: string;
  abiertas: string;
  enteras: string;
  semillasRevisadas: string;
  semillasDaniadas: string;
  noEvaluable: boolean;
  recipientesAfectados: string;
}

/** Intento de la comprobación del Anexo B (4): se cambia una sola condición por intento. */
export interface IntentoComprobacion {
  id: string;
  gapMm: string;
  posicion: string;
  condicionAnterior: string;
  condicionNueva: string;
  control: ControlApertura;
  disposicionPorciones: string;
}

/** Registro D: comprobación inicial del gap de un grupo (Anexo B). */
export interface ComprobacionInicial {
  id: string;
  fecha: string;
  grupo: Grupo;
  /** El grupo no se presentó: se anota NO APLICA (Anexo B 5). */
  noAplica: boolean;
  equipoModelo: string;
  /** Casillas del Anexo B (1) y (2). */
  checks: Record<string, boolean>;
  gapInicial: {
    gapRealMm: string;
    posicion: string;
    masaKg: string;
    alimentacionEstable: boolean | null;
    mantenimiento: FirmaRol;
  };
  intentos: IntentoComprobacion[];
  observaciones: string;
  creadaEn: string;
  updatedAt: string;
}

// ─────────────────────────────────────────
// Registro de trituración (uno por lote de Recepción)
// ─────────────────────────────────────────
export type EstadoRegistro = "EN_CURSO" | "CERRADO" | "CERRADO_CON_RETENIDOS";

export interface Incidencia {
  id: string;
  hora: string;
  descripcion: string;
  /** Mantenimiento que intervino (nombre). */
  mantenimiento: string;
}

export interface ControlSalida {
  id: string;
  hora: string;
  resultado: "conforme" | "fruta_rota" | null;
  comentarioFrutaRota: string;
  tallosObservados: boolean | null;
  danio: string;
  fotoIds: string[];
  /** Se detuvo y se solicitó la revisión del equipo. */
  detencion: { solicitada: boolean; correccion: string };
  /** Producción verifica la salida tras la intervención. */
  verificaProduccion: FirmaRol;
}

export interface Recipiente {
  id: string;
  identificador: string;
  brutoKg: string;
  taraKg: string;
  hora: string;
}

export type TipoFraccion = "FRUTA_ROTA" | "TALLOS" | "PRUEBA" | "REMANENTE";

export interface Fraccion {
  id: string;
  tipo: TipoFraccion;
  kg: string;
  recipiente: string;
  hora: string;
}

export interface Retencion {
  id: string;
  origen: "control" | "perdida_identificacion";
  /** Control No conforme / No evaluable que originó la retención (origen «control»). */
  controlId?: string;
  /** Control conforme desde el que se retiene (vacío = desde el inicio del grupo). */
  desdeControlId: string;
  kg: string;
  recipientes: string;
  descripcion: string;
  accion: "revision" | "ajuste_gap" | "detener" | null;
  correccion: string;
  ajusteGap?: { nuevoMm: string; mantenimiento: FirmaRol };
  conformidadProduccion: FirmaRol;
  disposicion: { decision: "autorizar_entrega" | "no_entregar" | null; texto: string; firma: FirmaRol };
}

export interface ProcesoGrupo {
  gap: {
    tablaVersionId: string;
    tablaVersion: number;
    /** Aprobación de la versión usada (identifica la versión aunque su número se repita). */
    tablaAprobacion?: FirmaRol;
    estandarMm: number;
    posicion: string;
    aplicadoMm: string;
    mantenimiento: FirmaRol;
  };
  checks: Record<string, boolean>;
  inicio: string;
  fin: string;
  kgTriturados: string;
  controles: ControlApertura[];
  retenciones: Retencion[];
}

export interface Tanda {
  numero: number;
  cerrada: boolean;
  cerradaEn: string;
  checks: Record<string, boolean>;
  grupos: Record<Grupo, { noAparecio: boolean; recipientes: Recipiente[] }>;
  fracciones: Fraccion[];
  proceso: Partial<Record<Grupo, ProcesoGrupo>>;
}

export interface Entrega {
  id: string;
  tanda: number;
  grupo: Grupo;
  kg: string;
  hora: string;
  destino: string;
}

export interface RegistroTrituracion {
  version: 1;
  id: string;
  loteId: string;
  /** Código original del lote (no cambia en Trituración). */
  codigoLote: string;
  /** Copia de la ficha de Recepción al recibir el lote. */
  entrada: {
    pesoDisponibleKg: number;
    variedad: string;
    proveedor: string;
    origen: string;
    estadoLote: string;
    disposicion: { nombre: string; rol?: Rol; destino: string };
    capturadaEn: string;
  };
  estado: EstadoRegistro;
  /** Paso actual del asistente (1–6). */
  paso: number;
  /** Casillas de los pasos 1 a 3 y 6 (las de tandas y grupos van en cada uno). */
  checks: Record<string, boolean>;
  recepcion: { horaEntrega: string; recibe: FirmaRol; entregadoPor: FirmaRol };
  despalillado: { anomalia: boolean | null; incidencias: Incidencia[] };
  salida: { controles: ControlSalida[] };
  tandas: Tanda[];
  entrega: {
    entregas: Entrega[];
    disposicionPorciones: { texto: string; firma: FirmaRol };
    limpieza: { responsable: FirmaRol; hora: string };
    cierre: FirmaRol;
  };
  bitacora: CambioBitacora[];
  creadoEn: string;
  updatedAt: string;
  cerradoEn?: string;
}
