"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  Loader2,
  Trash2,
  Eye,
  Edit,
} from "lucide-react";
import { calcularKPIs, type LoteGuardado, type Categoria } from "@/lib/recepcion-data";

// ─────────────────────────────────────────
// Category badge
// ─────────────────────────────────────────
function CategoriaBadge({ categoria }: { categoria: Categoria }) {
  if (categoria === "A")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> Cat. A
      </span>
    );
  if (categoria === "B")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5" /> Cat. B
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
      <XCircle className="w-3.5 h-3.5" /> Cat. C
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
  color: "emerald" | "amber" | "red" | "marine" | "gold";
}

const KPI_COLORS = {
  emerald: { icon: "bg-emerald-100 border-emerald-200 text-emerald-600", value: "text-emerald-700" },
  amber:   { icon: "bg-amber-100 border-amber-200 text-amber-600",     value: "text-amber-700" },
  red:     { icon: "bg-red-100 border-red-200 text-red-600",           value: "text-red-700" },
  marine:  { icon: "bg-marine-light/10 border-marine-light/20 text-marine", value: "text-marine" },
  gold:    { icon: "bg-gold/10 border-gold/20 text-gold-dark",           value: "text-marine" },
};

function KPICard({ label, value, unit, sub, icon: Icon, color }: KPICardProps) {
  const c = KPI_COLORS[color];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${c.icon}`}>
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className={`text-3xl font-black font-mono ${c.value}`}>{value}</span>
          {unit && <span className="text-sm font-bold text-slate-400">{unit}</span>}
        </div>
        {sub && <p className="text-xs font-medium text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Distribution Chart
// ─────────────────────────────────────────
function DistributionChart({ conformes, observados, rechazados, total }: {
  conformes: number; observados: number; rechazados: number; total: number;
}) {
  const pA = total > 0 ? (conformes / total) * 100 : 0;
  const pB = total > 0 ? (observados / total) * 100 : 0;
  const pC = total > 0 ? (rechazados / total) * 100 : 0;

  const bars = [
    { label: "A — Conforme",    count: conformes,  pct: pA, color: "bg-emerald-500", light: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { label: "B — Observado",   count: observados,  pct: pB, color: "bg-amber-500",   light: "bg-amber-50 border-amber-200 text-amber-700" },
    { label: "C — No liberado", count: rechazados, pct: pC, color: "bg-red-500",     light: "bg-red-50 border-red-200 text-red-700" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col gap-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-200">
          <BarChart3 className="w-5 h-5 text-marine" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-marine">Distribución por Categoría</h3>
          <p className="text-xs font-medium text-slate-500">{total} lotes registrados en el sistema</p>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm font-medium text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-slate-100">
          Sin datos aún. Registre el primer lote en{" "}
          <Link href="/recepcion" className="text-gold-dark hover:underline font-bold">Recepción</Link>.
        </p>
      ) : (
        <>
          <div className="flex h-8 rounded-xl overflow-hidden gap-0.5 shadow-inner bg-slate-100">
            {bars.map((b) =>
              b.pct > 0 ? (
                <div
                  key={b.label}
                  className={`${b.color} flex items-center justify-center transition-all`}
                  style={{ width: `${b.pct}%` }}
                  title={`${b.label}: ${b.count} (${b.pct.toFixed(1)}%)`}
                >
                  {b.pct > 10 && (
                    <span className="text-xs font-bold text-white drop-shadow-sm">{b.pct.toFixed(0)}%</span>
                  )}
                </div>
              ) : null
            )}
          </div>
          <div className="flex flex-col gap-3">
            {bars.map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold border ${b.light} flex-shrink-0 w-[130px]`}>
                  {b.label}
                </span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full ${b.color} rounded-full`} style={{ width: `${b.pct}%` }} />
                </div>
                <div className="text-right flex-shrink-0 w-20">
                  <span className="text-sm font-black text-marine font-mono">{b.count}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">({b.pct.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Lot detail modal
// ─────────────────────────────────────────
function LoteModal({ lote, onClose }: { lote: LoteGuardado; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-marine-dark/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div>
            <p className="font-mono text-sm font-bold text-marine">{lote.codigoLote}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{lote.variedad} · {lote.proveedor}</p>
          </div>
          <CategoriaBadge categoria={lote.categoria} />
        </div>
        <div className="px-6 py-5 flex flex-col gap-2 text-sm">
          {[
            ["Procedencia", lote.procedencia],
            ["Fecha / Hora", `${lote.fecha}  ${lote.hora ?? "—"}`],
            ["Peso", `${lote.peso?.toLocaleString()} kg`],
            ["°Brix promedio", `${lote.brixPromedio?.toFixed(2)} °Bx`],
            ["pH promedio", lote.phPromedio?.toFixed(3)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{label}</span>
              <span className="text-marine font-bold">{value}</span>
            </div>
          ))}
          {lote.inspeccionVisual && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs font-black text-marine uppercase tracking-wider mb-3 bg-slate-50 p-2 rounded-md border border-slate-100 inline-block">
                Inspección visual
              </p>
              {Object.entries(lote.inspeccionVisual).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-marine font-mono font-bold">{(v as number).toFixed(1)} kg</span>
                </div>
              ))}
            </div>
          )}
          {lote.observaciones?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-3 bg-red-50 p-2 rounded-md border border-red-100 inline-block">
                Observaciones
              </p>
              {lote.observaciones.map((o, i) => (
                <p key={i} className="text-xs font-medium text-slate-600 mb-2 pl-3 relative">
                  <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-red-400" />
                  {o}
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 pb-6 pt-2">
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-marine transition-colors border border-slate-200">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Lots Table
// ─────────────────────────────────────────
type SortKey = "fecha" | "proveedor" | "categoria" | "brixPromedio" | "phPromedio";

function LotesTable({
  lotes,
  onDelete,
  onView,
}: {
  lotes: LoteGuardado[];
  onDelete: (id: string) => void;
  onView: (lote: LoteGuardado) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "fecha", dir: "desc" });
  const [filter, setFilter] = useState<Categoria | "all">("all");

  const sorted = [...lotes]
    .filter((l) => filter === "all" || l.categoria === filter)
    .sort((a, b) => {
      const mul = sort.dir === "asc" ? 1 : -1;
      const av = a[sort.key as keyof LoteGuardado];
      const bv = b[sort.key as keyof LoteGuardado];
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * mul;
      return (((av as number) ?? 0) - ((bv as number) ?? 0)) * mul;
    });

  function toggleSort(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sort.key !== k) return <span className="text-slate-300 ml-1">↕</span>;
    return sort.dir === "asc"
      ? <ChevronUp className="w-3 h-3 text-gold-dark inline ml-1" />
      : <ChevronDown className="w-3 h-3 text-gold-dark inline ml-1" />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 gap-4">
        <h3 className="text-sm font-bold text-marine">
          Historial de Lotes
          <span className="ml-2 text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            {sorted.length} de {lotes.length}
          </span>
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {(["all", "A", "B", "C"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-colors whitespace-nowrap ${
                filter === f
                  ? f === "all" ? "bg-marine text-white border-marine"
                    : f === "A" ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                    : f === "B" ? "bg-amber-100 border-amber-200 text-amber-800"
                    : "bg-red-100 border-red-200 text-red-800"
                  : "bg-white border-slate-200 text-slate-500 hover:text-marine hover:bg-slate-50"
              }`}
            >
              {f === "all" ? "Todos" : `Cat. ${f}`}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-white">
              {[
                { key: "codigoLote", label: "Lote",      sortable: false },
                { key: "proveedor",  label: "Proveedor", sortable: true  },
                { key: "variedad",   label: "Variedad",  sortable: false },
                { key: "fecha",      label: "Fecha",     sortable: true  },
                { key: "peso",       label: "Peso kg",   sortable: false },
                { key: "brixPromedio", label: "°Brix",   sortable: true  },
                { key: "phPromedio",   label: "pH",      sortable: true  },
                { key: "categoria",    label: "Cat.",    sortable: true  },
                { key: "actions",      label: "",        sortable: false },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50/50 ${col.sortable ? "cursor-pointer hover:text-marine hover:bg-slate-100/50" : ""}`}
                  onClick={() => col.sortable && toggleSort(col.key as SortKey)}
                >
                  {col.label}{col.sortable && <SortIcon k={col.key as SortKey} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((lote) => (
              <tr key={lote.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs font-bold text-marine whitespace-nowrap">{lote.codigoLote}</td>
                <td className="px-5 py-3.5 text-slate-700 font-medium whitespace-nowrap max-w-[140px] truncate">{lote.proveedor}</td>
                <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">{lote.variedad}</td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-xs whitespace-nowrap">{lote.fecha}</td>
                <td className="px-5 py-3.5 text-marine font-mono font-bold whitespace-nowrap">{lote.peso?.toLocaleString()}</td>
                <td className={`px-5 py-3.5 font-mono font-bold whitespace-nowrap ${lote.brixPromedio >= 16 && lote.brixPromedio <= 20 ? "text-emerald-600" : "text-red-600"}`}>
                  {lote.brixPromedio?.toFixed(1)}
                </td>
                <td className={`px-5 py-3.5 font-mono font-bold whitespace-nowrap ${lote.phPromedio >= 2.8 && lote.phPromedio <= 3.65 ? "text-emerald-600" : "text-red-600"}`}>
                  {lote.phPromedio?.toFixed(2)}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <CategoriaBadge categoria={lote.categoria} />
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/recepcion?edit=${lote.id}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-marine hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                      title="Editar lote"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onView(lote)}
                      className="p-2 rounded-lg text-slate-400 hover:text-marine hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el lote ${lote.codigoLote}?`)) onDelete(lote.id);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="py-20 text-center bg-slate-50">
            <p className="text-slate-500 text-sm font-medium">
              {lotes.length === 0
                ? "Aún no hay lotes registrados en la base de datos."
                : "No hay lotes para el filtro seleccionado."}
            </p>
            {lotes.length === 0 && (
              <Link href="/recepcion" className="text-sm font-bold text-gold-dark hover:text-gold hover:underline mt-3 inline-block">
                → Registrar primer lote
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Reportes Page — fetches from /api/lotes
// ─────────────────────────────────────────
export default function ReportesPage() {
  const [lotes, setLotes] = useState<LoteGuardado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLote, setSelectedLote] = useState<LoteGuardado | null>(null);

  const fetchLotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lotes", { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar los datos");
      const data: LoteGuardado[] = await res.json();
      setLotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLotes();
  }, [fetchLotes]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/lotes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setLotes((prev) => prev.filter((l) => l.id !== id));
      }
    } catch {
      alert("Error al eliminar el lote");
    }
  }

  const kpis = calcularKPIs(lotes);
  const mes = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/inicio" className="flex items-center gap-1.5 text-slate-500 hover:text-marine font-medium transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start">
            <img src="/images/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold text-marine">Dashboard de Reportes</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{mes}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-marine">Reporte de Lotes</h1>
            <p className="text-sm font-medium text-slate-500 mt-1 capitalize">{mes}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchLotes}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-marine transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-gold" : ""}`} />
              Actualizar
            </button>
            <Link href="/recepcion" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-marine hover:bg-marine-light text-sm font-bold text-white transition-colors shadow-md shadow-marine/20">
              + Nuevo lote
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-marine">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <span className="text-sm font-bold">Cargando datos desde el servidor...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-3 p-5 rounded-xl border border-red-200 bg-red-50 shadow-sm">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-sm font-black text-red-800">Error al cargar datos</p>
              <p className="text-sm font-medium text-red-600 mt-0.5">{error}</p>
            </div>
            <button onClick={fetchLotes} className="ml-auto text-sm font-bold text-red-700 hover:text-red-800 underline bg-white px-3 py-1.5 rounded-md border border-red-200 shadow-sm">
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI grid */}
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
              <KPICard label="Total de lotes" value={kpis.total} unit="lotes" icon={Package} color="marine" sub="Registrados en el sistema" />
              <KPICard label="Conformes (Cat. A)" value={kpis.conformes} icon={CheckCircle2} color="emerald" sub={kpis.total > 0 ? `${kpis.tasaConformidad}% del total` : "Sin datos"} />
              <KPICard label="Observados (Cat. B)" value={kpis.observados} icon={AlertTriangle} color="amber" />
              <KPICard label="Rechazados (Cat. C)" value={kpis.rechazados} icon={XCircle} color="red" />
              <KPICard label="Volumen total" value={kpis.total > 0 ? (kpis.totalKg / 1000).toFixed(1) : "0"} unit="ton" icon={TrendingUp} color="gold" />
            </div>

            {/* Chart */}
            <DistributionChart
              conformes={kpis.conformes}
              observados={kpis.observados}
              rechazados={kpis.rechazados}
              total={kpis.total}
            />

            {/* Table */}
            <LotesTable lotes={lotes} onDelete={handleDelete} onView={setSelectedLote} />
          </>
        )}
      </div>

      {/* Detail modal */}
      {selectedLote && (
        <LoteModal lote={selectedLote} onClose={() => setSelectedLote(null)} />
      )}
    </div>
  );
}
