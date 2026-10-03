"use client";

import React from "react";
import { Eye, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { LIMITES_VISUAL, type InspeccionVisualData } from "@/lib/recepcion-data";
import { FormField, StyledInput, SectionCard, NavButtons } from "./WizardUI";

interface Paso2Props {
  data: InspeccionVisualData;
  onChange: (data: InspeccionVisualData) => void;
  onNext: () => void;
  onPrev: () => void;
}

// ─────────────────────────────────────────
// Single visual parameter row
// ─────────────────────────────────────────
interface DefectoRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  limite: number;
  limiteObs?: number;
  descripcion?: string;
}

function DefectoRow({ label, value, onChange, limite, limiteObs, descripcion }: DefectoRowProps) {
  const num = parseFloat(value);
  const hasValue = value !== "" && !isNaN(num);

  let status: "empty" | "conforme" | "observado" | "no-conforme" = "empty";
  if (hasValue) {
    if (num > limite) {
      status = "no-conforme";
    } else if (limiteObs !== undefined && num > limiteObs) {
      status = "no-conforme";
    } else if (limiteObs !== undefined && num > limite) {
      status = "observado";
    } else {
      status = "conforme";
    }
  }

  const statusConfig = {
    empty: { border: "border-stone-700", bg: "bg-stone-800/60", dot: "bg-stone-700", text: "text-stone-500", label: "" },
    conforme: { border: "border-emerald-700/50", bg: "bg-emerald-900/20", dot: "bg-emerald-500", text: "text-emerald-400", label: "Conforme" },
    observado: { border: "border-amber-700/50", bg: "bg-amber-900/20", dot: "bg-amber-500", text: "text-amber-400", label: "Observado" },
    "no-conforme": { border: "border-red-600/50", bg: "bg-red-900/20", dot: "bg-red-500", text: "text-red-400", label: "No conforme" },
  };

  const cfg = statusConfig[status];

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all ${cfg.border} ${cfg.bg}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <span className="text-sm font-medium text-stone-200">{label}</span>
          {descripcion && (
            <span className="hidden sm:inline text-xs text-stone-500">— {descripcion}</span>
          )}
        </div>
        <p className="text-xs text-stone-500 mt-1 ml-4">
          {limiteObs !== undefined
            ? `Conforme ≤ ${limite}% · Observado ${limite}–${limiteObs}% · No conforme > ${limiteObs}%`
            : `Límite máximo: ≤ ${limite}%`}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className={`flex items-center rounded-xl border overflow-hidden transition-colors ${
          status === "no-conforme"
            ? "border-red-500/70 focus-within:border-red-500"
            : "border-stone-700 focus-within:border-red-700/60"
        } bg-stone-900/60`}>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="0.0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 bg-transparent px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 outline-none text-right"
          />
          <span className="pr-3 text-xs text-stone-500 font-mono">%</span>
        </div>
        {hasValue && (
          <div className="flex items-center gap-1.5 min-w-[90px]">
            {status === "conforme" && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
            {status === "observado" && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
            {status === "no-conforme" && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
            <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Paso 2
// ─────────────────────────────────────────
function isValid(data: InspeccionVisualData): boolean {
  const fields = [
    data.podredumbre,
    data.bayasDaniadas,
    data.deshidratacion,
    data.bayasVerdes,
    data.materiaExtrana,
  ];
  return fields.every((f) => f !== "" && !isNaN(parseFloat(f)));
}

export function Paso2InspeccionVisual({ data, onChange, onNext, onPrev }: Paso2Props) {
  const set = (field: keyof InspeccionVisualData) => (v: string) =>
    onChange({ ...data, [field]: v });

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Inspección Visual de Uva"
        subtitle="Ingrese el porcentaje en peso de cada tipo de defecto encontrado"
        icon={Eye}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-stone-800/40 border border-stone-700/40 mb-2">
            <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-stone-400 leading-relaxed">
              Poka-Yoke: El sistema evaluará automáticamente cada parámetro y señalará si
              supera los límites establecidos. Los lotes con parámetros fuera de rango serán
              clasificados según los criterios definidos.
            </p>
          </div>

          <DefectoRow
            label={LIMITES_VISUAL.podredumbre.label}
            value={data.podredumbre}
            onChange={set("podredumbre")}
            limite={LIMITES_VISUAL.podredumbre.max}
          />
          <DefectoRow
            label={LIMITES_VISUAL.bayasDaniadas.label}
            value={data.bayasDaniadas}
            onChange={set("bayasDaniadas")}
            limite={LIMITES_VISUAL.bayasDaniadas.max}
          />
          <DefectoRow
            label={LIMITES_VISUAL.deshidratacion.label}
            value={data.deshidratacion}
            onChange={set("deshidratacion")}
            limite={LIMITES_VISUAL.deshidratacion.max}
          />
          <DefectoRow
            label={LIMITES_VISUAL.bayasVerdes.label}
            value={data.bayasVerdes}
            onChange={set("bayasVerdes")}
            limite={LIMITES_VISUAL.bayasVerdes.conformeMax}
            limiteObs={LIMITES_VISUAL.bayasVerdes.observadoMax}
            descripcion="Clasificación 3 categorías"
          />
          <DefectoRow
            label={LIMITES_VISUAL.materiaExtrana.label}
            value={data.materiaExtrana}
            onChange={set("materiaExtrana")}
            limite={LIMITES_VISUAL.materiaExtrana.max}
          />
        </div>
      </SectionCard>

      <NavButtons
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Siguiente — Evaluación Fisicoquímica"
        disabledNext={!isValid(data)}
      />
    </div>
  );
}
