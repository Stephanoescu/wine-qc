"use client";

import React from "react";
import { Check } from "lucide-react";

// ─────────────────────────────────────────
// Stepper Progress
// ─────────────────────────────────────────
export function WizardProgress({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="relative">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 rounded-full" />
      <div
        className="absolute top-1/2 left-0 h-0.5 bg-marine -translate-y-1/2 transition-all duration-500 rounded-full"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      />
      <div className="relative flex justify-between">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <div key={label} className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 z-10 ${
                  isActive
                    ? "bg-marine border-marine text-white shadow-md shadow-marine/20 scale-110"
                    : isDone
                    ? "bg-marine border-marine text-white"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider absolute -bottom-5 text-center w-24 -ml-8 ${
                  isActive ? "text-marine" : isDone ? "text-marine-light" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Form Field Wrapper
// ─────────────────────────────────────────
export function FormField({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-marine-light">
        {label} {required && <span className="text-gold-dark">*</span>}
      </label>
      {children}
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </div>
  );
}

// ─────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────
export const inputBaseClasses =
  "w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-marine placeholder:text-slate-400 focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine transition-all shadow-sm";

export function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBaseClasses} ${props.className || ""}`} />;
}

export function StyledSelect({
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${inputBaseClasses} appearance-none pr-10 ${props.value ? "text-marine" : "text-slate-400"}`}
      >
        <option value="" disabled>
          Seleccione una opción...
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="text-marine">
            {o}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Section Card
// ─────────────────────────────────────────
export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-marine text-white shadow-sm">
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-base font-bold text-marine">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────
// Navigation Buttons
// ─────────────────────────────────────────
export function NavButtons({
  onPrev,
  onNext,
  nextLabel = "Siguiente",
  prevLabel = "Atrás",
  disabledNext = false,
  isLastStep = false,
}: {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel?: string;
  prevLabel?: string;
  disabledNext?: boolean;
  isLastStep?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-8">
      {onPrev ? (
        <button
          onClick={onPrev}
          className="px-6 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-marine transition-colors"
        >
          {prevLabel}
        </button>
      ) : (
        <div /> // Spacer
      )}
      <button
        onClick={onNext}
        disabled={disabledNext}
        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
          disabledNext
            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            : isLastStep
            ? "bg-gold hover:bg-gold-dark text-white shadow-gold/20 hover:shadow-md border border-gold-dark"
            : "bg-marine hover:bg-marine-light text-white shadow-marine/20 hover:shadow-md border border-marine-dark"
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Value Range Indicator (Paso 3)
// ─────────────────────────────────────────
export function ValueIndicator({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const isOk = value >= min && value <= max;

  return (
    <div className="flex flex-col gap-2 mt-4 p-5 rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
        <span>Min {min}</span>
        <span className={isOk ? "text-marine" : "text-red-600"}>Promedio: {value.toFixed(2)}</span>
        <span>Max {max}</span>
      </div>
      <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
        {/* Ideal range indicator */}
        <div className="absolute top-0 bottom-0 left-0 right-0 bg-emerald-100/50" />
        {/* Actual value pip */}
        <div
          className={`absolute top-0 bottom-0 w-1.5 -ml-[3px] rounded-full transition-all duration-500 z-10 ${
            isOk ? "bg-marine shadow-[0_0_8px_rgba(17,41,76,0.8)]" : "bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
