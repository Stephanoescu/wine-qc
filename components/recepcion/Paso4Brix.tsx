"use client";

import React, { useState } from "react";
import { FlaskConical, CheckSquare, Square, ChevronRight } from "lucide-react";
import { LIMITES_FISICOQUIMICA, type FisicoquimicaData } from "@/lib/recepcion-data";
import { FormField, StyledInput, SectionCard, NavButtons, ValueIndicator } from "./WizardUI";

interface Paso4Props {
  data: FisicoquimicaData;
  onChange: (data: FisicoquimicaData) => void;
  onNext: () => void;
  onPrev: () => void;
}

const PASOS_BRIX = [
  { id: "4.1", texto: "Calibrar el refractómetro siguiendo las instrucciones del fabricante." },
  { id: "4.2", texto: "Limpiar y secar el prisma." },
  { id: "4.3", texto: "Colocar una gota del jugo homogenizado sobre el prisma, cubriendo adecuadamente la superficie." },
  { id: "4.4", texto: "Cerrar el prisma y realizar la lectura." },
  { id: "4.5", texto: "Registrar el valor en °Brix. (Realizar tres mediciones de la misma muestra)." },
  { id: "4.6", texto: "Calcular el promedio:" },
];

function calcBrix(data: FisicoquimicaData): number | null {
  const b1 = parseFloat(data.brix1);
  const b2 = parseFloat(data.brix2);
  const b3 = parseFloat(data.brix3);
  if (isNaN(b1) || isNaN(b2) || isNaN(b3)) return null;
  return (b1 + b2 + b3) / 3;
}

export function Paso4Brix({ data, onChange, onNext, onPrev }: Paso4Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const brixProm = calcBrix(data);
  const allChecked = PASOS_BRIX.every((p) => checked[p.id]);
  const hasInputs = data.brix1 !== "" && data.brix2 !== "" && data.brix3 !== "";

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const setBrix = (i: number, v: string) => {
    const next = { ...data };
    if (i === 0) next.brix1 = v;
    if (i === 1) next.brix2 = v;
    if (i === 2) next.brix3 = v;
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
              Medición de °Brix — criterio principal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Procedimiento 4.1–4.6 · Marque cada paso al completarlo
            </p>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Pasos completados</span>
              <span className="font-mono text-marine">{completedCount} / {PASOS_BRIX.length}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-marine rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / PASOS_BRIX.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-4">
            {PASOS_BRIX.map((paso, index) => {
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
                      <p className={`text-sm leading-relaxed ${isChecked && index < 4 ? "text-slate-400 line-through decoration-slate-300" : "text-marine font-medium"}`}>
                        {paso.texto}
                      </p>
                    </div>
                    {isChecked && <ChevronRight className="w-4 h-4 text-marine/40 flex-shrink-0 mt-0.5" />}
                  </button>
                  
                  {/* Inputs para mediciones */}
                  {index === 4 && (
                    <div className="ml-12 mr-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-marine">Mediciones (°Brix)</span>
                          <span className="text-xs font-medium text-slate-500">Rango ideal: {LIMITES_FISICOQUIMICA.brix.min}–{LIMITES_FISICOQUIMICA.brix.max} °Bx</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[data.brix1, data.brix2, data.brix3].map((v, i) => (
                            <FormField key={i} label={`Lectura ${i + 1}`}>
                              <div className="relative">
                                <StyledInput
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={v}
                                  onChange={(e: any) => setBrix(i, e.target.value)}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">°Bx</span>
                              </div>
                            </FormField>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Promedio */}
                  {index === 5 && brixProm !== null && (
                    <div className="ml-12 mr-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Promedio Calculado</span>
                      </div>
                      <ValueIndicator
                        value={brixProm}
                        min={LIMITES_FISICOQUIMICA.brix.min}
                        max={LIMITES_FISICOQUIMICA.brix.max}
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
        nextLabel="Siguiente — Medición de pH"
        disabledNext={!allChecked || !hasInputs || brixProm === null}
      />
    </div>
  );
}
