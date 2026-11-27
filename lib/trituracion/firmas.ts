// ============================================================
// Firmas: la fecha y hora se registran al CONFIRMAR la firma
// (al pasar de paso o al pulsar el botón correspondiente), no al
// escribir el nombre. Escribir o cambiar el nombre deja la fecha vacía.
// ============================================================
import type { FirmaRol } from "./tipos";

/** Objeto firma: exactamente { nombre, rol, fecha }. */
function esFirma(x: unknown): x is FirmaRol {
  if (typeof x !== "object" || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  const claves = Object.keys(o);
  return claves.length === 3 && typeof o.nombre === "string" && typeof o.rol === "string" && typeof o.fecha === "string";
}

/** Nombre escrito (sin confirmar): la fecha queda vacía hasta sellarla. */
export function escribirFirma(f: FirmaRol, nombre: string, rol: FirmaRol["rol"] = f.rol): FirmaRol {
  return { nombre, rol, fecha: "" };
}

/** Pone la fecha y hora a todas las firmas con nombre y sin fecha (recorre todo el objeto). */
export function sellarFirmas<T>(x: T, ahora: string): T {
  if (esFirma(x)) {
    return (x.nombre.trim() && !x.fecha ? { ...x, fecha: ahora } : x) as T;
  }
  if (Array.isArray(x)) {
    let cambio = false;
    const out = x.map((v) => {
      const n = sellarFirmas(v, ahora);
      if (n !== v) cambio = true;
      return n;
    });
    return (cambio ? out : x) as T;
  }
  if (typeof x === "object" && x !== null) {
    let cambio = false;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
      const n = sellarFirmas(v, ahora);
      if (n !== v) cambio = true;
      out[k] = n;
    }
    return (cambio ? out : x) as T;
  }
  return x;
}
