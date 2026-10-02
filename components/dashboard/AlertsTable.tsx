"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import type { RecentAlert } from "@/lib/mock-data";

interface AlertsTableProps {
  alerts: RecentAlert[];
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-200">Alertas del turno</h3>
        <span className="text-xs text-zinc-600">{alerts.length} registros</span>
      </div>
      <div className="divide-y divide-zinc-800">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/30 transition-colors">
            {/* Status icon */}
            <div className="flex-shrink-0">
              {alert.resolved ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200">{alert.parameter}</span>
                <span className="text-xs text-zinc-600 font-mono">{alert.id}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-zinc-500">Tanque: {alert.tank}</span>
                <span className="text-xs text-zinc-600">·</span>
                <span className="text-xs text-zinc-500 font-mono">{alert.value}</span>
              </div>
            </div>

            {/* Time & status */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-zinc-600">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-mono">{alert.time}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                alert.resolved
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}>
                {alert.resolved ? "Resuelta" : "Pendiente"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SummaryRow — compact process summary
// ─────────────────────────────────────────
interface SummaryItem {
  label: string;
  value: string;
  status: "ok" | "warn" | "info";
}

interface SummaryRowProps {
  items: SummaryItem[];
}

export function SummaryRow({ items }: SummaryRowProps) {
  const statusColors = {
    ok: "text-emerald-400",
    warn: "text-amber-400",
    info: "text-zinc-400",
  };

  return (
    <div className="flex flex-wrap gap-0 divide-x divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {items.map((item, i) => (
        <div key={i} className="flex-1 min-w-[120px] px-5 py-4">
          <p className="text-xs text-zinc-600 mb-1">{item.label}</p>
          <p className={`text-sm font-semibold ${statusColors[item.status]}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
