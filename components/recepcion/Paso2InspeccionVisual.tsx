"use client";

import React from "react";
import { Eye, AlertTriangle, CheckCircle2, Info, XCircle, ChevronDown, ImageIcon } from "lucide-react";
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
  descripcion: string;
  imageSrc: string;
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
  descripcion,
  imageSrc,
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
    empty:         { border: "border-slate-200",    bg: "bg-white",         dot: "bg-slate-300",  text: "text-slate-500", label: "" },
    conforme:      { border: "border-emerald-200",  bg: "bg-emerald-50/50", dot: "bg-emerald-500", text: "text-emerald-700", label: "Conforme" },
    observado:     { border: "border-amber-200",    bg: "bg-amber-50/50",   dot: "bg-amber-500",  text: "text-amber-700",   label: "Observado" },
    "no-conforme": { border: "border-red-300",      bg: "bg-red-50/80",     dot: "bg-red-500",    text: "text-red-700",     label: "No conforme - Revisar" },
  }[status];

  return (
    <div className={`rounded-xl border transition-all p-4 ${cfg.border} ${cfg.bg}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Label + limits */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 group">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <span className="text-sm font-bold text-marine">{label}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 ml-4 font-medium">
            {limiteObs !== undefined
              ? `Conforme ≤ ${limiteObs}% · Observado ${limiteObs}–${limiteMax}% · NC > ${limiteMax}%`
              : `Límite máximo: ≤ ${limiteMax}%`}
          </p>
        </div>

        {/* Weight input */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex flex-col items-end gap-1">
            <div className={`flex items-center rounded-xl border bg-white shadow-sm overflow-hidden transition-colors ${
              status === "no-conforme" ? "border-red-400 focus-within:ring-red-400" : "border-slate-300 focus-within:border-marine focus-within:ring-1 focus-within:ring-marine"
            }`}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={valueKg}
                onChange={(e) => onChange(e.target.value)}
                className={`w-24 bg-transparent px-3 py-2.5 text-sm text-marine placeholder:text-slate-400 outline-none text-right font-medium`}
              />
              <span className="pr-3 text-xs text-slate-400 font-bold">kg</span>
            </div>
            {/* Auto-calculated % */}
            {hasValue && (
              <span className={`text-xs font-mono font-bold ${
                status === "conforme" ? "text-emerald-600" :
                status === "observado" ? "text-amber-600" : "text-red-600"
              }`}>
                = {pct!.toFixed(2)}%
              </span>
            )}
          </div>

          {/* Status badge */}
          {hasValue && (
            <div className="flex items-center justify-end gap-1.5 min-w-[140px]">
              {status === "conforme" && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
              {status === "observado" && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
              {status === "no-conforme" && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
              <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Description & Image */}
      <div className="mt-4 pt-4 border-t border-slate-200/50 flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-28 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 relative flex flex-col items-center justify-center">
          <ImageIcon className="w-6 h-6 text-slate-300 mb-1" />
          <span className="text-[9px] text-slate-400 font-medium text-center px-2 leading-tight">Pendiente imagen<br/>({imageSrc.split('/').pop()})</span>
          {/* When you put images in public/images folder, this img tag will show them automatically over the placeholder */}
          <img 
            src={imageSrc} 
            alt={label} 
            className="absolute inset-0 w-full h-full object-cover" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
          />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium flex-1">
          {descripcion}
        </p>
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
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
            <Info className="w-4 h-4 text-marine mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              <span className="font-bold text-marine">Poka-Yoke:</span>{" "}
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
            descripcion="Bayas con crecimiento fúngico visible, descomposición, tejido blando o presencia de olores anormales."
            imageSrc="/images/moho.jpeg"
          />
          <DefectoRow
            label={LIMITES_VISUAL.bayasDaniadas.label}
            valueKg={data.bayasDaniadas}
            pesoNeto={pesoNeto}
            onChange={set("bayasDaniadas")}
            limiteMax={LIMITES_VISUAL.bayasDaniadas.max}
            descripcion="Bayas con ruptura de piel, pérdida de jugo, aplastamiento o daño mecánico evidente."
            imageSrc="/images/daniadas.png"
          />
          <DefectoRow
            label={LIMITES_VISUAL.deshidratacion.label}
            valueKg={data.deshidratacion}
            pesoNeto={pesoNeto}
            onChange={set("deshidratacion")}
            limiteMax={LIMITES_VISUAL.deshidratacion.max}
            descripcion="Bayas con arrugamiento marcado, pérdida de turgencia o signos evidentes de deshidratación."
            imageSrc="/images/deshidratacion.png"
          />
          <DefectoRow
            label={LIMITES_VISUAL.bayasVerdes.label}
            valueKg={data.bayasVerdes}
            pesoNeto={pesoNeto}
            onChange={set("bayasVerdes")}
            limiteObs={LIMITES_VISUAL.bayasVerdes.conformeMax}
            limiteMax={LIMITES_VISUAL.bayasVerdes.observadoMax}
            descripcion="Bayas con desarrollo insuficiente de color, textura o condición aparente respecto del resto del lote."
            imageSrc="/images/verdes.jpeg"
          />
          <DefectoRow
            label={LIMITES_VISUAL.materiaExtrana.label}
            valueKg={data.materiaExtrana}
            pesoNeto={pesoNeto}
            onChange={set("materiaExtrana")}
            limiteMax={LIMITES_VISUAL.materiaExtrana.max}
            descripcion="Hojas, tallos en exceso, tierra, piedras, insectos u otros materiales ajenos a la uva."
            imageSrc="/images/extrana.png"
          />

          {/* Summary feedback */}
          {hasSomeValue && noConformeCount > 0 && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-sm ${
              noConformeCount >= 3
                ? "bg-red-50 border-red-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${noConformeCount >= 3 ? "text-red-600" : "text-amber-600"}`} />
              <div>
                <p className={`text-sm font-bold ${noConformeCount >= 3 ? "text-red-800" : "text-amber-800"}`}>
                  {noConformeCount >= 3
                    ? `${noConformeCount} parámetros fuera de rango → Categoría C (No liberado)`
                    : `${noConformeCount} parámetro${noConformeCount > 1 ? "s" : ""} fuera de rango → Categoría B (Observado)`}
                </p>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  El resultado final se determinará al completar todos los pasos.
                </p>
              </div>
            </div>
          )}
          {hasSomeValue && noConformeCount === 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-bold text-emerald-800">Todos los parámetros visuales dentro del rango aceptable.</p>
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
