"use client";

import React from "react";
import Link from "next/link";
import {
  ClipboardList,
  BarChart3,
  ArrowRight,
  ArrowRightLeft,
  Cog,
  FlaskConical,
  Hourglass,
} from "lucide-react";

interface ProcedimientoCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  primary?: boolean;
  disabled?: boolean;
}

function ProcedimientoCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  primary,
  disabled,
}: ProcedimientoCardProps) {
  const content = (
    <div
      className={`group relative flex flex-col gap-5 p-7 rounded-2xl border transition-all duration-300 h-full ${
        disabled
          ? "opacity-60 cursor-not-allowed bg-slate-100 border-slate-200"
          : primary
          ? "bg-marine text-white border-marine-light hover:border-gold hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(17,41,76,0.15)] cursor-pointer"
          : "bg-white border-slate-200 hover:border-gold hover:scale-[1.02] hover:shadow-lg cursor-pointer"
      }`}
    >
      {badge && (
        <span className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full ${
          primary ? "bg-gold text-white" : "bg-gold/15 text-gold-dark border border-gold/30"
        }`}>
          {badge}
        </span>
      )}
      <div className={`flex items-center justify-center w-14 h-14 rounded-xl border ${
        disabled ? "bg-slate-200 border-slate-300 text-slate-400"
        : primary ? "bg-marine-light border-marine-light/50 text-gold-light"
        : "bg-slate-50 border-slate-200 text-marine group-hover:border-gold group-hover:text-gold group-hover:bg-gold/5"
      } transition-colors`}>
        <Icon className="w-7 h-7" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <h3 className={`text-lg font-bold leading-snug ${disabled ? "text-slate-500" : primary ? "text-white" : "text-marine"}`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed ${disabled ? "text-slate-400" : primary ? "text-white/70" : "text-slate-500"}`}>
          {description}
        </p>
      </div>
      {!disabled && (
        <div className={`flex items-center gap-2 text-sm font-semibold transition-colors mt-auto ${
          primary ? "text-gold group-hover:text-gold-light" : "text-marine group-hover:text-gold"
        }`}>
          Iniciar
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
      {disabled && (
        <p className="text-xs text-slate-400 mt-auto font-medium">Próximamente</p>
      )}
    </div>
  );

  if (disabled) return content;
  return <Link href={href} className="block h-full">{content}</Link>;
}

export default function InicioPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Logo" className="h-12 sm:h-14 w-auto object-contain" />
          </div>
          <Link
            href="/reportes"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-marine font-medium hover:bg-slate-50 hover:border-marine/20 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-marine-light" />
            Ver reportes
          </Link>
        </div>
      </header>

      {/* Hero text with Dashboard background */}
      <div 
        className="relative border-b border-slate-200 bg-marine overflow-hidden"
      >
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url('/images/dashboard.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-marine via-marine/90 to-transparent pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-6 py-14 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full bg-gold" />
            <span className="text-xs font-bold tracking-widest text-gold-light uppercase">
              Procedimientos disponibles
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            ¿Qué procedimiento{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-light to-white">
              deseas iniciar?
            </span>
          </h1>
          <p className="text-slate-300 max-w-lg leading-relaxed font-medium">
            Selecciona el módulo de trabajo. Todos los registros se guardan automáticamente en el sistema central.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <ProcedimientoCard
            href="/recepcion"
            icon={ClipboardList}
            title="Recepción y Evaluación de Uva"
            description="Identificación, inspección visual y evaluación fisicoquímica de cada lote ingresado a bodega. Clasificación Poka-Yoke."
            badge="Principal"
            primary
          />
          <ProcedimientoCard
            href="#"
            icon={ArrowRightLeft}
            title="Etapa Trasiego"
            description="Control y registro de movimientos de vino entre depósitos."
            primary
          />
          <ProcedimientoCard
            href="#"
            icon={Cog}
            title="Proceso de Trituración"
            description="Monitoreo del despalillado y estrujado mecánico de la uva."
            primary
          />
          <ProcedimientoCard
            href="#"
            icon={FlaskConical}
            title="Dosificación de Correctores de Acidez"
            description="Ajustes y adiciones enológicas para la corrección del mosto."
            primary
          />
          <ProcedimientoCard
            href="#"
            icon={Hourglass}
            title="Proceso Maceración (Horas)"
            description="Control de tiempos y temperatura durante el contacto pelicular."
            primary
          />
        </div>

        {/* Stats footer */}
        <div className="mt-12 flex flex-wrap gap-0 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {[
            { label: "Parámetros monitoreados", value: "7" },
            { label: "Categorías de clasificación", value: "A · B · C" },
            { label: "Límites Poka-Yoke", value: "5 visual + 2 fisico" },
            { label: "Norma de referencia", value: "AWRI" },
          ].map((s) => (
            <div key={s.label} className="flex-1 min-w-[140px] px-6 py-5">
              <p className="text-lg font-bold text-marine font-mono">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
