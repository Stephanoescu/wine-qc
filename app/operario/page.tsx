"use client";

import React, { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { TRANSFER_STEPS, MOCK_ALERT } from "@/lib/mock-data";
import { StepCard, StepDots, ParameterInput } from "@/components/wizard/StepCard";
import { AlertModal } from "@/components/alerts/AlertModal";
import { TopBar } from "@/components/layout/Navigation";

export default function OperarioPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [completed, setCompleted] = useState(false);

  const total = TRANSFER_STEPS.length;
  const step = TRANSFER_STEPS[currentStep - 1];

  const hasInput = step.requiresInput;
  const inputIsOutOfRange =
    hasInput &&
    inputValue !== "" &&
    (parseFloat(inputValue) < step.inputMin! || parseFloat(inputValue) > step.inputMax!);

  const canAdvance = !hasInput || (inputValue !== "" && !inputIsOutOfRange);

  function handleNext() {
    // If this step requires input and value triggers alert
    if (hasInput && inputValue !== "" && parseFloat(inputValue) > step.inputMax!) {
      setShowAlert(true);
      return;
    }

    if (currentStep < total) {
      setCurrentStep((s) => s + 1);
      setInputValue("");
    } else {
      setCompleted(true);
    }
  }

  function handlePrev() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      setInputValue("");
    }
  }

  function handleDismissAlert() {
    setShowAlert(false);
    // After acknowledging alert, move to next step anyway
    if (currentStep < total) {
      setCurrentStep((s) => s + 1);
      setInputValue("");
    } else {
      setCompleted(true);
    }
  }

  if (completed) {
    return (
      <>
        <TopBar title="Vista Operario" />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-6">
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-100 mb-2">¡Procedimiento completado!</h2>
            <p className="text-zinc-400">
              El trasiego ha sido registrado exitosamente en el sistema.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm text-zinc-600">
            <span>Orden de trabajo N° 2024-087</span>
            <span className="font-mono text-zinc-500">Tanque A-04 → Tanque B-12</span>
          </div>
          <button
            onClick={() => { setCurrentStep(1); setCompleted(false); setInputValue(""); }}
            className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-all"
          >
            Iniciar nuevo procedimiento
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Vista Operario" />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold">Trasiego activo</p>
            <p className="text-sm text-zinc-400 mt-0.5 font-mono">A-04 → B-12 · OT N° 2024-087</p>
          </div>
          <StepDots total={total} current={currentStep} />
        </div>

        {/* Step card */}
        <StepCard step={step} current={currentStep} total={total} />

        {/* Parameter input (if required for this step) */}
        {hasInput && (
          <div className="w-full">
            <ParameterInput
              label={step.inputLabel!}
              unit={step.inputUnit!}
              min={step.inputMin!}
              max={step.inputMax!}
              value={inputValue}
              onChange={setInputValue}
              hasError={!!inputIsOutOfRange}
            />
            {inputIsOutOfRange && (
              <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-400">
                  Al confirmar, el sistema generará una alerta de parámetro fuera de rango.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="w-full flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>

          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              inputIsOutOfRange
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : currentStep === total
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-emerald-700 hover:bg-emerald-600 text-white"
            }`}
          >
            {inputIsOutOfRange ? (
              <>
                <AlertTriangle className="w-5 h-5" />
                Confirmar y generar alerta
              </>
            ) : currentStep === total ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Finalizar procedimiento
              </>
            ) : (
              <>
                Confirmar y continuar
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert modal overlay */}
      {showAlert && (
        <AlertModal alert={MOCK_ALERT} onDismiss={handleDismissAlert} />
      )}
    </>
  );
}
