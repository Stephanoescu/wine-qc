"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPIMetric } from "@/lib/mock-data";

// ─────────────────────────────────────────
// MetricCard
// ─────────────────────────────────────────
const COLOR_MAP: Record<KPIMetric["color"], { value: string; bg: string; border: string }> = {
  emerald: {
    value: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  amber: {
    value: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  red: {
    value: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  blue: {
    value: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  zinc: {
    value: "text-zinc-300",
    bg: "bg-zinc-700/30",
    border: "border-zinc-700",
  },
};

interface MetricCardProps {
  metric: KPIMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const colors = COLOR_MAP[metric.color];

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 flex flex-col gap-3`}>
      <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase leading-snug">
        {metric.label}
      </p>
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-bold font-mono leading-none ${colors.value}`}>
          {metric.value}
        </span>
        {metric.unit && (
          <span className="text-sm text-zinc-600 mb-0.5">{metric.unit}</span>
        )}
      </div>
      {metric.trend && (
        <div className="flex items-center gap-1.5 mt-auto pt-1 border-t border-zinc-800">
          {metric.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
          {metric.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
          {metric.trend === "stable" && <Minus className="w-3.5 h-3.5 text-zinc-500" />}
          <span className="text-xs text-zinc-500">{metric.trendValue}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// MetricsGrid
// ─────────────────────────────────────────
interface MetricsGridProps {
  metrics: KPIMetric[];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <MetricCard key={m.id} metric={m} />
      ))}
    </div>
  );
}
