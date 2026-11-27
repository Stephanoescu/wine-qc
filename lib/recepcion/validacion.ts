// ============================================================
// Validación de entradas numéricas (acepta coma o punto decimal)
// ============================================================

export interface ReglaNumero {
  min?: number;
  max?: number;
  /** El mínimo no está permitido (valor > min). */
  minExclusivo?: boolean;
  /** Solo enteros. */
  entero?: boolean;
}

export interface ResultadoNumero {
  valor: number | null;
  /** Mensaje en español, o null si es válido o está vacío. */
  error: string | null;
  vacio: boolean;
}

const PATRON_NUMERO = /^-?\d+(?:[.,]\d+)?$/;

/** Convierte "12,5" o "12.5" a número. Devuelve null si no es un número válido. */
export function parseNumero(texto: string): number | null {
  const t = texto.trim();
  if (!PATRON_NUMERO.test(t)) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function fmtLimite(n: number): string {
  return formatear(n, 3, 0);
}

/**
 * Valida un texto contra una regla. Un campo vacío no tiene error
 * (`vacio: true`); quien llama decide si es obligatorio.
 */
export function validarNumero(texto: string, regla: ReglaNumero): ResultadoNumero {
  if (texto.trim() === "") return { valor: null, error: null, vacio: true };

  const n = parseNumero(texto);
  if (n === null) return { valor: null, error: "Ingrese un número válido", vacio: false };

  if (regla.entero && !Number.isInteger(n)) {
    return { valor: null, error: "Debe ser un número entero", vacio: false };
  }
  const { min, max, minExclusivo } = regla;
  if (min !== undefined && min >= 0 && n < 0) {
    return { valor: null, error: "No se aceptan valores negativos", vacio: false };
  }
  if (min !== undefined && (minExclusivo ? n <= min : n < min)) {
    const msg = minExclusivo
      ? `Debe ser mayor que ${fmtLimite(min)}`
      : max !== undefined
        ? `Debe estar entre ${fmtLimite(min)} y ${fmtLimite(max)}`
        : `Debe ser al menos ${fmtLimite(min)}`;
    return { valor: null, error: msg, vacio: false };
  }
  if (max !== undefined && n > max) {
    const msg =
      min !== undefined && !minExclusivo
        ? `Debe estar entre ${fmtLimite(min)} y ${fmtLimite(max)}`
        : `Valor imposible: el máximo es ${fmtLimite(max)}`;
    return { valor: null, error: msg, vacio: false };
  }
  return { valor: n, error: null, vacio: false };
}

/** Redondea para evitar errores de coma flotante al restar o sumar pesos. */
export function redondear(n: number, decimales = 3): number {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}

const formateadores = new Map<string, Intl.NumberFormat>();

/** Separador de miles: espacio irrompible (evita confundir "1.900" con 1,9). */
const SEPARADOR_MILES = " ";

/**
 * Formatea un número para mostrarlo con coma decimal: 1900,5 → "1 900,50".
 * `decimales` es el máximo; `minimoDecimales` (por defecto igual) permite
 * ocultar ceros finales: formatear(138.5, 2, 0) → "138,5".
 */
export function formatear(n: number | null | undefined, decimales = 2, minimoDecimales = decimales): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const clave = `${minimoDecimales}-${decimales}`;
  let f = formateadores.get(clave);
  if (!f) {
    // Se formatea con un locale de referencia fijo y se reemplazan los separadores,
    // para no depender de los datos regionales del navegador.
    f = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: minimoDecimales,
      maximumFractionDigits: decimales,
      useGrouping: true,
    });
    formateadores.set(clave, f);
  }
  return f
    .format(n)
    .replace(/,/g, SEPARADOR_MILES)
    .replace(".", ",");
}
