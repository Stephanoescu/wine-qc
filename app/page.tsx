"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Wine } from "lucide-react";

export default function LandingPage() {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(
            to bottom,
            rgba(5, 3, 3, 0.62) 0%,
            rgba(15, 5, 8, 0.80) 55%,
            rgba(5, 3, 3, 0.97) 100%
          ),
          url('https://images.unsplash.com/photo-1568213214768-d3f3ba70e773?w=1920&q=80')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")" }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-900/50 border border-red-700/40">
            <Wine className="w-4 h-4 text-red-300" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold text-stone-300 tracking-wide">Bodega Control</span>
        </div>
        <span className="text-xs text-stone-600 tracking-widest uppercase hidden sm:block">
          Sistema de Calidad Vitivinícola
        </span>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-8 px-6 max-w-3xl">
        {/* Divider top */}
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-red-700/50" />
          <span className="text-xs font-semibold tracking-[0.25em] text-red-400 uppercase">
            Control de Calidad · Poka-Yoke
          </span>
          <div className="h-px w-12 bg-red-700/50" />
        </div>

        {/* Company name */}
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl sm:text-7xl font-black text-stone-50 leading-none tracking-tight">
            Bodega
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-400 to-amber-400">
              Control
            </span>
          </h1>
          <p className="text-base sm:text-lg text-stone-300/80 max-w-md mx-auto leading-relaxed font-light">
            Sistema integrado de evaluación y clasificación de uva según grado de madurez para bodegas vitivinícolas.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/inicio"
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-900 hover:bg-red-800 border border-red-700/60 hover:border-red-600 text-red-100 font-bold text-base transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(185,28,28,0.3)]"
        >
          Ingresar al Sistema
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Stats row */}
        <div className="flex items-center gap-8 mt-2">
          {[
            { value: "Poka-Yoke", label: "Validación automática" },
            { value: "3 Cat.", label: "A · B · C" },
            { value: "100%", label: "Trazabilidad" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-base font-bold text-amber-400 font-mono">{s.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-stone-950 to-transparent pointer-events-none" />
    </div>
  );
}
