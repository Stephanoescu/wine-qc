"use client";

import React from "react";
import { CheckSquare, FilePen, ListChecks, Square } from "lucide-react";
import type { ResultadoEdicion } from "@/lib/recepcion/edicion";
import type { BorradorLote, LoteV2 } from "@/lib/recepcion/tipos";
import { EstadoBadge } from "@/components/lote/EstadoBadge";
import { CampoFirma } from "@/components/lote/CampoFirma";
import { BloquePesoDisponible } from "@/components/lote/PesoDisponible";
import { FormularioFirmaDecision, ListaMotivos } from "./Paso9Decision";
import { Aviso, FormField, SectionCard, inputBaseClasses } from "./WizardUI";

export type DatosEdicion = NonNullable<BorradorLote["edicion"]>;

/** Paso 9 en modo edición: resumen de cambios, consecuencias y firma de quien edita. */
export function Paso9Edicion({
  borrador,
  antes,
  vista,
  trituracionVinculada,
  onDecision,
  onEdicion,
  onIrAPaso,
  errorGuardado,
}: {
  borrador: BorradorLote;
  antes: LoteV2;
  vista: ResultadoEdicion;
  trituracionVinculada: boolean;
  onDecision: (cambios: Partial<BorradorLote["decision"]>) => void;
  onEdicion: (cambios: Partial<DatosEdicion>) => void;
  onIrAPaso: (paso: number) => void;
  errorGuardado: string | null;
}) {
  const e = borrador.edicion ?? { por: "", rol: "", motivo: "", trituracionInformada: false };
  const { lote, cambios } = vista;
  const sinMotivos = lote.motivos.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Resumen de cambios" subtitle="Comparado con el informe guardado" icon={FilePen}>
        {cambios.length === 0 ? (
          <Aviso tono="info" titulo="Aún no hay cambios">
            Vaya al paso que quiere corregir con la barra de pasos o con «Atrás».
          </Aviso>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="px-3 py-2">Campo</th>
                  <th className="px-3 py-2">Anterior</th>
                  <th className="px-3 py-2">Nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cambios.map((c) => (
                  <tr key={c.campo}>
                    <td className="px-3 py-2 font-bold text-marine">{c.campo}</td>
                    <td className="px-3 py-2 text-slate-500 line-through decoration-slate-300">{c.anterior}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{c.nuevo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Consecuencias sobre el estado */}
      <SectionCard title="Estado del lote" subtitle="Se recalcula con los datos editados" icon={ListChecks}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <EstadoBadge estado={antes.estado} />
            <span className="text-slate-400 font-bold">→</span>
            <EstadoBadge estado={lote.estado} />
          </div>
          {vista.retenidoPorEdicion && (
            <Aviso tono="alerta" titulo="El lote pasará de LIBERADO a RETENIDO por edición posterior">
              La edición genera una no conformidad nueva. Se quitará la disposición vigente y hará falta una nueva
              decisión firmada desde el detalle del lote.
            </Aviso>
          )}
          {antes.estado === "RETENIDO" && sinMotivos && (
            <Aviso tono="ok" titulo="Ya no hay no conformidades">
              El lote sigue RETENIDO; desde el detalle podrá liberarlo con disposición firmada.
            </Aviso>
          )}
          {antes.estado === "RECHAZADO" && (
            <Aviso tono="info" titulo="El lote sigue RECHAZADO">
              La edición corrige los datos registrados; la decisión de Enología se mantiene.
            </Aviso>
          )}
          {lote.motivos.length > 0 && <ListaMotivos motivos={lote.motivos} onIrAPaso={onIrAPaso} />}
        </div>
      </SectionCard>

      <BloquePesoDisponible netoTotal={lote.pesado.pesoNetoTotal} peso={lote.pesoDisponible} />

      {/* Firmas vigentes (si la edición no retiene el lote) */}
      {!vista.retenidoPorEdicion && (
        <SectionCard title="Firmas y destino" subtitle="Corrija si hace falta" icon={FilePen}>
          <FormularioFirmaDecision
            estado={antes.estado}
            decision={borrador.decision}
            onDecision={onDecision}
            enologia={antes.liberadoConObservaciones}
          />
        </SectionCard>
      )}

      {/* Firma de la edición */}
      <SectionCard title="Firma de la edición" subtitle="Queda en la bitácora de cambios, que no se puede editar" icon={FilePen}>
        <div className="flex flex-col gap-4">
          <CampoFirma
            etiqueta="Editado por"
            nombre={e.por}
            rol={e.rol}
            onNombre={(por) => onEdicion({ por })}
            onRol={(rol) => onEdicion({ rol })}
          />
          <FormField label="Motivo de la edición" required>
            <textarea
              rows={3}
              value={e.motivo}
              onChange={(ev) => onEdicion({ motivo: ev.target.value })}
              placeholder="Ej.: error de transcripción de la lectura de pH"
              className={`${inputBaseClasses} resize-y`}
            />
          </FormField>
          {trituracionVinculada && vista.cambiaPesoDisponible && (
            <button
              type="button"
              role="checkbox"
              aria-checked={e.trituracionInformada}
              onClick={() => onEdicion({ trituracionInformada: !e.trituracionInformada })}
              className="flex items-start gap-3 text-left p-3 rounded-xl border border-amber-300 bg-amber-50"
            >
              {e.trituracionInformada ? (
                <CheckSquare className="w-5 h-5 text-marine flex-shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-amber-900">
                El peso disponible cambia y este lote ya tiene un registro de Trituración. Confirmo que Trituración fue
                informada del cambio.
              </span>
            </button>
          )}
        </div>
      </SectionCard>

      {errorGuardado && <Aviso tono="error" titulo="No se pudo guardar la edición">{errorGuardado}</Aviso>}
    </div>
  );
}
