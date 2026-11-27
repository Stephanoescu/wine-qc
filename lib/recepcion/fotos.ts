// ============================================================
// Fotos de la inspección (paso 5): compresión en el navegador y
// almacenamiento en IndexedDB (localStorage no admite imágenes).
// Solo se usa en el cliente.
// ============================================================
import { FOTOS } from "@/lib/config/recepcion";
import { nuevoId } from "./borrador";

const NOMBRE_BD = "wine_qc_fotos";
const ALMACEN = "fotos";

let conexion: Promise<IDBDatabase> | null = null;

function abrirBD(): Promise<IDBDatabase> {
  if (conexion) return conexion;
  conexion = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Este navegador no permite guardar fotos."));
      return;
    }
    const req = indexedDB.open(NOMBRE_BD, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(ALMACEN)) req.result.createObjectStore(ALMACEN);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("No se pudo abrir el almacén de fotos."));
    req.onblocked = () => reject(new Error("El almacén de fotos está bloqueado por otra pestaña."));
  });
  // Si falla, permitir reintentar más tarde.
  conexion.catch(() => {
    conexion = null;
  });
  return conexion;
}

function transaccion<T>(modo: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return abrirBD().then(
    (bd) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = bd.transaction(ALMACEN, modo);
        const req = op(tx.objectStore(ALMACEN));
        tx.oncomplete = () => resolve(req ? req.result : undefined);
        tx.onerror = () => reject(tx.error ?? new Error("Error del almacén de fotos."));
        tx.onabort = () => reject(tx.error ?? new Error("No hay espacio para guardar la foto."));
      }),
  );
}

/** Guarda una imagen ya comprimida y devuelve su id. */
export async function guardarFoto(blob: Blob, id: string = nuevoId()): Promise<string> {
  await transaccion("readwrite", (s) => s.put(blob, id));
  return id;
}

export async function obtenerFoto(id: string): Promise<Blob | null> {
  const r = await transaccion<Blob>("readonly", (s) => s.get(id));
  return r instanceof Blob ? r : null;
}

export async function borrarFotos(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await transaccion("readwrite", (s) => {
    for (const id of ids) s.delete(id);
  });
}

// ─────────────────────────────────────────
// Compresión
// ─────────────────────────────────────────
async function decodificar(archivo: Blob): Promise<{ fuente: CanvasImageSource; ancho: number; alto: number; liberar: () => void }> {
  // createImageBitmap respeta la orientación EXIF de las fotos del celular.
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(archivo, { imageOrientation: "from-image" });
      return { fuente: bmp, ancho: bmp.width, alto: bmp.height, liberar: () => bmp.close() };
    } catch {
      // Formato no admitido por createImageBitmap: probar con <img>.
    }
  }
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { fuente: img, ancho: img.naturalWidth, alto: img.naturalHeight, liberar: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("No se pudo leer la imagen. Use una foto en formato JPG o PNG.");
  }
}

/** Reduce la imagen a `FOTOS.maxLadoPx` en su lado mayor y la convierte a JPEG. */
export async function comprimirImagen(archivo: Blob): Promise<Blob> {
  const { fuente, ancho, alto, liberar } = await decodificar(archivo);
  try {
    const escala = Math.min(1, FOTOS.maxLadoPx / Math.max(ancho, alto));
    const w = Math.max(1, Math.round(ancho * escala));
    const h = Math.max(1, Math.round(alto * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la imagen.");
    ctx.fillStyle = "#fff"; // fondo blanco para PNG con transparencia
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(fuente, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", FOTOS.calidadJpeg));
    if (!blob) throw new Error("No se pudo comprimir la imagen.");
    return blob;
  } finally {
    liberar();
  }
}

/** Comprime y guarda; devuelve el id de la foto. */
export async function agregarFoto(archivo: File): Promise<string> {
  if (archivo.type && !archivo.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen.");
  }
  return guardarFoto(await comprimirImagen(archivo));
}
