"use client";

import React from "react";
import {
  CheckCircle2,
  ArrowRightLeft,
  Settings2,
  Gauge,
  FlaskConical,
  Search,
  FileText,
  Zap,
} from "lucide-react";
import type { Step } from "@/lib/mock-data";

// ─────────────────────────────────────────
// Icon resolver
// ─────────────────────────────────────────
const ICON_MAP: Record<Step["icon"], React.ElementType> = {
  pipe: ArrowRightLeft,
  check: CheckCircle2,
  valve: Settings2,
  pump: Zap,
  measure: Gauge,
  sample: FlaskConical,
  inspect: Search,
  log: FileText,
};

// ─────────────────────────────────────────
// StepCard
// ─────────────────────────────────────────
interface StepCardProps {
  step: Step;
  current: number;
  total: number;
}

export function StepCard({ step, current, total }: StepCardProps) {
  const Icon = ICON_MAP[step.icon];
  const progress = Math.round((current / total) * 100);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Icon badge */}
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700 shadow-lg">
        <Icon className="w-9 h-9 text-emerald-400" strokeWidth={1.5} />
      </div>

      {/* Card */}
      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-3">
          Paso {current} de {total}
        </p>
        <h2 className="text-2xl font-bold text-zinc-100 leading-snug mb-4">
          {step.title}
        </h2>
        <p className="text-base text-zinc-300 leading-relaxed mb-6">
          {step.description}
        </p>
        {step.detail && (
          <div className="flex gap-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 p-4">
            <span className="mt-0.5 text-zinc-500">ℹ</span>
            <p className="text-sm text-zinc-400 leading-relaxed">{step.detail}</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Progreso del procedimiento</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// StepDots — mini breadcrumb dots
// ─────────────────────────────────────────
interface StepDotsProps {
  total: number;
  current: number;
}

export function StepDots({ total, current }: StepDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i + 1 < current
              ? "w-2 h-2 bg-emerald-500"
              : i + 1 === current
              ? "w-4 h-2 bg-emerald-400"
              : "w-2 h-2 bg-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// ParameterInput
// ─────────────────────────────────────────
interface ParameterInputProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}

export function ParameterInput({
  label,
  unit,
  min,
  max,
  value,
  onChange,
  hasError,
}: ParameterInputProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-400">
        {label}
        <span className="ml-1 text-zinc-600">
          (rango: {min}–{max} {unit})
        </span>
      </label>
      <div className={`flex items-center rounded-xl border bg-zinc-800 overflow-hidden transition-colors ${
        hasError ? "border-red-500/70" : "border-zinc-700 focus-within:border-emerald-500/60"
      }`}>
        <input
          type="number"
          step="0.1"
          placeholder={`Ej: ${((min + max) / 2).toFixed(1)}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-600 outline-none"
        />
        <span className="px-4 text-sm text-zinc-500 font-mono">{unit}</span>
      </div>
      {hasError && (
        <p className="text-xs text-red-400 mt-0.5">
          ⚠ Valor fuera del rango permitido ({min}–{max} {unit})
        </p>
      )}
    </div>
  );
}
