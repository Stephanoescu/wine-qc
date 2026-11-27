"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Rol } from "@/lib/config/roles";
import { FormField, inputBaseClasses } from "@/components/recepcion/WizardUI";
import { CampoFirma } from "@/components/lote/CampoFirma";

export interface FirmaMotivo {
  por: string;
  rol: Rol;
  motivo: string;
}

/** Confirmación con firma (nombre y rol) y motivo obligatorio; queda en la bitácora. */
export function DialogoMotivo({
  titulo,
  descripcion,
  etiquetaConfirmar,
  peligro,
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  descripcion: React.ReactNode;
  etiquetaConfirmar: string;
  peligro?: boolean;
  onConfirmar: (f: FirmaMotivo) => void;
  onCancelar: () => void;
}) {
  const [por, setPor] = useState("");
  const [rol, setRol] = useState<Rol | "">("");
  const [motivo, setMotivo] = useState("");
  const puede = por.trim() !== "" && rol !== "" && motivo.trim() !== "";

  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && onCancelar();
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [onCancelar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-marine-dark/50 backdrop-blur-sm sm:p-4 print:hidden" onClick={onCancelar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-dialogo-motivo"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl"
      >
        <div className={`flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 ${peligro ? "bg-red-50" : "bg-slate-50"}`}>
          <h2 id="titulo-dialogo-motivo" className={`text-base font-black ${peligro ? "text-red-800" : "text-marine"}`}>
            {titulo}
          </h2>
          <button type="button" onClick={onCancelar} className="p-1.5 rounded-lg text-slate-500 hover:bg-white" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="text-sm font-medium text-slate-700 leading-relaxed">{descripcion}</div>
          <CampoFirma etiqueta="Registrado por" nombre={por} rol={rol} onNombre={setPor} onRol={setRol} />
          <FormField label="Motivo" required ayuda="Queda en la bitácora del registro">
            <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={`${inputBaseClasses} resize-y`} />
          </FormField>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={onCancelar} className="px-5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button
              type="button"
              disabled={!puede}
              onClick={() => puede && onConfirmar({ por: por.trim(), rol: rol as Rol, motivo: motivo.trim() })}
              className={`px-5 py-3 rounded-xl text-sm font-bold text-white border disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 ${
                peligro ? "bg-red-600 border-red-700 hover:bg-red-700" : "bg-marine border-marine-dark hover:bg-marine-light"
              }`}
            >
              {etiquetaConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
