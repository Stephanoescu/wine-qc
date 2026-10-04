"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  ChevronRight,
  Award,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type {
  IdentificacionData,
  InspeccionVisualData,
  FisicoquimicaData,
  Categoria,
  LoteGuardado,
} from "@/lib/recepcion-data";
import { evaluarCategoria } from "@/lib/recepcion-data";
import { NavButtons } from "./WizardUI";

interface Paso4Props {
  identificacion: IdentificacionData;
  visual: InspeccionVisualData;
  fisico: FisicoquimicaData;
  pesoNeto: number;
  onPrev: () => void;
  onSave: (lote: LoteGuardado) => Promise<{ ok: boolean; error?: string }>;
  isEditing?: boolean;
}

const CAT_CONFIG: Record<
  NonNullable<Categoria>,
  {
    label: string;
    sublabel: string;
    border: string;
    bg: string;
    iconBg: string;
    textColor: string;
    accentBar: string;
    Icon: React.ElementType;
    action: string;
  }
> = {
  A: {
    label: "Categoría A",
    sublabel: "Conforme — Liberado para proceso",
    border: "border-emerald-200",
    bg: "bg-gradient-to-br from-emerald-50 to-white",
    iconBg: "bg-emerald-100 border-emerald-200",
    textColor: "text-emerald-700",
    accentBar: "bg-emerald-500",
    Icon: CheckCircle2,
    action: "Lote aprobado. Proceder al descargue y procesamiento.",
  },
  B: {
    label: "Categoría B",
    sublabel: "Observado — Segregar para evaluación adicional",
    border: "border-amber-200",
    bg: "bg-gradient-to-br from-amber-50 to-white",
    iconBg: "bg-amber-100 border-amber-200",
    textColor: "text-amber-700",
    accentBar: "bg-amber-500",
    Icon: AlertTriangle,
    action: "Segregar lote. Informar al enólogo. Evaluar si puede ser procesado con restricciones.",
  },
  C: {
    label: "Categoría C",
    sublabel: "No liberado — Rechazar o devolver",
    border: "border-red-200",
    bg: "bg-gradient-to-br from-red-50 to-white",
    iconBg: "bg-red-100 border-red-200",
    textColor: "text-red-700",
    accentBar: "bg-red-500",
    Icon: XCircle,
    action: "Rechazar lote. No procesar. Notificar al proveedor y documentar la no conformidad.",
  },
};

// ── Classification rule summary ──────────────────────
function ClasificacionReglas({ categoria }: { categoria: Categoria }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        Criterios de clasificación global
      </p>
      {[
        { rango: "0 parámetros visuales NC + Fisicoquímica conforme", cat: "A", color: "text-emerald-800 bg-emerald-100 border-emerald-200 font-bold", active: categoria === "A" },
        { rango: "1–2 parámetros visuales NC", cat: "B", color: "text-amber-800 bg-amber-100 border-amber-200 font-bold", active: categoria === "B" },
        { rango: "≥ 3 parámetros visuales NC o Fisicoquímica NC", cat: "C", color: "text-red-800 bg-red-100 border-red-200 font-bold", active: categoria === "C" },
      ].map((r) => (
        <div
          key={r.rango}
          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs shadow-sm ${r.active ? r.color : "text-slate-500 bg-slate-50 border-slate-200"}`}
        >
          <span>{r.rango}</span>
          <span className={`font-bold ${r.active ? "" : "text-slate-400"}`}>→ Cat. {r.cat}</span>
          {r.active && <div className="w-1.5 h-1.5 rounded-full bg-current ml-1" />}
        </div>
      ))}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-marine text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function Paso4DecisionFinal({
  identificacion,
  visual,
  fisico,
  pesoNeto,
  onPrev,
  onSave,
  isEditing,
}: Paso4Props) {
  const { categoria, observaciones, brixPromedio, phPromedio, noConformeVisualCount } =
    evaluarCategoria(visual, fisico, pesoNeto);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const cfg = categoria ? CAT_CONFIG[categoria] : null;
  const CatIcon = cfg?.Icon ?? CheckCircle2;

  async function handleSave() {
    setSaving(true);
    setApiError(null);

    const lote: LoteGuardado = {
      id: Date.now().toString(),
      codigoLote: identificacion.codigoLote,
      proveedor: identificacion.proveedor,
      variedad: identificacion.variedad,
      procedencia: identificacion.procedencia,
      fecha: identificacion.fecha,
      hora: identificacion.hora,
      peso: parseFloat(identificacion.peso),
      brixPromedio: parseFloat(brixPromedio.toFixed(2)),
      phPromedio: parseFloat(phPromedio.toFixed(3)),
      categoria,
      observaciones,
      inspeccionVisual: {
        podredumbre: parseFloat(visual.podredumbre) || 0,
        bayasDaniadas: parseFloat(visual.bayasDaniadas) || 0,
        deshidratacion: parseFloat(visual.deshidratacion) || 0,
        bayasVerdes: parseFloat(visual.bayasVerdes) || 0,
        materiaExtrana: parseFloat(visual.materiaExtrana) || 0,
      },
    };

    const result = await onSave(lote);
    setSaving(false);

    if (result.ok) {
      setSaved(true);
    } else {
      setApiError(result.error ?? "Error desconocido al guardar");
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 border border-emerald-200">
          <Save className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-marine">Lote guardado exitosamente</h2>
          <p className="text-slate-500 mt-2 font-medium">
            El lote{" "}
            <span className="font-mono text-marine font-bold">{identificacion.codigoLote}</span> fue
            registrado como{" "}
            <span className={`font-black ${cfg?.textColor}`}>Categoría {categoria}</span>.
          </p>
        </div>
        <p className="text-xs text-slate-400 font-medium">El formulario se reiniciará en unos segundos...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Category result */}
      {cfg && (
        <div className={`relative rounded-2xl border ${cfg.bg} ${cfg.border} overflow-hidden shadow-sm`}>
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${cfg.accentBar}`} />
          <div className="p-7 flex flex-col gap-5 mt-1">
            {/* Icon + title */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-14 h-14 rounded-2xl border shadow-sm ${cfg.iconBg}`}>
                <CatIcon className={`w-7 h-7 ${cfg.textColor}`} strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Award className={`w-4 h-4 ${cfg.textColor}`} />
                  <h2 className={`text-xl font-black tracking-tight ${cfg.textColor}`}>{cfg.label}</h2>
                </div>
                <p className="text-sm text-slate-600 font-medium mt-0.5">{cfg.sublabel}</p>
              </div>
            </div>

            {/* Action */}
            <div className={`flex items-start gap-2 p-4 rounded-xl border bg-white shadow-sm ${cfg.border}`}>
              <ChevronRight className={`w-5 h-5 mt-0 flex-shrink-0 ${cfg.textColor}`} />
              <p className="text-sm text-marine font-bold">{cfg.action}</p>
            </div>

            {/* Observations */}
            {observaciones.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Parámetros fuera de rango detectados ({observaciones.length})
                </p>
                <ul className="flex flex-col gap-2">
                  {observaciones.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.accentBar}`} />
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {observaciones.length === 0 && (
              <p className="text-sm text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Todos los parámetros dentro del rango aceptable.
              </p>
            )}

            {/* Classification rules mini table */}
            <ClasificacionReglas categoria={categoria} />
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-marine">Resumen del lote</h3>
        </div>
        <div className="px-6 py-4">
          <SummaryItem label="Código de lote" value={identificacion.codigoLote} />
          <SummaryItem label="Proveedor" value={identificacion.proveedor} />
          <SummaryItem label="Procedencia" value={identificacion.procedencia} />
          <SummaryItem label="Variedad" value={identificacion.variedad} />
          <SummaryItem label="Fecha / Hora" value={`${identificacion.fecha}  ${identificacion.hora}`} />
          <SummaryItem label="Peso neto" value={`${identificacion.peso} kg`} />
          <SummaryItem label="°Brix promedio" value={`${brixPromedio.toFixed(2)} °Bx`} />
          <SummaryItem label="pH promedio" value={phPromedio.toFixed(3)} />
          <SummaryItem label="Parámetros visuales NC" value={`${noConformeVisualCount} / 5`} />
        </div>
      </div>

      {/* API error */}
      {apiError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Error al guardar</p>
            <p className="text-sm text-red-600 mt-0.5 font-medium">{apiError}</p>
          </div>
        </div>
      )}

      <NavButtons
        onPrev={onPrev}
        onNext={handleSave}
        nextLabel={saving ? "Guardando..." : (isEditing ? "Actualizar Lote" : "Guardar Lote")}
        isLastStep
        prevLabel="Revisar datos"
        disabledNext={saving}
      />
      {saving && (
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-marine">
          <Loader2 className="w-4 h-4 animate-spin text-gold" />
          {isEditing ? "Actualizando en el sistema..." : "Guardando en el sistema..."}
        </div>
      )}
    </div>
  );
}
