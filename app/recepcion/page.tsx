"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wine } from "lucide-react";
import { WizardProgress } from "@/components/recepcion/WizardUI";
import { Paso1Identificacion } from "@/components/recepcion/Paso1Identificacion";
import { Paso2InspeccionVisual } from "@/components/recepcion/Paso2InspeccionVisual";
import { PasoMuestra } from "@/components/recepcion/PasoMuestra";
import { Paso4Brix } from "@/components/recepcion/Paso4Brix";
import { Paso5PH } from "@/components/recepcion/Paso5PH";
import { Paso4DecisionFinal as Paso6DecisionFinal } from "@/components/recepcion/Paso6DecisionFinal";
import type {
  IdentificacionData,
  InspeccionVisualData,
  FisicoquimicaData,
  LoteGuardado,
} from "@/lib/recepcion-data";

// ─────────────────────────────────────────
// 6-step wizard
// ─────────────────────────────────────────
const STEPS = ["Identificación", "Inspección Visual", "Muestra", "°Brix", "pH", "Decisión"];

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

import { useRouter } from "next/navigation";

import { getLotesLocal, saveLoteLocal } from "@/lib/recepcion-data";

export default function RecepcionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [identificacion, setIdentificacion] = useState<IdentificacionData>(EMPTY_ID);
  const [visual, setVisual] = useState<InspeccionVisualData>(EMPTY_VISUAL);
  const [fisico, setFisico] = useState<FisicoquimicaData>(EMPTY_FISICO);

  React.useEffect(() => {
    // Client-side detection of edit param to avoid Next.js build Suspense errors
    const params = new URLSearchParams(window.location.search);
    const id = params.get("edit");
    if (id) {
      setEditId(id);
      try {
        const data = getLotesLocal();
        const lote: any = data.find((l: any) => l.id === id);
        if (lote) {
          setIdentificacion({
            proveedor: lote.proveedor,
            procedencia: lote.procedencia,
            fecha: lote.fecha,
            hora: lote.hora,
            variedad: lote.variedad,
            peso: lote.peso.toString(),
            codigoLote: lote.codigoLote,
          });
          if (lote.inspeccionVisual) {
            setVisual({
              podredumbre: lote.inspeccionVisual.podredumbre?.toString() || "",
              bayasDaniadas: lote.inspeccionVisual.bayasDaniadas?.toString() || "",
              deshidratacion: lote.inspeccionVisual.deshidratacion?.toString() || "",
              bayasVerdes: lote.inspeccionVisual.bayasVerdes?.toString() || "",
              materiaExtrana: lote.inspeccionVisual.materiaExtrana?.toString() || "",
            });
          }
        }
      } catch (err) {
        console.error("Error cargando lote", err);
      } finally {
        setIsLoaded(true);
      }
    } else {
      setIsLoaded(true);
    }
  }, []);

  const pesoNeto = parseFloat(identificacion.peso) || 0;

  async function handleSave(lote: LoteGuardado): Promise<{ ok: boolean; error?: string }> {
    try {
      saveLoteLocal(lote);
      setTimeout(() => {
        router.push("/reportes");
      }, 2000);
      return { ok: true };
    } catch {
      return { ok: false, error: "Error de almacenamiento. Intente nuevamente." };
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-marine font-bold">Cargando lote...</p>
      </div>
    );
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
          <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start">
            <img src="/images/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold text-marine truncate">
              Recepción y Evaluación de Uva
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium flex-shrink-0 bg-slate-100 px-2.5 py-1 rounded-md">
            Paso {step}/{STEPS.length}
          </span>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-4 overflow-x-auto">
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
          <Paso4Brix
            data={fisico}
            onChange={setFisico}
            onNext={() => setStep(5)}
            onPrev={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <Paso5PH
            data={fisico}
            onChange={setFisico}
            onNext={() => setStep(6)}
            onPrev={() => setStep(4)}
          />
        )}
        {step === 6 && (
          <Paso6DecisionFinal
            identificacion={identificacion}
            visual={visual}
            fisico={fisico}
            pesoNeto={pesoNeto}
            onPrev={() => setStep(5)}
            onSave={handleSave}
            isEditing={!!editId}
          />
        )}
      </div>
    </div>
  );
}
