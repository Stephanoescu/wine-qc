"use client";

import React, { useState } from "react";
import { ImageOff, Shapes } from "lucide-react";
import { GRUPOS, IMAGEN_CRIBAS } from "@/lib/config/trituracion";
import { DEFINICION_GRUPOS, TEXTO_POKA_YOKE_CRIBAS } from "@/lib/config/trituracion-textos";
import { SectionCard } from "@/components/recepcion/WizardUI";
import { DiagramaRecorrido } from "./DiagramaRecorrido";

/**
 * «Poka-Yoke físico: CRIBAS»: el lugar donde queda la uva indica su grupo.
 * Al costado, la foto de las cribas de la bodega; si aún no existe, un marcador
 * con el diagrama del recorrido. Con la foto, el diagrama se muestra debajo.
 */
export function PokaYokeCribas() {
  const [imagen, setImagen] = useState<"cargando" | "ok" | "falta">("cargando");
  const ruta = `public${IMAGEN_CRIBAS}`;

  return (
    <>
      <SectionCard title="Poka-Yoke físico: CRIBAS" subtitle="Sección 4.2" icon={Shapes}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-marine leading-relaxed">{TEXTO_POKA_YOKE_CRIBAS}</p>
            <ul className="flex flex-col gap-2">
              {GRUPOS.map((g) => (
                <li key={g} className="flex gap-3 p-3 rounded-xl border border-gold/40 bg-gold/5">
                  <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-gold text-white font-black font-mono flex items-center justify-center">
                    {g}
                  </span>
                  <div>
                    <p className="text-sm font-black text-marine">
                      {DEFINICION_GRUPOS[g].nombre} · {DEFINICION_GRUPOS[g].recipiente}
                    </p>
                    <p className="text-xs font-medium text-slate-600">{DEFINICION_GRUPOS[g].identificacion}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center min-h-48">
            {imagen !== "falta" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={IMAGEN_CRIBAS}
                alt="Cribas de 20 y 18 mm de la bodega con los recipientes G, M y P"
                className={`w-full h-full object-cover ${imagen === "ok" ? "" : "hidden"}`}
                onLoad={() => setImagen("ok")}
                onError={() => setImagen("falta")}
              />
            )}
            {imagen === "falta" && (
              <div className="w-full p-4 flex flex-col items-center gap-3 text-center">
                <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <ImageOff className="w-4 h-4" />
                  Agregar foto de las cribas de la bodega en {ruta}
                </p>
                <DiagramaRecorrido className="w-full h-auto max-w-xs" />
              </div>
            )}
          </div>
        </div>
      </SectionCard>
      {imagen === "ok" && (
        <SectionCard title="Recorrido de las uvas y sus recipientes" subtitle="Sección 4" icon={Shapes}>
          <DiagramaRecorrido />
        </SectionCard>
      )}
    </>
  );
}
