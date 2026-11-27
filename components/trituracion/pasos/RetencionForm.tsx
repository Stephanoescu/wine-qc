"use client";

import React from "react";
import { ROL_ENOLOGIA } from "@/lib/config/roles";
import { faltantesRetencion } from "@/lib/trituracion/proceso";
import type { FirmaRol, Retencion } from "@/lib/trituracion/tipos";
import { Aviso, FormField, NumeroInput, StyledInput, inputBaseClasses } from "@/components/recepcion/WizardUI";
import { CampoFirma } from "@/components/lote/CampoFirma";

/** Firma con la fecha y hora del momento en que se escribe el nombre. */
export function firmar(f: FirmaRol, nombre: string, rol = f.rol): FirmaRol {
  return { nombre, rol, fecha: nombre.trim() ? new Date().toISOString() : "" };
}

const ACCIONES: { v: NonNullable<Retencion["accion"]>; t: string }[] = [
  { v: "revision", t: "Revisión" },
  { v: "ajuste_gap", t: "Ajustar gap" },
  { v: "detener", t: "Detener" },
];

/**
 * Material retenido (actividad 9 o pérdida de identificación): kg y recipientes,
 * corrección, conformidad de Producción y disposición de Calidad o Enología.
 */
export function RetencionForm({
  rt,
  desde,
  onChange,
  onQuitar,
}: {
  rt: Retencion;
  /** Texto «desde el control …» / «desde el inicio del grupo». */
  desde?: string;
  onChange: (fn: (r: Retencion) => Retencion) => void;
  onQuitar?: () => void;
}) {
  const falta = faltantesRetencion(rt);
  const set = (cambios: Partial<Retencion>) => onChange((x) => ({ ...x, ...cambios }));

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 rounded-xl border-2 border-amber-300 bg-amber-50/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black text-amber-900">
          Material RETENIDO {desde ? `· ${desde}` : ""}
        </p>
        {onQuitar && (
          <button type="button" onClick={onQuitar} className="text-xs font-bold text-red-700 hover:underline">
            Quitar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] gap-3">
        <FormField label="kg retenidos" required>
          <NumeroInput unidad="kg" value={rt.kg} onChange={(kg) => set({ kg })} />
        </FormField>
        <FormField label="Recipientes retenidos" required>
          <StyledInput value={rt.recipientes} onChange={(e) => set({ recipientes: e.target.value })} placeholder="Ej.: M-salida-2, M-salida-3" />
        </FormField>
      </div>
      {rt.origen === "perdida_identificacion" && (
        <FormField label="Salida afectada" required>
          <StyledInput value={rt.descripcion} onChange={(e) => set({ descripcion: e.target.value })} placeholder="Qué entró o qué recipiente perdió su identificación" />
        </FormField>
      )}

      {rt.origen === "control" && (
        <>
          <div>
            <p className="text-sm font-bold text-marine-light mb-2">Acción <span className="text-gold-dark">*</span></p>
            <div role="radiogroup" aria-label="Acción" className="grid grid-cols-3 gap-2">
              {ACCIONES.map((a) => (
                <button
                  key={a.v}
                  type="button"
                  role="radio"
                  aria-checked={rt.accion === a.v}
                  onClick={() =>
                    set({
                      accion: a.v,
                      ajusteGap: a.v === "ajuste_gap" ? (rt.ajusteGap ?? { nuevoMm: "", mantenimiento: { nombre: "", rol: "Mantenimiento", fecha: "" } }) : undefined,
                    })
                  }
                  className={`px-3 py-2.5 rounded-xl border-2 text-sm font-bold ${
                    rt.accion === a.v ? "border-marine bg-marine text-white" : "border-slate-200 bg-white text-marine"
                  }`}
                >
                  {a.t}
                </button>
              ))}
            </div>
          </div>
          <FormField label="Corrección" required>
            <textarea
              rows={2}
              value={rt.correccion}
              onChange={(e) => set({ correccion: e.target.value })}
              placeholder="Qué se corrigió antes de repetir el control"
              className={`${inputBaseClasses} resize-y`}
            />
          </FormField>
          {rt.accion === "ajuste_gap" && rt.ajusteGap && (
            <div className="flex flex-col gap-3 p-3 rounded-xl border border-slate-200 bg-white">
              <Aviso tono="info" titulo="El ajuste lo registra Mantenimiento y queda como desviación respecto de la tabla estándar." />
              <div className="sm:max-w-[12rem]">
                <FormField label="Nuevo gap (mm)" required>
                  <NumeroInput unidad="mm" value={rt.ajusteGap.nuevoMm} onChange={(nuevoMm) => set({ ajusteGap: { ...rt.ajusteGap!, nuevoMm } })} />
                </FormField>
              </div>
              <CampoFirma
                etiqueta="Mantenimiento que ajustó"
                nombre={rt.ajusteGap.mantenimiento.nombre}
                rol="Mantenimiento"
                rolFijo="Mantenimiento"
                onNombre={(n) => set({ ajusteGap: { ...rt.ajusteGap!, mantenimiento: firmar(rt.ajusteGap!.mantenimiento, n, "Mantenimiento") } })}
              />
            </div>
          )}
        </>
      )}

      <CampoFirma
        etiqueta="Conformidad de Producción"
        nombre={rt.conformidadProduccion.nombre}
        rol="Producción"
        rolFijo="Producción"
        onNombre={(n) => set({ conformidadProduccion: firmar(rt.conformidadProduccion, n, "Producción") })}
      />

      <div className="flex flex-col gap-3 p-3 rounded-xl border border-slate-200 bg-white">
        <p className="text-sm font-bold text-marine">Disposición de Calidad o Enología para el material retenido</p>
        <div role="radiogroup" aria-label="Decisión" className="grid grid-cols-2 gap-2">
          {(
            [
              ["autorizar_entrega", "Autorizar entrega", "border-emerald-400 bg-emerald-50 text-emerald-800"],
              ["no_entregar", "No entregar", "border-red-400 bg-red-50 text-red-800"],
            ] as const
          ).map(([v, t, cls]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={rt.disposicion.decision === v}
              onClick={() => set({ disposicion: { ...rt.disposicion, decision: v } })}
              className={`px-3 py-2.5 rounded-xl border-2 text-sm font-bold ${rt.disposicion.decision === v ? cls : "border-slate-200 bg-white text-slate-500"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <FormField label="Disposición" required>
          <StyledInput
            value={rt.disposicion.texto}
            onChange={(e) => set({ disposicion: { ...rt.disposicion, texto: e.target.value } })}
            placeholder="Destino o tratamiento del material retenido"
          />
        </FormField>
        <CampoFirma
          etiqueta="Dispuesto por"
          nombre={rt.disposicion.firma.nombre}
          rol={ROL_ENOLOGIA}
          rolFijo={ROL_ENOLOGIA}
          onNombre={(n) => set({ disposicion: { ...rt.disposicion, firma: firmar(rt.disposicion.firma, n, ROL_ENOLOGIA) } })}
        />
      </div>

      {falta.length > 0 && <p className="text-xs font-medium text-amber-900">Falta: {falta.join(", ")}.</p>}
    </div>
  );
}
