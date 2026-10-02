"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from "lucide-react";
import type { Alert } from "@/lib/mock-data";

// ─────────────────────────────────────────
// AlertBadge — severity indicator
// ─────────────────────────────────────────
function AlertBadge({ severity }: { severity: Alert["severity"] }) {
  return severity === "critical" ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
      <ShieldAlert className="w-3.5 h-3.5" />
      CRÍTICO
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
      <AlertTriangle className="w-3.5 h-3.5" />
      ADVERTENCIA
    </span>
  );
}

// ─────────────────────────────────────────
// OutOfRangeVisualizer — bar visual
// ─────────────────────────────────────────
function OutOfRangeVisualizer({ alert }: { alert: Alert }) {
  const range = alert.max - alert.min;
  const clampedValue = Math.min(alert.value, alert.max * 1.3);
  const percentage = Math.min(((clampedValue - alert.min + range * 0.1) / (range * 1.5)) * 100, 100);
  const isOver = alert.value > alert.max;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-zinc-500 font-mono">
        <span>{alert.min} {alert.unit}</span>
        <span>{alert.max} {alert.unit}</span>
      </div>
      <div className="relative w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
        {/* Safe zone */}
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full" />
        {/* Value indicator */}
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${
            isOver ? "bg-red-500" : "bg-amber-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-600">Mín. aceptable</span>
        <span className={`font-bold font-mono ${isOver ? "text-red-400" : "text-amber-400"}`}>
          Lectura: {alert.value} {alert.unit}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// AlertModal — main component
// ─────────────────────────────────────────
interface AlertModalProps {
  alert: Alert;
  onDismiss?: () => void;
}

export function AlertModal({ alert, onDismiss }: AlertModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`flex items-start gap-4 px-6 py-5 border-b ${
          alert.severity === "critical"
            ? "border-red-500/20 bg-red-500/5"
            : "border-amber-500/20 bg-amber-500/5"
        }`}>
          <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${
            alert.severity === "critical" ? "bg-red-500/15" : "bg-amber-500/15"
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              alert.severity === "critical" ? "text-red-400" : "text-amber-400"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <AlertBadge severity={alert.severity} />
              <span className="text-xs text-zinc-600 font-mono">{alert.id}</span>
            </div>
            <h2 className="text-lg font-bold text-zinc-100">
              Parámetro fuera de rango detectado
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              {alert.parameter} · {alert.timestamp}
            </p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Reading summary */}
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl bg-zinc-800 p-4 text-center">
              <p className="text-xs text-zinc-500 mb-1">Lectura obtenida</p>
              <p className={`text-3xl font-bold font-mono ${
                alert.severity === "critical" ? "text-red-400" : "text-amber-400"
              }`}>
                {alert.value}
              </p>
              <p className="text-sm text-zinc-500">{alert.unit}</p>
            </div>
            <div className="flex-1 rounded-xl bg-zinc-800 p-4 text-center">
              <p className="text-xs text-zinc-500 mb-1">Rango permitido</p>
              <p className="text-3xl font-bold font-mono text-emerald-400">
                {alert.min}–{alert.max}
              </p>
              <p className="text-sm text-zinc-500">{alert.unit}</p>
            </div>
          </div>

          {/* Visual range bar */}
          <OutOfRangeVisualizer alert={alert} />

          {/* Recommendations */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-zinc-200">
                Recomendaciones del Sistema
              </h3>
            </div>
            <ul className="divide-y divide-zinc-800/60">
              {alert.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                    {i + 1}
                  </span>
                  <p className="text-sm text-zinc-400 leading-relaxed">{rec}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onDismiss}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
          >
            Entendido — Cerrar
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-all"
          >
            Notificar al supervisor
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// AlertInline — inline (non-modal) version
// ─────────────────────────────────────────
interface AlertInlineProps {
  alert: Alert;
  onResolve?: () => void;
}

export function AlertInline({ alert, onResolve }: AlertInlineProps) {
  return (
    <div className={`w-full rounded-2xl border bg-zinc-900 overflow-hidden ${
      alert.severity === "critical"
        ? "border-red-500/30"
        : "border-amber-500/30"
    }`}>
      {/* Accent bar */}
      <div className={`h-1 w-full ${
        alert.severity === "critical" ? "bg-red-500" : "bg-amber-500"
      }`} />

      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertBadge severity={alert.severity} />
            <span className="text-xs text-zinc-600 font-mono">{alert.id}</span>
          </div>
          <span className="text-xs text-zinc-600">{alert.timestamp}</span>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 rounded-xl bg-zinc-800 p-3 text-center">
            <p className="text-xs text-zinc-500">Lectura</p>
            <p className={`text-2xl font-bold font-mono ${
              alert.severity === "critical" ? "text-red-400" : "text-amber-400"
            }`}>{alert.value} <span className="text-sm font-normal">{alert.unit}</span></p>
          </div>
          <div className="flex-1 rounded-xl bg-zinc-800 p-3 text-center">
            <p className="text-xs text-zinc-500">Rango</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">{alert.min}–{alert.max} <span className="text-sm font-normal">{alert.unit}</span></p>
          </div>
        </div>

        <OutOfRangeVisualizer alert={alert} />

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Acciones correctivas sugeridas
            </h3>
          </div>
          <ul className="divide-y divide-zinc-800/60">
            {alert.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className="mt-0.5 flex-shrink-0 text-xs font-bold text-zinc-600">{i + 1}.</span>
                <p className="text-sm text-zinc-400 leading-relaxed">{rec}</p>
              </li>
            ))}
          </ul>
        </div>

        {onResolve && (
          <button
            onClick={onResolve}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-all"
          >
            Marcar como resuelta
          </button>
        )}
      </div>
    </div>
  );
}
