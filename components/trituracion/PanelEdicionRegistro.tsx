"use client";

import React from "react";
import { FilePen } from "lucide-react";
import type { Rol } from "@/lib/config/roles";
import type { CambioSinFirma } from "@/lib/recepcion/lote";
import type { RegistroTrituracion } from "@/lib/trituracion/tipos";
import { Aviso, FormField, SectionCard, inputBaseClasses } from "@/components/recepcion/WizardUI";
import { CampoFirma } from "@/components/lote/CampoFirma";
import { EstadoRegistroBadge } from "./EstadoRegistroBadge";

export interface FirmaEdicion {
  por: string;
  rol: Rol | "";
  motivo: string;
}

/** Resumen de cambios y firma de quien edita el informe de trituración. */
export function PanelEdicionRegistro({
  cambios,
  antes,
  despues,
  firma,
  onFirma,
}: {
  cambios: CambioSinFirma[];
  antes: RegistroTrituracion;
  despues: RegistroTrituracion;
  firma: FirmaEdicion;
  onFirma: (f: FirmaEdicion) => void;
}) {
  return (
    <SectionCard title="Edición del informe" subtitle="Los cambios quedan en la bitácora, que no se puede editar" icon={FilePen}>
      <div className="flex flex-col gap-4">
        {cambios.length === 0 ? (
          <Aviso tono="info" titulo="Aún no hay cambios">
            Use la barra de pasos para ir a la sección que quiere corregir.
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
        {antes.estado !== despues.estado && (
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
            El estado cambia: <EstadoRegistroBadge estado={antes.estado} /> → <EstadoRegistroBadge estado={despues.estado} />
          </div>
        )}
        <CampoFirma
          etiqueta="Editado por"
          nombre={firma.por}
          rol={firma.rol}
          onNombre={(por) => onFirma({ ...firma, por })}
          onRol={(rol) => onFirma({ ...firma, rol })}
        />
        <FormField label="Motivo de la edición" required>
          <textarea
            rows={3}
            value={firma.motivo}
            onChange={(e) => onFirma({ ...firma, motivo: e.target.value })}
            className={`${inputBaseClasses} resize-y`}
            placeholder="Por qué se reemplaza la información"
          />
        </FormField>
      </div>
    </SectionCard>
  );
}
