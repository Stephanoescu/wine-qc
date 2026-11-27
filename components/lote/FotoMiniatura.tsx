"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { obtenerFoto } from "@/lib/recepcion/fotos";

/** Muestra una foto guardada en IndexedDB. */
export function FotoMiniatura({ id, alt, className }: { id: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [falla, setFalla] = useState(false);

  useEffect(() => {
    let activo = true;
    let creada: string | null = null;
    obtenerFoto(id)
      .then((blob) => {
        if (!activo) return;
        if (!blob) {
          setFalla(true);
          return;
        }
        creada = URL.createObjectURL(blob);
        setUrl(creada);
      })
      .catch(() => activo && setFalla(true));
    return () => {
      activo = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [id]);

  if (falla) {
    return (
      <span className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-medium text-center p-1">
        Foto no disponible
      </span>
    );
  }
  if (!url) {
    return (
      <span className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}

/** Miniaturas que se amplían al tocarlas (informe del lote). */
export function GaleriaFotos({ ids, nombre }: { ids: string[]; nombre: string }) {
  const [ampliada, setAmpliada] = useState<string | null>(null);
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {ids.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => setAmpliada(id)}
            className="block w-20 h-20 print:w-28 print:h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
            aria-label={`Ver foto ${i + 1} de ${nombre}`}
          >
            <FotoMiniatura id={id} alt={`Foto ${i + 1} de ${nombre}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
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
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 text-marine flex items-center justify-center font-bold"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
