"use client";

import React, { useState } from "react";
import { CheckSquare, Square, Info, FlaskConical, ChevronRight } from "lucide-react";
import { NavButtons } from "./WizardUI";

interface PasoMuestraProps {
  onNext: () => void;
  onPrev: () => void;
}

const PASOS_MUESTRA = [
  {
    id: "3.1",
    texto: "Seleccionar bayas de diferentes sectores del recipiente o lote recibido: superficie, zona media, zonas laterales y distintas posiciones accesibles. (Evitar seleccionar únicamente las bayas visualmente mejores o peores.)",
  },
  {
    id: "3.2",
    texto: "Reunir las bayas seleccionadas en un recipiente limpio para formar una muestra compuesta.",
  },
  {
    id: "3.3",
    texto: "Mezclar cuidadosamente la muestra.",
  },
  {
    id: "3.4",
    texto: "Extraer aleatoriamente la cantidad establecida para los análisis.",
  },
];

export function PasoMuestra({ onNext, onPrev }: PasoMuestraProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = PASOS_MUESTRA.every((p) => checked[p.id]);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const completedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-marine text-white shadow-sm">
            <FlaskConical className="w-5 h-5 text-gold-light" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-bold text-marine">
              Obtención de muestra representativa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Procedimiento 3.1–3.5 · Marque cada paso al completarlo
            </p>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-4">
          {/* Reference note */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200/60">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              Basado en el protocolo del{" "}
              <span className="font-bold">AWRI</span>{" "}
              (Australian Wine Research Institute). Se utilizan{" "}
              <span className="font-bold">50 bayas</span> para la
              evaluación de madurez. Esta etapa garantiza que la muestra sea estadísticamente
              representativa del lote completo.
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Pasos completados</span>
              <span className="font-mono text-marine">
                {completedCount} / {PASOS_MUESTRA.length}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-marine rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / PASOS_MUESTRA.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-2.5 mt-4">
            {PASOS_MUESTRA.map((paso) => {
              const isChecked = !!checked[paso.id];
              return (
                <button
                  key={paso.id}
                  onClick={() => toggle(paso.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                    isChecked
                      ? "bg-slate-50 border-marine/20 shadow-sm"
                      : "bg-white border-slate-200 hover:border-marine-light/40 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-marine" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                          isChecked
                            ? "bg-marine/10 text-marine"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {paso.id}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${
                        isChecked ? "text-slate-400 line-through decoration-slate-300" : "text-marine font-medium"
                      }`}
                    >
                      {paso.texto}
                    </p>
                  </div>
                  {isChecked && (
                    <ChevronRight className="w-4 h-4 text-marine/40 flex-shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Final note */}
          {allChecked && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 mt-2 animate-in fade-in duration-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-800 font-bold">
                ✓ Muestra representativa obtenida. Puede proceder a la evaluación fisicoquímica.
              </p>
            </div>
          )}
        </div>
      </div>

      <NavButtons
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Siguiente — Evaluación Fisicoquímica"
        disabledNext={!allChecked}
      />
    </div>
  );
}
