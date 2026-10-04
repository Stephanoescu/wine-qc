"use client";

import React, { useState } from "react";
import { FlaskConical, CheckSquare, Square, ChevronRight } from "lucide-react";
import { LIMITES_FISICOQUIMICA, type FisicoquimicaData } from "@/lib/recepcion-data";
import { FormField, StyledInput, NavButtons, ValueIndicator } from "./WizardUI";

interface Paso5Props {
  data: FisicoquimicaData;
  onChange: (data: FisicoquimicaData) => void;
  onNext: () => void;
  onPrev: () => void;
}

const PASOS_PH = [
  { id: "5.1", texto: "Encender el pH-metro." },
  { id: "5.2", texto: "Calibrar utilizando soluciones buffer apropiadas, normalmente pH 7 y pH 4." },
  { id: "5.3", texto: "Enjuagar el electrodo con agua destilada." },
  { id: "5.4", texto: "Colocar el jugo homogenizado en un vaso limpio." },
  { id: "5.5", texto: "Introducir el electrodo hasta cubrir correctamente el sensor." },
  { id: "5.6", texto: "Agitar suavemente. (Esperar hasta estabilización de la lectura aprox. 20–30 seg)." },
  { id: "5.7", texto: "Registrar el pH." },
  { id: "5.8", texto: "Enjuagar nuevamente el electrodo después de la lectura." },
  { id: "5.9", texto: "Realizar dos determinaciones consecutivas de pH sobre la misma muestra." },
  { id: "5.10", texto: "Calcular el promedio aritmético de ambas determinaciones:" },
];

function calcPH(data: FisicoquimicaData): number | null {
  const p1 = parseFloat(data.ph1);
  const p2 = parseFloat(data.ph2);
  if (isNaN(p1) || isNaN(p2)) return null;
  return (p1 + p2) / 2;
}

export function Paso5PH({ data, onChange, onNext, onPrev }: Paso5Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const phProm = calcPH(data);
  const allChecked = PASOS_PH.every((p) => checked[p.id]);
  const hasInputs = data.ph1 !== "" && data.ph2 !== "";

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const setPH = (i: number, v: string) => {
    const next = { ...data };
    if (i === 0) next.ph1 = v;
    if (i === 1) next.ph2 = v;
    onChange(next);
  };

  const completedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-marine text-white shadow-sm">
            <FlaskConical className="w-5 h-5 text-gold-light" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-bold text-marine">
              Medición de pH — criterio complementario
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Procedimiento 5.1–5.10 · Marque cada paso al completarlo
            </p>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Pasos completados</span>
              <span className="font-mono text-marine">{completedCount} / {PASOS_PH.length}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-marine rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / PASOS_PH.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-4">
            {PASOS_PH.map((paso, index) => {
              const isChecked = !!checked[paso.id];
              return (
                <div key={paso.id} className="flex flex-col gap-2">
                  <button
                    onClick={() => toggle(paso.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                      isChecked ? "bg-slate-50 border-marine/20 shadow-sm" : "bg-white border-slate-200 hover:border-marine-light/40 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isChecked ? <CheckSquare className="w-5 h-5 text-marine" /> : <Square className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md self-start ${isChecked ? "bg-marine/10 text-marine" : "bg-slate-100 text-slate-500"}`}>
                        {paso.id}
                      </span>
                      <p className={`text-sm leading-relaxed ${isChecked && index < 8 ? "text-slate-400 line-through decoration-slate-300" : "text-marine font-medium"}`}>
                        {paso.texto}
                      </p>
                    </div>
                    {isChecked && <ChevronRight className="w-4 h-4 text-marine/40 flex-shrink-0 mt-0.5" />}
                  </button>
                  
                  {/* Inputs para mediciones pH */}
                  {index === 8 && isChecked && (
                    <div className="ml-12 mr-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-marine">Determinaciones (pH)</span>
                          <span className="text-xs font-medium text-slate-500">Rango ideal: {LIMITES_FISICOQUIMICA.ph.min}–{LIMITES_FISICOQUIMICA.ph.max}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[data.ph1, data.ph2].map((v, i) => (
                            <FormField key={i} label={`Lectura ${i + 1}`}>
                              <div className="relative">
                                <StyledInput
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={v}
                                  onChange={(e: any) => setPH(i, e.target.value)}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">pH</span>
                              </div>
                            </FormField>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Promedio pH */}
                  {index === 9 && isChecked && phProm !== null && (
                    <div className="ml-12 mr-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Promedio Calculado</span>
                      </div>
                      <ValueIndicator
                        value={phProm}
                        min={LIMITES_FISICOQUIMICA.ph.min}
                        max={LIMITES_FISICOQUIMICA.ph.max}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <NavButtons
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Siguiente — Decisión Final"
        disabledNext={!allChecked || !hasInputs || phProm === null}
      />
    </div>
  );
}
