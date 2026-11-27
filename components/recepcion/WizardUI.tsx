"use client";

import React, { useCallback, useRef } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  Info,
  Square,
  XCircle,
} from "lucide-react";
import type { ItemChecklist } from "@/lib/config/recepcion-textos";

// ─────────────────────────────────────────
// Enter (o "Siguiente" del teclado del celular) pasa al siguiente
// input[data-nav] dentro del contenedor.
// ─────────────────────────────────────────
export function useNavegacionEnter<T extends HTMLElement = HTMLDivElement>() {
  const contenedor = useRef<T>(null);
  const alPresionarTecla = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const campos = Array.from(contenedor.current?.querySelectorAll<HTMLInputElement>("input[data-nav]") ?? []);
    const siguiente = campos[campos.indexOf(e.currentTarget) + 1];
    if (siguiente) {
      siguiente.focus();
      siguiente.select();
    } else {
      e.currentTarget.blur();
    }
  }, []);
  return { contenedor, alPresionarTecla };
}

// ─────────────────────────────────────────
// Stepper Progress (compacto en móvil, completo desde sm)
// ─────────────────────────────────────────
export function WizardProgress({
  steps,
  currentStep,
  onSeleccionarPaso,
}: {
  steps: readonly string[];
  currentStep: number;
  /** Si se pasa, se puede saltar a cualquier paso (modo edición). */
  onSeleccionarPaso?: (paso: number) => void;
}) {
  const total = steps.length;
  return (
    <>
      {/* Móvil: "Paso X/9 · Nombre" + barra segmentada */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between gap-2 text-xs font-bold">
          <span className="text-marine truncate">
            Paso {currentStep}/{total} · {steps[currentStep - 1]}
          </span>
          {currentStep < total && (
            <span className="text-slate-400 font-medium truncate">Sigue: {steps[currentStep]}</span>
          )}
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {steps.map((label, i) => (
            <div
              key={label}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentStep ? "bg-marine" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        {onSeleccionarPaso && (
          <select
            aria-label="Ir al paso"
            value={currentStep}
            onChange={(e) => onSeleccionarPaso(Number(e.target.value))}
            className="mt-2 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-marine"
          >
            {steps.map((label, i) => (
              <option key={label} value={i + 1}>
                Ir al paso {i + 1} · {label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Desde sm: círculos con etiqueta, con scroll horizontal si no cabe */}
      <div className="hidden sm:block overflow-x-auto">
        <ol className="flex min-w-[640px] pb-1">
          {steps.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isDone = stepNum < currentStep;
            return (
              <li key={label} className="relative flex-1 flex flex-col items-center">
                {idx > 0 && (
                  <div
                    className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                      stepNum <= currentStep ? "bg-marine" : "bg-slate-200"
                    }`}
                  />
                )}
                <div
                  aria-current={isActive ? "step" : undefined}
                  role={onSeleccionarPaso ? "button" : undefined}
                  tabIndex={onSeleccionarPaso ? 0 : undefined}
                  onClick={onSeleccionarPaso ? () => onSeleccionarPaso(stepNum) : undefined}
                  onKeyDown={
                    onSeleccionarPaso
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") onSeleccionarPaso(stepNum);
                        }
                      : undefined
                  }
                  title={onSeleccionarPaso ? `Ir al paso ${stepNum}: ${label}` : undefined}
                  className={`relative z-10 ${onSeleccionarPaso ? "cursor-pointer hover:ring-2 hover:ring-gold/50" : ""} w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
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
                  className={`mt-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-center leading-tight ${
                    isActive ? "text-marine" : isDone ? "text-marine-light" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </>
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
  ayuda,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string | null;
  ayuda?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-marine-light">
        {label} {required && <span className="text-gold-dark">*</span>}
      </label>
      {children}
      {error ? (
        <span className="text-xs text-red-600 font-medium">{error}</span>
      ) : (
        ayuda && <span className="text-xs text-slate-500 font-medium">{ayuda}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────
export const inputBaseClasses =
  "w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-marine placeholder:text-slate-400 focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine transition-all shadow-sm";

const inputErrorClasses = "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500";

export function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBaseClasses} ${props.className || ""}`} />;
}

/**
 * Entrada numérica para celular: teclado numérico, acepta coma o punto,
 * y descarta letras al escribir. La validación de rango la hace quien llama.
 */
export function NumeroInput({
  value,
  onChange,
  unidad,
  entero,
  error,
  compacto,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (valor: string) => void;
  unidad?: string;
  entero?: boolean;
  error?: boolean | string | null;
  compacto?: boolean;
}) {
  const conError = !!error;
  const tamano = compacto ? "px-2.5 py-2 rounded-lg text-sm" : "";
  return (
    <div className="relative">
      <input
        {...rest}
        type="text"
        inputMode={entero ? "numeric" : "decimal"}
        autoComplete="off"
        value={value}
        aria-invalid={conError || undefined}
        onChange={(e) => onChange(e.target.value.replace(entero ? /[^\d-]/g : /[^\d.,-]/g, ""))}
        className={`${inputBaseClasses} ${tamano} ${unidad && !compacto ? "pr-14" : ""} ${
          conError ? inputErrorClasses : ""
        } ${className ?? ""}`}
      />
      {unidad && !compacto && (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
          {unidad}
        </span>
      )}
    </div>
  );
}

export function StyledSelect({
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[] }) {
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
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl bg-marine text-white shadow-sm">
          <Icon className="w-5 h-5 text-gold-light" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-marine">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────
// Checklist (casillas controladas por el asistente)
// ─────────────────────────────────────────
export function Checklist({
  items,
  checks,
  onToggle,
  extras,
}: {
  items: ItemChecklist[];
  checks: Record<string, boolean>;
  onToggle: (id: string) => void;
  /** Contenido adicional bajo un ítem (p. ej. un control Sí/No), por id. */
  extras?: Record<string, React.ReactNode>;
}) {
  const marcados = items.filter((i) => checks[i.id]).length;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
          <span>Ítems verificados</span>
          <span className="font-mono text-marine">
            {marcados} / {items.length}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-marine rounded-full transition-all duration-500"
            style={{ width: `${(marcados / items.length) * 100}%` }}
          />
        </div>
      </div>
      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => {
          const marcado = !!checks[item.id];
          const extra = extras?.[item.id];
          return (
            <li
              key={item.id}
              className={`rounded-xl border transition-all duration-200 ${
                marcado ? "bg-slate-50 border-marine/20 shadow-sm" : "bg-white border-slate-200"
              }`}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={marcado}
                onClick={() => onToggle(item.id)}
                className="w-full flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 text-left rounded-xl hover:bg-slate-50/60"
              >
                <span className="flex-shrink-0 mt-0.5">
                  {marcado ? (
                    <CheckSquare className="w-5 h-5 text-marine" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                </span>
                <span
                  className={`flex-shrink-0 text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                    marcado ? "bg-marine/10 text-marine" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-sm leading-relaxed ${
                    marcado ? "text-slate-400 line-through decoration-slate-300" : "text-marine font-medium"
                  }`}
                >
                  {item.texto}
                </span>
              </button>
              {extra && <div className="px-3.5 sm:px-4 pb-4 sm:pl-[4.5rem]">{extra}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────
// Control Sí / No
// ─────────────────────────────────────────
export function SiNo({
  value,
  onChange,
  etiquetaSi = "Sí",
  etiquetaNo = "No",
  pregunta,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  etiquetaSi?: string;
  etiquetaNo?: string;
  pregunta?: string;
}) {
  const base =
    "flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg border transition-colors whitespace-nowrap";
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      {pregunta && <span className="text-sm font-bold text-marine-light">{pregunta}</span>}
      <div role="radiogroup" aria-label={pregunta} className="flex gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={value === true}
          onClick={() => onChange(true)}
          className={`${base} ${
            value === true
              ? "bg-amber-100 border-amber-300 text-amber-800"
              : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
          }`}
        >
          {etiquetaSi}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === false}
          onClick={() => onChange(false)}
          className={`${base} ${
            value === false
              ? "bg-emerald-100 border-emerald-300 text-emerald-800"
              : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
          }`}
        >
          {etiquetaNo}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Interruptor (switch)
// ─────────────────────────────────────────
export function Interruptor({
  activo,
  onChange,
  etiqueta,
  descripcion,
}: {
  activo: boolean;
  onChange: (v: boolean) => void;
  etiqueta: string;
  descripcion?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => onChange(!activo)}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-colors ${
        activo ? "bg-marine/5 border-marine/30" : "bg-white border-slate-200 hover:bg-slate-50"
      }`}
    >
      <span
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          activo ? "bg-marine" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            activo ? "translate-x-5" : ""
          }`}
        />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-bold text-marine">{etiqueta}</span>
        {descripcion && <span className="text-xs text-slate-500 font-medium mt-0.5">{descripcion}</span>}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────
// Aviso (banner)
// ─────────────────────────────────────────
const AVISO_TONOS = {
  info: { caja: "bg-slate-50 border-slate-200", icono: "text-marine", titulo: "text-marine", Icon: Info },
  ok: { caja: "bg-emerald-50 border-emerald-200", icono: "text-emerald-600", titulo: "text-emerald-800", Icon: CheckCircle2 },
  alerta: { caja: "bg-amber-50 border-amber-300", icono: "text-amber-600", titulo: "text-amber-900", Icon: AlertTriangle },
  error: { caja: "bg-red-50 border-red-200", icono: "text-red-600", titulo: "text-red-800", Icon: XCircle },
} as const;

export function Aviso({
  tono,
  titulo,
  children,
}: {
  tono: keyof typeof AVISO_TONOS;
  titulo?: string;
  children?: React.ReactNode;
}) {
  const t = AVISO_TONOS[tono];
  return (
    <div role={tono === "error" || tono === "alerta" ? "alert" : undefined} className={`flex items-start gap-3 p-4 rounded-xl border shadow-sm ${t.caja}`}>
      <t.Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${t.icono}`} />
      <div className="flex flex-col gap-1 min-w-0">
        {titulo && <p className={`text-sm font-bold ${t.titulo}`}>{titulo}</p>}
        {children && <div className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Etiqueta Conforme / No conforme / Pendiente
// ─────────────────────────────────────────
export function BadgeConformidad({
  estado,
  texto,
}: {
  estado: "conforme" | "no_conforme" | "pendiente";
  texto?: string;
}) {
  const cfg = {
    conforme: { cls: "bg-emerald-100 text-emerald-800 border-emerald-200", Icon: CheckCircle2, t: "Conforme" },
    no_conforme: { cls: "bg-red-100 text-red-800 border-red-200", Icon: XCircle, t: "No conforme" },
    pendiente: { cls: "bg-amber-100 text-amber-800 border-amber-200", Icon: Clock, t: "Pendiente" },
  }[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${cfg.cls}`}>
      <cfg.Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {texto ?? cfg.t}
    </span>
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
  faltantes,
}: {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel?: string;
  prevLabel?: string;
  disabledNext?: boolean;
  isLastStep?: boolean;
  /** Se muestran cuando "Siguiente" está deshabilitado, para explicar qué falta. */
  faltantes?: string[];
}) {
  return (
    <div className="flex flex-col gap-3 mt-2">
      {disabledNext && faltantes && faltantes.length > 0 && (
        <ul className="flex flex-col gap-1 p-3 rounded-xl bg-slate-100 border border-slate-200">
          {faltantes.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs font-medium text-slate-600">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between gap-3">
        {onPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="px-5 sm:px-6 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-marine transition-colors"
          >
            {prevLabel}
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={disabledNext}
          className={`flex-1 sm:flex-none px-5 sm:px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
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
    </div>
  );
}
