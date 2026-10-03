"use client";

import React from "react";
import Link from "next/link";
import {
  ClipboardList,
  BarChart3,
  Wine,
  ArrowRight,
  Shield,
  Leaf,
  Thermometer,
} from "lucide-react";

// ─────────────────────────────────────────
// Procedimiento Card
// ─────────────────────────────────────────
interface ProcedimientoCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
  badge?: string;
  primary?: boolean;
}

function ProcedimientoCard({
  href,
  icon: Icon,
  title,
  description,
  accent,
  badge,
  primary,
}: ProcedimientoCardProps) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col gap-5 p-7 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
        primary
          ? "bg-gradient-to-br from-red-950 to-stone-900 border-red-800/60 hover:border-red-700"
          : "bg-stone-900 border-stone-700/50 hover:border-stone-600 hover:bg-stone-800/80"
      }`}
    >
      {badge && (
        <span className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
          {badge}
        </span>
      )}
      <div
        className={`flex items-center justify-center w-14 h-14 rounded-xl border ${accent}`}
      >
        <Icon className="w-7 h-7" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className={`text-lg font-bold leading-snug ${primary ? "text-red-100" : "text-stone-100"}`}>
          {title}
        </h3>
        <p className="text-sm text-stone-400 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-red-400 group-hover:text-red-300 transition-colors mt-auto">
        Iniciar
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────
// Home Page
// ─────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Header / Brand */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-900/40 border border-red-800/50">
              <Wine className="w-5 h-5 text-red-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-bold text-stone-100 leading-none">Bodega Control</p>
              <p className="text-xs text-stone-500 mt-0.5">Sistema de Calidad Vitivinícola</p>
            </div>
          </div>
          <Link
            href="/reportes"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-700 text-sm text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Ver reportes
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-full bg-red-700" />
          <span className="text-xs font-semibold tracking-widest text-red-400 uppercase">
            Control de Calidad · Poka-Yoke
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-100 leading-tight">
          Gestión de Calidad{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500">
            Vitivinícola
          </span>
        </h1>
        <p className="text-stone-400 max-w-lg leading-relaxed">
          Estandariza la recepción, clasificación y segregación de uva según su grado de
          madurez. Selecciona el procedimiento a realizar.
        </p>
      </div>

      {/* Cards grid */}
      <div className="max-w-5xl mx-auto px-6 pb-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <ProcedimientoCard
            href="/recepcion"
            icon={ClipboardList}
            title="Recepción y Evaluación de Uva"
            description="Identificación, inspección visual y evaluación fisicoquímica de cada lote ingresado a bodega."
            accent="bg-red-900/30 border-red-800/50 text-red-400"
            badge="Principal"
            primary
          />
          <ProcedimientoCard
            href="/reportes"
            icon={BarChart3}
            title="Dashboard de Reportes"
            description="Resumen mensual de lotes evaluados, KPIs de conformidad y distribución por categorías."
            accent="bg-amber-900/20 border-amber-800/40 text-amber-400"
          />
          <ProcedimientoCard
            href="#"
            icon={Shield}
            title="Control de Proceso"
            description="Monitoreo de parámetros durante la fermentación y crianza. (Próximamente)"
            accent="bg-emerald-900/20 border-emerald-800/40 text-emerald-400"
          />
          <ProcedimientoCard
            href="#"
            icon={Leaf}
            title="Trazabilidad de Lotes"
            description="Seguimiento completo del recorrido de cada lote desde la viña hasta el embotellado."
            accent="bg-stone-800 border-stone-700 text-stone-400"
          />
          <ProcedimientoCard
            href="#"
            icon={Thermometer}
            title="Control de Temperatura"
            description="Registro y alertas de temperatura en depósitos de almacenamiento."
            accent="bg-stone-800 border-stone-700 text-stone-400"
          />
        </div>

        {/* Footer stats */}
        <div className="mt-10 flex flex-wrap gap-0 divide-x divide-stone-800 rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden">
          {[
            { label: "Lotes evaluados (mes)", value: "120" },
            { label: "Tasa de conformidad", value: "79%" },
            { label: "Proveedores activos", value: "14" },
            { label: "Variedades registradas", value: "8" },
          ].map((s) => (
            <div key={s.label} className="flex-1 min-w-[140px] px-6 py-5">
              <p className="text-2xl font-bold text-amber-400 font-mono">{s.value}</p>
              <p className="text-xs text-stone-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
