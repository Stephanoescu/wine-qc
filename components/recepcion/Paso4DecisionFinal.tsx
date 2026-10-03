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
    border: "border-emerald-600/40",
    bg: "from-emerald-950/60 to-stone-900",
    iconBg: "bg-emerald-600/20 border-emerald-600/40",
    textColor: "text-emerald-400",
    accentBar: "bg-emerald-500",
    Icon: CheckCircle2,
    action: "Lote aprobado. Proceder al descargue y procesamiento.",
  },
  B: {
    label: "Categoría B",
    sublabel: "Observado — Segregar para evaluación adicional",
    border: "border-amber-500/40",
    bg: "from-amber-950/40 to-stone-900",
    iconBg: "bg-amber-500/20 border-amber-500/40",
    textColor: "text-amber-400",
    accentBar: "bg-amber-500",
    Icon: AlertTriangle,
    action: "Segregar lote. Informar al enólogo. Evaluar si puede ser procesado con restricciones.",
  },
  C: {
    label: "Categoría C",
    sublabel: "No liberado — Rechazar o devolver",
    border: "border-red-600/40",
    bg: "from-red-950/40 to-stone-900",
    iconBg: "bg-red-600/20 border-red-600/40",
    textColor: "text-red-400",
    accentBar: "bg-red-600",
    Icon: XCircle,
    action: "Rechazar lote. No procesar. Notificar al proveedor y documentar la no conformidad.",
  },
};

// ── Classification rule summary ──────────────────────
function ClasificacionReglas({ noConformeVisualCount }: { noConformeVisualCount: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
        Criterios de clasificación visual
      </p>
      {[
        { rango: "0 parámetros NC", cat: "A", color: "text-emerald-400 bg-emerald-900/20 border-emerald-700/30", active: noConformeVisualCount === 0 },
        { rango: "1–2 parámetros NC", cat: "B", color: "text-amber-400 bg-amber-900/20 border-amber-700/30", active: noConformeVisualCount === 1 || noConformeVisualCount === 2 },
        { rango: "3 o más parámetros NC", cat: "C", color: "text-red-400 bg-red-900/20 border-red-700/30", active: noConformeVisualCount >= 3 },
      ].map((r) => (
        <div
          key={r.rango}
          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${r.active ? r.color : "text-stone-600 bg-stone-800/30 border-stone-700/20"}`}
        >
          <span>{r.rango}</span>
          <span className={`font-bold ${r.active ? "" : "text-stone-700"}`}>→ Cat. {r.cat}</span>
          {r.active && <div className="w-1.5 h-1.5 rounded-full bg-current ml-1" />}
        </div>
      ))}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-stone-800/60 last:border-0">
      <span className="text-xs text-stone-500">{label}</span>
      <span className="text-sm font-medium text-stone-200 text-right max-w-[60%]">{value}</span>
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
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-600/15 border border-emerald-600/30">
          <Save className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-stone-100">Lote guardado exitosamente</h2>
          <p className="text-stone-400 mt-2">
            El lote{" "}
            <span className="font-mono text-amber-400">{identificacion.codigoLote}</span> fue
            registrado como{" "}
            <span className={`font-bold ${cfg?.textColor}`}>Categoría {categoria}</span>.
          </p>
        </div>
        <p className="text-xs text-stone-600">El formulario se reiniciará en unos segundos...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Category result */}
      {cfg && (
        <div className={`relative rounded-2xl border bg-gradient-to-br ${cfg.bg} ${cfg.border} overflow-hidden`}>
          <div className={`absolute top-0 left-0 right-0 h-1 ${cfg.accentBar}`} />
          <div className="p-7 flex flex-col gap-5 mt-1">
            {/* Icon + title */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-14 h-14 rounded-2xl border ${cfg.iconBg}`}>
                <CatIcon className={`w-7 h-7 ${cfg.textColor}`} strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Award className={`w-4 h-4 ${cfg.textColor}`} />
                  <h2 className={`text-xl font-extrabold ${cfg.textColor}`}>{cfg.label}</h2>
                </div>
                <p className="text-sm text-stone-400 mt-0.5">{cfg.sublabel}</p>
              </div>
            </div>

            {/* Action */}
            <div className={`flex items-start gap-2 p-4 rounded-xl border ${cfg.border} bg-stone-900/40`}>
              <ChevronRight className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.textColor}`} />
              <p className="text-sm text-stone-300">{cfg.action}</p>
            </div>

            {/* Observations */}
            {observaciones.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Parámetros fuera de rango detectados ({observaciones.length})
                </p>
                <ul className="flex flex-col gap-1.5">
                  {observaciones.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-400">
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.accentBar}`} />
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {observaciones.length === 0 && (
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Todos los parámetros dentro del rango aceptable.
              </p>
            )}

            {/* Classification rules mini table */}
            <ClasificacionReglas noConformeVisualCount={noConformeVisualCount} />
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-800">
          <h3 className="text-sm font-semibold text-stone-300">Resumen del lote</h3>
        </div>
        <div className="px-5 py-4">
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
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-900/20 border border-red-700/40">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Error al guardar</p>
            <p className="text-sm text-red-400 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      <NavButtons
        onPrev={onPrev}
        onNext={handleSave}
        nextLabel={saving ? "Guardando..." : "Guardar Lote"}
        isLastStep
        prevLabel="Revisar datos"
        disabledNext={saving}
      />
      {saving && (
        <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Guardando en el sistema...
        </div>
      )}
    </div>
  );
}
