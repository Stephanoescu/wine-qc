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
  Activity,
} from "lucide-react";

interface ProcedimientoCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
  badge?: string;
  primary?: boolean;
  disabled?: boolean;
}

function ProcedimientoCard({
  href,
  icon: Icon,
  title,
  description,
  accent,
  badge,
  primary,
  disabled,
}: ProcedimientoCardProps) {
  const content = (
    <div
      className={`group relative flex flex-col gap-5 p-7 rounded-2xl border transition-all duration-300 h-full ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-stone-900 border-stone-800"
          : primary
          ? "bg-gradient-to-br from-red-950 to-stone-900 border-red-800/60 hover:border-red-700 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
          : "bg-stone-900 border-stone-700/50 hover:border-stone-600 hover:bg-stone-800/80 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
      }`}
    >
      {badge && (
        <span className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
          {badge}
        </span>
      )}
      <div className={`flex items-center justify-center w-14 h-14 rounded-xl border ${accent}`}>
        <Icon className="w-7 h-7" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <h3 className={`text-lg font-bold leading-snug ${primary ? "text-red-100" : "text-stone-100"}`}>
          {title}
        </h3>
        <p className="text-sm text-stone-400 leading-relaxed">{description}</p>
      </div>
      {!disabled && (
        <div className="flex items-center gap-2 text-sm font-semibold text-red-400 group-hover:text-red-300 transition-colors mt-auto">
          Iniciar
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
      {disabled && (
        <p className="text-xs text-stone-600 mt-auto">Próximamente</p>
      )}
    </div>
  );

  if (disabled) return content;
  return <Link href={href} className="block h-full">{content}</Link>;
}

export default function InicioPage() {
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Header */}
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

      {/* Hero text */}
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full bg-red-700" />
          <span className="text-xs font-semibold tracking-widest text-red-400 uppercase">
            Procedimientos disponibles
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-100 leading-tight">
          ¿Qué procedimiento{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500">
            deseas iniciar?
          </span>
        </h1>
        <p className="text-stone-400 max-w-lg leading-relaxed">
          Selecciona el módulo de trabajo. Todos los registros se guardan automáticamente en el sistema.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto px-6 pb-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <ProcedimientoCard
            href="/recepcion"
            icon={ClipboardList}
            title="Recepción y Evaluación de Uva"
            description="Identificación, inspección visual y evaluación fisicoquímica de cada lote ingresado a bodega. Clasificación Poka-Yoke."
            accent="bg-red-900/30 border-red-800/50 text-red-400"
            badge="Principal"
            primary
          />
          <ProcedimientoCard
            href="/reportes"
            icon={BarChart3}
            title="Dashboard de Reportes"
            description="Resumen de lotes evaluados, KPIs de conformidad y distribución histórica por categorías A, B y C."
            accent="bg-amber-900/20 border-amber-800/40 text-amber-400"
          />
          <ProcedimientoCard
            href="/control-estadistico"
            icon={Activity}
            title="Control Estadístico"
            description="Gráficos de control SPC, cartas de control X̄-R y análisis de tendencias de los parámetros fisicoquímicos."
            accent="bg-rose-900/20 border-rose-800/40 text-rose-400"
            disabled
          />
          <ProcedimientoCard
            href="#"
            icon={Shield}
            title="Control de Proceso"
            description="Monitoreo de parámetros durante la fermentación y crianza."
            accent="bg-emerald-900/20 border-emerald-800/40 text-emerald-400"
            disabled
          />
          <ProcedimientoCard
            href="#"
            icon={Leaf}
            title="Trazabilidad de Lotes"
            description="Seguimiento completo del recorrido de cada lote desde la viña hasta el embotellado."
            accent="bg-stone-800 border-stone-700 text-stone-400"
            disabled
          />
          <ProcedimientoCard
            href="#"
            icon={Thermometer}
            title="Control de Temperatura"
            description="Registro y alertas de temperatura en depósitos de almacenamiento y sala de barricas."
            accent="bg-stone-800 border-stone-700 text-stone-400"
            disabled
          />
        </div>

        {/* Stats footer */}
        <div className="mt-10 flex flex-wrap gap-0 divide-x divide-stone-800 rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden">
          {[
            { label: "Parámetros monitoreados", value: "7" },
            { label: "Categorías de clasificación", value: "A · B · C" },
            { label: "Límites Poka-Yoke activos", value: "5 visual + 2 fisico" },
            { label: "Norma de referencia", value: "AWRI" },
          ].map((s) => (
            <div key={s.label} className="flex-1 min-w-[140px] px-6 py-5">
              <p className="text-lg font-bold text-amber-400 font-mono">{s.value}</p>
              <p className="text-xs text-stone-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
