"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  TrendingUp,
  ArrowLeft,
  Wine,
  Calendar,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  LOTES_MOCK,
  calcularKPIs,
  type LoteGuardado,
  type Categoria,
} from "@/lib/recepcion-data";

// ─────────────────────────────────────────
// Category badge
// ─────────────────────────────────────────
function CategoriaBadge({ categoria }: { categoria: Categoria }) {
  if (categoria === "A")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
        <CheckCircle2 className="w-3 h-3" /> A
      </span>
    );
  if (categoria === "B")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
        <AlertTriangle className="w-3 h-3" /> B
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/25">
      <XCircle className="w-3 h-3" /> C
    </span>
  );
}

// ─────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  icon: React.ElementType;
  color: "emerald" | "amber" | "red" | "wine" | "stone";
}

const KPI_COLORS = {
  emerald: { icon: "bg-emerald-900/30 border-emerald-800/40 text-emerald-400", value: "text-emerald-400", border: "border-stone-800" },
  amber:   { icon: "bg-amber-900/30 border-amber-800/40 text-amber-400",     value: "text-amber-400",   border: "border-stone-800" },
  red:     { icon: "bg-red-900/30 border-red-800/40 text-red-400",           value: "text-red-400",     border: "border-stone-800" },
  wine:    { icon: "bg-rose-900/30 border-rose-800/40 text-rose-400",        value: "text-rose-300",    border: "border-stone-800" },
  stone:   { icon: "bg-stone-800 border-stone-700 text-stone-400",           value: "text-stone-200",   border: "border-stone-800" },
};

function KPICard({ label, value, unit, sub, icon: Icon, color }: KPICardProps) {
  const c = KPI_COLORS[color];
  return (
    <div className={`rounded-2xl border ${c.border} bg-stone-900 p-5 flex flex-col gap-3`}>
      <div className={`w-9 h-9 flex items-center justify-center rounded-xl border ${c.icon}`}>
        <Icon className="w-4.5 h-4.5" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xs text-stone-500 leading-tight">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className={`text-3xl font-extrabold font-mono ${c.value}`}>{value}</span>
          {unit && <span className="text-sm text-stone-500">{unit}</span>}
        </div>
        {sub && <p className="text-xs text-stone-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Distribution Chart (pure Tailwind)
// ─────────────────────────────────────────
interface DistChartProps {
  conformes: number;
  observados: number;
  rechazados: number;
  total: number;
}

function DistributionChart({ conformes, observados, rechazados, total }: DistChartProps) {
  const pA = total > 0 ? (conformes / total) * 100 : 0;
  const pB = total > 0 ? (observados / total) * 100 : 0;
  const pC = total > 0 ? (rechazados / total) * 100 : 0;

  const bars = [
    { label: "A — Conforme", count: conformes, pct: pA, color: "bg-emerald-500", light: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" },
    { label: "B — Observado", count: observados, pct: pB, color: "bg-amber-500", light: "bg-amber-500/15 border-amber-500/25 text-amber-400" },
    { label: "C — No liberado", count: rechazados, pct: pC, color: "bg-red-500", light: "bg-red-500/15 border-red-500/25 text-red-400" },
  ];

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-800">
          <BarChart3 className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-200">Distribución por Categoría</h3>
          <p className="text-xs text-stone-500">Mes actual · {total} lotes evaluados</p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex h-8 rounded-xl overflow-hidden gap-0.5">
        {bars.map((b) =>
          b.pct > 0 ? (
            <div
              key={b.label}
              className={`${b.color} flex items-center justify-center transition-all`}
              style={{ width: `${b.pct}%` }}
              title={`${b.label}: ${b.count} (${b.pct.toFixed(1)}%)`}
            >
              {b.pct > 10 && (
                <span className="text-xs font-bold text-white">{b.pct.toFixed(0)}%</span>
              )}
            </div>
          ) : null
        )}
      </div>

      {/* Legend rows with mini bars */}
      <div className="flex flex-col gap-3">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${b.light} flex-shrink-0 w-[130px]`}>
              {b.label}
            </span>
            <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
              <div className={`h-full ${b.color} rounded-full transition-all`} style={{ width: `${b.pct}%` }} />
            </div>
            <div className="text-right flex-shrink-0 w-20">
              <span className="text-sm font-bold text-stone-200 font-mono">{b.count}</span>
              <span className="text-xs text-stone-500 ml-1">({b.pct.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Lots Table
// ─────────────────────────────────────────
type SortKey = "fecha" | "proveedor" | "categoria" | "brixPromedio" | "phPromedio";

function LotesTable({ lotes }: { lotes: LoteGuardado[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "fecha", dir: "desc" });
  const [filter, setFilter] = useState<Categoria | "all">("all");

  const sorted = [...lotes]
    .filter((l) => filter === "all" || l.categoria === filter)
    .sort((a, b) => {
      const mul = sort.dir === "asc" ? 1 : -1;
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "string" && typeof bv === "string")
        return av.localeCompare(bv) * mul;
      return ((av as number) - (bv as number)) * mul;
    });

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sort.key !== k) return <span className="text-stone-700">↕</span>;
    return sort.dir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-rose-400 inline" />
    ) : (
      <ChevronDown className="w-3 h-3 text-rose-400 inline" />
    );
  }

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
        <h3 className="text-sm font-semibold text-stone-200">Historial de Lotes</h3>
        <div className="flex gap-2">
          {(["all", "A", "B", "C"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                filter === f
                  ? f === "all"
                    ? "bg-rose-900/30 border-rose-800/40 text-rose-300"
                    : f === "A"
                    ? "bg-emerald-900/30 border-emerald-800/40 text-emerald-300"
                    : f === "B"
                    ? "bg-amber-900/30 border-amber-800/40 text-amber-300"
                    : "bg-red-900/30 border-red-800/40 text-red-300"
                  : "border-stone-700 text-stone-500 hover:text-stone-300"
              }`}
            >
              {f === "all" ? "Todos" : `Cat. ${f}`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-950/40">
              {[
                { key: "codigoLote", label: "Lote", sortable: false },
                { key: "proveedor", label: "Proveedor", sortable: true },
                { key: "variedad", label: "Variedad", sortable: false },
                { key: "fecha", label: "Fecha", sortable: true },
                { key: "peso", label: "Peso (kg)", sortable: false },
                { key: "brixPromedio", label: "°Brix", sortable: true },
                { key: "phPromedio", label: "pH", sortable: true },
                { key: "categoria", label: "Cat.", sortable: true },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap ${
                    col.sortable ? "cursor-pointer hover:text-stone-300" : ""
                  }`}
                  onClick={() => col.sortable && toggleSort(col.key as SortKey)}
                >
                  {col.label} {col.sortable && <SortIcon k={col.key as SortKey} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60">
            {sorted.map((lote) => (
              <tr
                key={lote.id}
                className="hover:bg-stone-800/30 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-amber-400/90">{lote.codigoLote}</td>
                <td className="px-4 py-3 text-stone-300 whitespace-nowrap">{lote.proveedor}</td>
                <td className="px-4 py-3 text-stone-400 whitespace-nowrap">{lote.variedad}</td>
                <td className="px-4 py-3 text-stone-500 font-mono whitespace-nowrap">{lote.fecha}</td>
                <td className="px-4 py-3 text-stone-300 font-mono">{lote.peso.toLocaleString()}</td>
                <td className={`px-4 py-3 font-mono font-semibold ${
                  lote.brixPromedio >= 16 && lote.brixPromedio <= 20
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}>
                  {lote.brixPromedio.toFixed(1)}
                </td>
                <td className={`px-4 py-3 font-mono font-semibold ${
                  lote.phPromedio >= 2.8 && lote.phPromedio <= 3.65
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}>
                  {lote.phPromedio.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <CategoriaBadge categoria={lote.categoria} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="py-12 text-center text-stone-600 text-sm">
            No hay lotes para el filtro seleccionado.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Reportes Page
// ─────────────────────────────────────────
export default function ReportesPage() {
  const kpis = calcularKPIs(LOTES_MOCK);
  const mes = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-stone-800 bg-stone-950/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Wine className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm font-bold text-stone-200">Dashboard de Reportes</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{mes}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Page title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-100">Reporte Mensual</h1>
            <p className="text-sm text-stone-500 mt-1 capitalize">{mes} · Bodega Control Vitivinícola</p>
          </div>
          <Link
            href="/recepcion"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-900 hover:bg-red-800 text-sm font-semibold text-red-100 transition-colors"
          >
            + Nuevo lote
          </Link>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          <KPICard label="Total de lotes evaluados" value={kpis.total} unit="lotes" icon={Package} color="wine" sub="Mes actual" />
          <KPICard label="Lotes Conformes (Cat. A)" value={kpis.conformes} icon={CheckCircle2} color="emerald" sub={`${kpis.tasaConformidad}% del total`} />
          <KPICard label="Lotes Observados (Cat. B)" value={kpis.observados} icon={AlertTriangle} color="amber" />
          <KPICard label="Lotes Rechazados (Cat. C)" value={kpis.rechazados} icon={XCircle} color="red" />
          <KPICard label="Volumen total recibido" value={(kpis.totalKg / 1000).toFixed(1)} unit="ton" icon={TrendingUp} color="stone" />
        </div>

        {/* Chart */}
        <DistributionChart
          conformes={kpis.conformes}
          observados={kpis.observados}
          rechazados={kpis.rechazados}
          total={kpis.total}
        />

        {/* Table */}
        <LotesTable lotes={LOTES_MOCK} />
      </div>
    </div>
  );
}
