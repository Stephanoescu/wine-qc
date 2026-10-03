"use client";

import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// ─────────────────────────────────────────
// WizardProgress — header stepper
// ─────────────────────────────────────────
interface WizardProgressProps {
  steps: string[];
  currentStep: number;
}

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  return (
    <div className="w-full flex items-center gap-0">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all ${
                  isDone
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : isActive
                    ? "bg-red-900 border-red-600 text-red-200"
                    : "bg-stone-800 border-stone-700 text-stone-500"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`text-xs hidden sm:block font-medium ${
                  isActive ? "text-red-300" : isDone ? "text-emerald-500" : "text-stone-600"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${
                  isDone ? "bg-emerald-600" : "bg-stone-700"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
// FormField — labeled input wrapper
// ─────────────────────────────────────────
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function FormField({ label, children, error, hint, required }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-stone-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────
// StyledInput — dark themed input
// ─────────────────────────────────────────
interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  suffix?: string;
}

export function StyledInput({ hasError, suffix, className = "", ...props }: StyledInputProps) {
  return (
    <div
      className={`flex items-center rounded-xl border bg-stone-800/60 overflow-hidden transition-colors ${
        hasError
          ? "border-red-500/70 focus-within:border-red-500"
          : "border-stone-700 focus-within:border-red-700/60"
      }`}
    >
      <input
        {...props}
        className={`flex-1 bg-transparent px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 outline-none ${className}`}
      />
      {suffix && (
        <span className="pr-3 text-xs text-stone-500 font-mono flex-shrink-0">{suffix}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// StyledSelect
// ─────────────────────────────────────────
interface StyledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function StyledSelect({ hasError, children, ...props }: StyledSelectProps) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border bg-stone-800/60 px-4 py-3 text-sm text-stone-100 outline-none transition-colors appearance-none ${
        hasError
          ? "border-red-500/70 focus:border-red-500"
          : "border-stone-700 focus:border-red-700/60"
      }`}
    >
      {children}
    </select>
  );
}

// ─────────────────────────────────────────
// SectionCard — step wrapper card
// ─────────────────────────────────────────
interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

export function SectionCard({ title, subtitle, icon: Icon, children }: SectionCardProps) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-800 bg-gradient-to-r from-red-950/40 to-transparent">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-900/40 border border-red-800/40">
          <Icon className="w-4.5 h-4.5 text-red-400" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-stone-100">{title}</h2>
          {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────
// NavButtons — prev/next wizard footer
// ─────────────────────────────────────────
interface NavButtonsProps {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel?: string;
  prevLabel?: string;
  disabledNext?: boolean;
  isLastStep?: boolean;
}

export function NavButtons({
  onPrev,
  onNext,
  nextLabel = "Siguiente",
  prevLabel = "Atrás",
  disabledNext,
  isLastStep,
}: NavButtonsProps) {
  return (
    <div className="flex gap-3 pt-2">
      {onPrev && (
        <button
          onClick={onPrev}
          className="px-5 py-3 rounded-xl border border-stone-700 text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-all"
        >
          {prevLabel}
        </button>
      )}
      <button
        onClick={onNext}
        disabled={disabledNext}
        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          isLastStep
            ? "bg-emerald-700 hover:bg-emerald-600 text-white"
            : "bg-red-900 hover:bg-red-800 text-red-100"
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// ValueIndicator — colored value badge
// ─────────────────────────────────────────
interface ValueIndicatorProps {
  value: number | null;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
}

export function ValueIndicator({ value, min, max, label, unit = "" }: ValueIndicatorProps) {
  if (value === null || isNaN(value)) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-stone-800/50 border border-stone-700/50">
        <span className="text-xs text-stone-500">{label}</span>
        <span className="text-xs text-stone-600 font-mono">—</span>
      </div>
    );
  }

  const inRange = (min === undefined || value >= min) && (max === undefined || value <= max);
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
        inRange
          ? "bg-emerald-900/20 border-emerald-700/30"
          : "bg-red-900/20 border-red-700/40"
      }`}
    >
      <span className={`text-xs font-medium ${inRange ? "text-emerald-400" : "text-red-400"}`}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-bold font-mono ${inRange ? "text-emerald-300" : "text-red-300"}`}
        >
          {value.toFixed(value < 10 ? 3 : 1)}{unit}
        </span>
        {inRange ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        )}
      </div>
    </div>
  );
}
