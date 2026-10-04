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
            rgba(17, 41, 76, 0.70) 0%,
            rgba(26, 61, 115, 0.50) 55%,
            rgba(10, 25, 48, 0.90) 100%
          ),
          url('/images/Inicio.png')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")" }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5">
        <div className="flex items-center">
          <img src="/images/logo.png" alt="Logo" className="h-16 sm:h-20 w-auto object-contain drop-shadow-md" />
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-8 px-6 max-w-3xl">
        {/* Divider top */}
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-gold/50" />
          <span className="text-xs font-semibold tracking-[0.25em] text-gold uppercase drop-shadow-md">
            Control de Calidad · Poka-Yoke
          </span>
          <div className="h-px w-12 bg-gold/50" />
        </div>

        {/* Company name */}
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl sm:text-7xl font-black text-white leading-none tracking-tight">
            Bodega
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold to-gold-dark drop-shadow-lg">
              Control
            </span>
          </h1>
          <p className="text-base sm:text-lg text-white/90 max-w-md mx-auto leading-relaxed font-light mt-2">
            Sistema integrado de evaluación y clasificación de uva según grado de madurez para bodegas vitivinícolas.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/inicio"
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gold hover:bg-gold-light border border-gold-light/50 text-white font-bold text-base transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(156,142,101,0.4)]"
        >
          Ingresar al Sistema
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Stats row */}
        <div className="flex items-center gap-8 mt-4 bg-marine-dark/40 backdrop-blur-sm py-4 px-8 rounded-2xl border border-white/10">
          {[
            { value: "Poka-Yoke", label: "Validación automática" },
            { value: "3 Cat.", label: "A · B · C" },
            { value: "100%", label: "Trazabilidad" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-base font-bold text-gold font-mono drop-shadow-sm">{s.value}</p>
              <p className="text-xs text-white/70 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
    </div>
  );
}
