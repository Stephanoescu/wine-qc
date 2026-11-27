"use client";

import React, { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { FOTOS } from "@/lib/config/recepcion";
import { agregarFoto } from "@/lib/recepcion/fotos";
import { FotoMiniatura } from "./FotoMiniatura";

/**
 * Fotos de un campo: tomar con la cámara o adjuntar de la galería (comprimidas y
 * guardadas en IndexedDB), miniaturas que se amplían y botón para quitar.
 * Se usa en el paso 3 (observaciones de carga), el paso 5 y Trituración.
 */
export function FotosCampo({
  nombre,
  fotoIds,
  onAgregar,
  onQuitar,
  max = FOTOS.maxPorParametro,
  etiqueta = "Fotos",
}: {
  /** Para los textos de accesibilidad ("Foto 1 de …"). */
  nombre: string;
  fotoIds: string[];
  onAgregar: (ids: string[]) => void;
  onQuitar: (id: string) => void;
  max?: number;
  etiqueta?: string;
}) {
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ampliada, setAmpliada] = useState<string | null>(null);
  const restantes = max - fotoIds.length;

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []).slice(0, Math.max(0, restantes));
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (archivos.length === 0) return;
    setProcesando(true);
    setError(null);
    const ids: string[] = [];
    try {
      for (const a of archivos) ids.push(await agregarFoto(a));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la foto.");
    } finally {
      if (ids.length) onAgregar(ids);
      setProcesando(false);
    }
  }

  const boton =
    "inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-marine-light">{etiqueta}</span>
        <span className="text-xs font-mono text-slate-500">
          {fotoIds.length} / {max}
        </span>
      </div>

      {fotoIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotoIds.map((id, i) => (
            <div key={id} className="relative">
              <button
                type="button"
                onClick={() => setAmpliada(id)}
                className="block w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                aria-label={`Ver foto ${i + 1} de ${nombre}`}
              >
                <FotoMiniatura id={id} alt={`Foto ${i + 1} de ${nombre}`} className="w-full h-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => onQuitar(id)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-300 shadow flex items-center justify-center"
                aria-label={`Quitar foto ${i + 1}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {restantes > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={procesando}
            onClick={() => camara.current?.click()}
            className={`${boton} bg-marine text-white border-marine-dark hover:bg-marine-light`}
          >
            {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Tomar foto
          </button>
          <button
            type="button"
            disabled={procesando}
            onClick={() => galeria.current?.click()}
            className={`${boton} bg-white text-marine border-slate-300 hover:bg-slate-50`}
          >
            <ImagePlus className="w-4 h-4" />
            Adjuntar
          </button>
          <input ref={camara} type="file" accept="image/*" capture="environment" className="hidden" onChange={alElegir} />
          <input ref={galeria} type="file" accept="image/*" multiple className="hidden" onChange={alElegir} />
        </div>
      )}
      {procesando && <span className="text-xs text-slate-500 font-medium">Comprimiendo y guardando…</span>}
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}

      {ampliada && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${nombre}`}
          onClick={() => setAmpliada(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print:hidden"
        >
          <FotoMiniatura id={ampliada} alt={`Foto de ${nombre}`} className="max-w-full max-h-full rounded-lg shadow-2xl" />
          <button
            type="button"
            onClick={() => setAmpliada(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 text-marine flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
