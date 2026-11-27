// ============================================================
// Borrador del asistente: creación y autosalvado en localStorage
// (permite recuperar el registro si se recarga la página en el celular)
// ============================================================
import { LECTURAS_POR_RONDA, VARIEDAD_POR_DEFECTO } from "@/lib/config/recepcion";
import { PARAMETROS_VISUALES } from "@/lib/config/recepcion-textos";
import {
  BORRADOR_ESQUEMA,
  type BorradorLote,
  type ClaveParametroVisual,
  type ParamVisualBorrador,
} from "./tipos";

const CLAVE_BORRADOR = "wine_qc_borrador";

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

/** Fecha local AAAA-MM-DD (no UTC: en Perú, después de las 19:00 UTC ya sería "mañana"). */
export function fechaLocalHoy(d = new Date()): string {
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}

export function horaLocalAhora(d = new Date()): string {
  return `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
}

export function generarCodigoLote(d = new Date()): string {
  const sufijo = String(d.getTime()).slice(-4);
  return `LOT-${d.getFullYear()}-${sufijo}`;
}

/** Id corto y único; `crypto.randomUUID` no existe en http (p. ej. pruebas por red local). */
export function nuevoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function parametrosVacios(): Record<ClaveParametroVisual, ParamVisualBorrador> {
  const vacio = (): ParamVisualBorrador => ({ observado: null, fotoIds: [], comentario: "" });
  return Object.fromEntries(PARAMETROS_VISUALES.map((p) => [p.clave, vacio()])) as Record<
    ClaveParametroVisual,
    ParamVisualBorrador
  >;
}

function rondasVacias(lecturas: number): string[][] {
  return [0, 1].map(() => Array.from({ length: lecturas }, () => ""));
}

/** Ajusta las rondas guardadas a 2 rondas × `lecturas` campos. */
function normalizarRondas(guardadas: unknown, lecturas: number): string[][] {
  const base = rondasVacias(lecturas);
  if (!Array.isArray(guardadas)) return base;
  return base.map((ronda, r) => ronda.map((_, i) => (typeof guardadas[r]?.[i] === "string" ? guardadas[r][i] : "")));
}

/** Ids de todas las fotos referenciadas por el borrador. */
export function fotosDelBorrador(b: BorradorLote): string[] {
  return Object.values(b.cajas.parametros).flatMap((p) => p.fotoIds);
}

export function crearBorradorVacio(): BorradorLote {
  const ahora = new Date();
  return {
    esquema: BORRADOR_ESQUEMA,
    paso: 1,
    checks: {},
    identificacion: {
      proveedor: "",
      origen: "",
      fecha: fechaLocalHoy(ahora),
      hora: horaLocalAhora(ahora),
      variedad: VARIEDAD_POR_DEFECTO,
      numJabas: "",
      codigoLote: generarCodigoLote(ahora),
    },
    carga: { hayObservaciones: null, observaciones: [] },
    pesado: { usoFuncionTara: false, jabas: [] },
    muestreo: { filas: [], pesoBolsaG: "" },
    cajas: { parametros: parametrosVacios(), decisionEnologia: "", materiaExtranaKg: "", uvaDaniadaKg: "" },
    brix: { rondas: rondasVacias(LECTURAS_POR_RONDA.brix) },
    ph: { rondas: rondasVacias(LECTURAS_POR_RONDA.ph), temperaturaJugo: "" },
    acidez: { pendiente: false, metodo: "", puntoFinal: "", valor: "", confirmado: null },
    decision: { estado: null, nombre: "", destino: "", motivo: "" },
  };
}

/** Devuelve el borrador guardado, o null si no hay uno válido. */
export function cargarBorrador(): BorradorLote | null {
  try {
    const raw = localStorage.getItem(CLAVE_BORRADOR);
    if (!raw) return null;
    const guardado = JSON.parse(raw) as Partial<BorradorLote>;
    if (guardado.esquema !== BORRADOR_ESQUEMA) return null;
    const vacio = crearBorradorVacio();
    // Fusión por sección: las secciones nuevas toman su valor por defecto.
    return {
      ...vacio,
      ...guardado,
      checks: { ...guardado.checks },
      identificacion: { ...vacio.identificacion, ...guardado.identificacion },
      carga: { ...vacio.carga, ...guardado.carga },
      pesado: { ...vacio.pesado, ...guardado.pesado },
      muestreo: { ...vacio.muestreo, ...guardado.muestreo },
      cajas: {
        ...vacio.cajas,
        ...guardado.cajas,
        parametros: Object.fromEntries(
          PARAMETROS_VISUALES.map((p) => [
            p.clave,
            { ...vacio.cajas.parametros[p.clave], ...guardado.cajas?.parametros?.[p.clave] },
          ]),
        ) as BorradorLote["cajas"]["parametros"],
      },
      brix: { rondas: normalizarRondas(guardado.brix?.rondas, LECTURAS_POR_RONDA.brix) },
      ph: {
        ...vacio.ph,
        ...guardado.ph,
        rondas: normalizarRondas(guardado.ph?.rondas, LECTURAS_POR_RONDA.ph),
      },
      acidez: { ...vacio.acidez, ...guardado.acidez },
      decision: { ...vacio.decision, ...guardado.decision },
    };
  } catch {
    return null;
  }
}

export function guardarBorrador(b: BorradorLote): void {
  try {
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(b));
  } catch {
    // Sin espacio o almacenamiento bloqueado: el asistente sigue funcionando en memoria.
  }
}

export function borrarBorrador(): void {
  try {
    localStorage.removeItem(CLAVE_BORRADOR);
  } catch {
    // ignorar
  }
}
