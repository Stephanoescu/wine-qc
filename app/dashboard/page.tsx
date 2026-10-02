"use client";

import React from "react";
import {
  DASHBOARD_KPIS,
  CHART_DATA,
  RECENT_ALERTS,
} from "@/lib/mock-data";
import { MetricsGrid } from "@/components/dashboard/MetricCard";
import { PHChart } from "@/components/dashboard/PHChart";
import { AlertsTable, SummaryRow } from "@/components/dashboard/AlertsTable";
import { TopBar } from "@/components/layout/Navigation";
import { Activity, CalendarDays, Download } from "lucide-react";

const SUMMARY_ITEMS = [
  { label: "Turno", value: "Mañana · 06:00–14:00", status: "info" as const },
  { label: "Operario", value: "Operario #04", status: "info" as const },
  { label: "Área", value: "Sala de fermentación", status: "info" as const },
  { label: "Estado del turno", value: "En curso", status: "ok" as const },
];

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <TopBar title="Dashboard" />

      <div className="flex-1 px-4 lg:px-8 py-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Dashboard de Control</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
              <CalendarDays className="w-4 h-4" />
              <span className="capitalize">{today}</span>
            </div>
          </div>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors">
            <Download className="w-4 h-4" />
            Exportar reporte
          </button>
        </div>

        {/* Shift summary */}
        <SummaryRow items={SUMMARY_ITEMS} />

        {/* KPI grid */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest text-zinc-600 uppercase mb-4">
            Indicadores del turno
          </h2>
          <MetricsGrid metrics={DASHBOARD_KPIS} />
        </section>

        {/* pH chart */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-200">
                  Gráfico de control — pH
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Lecturas cada hora · Rango aceptable: 5.0–10.0 pH
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              1 fuera de rango
            </div>
          </div>
          <PHChart data={CHART_DATA} yMin={4} yMax={13} />
        </section>

        {/* Alerts section */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest text-zinc-600 uppercase mb-4">
            Registro de alertas
          </h2>
          <AlertsTable alerts={RECENT_ALERTS} />
        </section>

        {/* Process stability indicator */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-600 uppercase mb-5">
            Estabilidad del proceso — última hora
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { param: "pH", value: "6.9", status: "ok", range: "5–10" },
              { param: "Temperatura", value: "16.2 °C", status: "ok", range: "12–20 °C" },
              { param: "Densidad", value: "1.042 g/mL", status: "ok", range: "0.990–1.100" },
            ].map((item) => (
              <div key={item.param} className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{item.param}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === "ok" ? "bg-emerald-500" : "bg-amber-500"
                  }`} />
                </div>
                <span className="text-xl font-bold font-mono text-zinc-100">{item.value}</span>
                <span className="text-xs text-zinc-600">Rango: {item.range}</span>
                {/* Mini stability bar */}
                <div className="h-1 bg-zinc-700 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "87%" }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
