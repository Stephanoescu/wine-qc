"use client";

import React from "react";
import type { ChartDataPoint } from "@/lib/mock-data";

// ─────────────────────────────────────────
// PHChart — Static tailwind bar chart
// ─────────────────────────────────────────
interface PHChartProps {
  data: ChartDataPoint[];
  yMin?: number;
  yMax?: number;
}

export function PHChart({ data, yMin = 4, yMax = 12 }: PHChartProps) {
  const range = yMax - yMin;

  const getBarHeight = (value: number) => {
    const clamped = Math.min(Math.max(value, yMin), yMax);
    return ((clamped - yMin) / range) * 100;
  };

  const isOutOfRange = (value: number, baseline: number) => {
    // Using ±2 as tolerance band
    return Math.abs(value - baseline) > 2;
  };

  return (
    <div className="w-full">
      {/* Y axis labels */}
      <div className="flex">
        {/* Y labels */}
        <div className="flex flex-col justify-between text-right pr-3 py-1" style={{ minWidth: "2rem" }}>
          {[yMax, (yMin + yMax) / 2, yMin].map((v) => (
            <span key={v} className="text-xs text-zinc-600 font-mono">{v}</span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-full border-t border-zinc-800/60" />
            ))}
          </div>

          {/* Baseline band */}
          <div
            className="absolute left-0 right-0 bg-emerald-500/5 border-y border-emerald-500/15"
            style={{
              bottom: `${getBarHeight(5)}%`,
              height: `${getBarHeight(10) - getBarHeight(5)}%`,
            }}
          />

          {/* Bars */}
          <div className="relative flex items-end gap-1 h-40 px-1">
            {data.map((point, i) => {
              const height = getBarHeight(point.value);
              const oor = isOutOfRange(point.value, point.baseline);
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                  {/* Tooltip */}
                  <div className="relative w-full flex flex-col items-center justify-end h-full">
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                      <div className={`px-2 py-1 rounded text-xs font-mono font-bold whitespace-nowrap ${
                        oor ? "bg-red-500 text-white" : "bg-zinc-700 text-zinc-200"
                      }`}>
                        {point.value} pH
                      </div>
                      <div className={`w-1.5 h-1.5 rotate-45 -mt-1 ${oor ? "bg-red-500" : "bg-zinc-700"}`} />
                    </div>
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        oor
                          ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                          : "bg-emerald-500/70 hover:bg-emerald-500"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X labels */}
      <div className="flex pl-9 pt-2">
        {data.map((point, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-xs text-zinc-600 font-mono">{point.label}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 pl-9 pt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
          <span className="text-xs text-zinc-500">pH en rango</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-xs text-zinc-500">Fuera de rango</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-emerald-500/30 border border-dashed border-emerald-500/30" />
          <span className="text-xs text-zinc-500">Zona aceptable (5–10)</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MiniSparkline — tiny inline chart
// ─────────────────────────────────────────
interface MiniSparklineProps {
  values: number[];
  color?: "emerald" | "amber" | "red";
}

export function MiniSparkline({ values, color = "emerald" }: MiniSparklineProps) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const colorClass = {
    emerald: "stroke-emerald-400",
    amber: "stroke-amber-400",
    red: "stroke-red-400",
  }[color];

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="w-16 h-6" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        className={colorClass}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
