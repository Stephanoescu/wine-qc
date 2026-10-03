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
    texto:
      "Seleccionar bayas de diferentes sectores del recipiente o lote recibido: superficie, zona media, zonas laterales y distintas posiciones accesibles.",
  },
  {
    id: "3.2",
    texto:
      "Evitar seleccionar únicamente las bayas visualmente mejores o peores. La muestra debe ser representativa del lote completo.",
  },
  {
    id: "3.3",
    texto:
      "Reunir las bayas seleccionadas en un recipiente limpio para formar una muestra compuesta.",
  },
  {
    id: "3.4",
    texto: "Mezclar cuidadosamente la muestra antes de proceder al análisis.",
  },
  {
    id: "3.5",
    texto:
      "Extraer aleatoriamente 50 bayas para los análisis fisicoquímicos (referencia AWRI — Australian Wine Research Institute).",
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
      <div className="rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-800 bg-gradient-to-r from-red-950/40 to-transparent">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-900/40 border border-red-800/40">
            <FlaskConical className="w-4 h-4 text-red-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-100">
              Obtención de muestra representativa
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Procedimiento 3.1–3.5 · Marque cada paso al completarlo
            </p>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-4">
          {/* Reference note */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-900/15 border border-amber-700/25">
            <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-stone-400 leading-relaxed">
              Basado en el protocolo del{" "}
              <span className="font-semibold text-amber-400">AWRI</span>{" "}
              (Australian Wine Research Institute). Se utilizan{" "}
              <span className="font-semibold text-stone-200">50 bayas</span> para la
              evaluación de madurez. Esta etapa garantiza que la muestra sea estadísticamente
              representativa del lote completo.
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-stone-500">
              <span>Pasos completados</span>
              <span className="font-mono font-semibold text-stone-300">
                {completedCount} / {PASOS_MUESTRA.length}
              </span>
            </div>
            <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / PASOS_MUESTRA.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-2">
            {PASOS_MUESTRA.map((paso) => {
              const isChecked = !!checked[paso.id];
              return (
                <button
                  key={paso.id}
                  onClick={() => toggle(paso.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                    isChecked
                      ? "bg-emerald-900/20 border-emerald-700/40"
                      : "bg-stone-800/40 border-stone-700/50 hover:border-stone-600 hover:bg-stone-800/70"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-600" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                          isChecked
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-stone-700 text-stone-400"
                        }`}
                      >
                        {paso.id}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed mt-1 ${
                        isChecked ? "text-stone-300 line-through decoration-stone-500" : "text-stone-300"
                      }`}
                    >
                      {paso.texto}
                    </p>
                  </div>
                  {isChecked && (
                    <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Final note */}
          {allChecked && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-900/20 border border-emerald-700/30 mt-1 animate-in fade-in duration-500">
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-400 font-medium">
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
