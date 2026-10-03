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
        <span className="text-sm font-semibold text-stone-200">{label}</span>
        <span className="text-xs text-stone-500">{rangeLabel}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {values.map((v, i) => (
          <FormField key={i} label={`Lectura ${i + 1}`}>
            <StyledInput
              type="number"
              step="0.01"
              placeholder="0.00"
              value={v}
              onChange={(e) => onChange(i, e.target.value)}
              suffix={unit}
            />
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

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Evaluación Fisicoquímica"
        subtitle="Ingrese las lecturas del refractómetro (°Brix) y pH-metro"
        icon={FlaskConical}
      >
        <div className="flex flex-col gap-8">
          {/* Brix section */}
          <div className="flex flex-col gap-4">
            <ReadingInputs
              label="Grados Brix (°Brix)"
              values={[data.brix1, data.brix2, data.brix3]}
              onChange={setBrix}
              unit="°Bx"
              rangeLabel={`Rango ideal: ${LIMITES_FISICOQUIMICA.brix.min} – ${LIMITES_FISICOQUIMICA.brix.max} °Brix`}
            />
            <div className="mt-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-px h-4 bg-stone-600" />
                <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Promedio calculado</span>
              </div>
              <ValueIndicator
                value={brixProm}
                min={LIMITES_FISICOQUIMICA.brix.min}
                max={LIMITES_FISICOQUIMICA.brix.max}
                label="Promedio °Brix = (B1 + B2 + B3) / 3"
                unit=" °Bx"
              />
            </div>
          </div>

          <div className="border-t border-stone-800" />

          {/* pH section */}
          <div className="flex flex-col gap-4">
            <ReadingInputs
              label="pH"
              values={[data.ph1, data.ph2]}
              onChange={setPH}
              unit="pH"
              rangeLabel={`Rango ideal: ${LIMITES_FISICOQUIMICA.ph.min} – ${LIMITES_FISICOQUIMICA.ph.max}`}
            />
            <div className="mt-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-px h-4 bg-stone-600" />
                <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Promedio calculado</span>
              </div>
              <ValueIndicator
                value={phProm}
                min={LIMITES_FISICOQUIMICA.ph.min}
                max={LIMITES_FISICOQUIMICA.ph.max}
                label="Promedio pH = (pH1 + pH2) / 2"
                unit=" pH"
              />
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
