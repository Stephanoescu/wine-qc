"use client";

import React from "react";
import { Cog, Plus, Trash2, Wrench } from "lucide-react";
import { AVISO_ANOMALIA, AVISO_DEPOSITO, CHECK_ACT2, PREGUNTA_ANOMALIA } from "@/lib/config/trituracion-textos";
import { horaLocalAhora, nuevoId } from "@/lib/recepcion/borrador";
import type { Incidencia, RegistroTrituracion } from "@/lib/trituracion/tipos";
import { Aviso, Checklist, FormField, SectionCard, SiNo, StyledInput } from "@/components/recepcion/WizardUI";
import type { Cambiar } from "../AsistenteTrituracion";

/** Paso 2 — Introducir los racimos y recoger las bayas (actividad 2). */
export function Paso2Despalillar({ r, onToggle, cambiar }: { r: RegistroTrituracion; onToggle: (id: string) => void; cambiar: Cambiar }) {
  const d = r.despalillado;
  const setD = (fn: (d: RegistroTrituracion["despalillado"]) => RegistroTrituracion["despalillado"]) =>
    cambiar((x) => ({ ...x, despalillado: fn(x.despalillado) }));
  const nueva = (): Incidencia => ({ id: nuevoId(), hora: horaLocalAhora(), descripcion: "", mantenimiento: "" });
  const setInc = (id: string, cambios: Partial<Incidencia>) =>
    setD((x) => ({ ...x, incidencias: x.incidencias.map((i) => (i.id === id ? { ...i, ...cambios } : i)) }));

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="2. Introducir los racimos y recoger las bayas" subtitle="Racimos → despalilladora → depósito UVA DESPALILLADA" icon={Cog}>
        <div className="flex flex-col gap-4">
          <Checklist items={CHECK_ACT2} checks={r.checks} onToggle={onToggle} />
          <Aviso tono="info" titulo={AVISO_DEPOSITO} />
        </div>
      </SectionCard>

      <SectionCard title="Funcionamiento del equipo" subtitle="Registro de incidencias" icon={Wrench}>
        <div className="flex flex-col gap-4">
          <SiNo
            pregunta={PREGUNTA_ANOMALIA}
            value={d.anomalia}
            onChange={(anomalia) =>
              setD((x) => ({ ...x, anomalia, incidencias: anomalia && x.incidencias.length === 0 ? [nueva()] : x.incidencias }))
            }
          />
          {d.anomalia && (
            <>
              <Aviso tono="error" titulo={AVISO_ANOMALIA} />
              {d.incidencias.map((i, n) => (
                <div key={i.id} className="rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-marine">Incidencia {n + 1}</p>
                    <button
                      type="button"
                      onClick={() => setD((x) => ({ ...x, incidencias: x.incidencias.filter((y) => y.id !== i.id) }))}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600"
                      aria-label={`Quitar incidencia ${n + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[9rem_minmax(0,1fr)] gap-3">
                    <FormField label="Hora" required>
                      <StyledInput type="time" value={i.hora} onChange={(e) => setInc(i.id, { hora: e.target.value })} />
                    </FormField>
                    <FormField label="Descripción" required>
                      <StyledInput value={i.descripcion} onChange={(e) => setInc(i.id, { descripcion: e.target.value })} placeholder="Ej.: atasco en la tolva de entrada" />
                    </FormField>
                  </div>
                  <FormField label="Mantenimiento interviene" required>
                    <StyledInput value={i.mantenimiento} onChange={(e) => setInc(i.id, { mantenimiento: e.target.value })} placeholder="Nombre de quien interviene" />
                  </FormField>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setD((x) => ({ ...x, incidencias: [...x.incidencias, nueva()] }))}
                className="self-start flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold text-marine hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" /> Otra incidencia
              </button>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
