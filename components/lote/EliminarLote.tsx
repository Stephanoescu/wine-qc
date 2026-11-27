"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, Trash2, X } from "lucide-react";
import { deleteLote, normalizarCodigo } from "@/lib/recepcion/almacen";
import { descargarRespaldo } from "@/lib/recepcion/respaldo";
import type { LoteAlmacenado } from "@/lib/recepcion/tipos";
import { Aviso, FormField, StyledInput, inputBaseClasses } from "@/components/recepcion/WizardUI";

/**
 * Confirmación para eliminar un lote: ofrece exportarlo antes y exige
 * escribir su código y un motivo (que queda en la bitácora de eliminaciones).
 */
export function DialogoEliminarLote({
  lote,
  onCancelar,
  onEliminado,
}: {
  lote: LoteAlmacenado;
  onCancelar: () => void;
  onEliminado: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [exportando, setExportando] = useState(false);
  const [exportado, setExportado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const primerCampo = useRef<HTMLButtonElement>(null);

  // El foco entra al diálogo solo al abrir.
  useEffect(() => {
    primerCampo.current?.focus();
  }, []);

  // Escape cierra.
  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelar();
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [onCancelar]);

  const codigoOk = normalizarCodigo(codigo) === normalizarCodigo(lote.codigoLote);
  const puede = codigoOk && motivo.trim() !== "";

  async function exportar() {
    setExportando(true);
    setError(null);
    try {
      await descargarRespaldo(lote);
      setExportado(true);
    } catch {
      setError("No se pudo exportar el respaldo del lote.");
    } finally {
      setExportando(false);
    }
  }

  function eliminar() {
    if (!puede) return;
    const r = deleteLote(lote.id, motivo, new Date().toISOString());
    if (r.ok) onEliminado();
    else setError(r.error);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-marine-dark/50 backdrop-blur-sm sm:p-4 print:hidden"
      onClick={onCancelar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-eliminar"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-red-50">
          <div>
            <h2 id="titulo-eliminar" className="text-base font-black text-red-800">
              Eliminar lote
            </h2>
            <p className="font-mono text-sm font-bold text-marine mt-0.5 break-all">{lote.codigoLote}</p>
          </div>
          <button type="button" onClick={onCancelar} className="p-1.5 rounded-lg text-slate-500 hover:bg-white" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            Se borrarán el lote y sus fotos de este dispositivo. Esta acción no se puede deshacer.
          </p>

          {/* Paso 1: respaldo opcional */}
          <div className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-sm font-bold text-marine">1. Antes de borrar (recomendado)</p>
            <p className="text-xs font-medium text-slate-600">
              Descargue un respaldo de este lote. Podrá restaurarlo con «Importar respaldo» en Reportes.
            </p>
            <button
              ref={primerCampo}
              type="button"
              onClick={exportar}
              disabled={exportando}
              className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-marine hover:bg-slate-50 disabled:opacity-50"
            >
              {exportando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : exportado ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exportado ? "Respaldo descargado" : "Exportar este lote (JSON)"}
            </button>
          </div>

          {/* Paso 2: confirmación */}
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold text-marine">2. Confirme la eliminación</p>
            <FormField
              label="Escriba el código del lote"
              required
              error={codigo.trim() && !codigoOk ? "El código no coincide" : undefined}
              ayuda={`Debe coincidir con ${lote.codigoLote}`}
            >
              <StyledInput
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder={lote.codigoLote}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="font-mono"
              />
            </FormField>
            <FormField label="Motivo de la eliminación" required ayuda="Queda registrado en la bitácora de eliminaciones">
              <textarea
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej.: registro duplicado, lote de prueba"
                className={`${inputBaseClasses} resize-y`}
              />
            </FormField>
          </div>

          {error && <Aviso tono="error" titulo={error} />}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="px-5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={eliminar}
              disabled={!puede}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-red-600 border border-red-700 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar definitivamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
