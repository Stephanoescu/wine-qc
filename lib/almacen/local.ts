// ============================================================
// Capa de almacenamiento local (localStorage) compartida por los
// módulos. Los componentes nunca acceden a localStorage directamente:
// usan los almacenes de cada módulo, que se apoyan en estas funciones.
// Así se puede migrar a una base de datos compartida sin tocar la UI.
// ============================================================

export type Resultado = { ok: true } | { ok: false; error: string };

export const ERROR_ESPACIO = "No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado.";

/** Lee una lista JSON y conserva solo los elementos válidos. */
export function leerLista<T>(clave: string, esValido: (x: unknown) => x is T): T[] {
  try {
    const raw = localStorage.getItem(clave);
    if (!raw) return [];
    const datos: unknown = JSON.parse(raw);
    return Array.isArray(datos) ? datos.filter(esValido) : [];
  } catch {
    return [];
  }
}

export function escribirLista<T>(clave: string, lista: T[]): Resultado {
  try {
    localStorage.setItem(clave, JSON.stringify(lista));
    return { ok: true };
  } catch {
    return { ok: false, error: ERROR_ESPACIO };
  }
}

export function leerJSON<T>(clave: string): T | null {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function escribirJSON(clave: string, valor: unknown): Resultado {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return { ok: true };
  } catch {
    return { ok: false, error: ERROR_ESPACIO };
  }
}

export function borrarClave(clave: string): void {
  try {
    localStorage.removeItem(clave);
  } catch {
    // ignorar
  }
}

/** Objeto con un `id` de texto. */
export function tieneId(x: unknown): x is { id: string } {
  return typeof x === "object" && x !== null && typeof (x as { id?: unknown }).id === "string";
}
