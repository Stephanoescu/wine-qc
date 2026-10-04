"use client";

import React from "react";
import { FlaskConical } from "lucide-react";
import { LIMITES_FISICOQUIMICA, type FisicoquimicaData } from "@/lib/recepcion-data";
import { FormField, StyledInput, SectionCard, NavButtons, ValueIndicator } from "./WizardUI";

interface Paso3Props {
  data: FisicoquimicaData;
  onChange: (data: FisicoquimicaData) => void;
  onNext: () => void;
  onPrev: () => void;
}

function calcBrix(data: FisicoquimicaData): number | null {
  const b1 = parseFloat(data.brix1);
  const b2 = parseFloat(data.brix2);
  const b3 = parseFloat(data.brix3);
  if (isNaN(b1) || isNaN(b2) || isNaN(b3)) return null;
  return (b1 + b2 + b3) / 3;
}

function calcPH(data: FisicoquimicaData): number | null {
  const p1 = parseFloat(data.ph1);
  const p2 = parseFloat(data.ph2);
  if (isNaN(p1) || isNaN(p2)) return null;
  return (p1 + p2) / 2;
}

function isValid(data: FisicoquimicaData): boolean {
  return (
    data.brix1 !== "" && data.brix2 !== "" && data.brix3 !== "" &&
    data.ph1 !== "" && data.ph2 !== "" &&
    !isNaN(parseFloat(data.brix1)) && !isNaN(parseFloat(data.brix2)) &&
    !isNaN(parseFloat(data.brix3)) && !isNaN(parseFloat(data.ph1)) &&
    !isNaN(parseFloat(data.ph2))
  );
}

// ─────────────────────────────────────────
// Reading input triple
// ─────────────────────────────────────────
interface ReadingInputsProps {
  label: string;
  values: [string, string, string] | [string, string];
  onChange: (i: number, v: string) => void;
  unit: string;
  rangeLabel: string;
}

function ReadingInputs({ label, values, onChange, unit, rangeLabel }: ReadingInputsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-marine">{label}</span>
        <span className="text-xs font-medium text-slate-500">{rangeLabel}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {values.map((v, i) => (
          <FormField key={i} label={`Lectura ${i + 1}`}>
            <div className="relative">
              <StyledInput
                type="number"
                step="0.01"
                placeholder="0.00"
                value={v}
                onChange={(e) => onChange(i, e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                {unit}
              </span>
            </div>
          </FormField>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Paso 3
// ─────────────────────────────────────────
export function Paso3Fisicoquimica({ data, onChange, onNext, onPrev }: Paso3Props) {
  const brixProm = calcBrix(data);
  const phProm = calcPH(data);

  const setBrix = (i: number, v: string) => {
    const next = { ...data };
    if (i === 0) next.brix1 = v;
    if (i === 1) next.brix2 = v;
    if (i === 2) next.brix3 = v;
    onChange(next);
  };

  const setPH = (i: number, v: string) => {
    const next = { ...data };
    if (i === 0) next.ph1 = v;
    if (i === 1) next.ph2 = v;
    onChange(next);
  };

  const pasosBrix = [
    "Calibrar el refractómetro siguiendo las instrucciones del fabricante.",
    "Limpiar y secar el prisma.",
    "Colocar una gota del jugo homogenizado sobre el prisma, cubriendo adecuadamente la superficie.",
    "Cerrar el prisma y realizar la lectura.",
    "Registrar el valor en °Brix. (Realizar tres mediciones de la misma muestra.)",
    "Calcular el promedio:",
  ];

  const pasosPH = [
    "Encender el pH-metro.",
    "Calibrar utilizando soluciones buffer apropiadas, normalmente pH 7 y pH 4.",
    "Enjuagar el electrodo con agua destilada.",
    "Colocar el jugo homogenizado en un vaso limpio.",
    "Introducir el electrodo hasta cubrir correctamente el sensor.",
    "Agitar suavemente. (Esperar hasta estabilización de la lectura; el procedimiento del AWRI indica aprox. 20–30 seg.)",
    "Registrar el pH.",
    "Enjuagar nuevamente el electrodo después de la lectura.",
    "Realizar dos determinaciones consecutivas de pH sobre la misma muestra, manteniendo las mismas condiciones de medición.",
    "Calcular el promedio aritmético de ambas determinaciones:",
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Evaluación Fisicoquímica"
        subtitle="Procedimiento estandarizado para medición de °Brix y pH"
        icon={FlaskConical}
      >
        <div className="flex flex-col gap-8">
          {/* Brix section */}
          <div>
            <h3 className="text-lg font-black text-marine mb-4 border-b border-slate-100 pb-2">
              Medición de °Brix — criterio principal de madurez
            </h3>
            <div className="flex flex-col gap-3">
              {pasosBrix.map((paso, index) => (
                <div key={index} className="flex gap-3 text-sm text-slate-700 font-medium">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
                    {index + 1}
                  </span>
                  <div className="flex-1 mt-0.5">
                    <p>{paso}</p>
                    {index === 4 && (
                      <div className="mt-4 mb-2 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                        <ReadingInputs
                          label="Mediciones (°Brix)"
                          values={[data.brix1, data.brix2, data.brix3]}
                          onChange={setBrix}
                          unit="°Bx"
                          rangeLabel={`Ideal: ${LIMITES_FISICOQUIMICA.brix.min}–${LIMITES_FISICOQUIMICA.brix.max} °Bx`}
                        />
                      </div>
                    )}
                    {index === 5 && brixProm !== null && (
                      <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Fórmula de promedio</span>
                        </div>
                        <ValueIndicator
                          value={brixProm}
                          min={LIMITES_FISICOQUIMICA.brix.min}
                          max={LIMITES_FISICOQUIMICA.brix.max}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-slate-100 border-dashed my-2" />

          {/* pH section */}
          <div>
            <h3 className="text-lg font-black text-marine mb-4 border-b border-slate-100 pb-2">
              Medición de pH — criterio complementario
            </h3>
            <div className="flex flex-col gap-3">
              {pasosPH.map((paso, index) => (
                <div key={index} className="flex gap-3 text-sm text-slate-700 font-medium">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
                    {index + 1}
                  </span>
                  <div className="flex-1 mt-0.5">
                    <p>{paso}</p>
                    {index === 8 && (
                      <div className="mt-4 mb-2 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                        <ReadingInputs
                          label="Determinaciones (pH)"
                          values={[data.ph1, data.ph2]}
                          onChange={setPH}
                          unit="pH"
                          rangeLabel={`Ideal: ${LIMITES_FISICOQUIMICA.ph.min}–${LIMITES_FISICOQUIMICA.ph.max}`}
                        />
                      </div>
                    )}
                    {index === 9 && phProm !== null && (
                      <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Fórmula de promedio</span>
                        </div>
                        <ValueIndicator
                          value={phProm}
                          min={LIMITES_FISICOQUIMICA.ph.min}
                          max={LIMITES_FISICOQUIMICA.ph.max}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <NavButtons
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Siguiente — Decisión Final"
        disabledNext={!isValid(data)}
      />
    </div>
  );
}
