"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wine } from "lucide-react";
import { WizardProgress } from "@/components/recepcion/WizardUI";
import { Paso1Identificacion } from "@/components/recepcion/Paso1Identificacion";
import { Paso2InspeccionVisual } from "@/components/recepcion/Paso2InspeccionVisual";
import { PasoMuestra } from "@/components/recepcion/PasoMuestra";
import { Paso3Fisicoquimica } from "@/components/recepcion/Paso3Fisicoquimica";
import { Paso4DecisionFinal } from "@/components/recepcion/Paso4DecisionFinal";
import type {
  IdentificacionData,
  InspeccionVisualData,
  FisicoquimicaData,
  LoteGuardado,
} from "@/lib/recepcion-data";

// ─────────────────────────────────────────
// 5-step wizard
// ─────────────────────────────────────────
const STEPS = ["Identificación", "Inspección Visual", "Muestra", "Fisicoquímica", "Decisión"];

function makeCodigoLote() {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-4);
  return `LOT-${year}-${suffix}`;
}

const EMPTY_ID: IdentificacionData = {
  proveedor: "",
  procedencia: "",
  fecha: new Date().toISOString().split("T")[0],
  hora: new Date().toTimeString().slice(0, 5),
  variedad: "",
  peso: "",
  codigoLote: makeCodigoLote(),
};

const EMPTY_VISUAL: InspeccionVisualData = {
  podredumbre: "",
  bayasDaniadas: "",
  deshidratacion: "",
  bayasVerdes: "",
  materiaExtrana: "",
};

const EMPTY_FISICO: FisicoquimicaData = {
  brix1: "",
  brix2: "",
  brix3: "",
  ph1: "",
  ph2: "",
};

export default function RecepcionPage() {
  const [step, setStep] = useState(1);
  const [identificacion, setIdentificacion] = useState<IdentificacionData>(EMPTY_ID);
  const [visual, setVisual] = useState<InspeccionVisualData>(EMPTY_VISUAL);
  const [fisico, setFisico] = useState<FisicoquimicaData>(EMPTY_FISICO);

  const pesoNeto = parseFloat(identificacion.peso) || 0;

  async function handleSave(lote: LoteGuardado): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lote),
      });
      const json = await res.json();
      if (!res.ok) return { ok: false, error: json.error ?? "Error al guardar" };

      setTimeout(() => {
        setStep(1);
        setIdentificacion({ ...EMPTY_ID, codigoLote: makeCodigoLote() });
        setVisual(EMPTY_VISUAL);
        setFisico(EMPTY_FISICO);
      }, 4000);

      return { ok: true };
    } catch {
      return { ok: false, error: "Error de red. Verifique que el servidor esté activo." };
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/inicio"
            className="flex items-center gap-1.5 text-slate-500 hover:text-marine transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
            <Wine className="w-4 h-4 text-gold-dark flex-shrink-0" />
            <span className="text-sm font-bold text-marine truncate">
              Recepción y Evaluación de Uva
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium flex-shrink-0 bg-slate-100 px-2.5 py-1 rounded-md">
            Paso {step}/{STEPS.length}
          </span>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-4">
          <WizardProgress steps={STEPS} currentStep={step} />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {step === 1 && (
          <Paso1Identificacion
            data={identificacion}
            onChange={setIdentificacion}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Paso2InspeccionVisual
            data={visual}
            pesoNeto={pesoNeto}
            onChange={setVisual}
            onNext={() => setStep(3)}
            onPrev={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <PasoMuestra
            onNext={() => setStep(4)}
            onPrev={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Paso3Fisicoquimica
            data={fisico}
            onChange={setFisico}
            onNext={() => setStep(5)}
            onPrev={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <Paso4DecisionFinal
            identificacion={identificacion}
            visual={visual}
            fisico={fisico}
            pesoNeto={pesoNeto}
            onPrev={() => setStep(4)}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
