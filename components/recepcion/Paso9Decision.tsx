"use client";

import React from "react";
import { ClipboardCheck, Gavel, ListChecks } from "lucide-react";
import { CHECK_FINAL } from "@/lib/config/recepcion-textos";
import type { EstadoPaso9 } from "@/lib/recepcion/lote";
import type { BorradorLote, EstadoLote, Motivo } from "@/lib/recepcion/tipos";
import { EstadoBadge, ESTILO_ESTADO } from "@/components/lote/EstadoBadge";
import { Aviso, Checklist, FormField, SectionCard, StyledInput, inputBaseClasses } from "./WizardUI";

const DESCRIPCION_ESTADO: Record<EstadoLote, string> = {
  LIBERADO: "Sin observaciones ni parámetros fuera de rango. Requiere disposición firmada con el destino.",
  RETENIDO: "Hay sospecha de contaminación o deterioro, o la evaluación sigue pendiente.",
  RECHAZADO: "Evaluado y el resultado no cambia. Enología confirma y documenta el motivo y el destino.",
};

export function Paso9Decision({
  borrador,
  estado,
  onToggle,
  onDecision,
  errorGuardado,
  onIrAPaso,
}: {
  borrador: BorradorLote;
  estado: EstadoPaso9;
  onToggle: (id: string) => void;
  onDecision: (cambios: Partial<BorradorLote["decision"]>) => void;
  errorGuardado: string | null;
  onIrAPaso: (paso: number) => void;
}) {
  const d = borrador.decision;
  const { elegido } = estado;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Estado sugerido y motivos ── */}
      <SectionCard title="Estado sugerido" subtitle="Calculado a partir de los pasos 3 a 8" icon={ListChecks}>
        <div className="flex flex-col gap-4">
          <EstadoBadge estado={estado.sugerido} grande />
          {estado.motivos.length === 0 ? (
            <Aviso tono="ok" titulo="Sin no conformidades">
              Todas las inspecciones y mediciones están conformes.
            </Aviso>
          ) : (
            <ListaMotivos motivos={estado.motivos} onIrAPaso={onIrAPaso} />
          )}
        </div>
      </SectionCard>

      {/* ── Decisión ── */}
      <SectionCard title="Decisión del lote" subtitle="Elija el estado y complete la firma" icon={Gavel}>
        <div className="flex flex-col gap-5">
          <div role="radiogroup" aria-label="Estado del lote" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["LIBERADO", "RETENIDO", "RECHAZADO"] as const).map((e) => {
              const permitido = estado.permitidos[e];
              const activo = elegido === e;
              return (
                <button
                  key={e}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  disabled={!permitido}
                  onClick={() => onDecision({ estado: e })}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    activo
                      ? `${ESTILO_ESTADO[e].chip} border-current shadow-sm`
                      : permitido
                        ? "bg-white border-slate-200 hover:border-slate-300"
                        : "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <EstadoBadge estado={e} />
                  <p className="text-xs font-medium text-slate-600 mt-2 leading-relaxed">{DESCRIPCION_ESTADO[e]}</p>
                  {!permitido && (
                    <p className="text-xs font-bold text-slate-500 mt-2">
                      {e === "LIBERADO" ? "No disponible: hay no conformidades" : "No disponible: no hay no conformidades"}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {elegido === "LIBERADO" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <p className="sm:col-span-2 text-sm font-bold text-emerald-900">Disposición firmada que autoriza el destino</p>
              <FormField label="Autorizado por" required>
                <StyledInput value={d.nombre} onChange={(e) => onDecision({ nombre: e.target.value })} placeholder="Nombre y apellido" />
              </FormField>
              <FormField label="Destino" required ayuda="Código o tanque">
                <StyledInput value={d.destino} onChange={(e) => onDecision({ destino: e.target.value })} placeholder="Ej.: Tanque T-04" />
              </FormField>
            </div>
          )}

          {elegido === "RETENIDO" && (
            <div className="flex flex-col gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50/40">
              <p className="text-sm font-medium text-amber-900">
                El lote quedará <strong>RETENIDO</strong>. Desde el detalle del lote en Reportes podrá completar los datos
                pendientes y luego liberarlo o rechazarlo con la firma correspondiente.
              </p>
              <div className="sm:max-w-sm">
                <FormField label="Responsable del registro" ayuda="Opcional">
                  <StyledInput value={d.nombre} onChange={(e) => onDecision({ nombre: e.target.value })} placeholder="Nombre y apellido" />
                </FormField>
              </div>
            </div>
          )}

          {elegido === "RECHAZADO" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-red-200 bg-red-50/40">
              <p className="sm:col-span-2 text-sm font-bold text-red-900">Confirmación de Enología</p>
              <FormField label="Confirmado por (Enología)" required>
                <StyledInput value={d.nombre} onChange={(e) => onDecision({ nombre: e.target.value })} placeholder="Nombre y apellido" />
              </FormField>
              <FormField label="Destino" required ayuda="Código, tanque o devolución">
                <StyledInput value={d.destino} onChange={(e) => onDecision({ destino: e.target.value })} placeholder="Ej.: Devolución al proveedor" />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Motivo" required>
                  <textarea
                    rows={3}
                    value={d.motivo}
                    onChange={(e) => onDecision({ motivo: e.target.value })}
                    placeholder="Por qué se rechaza el lote"
                    className={`${inputBaseClasses} resize-y`}
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Lista final ── */}
      <SectionCard title="Lista de verificación final" subtitle="Antes de guardar el lote" icon={ClipboardCheck}>
        <Checklist items={CHECK_FINAL} checks={borrador.checks} onToggle={onToggle} />
      </SectionCard>

      {errorGuardado && (
        <Aviso tono="error" titulo="No se pudo guardar el lote">
          <div className="flex flex-col items-start gap-2">
            <span>{errorGuardado}</span>
            <button type="button" onClick={() => onIrAPaso(1)} className="font-bold text-marine underline">
              Ir al paso 1 para cambiar el código de lote
            </button>
          </div>
        </Aviso>
      )}
    </div>
  );
}

/** Motivos agrupados con el paso en que ocurrieron. */
export function ListaMotivos({ motivos, onIrAPaso }: { motivos: Motivo[]; onIrAPaso?: (paso: number) => void }) {
  return (
    <ul className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
      {motivos.map((m, i) => (
        <li key={i} className="flex items-start gap-3 px-3 py-2.5 bg-white">
          {onIrAPaso ? (
            <button
              type="button"
              onClick={() => onIrAPaso(m.paso)}
              className="flex-shrink-0 text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-marine/10 text-marine hover:bg-marine/20 print:hidden"
              title={`Ir al paso ${m.paso}`}
            >
              Paso {m.paso}
            </button>
          ) : null}
          <span
            className={`flex-shrink-0 text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-marine/10 text-marine ${
              onIrAPaso ? "hidden print:inline" : ""
            }`}
          >
            Paso {m.paso}
          </span>
          <div className="min-w-0 text-sm">
            <span className="font-bold text-marine">{m.parametro}</span>
            {m.tipo === "pendiente" && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                pendiente
              </span>
            )}
            <p className="text-slate-600 font-medium leading-relaxed">{m.detalle}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
