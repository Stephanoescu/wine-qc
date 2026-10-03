"use client";

import React from "react";
import { Eye, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { LIMITES_VISUAL, type InspeccionVisualData } from "@/lib/recepcion-data";
import { SectionCard, NavButtons } from "./WizardUI";

interface Paso2Props {
  data: InspeccionVisualData;
  pesoNeto: number; // kg — from Paso 1
  onChange: (data: InspeccionVisualData) => void;
  onNext: () => void;
  onPrev: () => void;
}

// ─────────────────────────────────────────
// Single defect row — kg input, % auto-calculated
// ─────────────────────────────────────────
interface DefectoRowProps {
  label: string;
  valueKg: string;
  pesoNeto: number;
  onChange: (v: string) => void;
  limiteMax: number;        // % max for "no conforme"
  limiteObs?: number;       // % max for "conforme" (before observed)
}

function pctFromKg(kg: string, pesoNeto: number): number | null {
  const n = parseFloat(kg);
  if (isNaN(n) || pesoNeto <= 0) return null;
  return (n / pesoNeto) * 100;
}

function DefectoRow({
  label,
  valueKg,
  pesoNeto,
  onChange,
  limiteMax,
  limiteObs,
}: DefectoRowProps) {
  const pct = pctFromKg(valueKg, pesoNeto);
  const hasValue = pct !== null;

  // Determine status
  type Status = "empty" | "conforme" | "observado" | "no-conforme";
  let status: Status = "empty";
  if (hasValue) {
    if (pct! > limiteMax) {
      status = "no-conforme";
    } else if (limiteObs !== undefined && pct! > limiteObs) {
      status = "observado";
    } else {
      status = "conforme";
    }
  }

  const cfg = {
    empty:         { border: "border-stone-700",    bg: "bg-stone-800/40",    dot: "bg-stone-700",   text: "text-stone-500",   label: "" },
    conforme:      { border: "border-emerald-700/40", bg: "bg-emerald-900/15", dot: "bg-emerald-500", text: "text-emerald-400", label: "Conforme" },
    observado:     { border: "border-amber-600/40",   bg: "bg-amber-900/15",   dot: "bg-amber-500",   text: "text-amber-400",   label: "Observado" },
    "no-conforme": { border: "border-red-600/50",     bg: "bg-red-900/20",     dot: "bg-red-500",     text: "text-red-400",     label: "No conforme - Revisar" },
  }[status];

  return (
    <div className={`rounded-xl border transition-all p-4 ${cfg.border} ${cfg.bg}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Label + limits */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <span className="text-sm font-medium text-stone-200">{label}</span>
          </div>
          <p className="text-xs text-stone-500 mt-1 ml-4">
            {limiteObs !== undefined
              ? `Conforme ≤ ${limiteObs}% · Observado ${limiteObs}–${limiteMax}% · No conforme > ${limiteMax}%`
              : `Límite máximo: ≤ ${limiteMax}%`}
          </p>
        </div>

        {/* Weight input */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex flex-col items-end gap-1">
            <div className={`flex items-center rounded-xl border overflow-hidden bg-stone-900/60 ${
              status === "no-conforme" ? "border-red-500/70" : "border-stone-700 focus-within:border-red-700/60"
            }`}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={valueKg}
                onChange={(e) => onChange(e.target.value)}
                className="w-24 bg-transparent px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 outline-none text-right"
              />
              <span className="pr-3 text-xs text-stone-500 font-mono">kg</span>
            </div>
            {/* Auto-calculated % */}
            {hasValue && (
              <span className={`text-xs font-mono font-semibold ${
                status === "conforme" ? "text-emerald-400" :
                status === "observado" ? "text-amber-400" : "text-red-400"
              }`}>
                = {pct!.toFixed(2)}%
              </span>
            )}
          </div>

          {/* Status badge */}
          {hasValue && (
            <div className="flex items-center gap-1.5 min-w-[140px]">
              {status === "conforme" && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              {status === "observado" && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
              {status === "no-conforme" && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
              <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Validation
// ─────────────────────────────────────────
function isValid(data: InspeccionVisualData): boolean {
  return (
    data.podredumbre !== "" &&
    data.bayasDaniadas !== "" &&
    data.deshidratacion !== "" &&
    data.bayasVerdes !== "" &&
    data.materiaExtrana !== "" &&
    [data.podredumbre, data.bayasDaniadas, data.deshidratacion, data.bayasVerdes, data.materiaExtrana]
      .every((v) => !isNaN(parseFloat(v)))
  );
}

// ─────────────────────────────────────────
// Paso 2
// ─────────────────────────────────────────
export function Paso2InspeccionVisual({ data, pesoNeto, onChange, onNext, onPrev }: Paso2Props) {
  const set = (field: keyof InspeccionVisualData) => (v: string) =>
    onChange({ ...data, [field]: v });

  // Count how many parameters are non-conforming (for summary feedback)
  const ncCount = [
    { v: data.podredumbre, max: LIMITES_VISUAL.podredumbre.max },
    { v: data.bayasDaniadas, max: LIMITES_VISUAL.bayasDaniadas.max },
    { v: data.deshidratacion, max: LIMITES_VISUAL.deshidratacion.max },
    { v: data.materiaExtrana, max: LIMITES_VISUAL.materiaExtrana.max },
    { v: data.bayasVerdes, max: LIMITES_VISUAL.bayasVerdes.observadoMax },
  ].filter(({ v }) => {
    const pct = pctFromKg(v, pesoNeto);
    return pct !== null && pct > LIMITES_VISUAL.podredumbre.max; // placeholder, recalculated below
  });

  // Recalculate correctly
  const noConformeCount = (() => {
    let count = 0;
    const chk = (kg: string, maxPct: number) => {
      const pct = pctFromKg(kg, pesoNeto);
      if (pct !== null && pct > maxPct) count++;
    };
    chk(data.podredumbre, LIMITES_VISUAL.podredumbre.max);
    chk(data.bayasDaniadas, LIMITES_VISUAL.bayasDaniadas.max);
    chk(data.deshidratacion, LIMITES_VISUAL.deshidratacion.max);
    chk(data.materiaExtrana, LIMITES_VISUAL.materiaExtrana.max);
    chk(data.bayasVerdes, LIMITES_VISUAL.bayasVerdes.observadoMax);
    return count;
  })();

  const hasSomeValue = isValid(data);

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Inspección Visual de Uva"
        subtitle={`Ingrese el peso (kg) de cada defecto encontrado · Peso neto del lote: ${pesoNeto > 0 ? pesoNeto.toLocaleString() + " kg" : "—"}`}
        icon={Eye}
      >
        <div className="flex flex-col gap-4">
          {/* Info banner */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-stone-800/40 border border-stone-700/40">
            <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-stone-400 leading-relaxed">
              <span className="font-semibold text-stone-300">Poka-Yoke:</span>{" "}
              Ingrese el peso en kg de cada defecto. El sistema calculará el porcentaje
              automáticamente en base al peso neto del lote ({pesoNeto > 0 ? `${pesoNeto.toLocaleString()} kg` : "definido en el Paso 1"}) y
              señalará si supera los límites establecidos.
            </p>
          </div>

          <DefectoRow
            label={LIMITES_VISUAL.podredumbre.label}
            valueKg={data.podredumbre}
            pesoNeto={pesoNeto}
            onChange={set("podredumbre")}
            limiteMax={LIMITES_VISUAL.podredumbre.max}
          />
          <DefectoRow
            label={LIMITES_VISUAL.bayasDaniadas.label}
            valueKg={data.bayasDaniadas}
            pesoNeto={pesoNeto}
            onChange={set("bayasDaniadas")}
            limiteMax={LIMITES_VISUAL.bayasDaniadas.max}
          />
          <DefectoRow
            label={LIMITES_VISUAL.deshidratacion.label}
            valueKg={data.deshidratacion}
            pesoNeto={pesoNeto}
            onChange={set("deshidratacion")}
            limiteMax={LIMITES_VISUAL.deshidratacion.max}
          />
          <DefectoRow
            label={LIMITES_VISUAL.bayasVerdes.label}
            valueKg={data.bayasVerdes}
            pesoNeto={pesoNeto}
            onChange={set("bayasVerdes")}
            limiteObs={LIMITES_VISUAL.bayasVerdes.conformeMax}
            limiteMax={LIMITES_VISUAL.bayasVerdes.observadoMax}
          />
          <DefectoRow
            label={LIMITES_VISUAL.materiaExtrana.label}
            valueKg={data.materiaExtrana}
            pesoNeto={pesoNeto}
            onChange={set("materiaExtrana")}
            limiteMax={LIMITES_VISUAL.materiaExtrana.max}
          />

          {/* Summary feedback */}
          {hasSomeValue && noConformeCount > 0 && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${
              noConformeCount >= 3
                ? "bg-red-900/20 border-red-700/40"
                : "bg-amber-900/15 border-amber-600/40"
            }`}>
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${noConformeCount >= 3 ? "text-red-400" : "text-amber-400"}`} />
              <div>
                <p className={`text-sm font-semibold ${noConformeCount >= 3 ? "text-red-300" : "text-amber-300"}`}>
                  {noConformeCount >= 3
                    ? `${noConformeCount} parámetros fuera de rango → Categoría C (No liberado)`
                    : `${noConformeCount} parámetro${noConformeCount > 1 ? "s" : ""} fuera de rango → Categoría B (Observado)`}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  El resultado final se determinará al completar todos los pasos.
                </p>
              </div>
            </div>
          )}
          {hasSomeValue && noConformeCount === 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-900/15 border border-emerald-700/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-400">Todos los parámetros visuales dentro del rango aceptable.</p>
            </div>
          )}
        </div>
      </SectionCard>

      <NavButtons
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Siguiente — Obtención de Muestra"
        disabledNext={!isValid(data)}
      />
    </div>
  );
}
