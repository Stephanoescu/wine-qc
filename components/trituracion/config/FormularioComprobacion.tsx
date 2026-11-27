"use client";

import React, { useState } from "react";
import { ClipboardCheck, FlaskConical, Plus, Ruler, Trash2 } from "lucide-react";
import { GRUPOS, LIMITES_TRITURACION, MASA_PORCION_COMPROBACION_KG, type Grupo } from "@/lib/config/trituracion";
import {
  CHECK_ANEXO_B1,
  CHECK_ANEXO_B2,
  DEFINICION_GRUPOS,
  INSTRUCCION_ANEXO_B3,
  INSTRUCCION_ANEXO_B4,
  NOTA_ANEXO_B3,
  NOTA_ANEXO_B4,
  NOTA_ANEXO_B5,
  RESULTADO_ANEXO_B1,
  RESULTADO_ANEXO_B2,
} from "@/lib/config/trituracion-textos";
import { nuevoId } from "@/lib/recepcion/borrador";
import { formatear, validarNumero } from "@/lib/recepcion/validacion";
import { controlVacio, evaluarControl } from "@/lib/trituracion/control";
import { saveComprobacion } from "@/lib/trituracion/config-gaps";
import { escribirFirma, sellarFirmas } from "@/lib/trituracion/firmas";
import type { ComprobacionInicial, ControlApertura, IntentoComprobacion } from "@/lib/trituracion/tipos";
import { Aviso, Checklist, FormField, Interruptor, NumeroInput, SectionCard, SiNo, StyledInput, inputBaseClasses } from "@/components/recepcion/WizardUI";
import { CampoFirma } from "@/components/lote/CampoFirma";
import { BadgeResultadoControl, ControlAperturaForm } from "../ControlAperturaForm";

function intentoNuevo(previo?: IntentoComprobacion, gapInicial?: { gapRealMm: string; posicion: string }): IntentoComprobacion {
  return {
    id: nuevoId(),
    gapMm: previo?.gapMm ?? gapInicial?.gapRealMm ?? "",
    posicion: previo?.posicion ?? gapInicial?.posicion ?? "",
    condicionAnterior: "",
    condicionNueva: "",
    control: controlVacio(nuevoId(), "comprobacion"),
    disposicionPorciones: "",
  };
}

/** Faltantes para guardar la comprobación (se puede guardar incompleta como borrador). */
function faltantes(c: ComprobacionInicial): string[] {
  const f: string[] = [];
  if (!c.fecha) f.push("Indique la fecha");
  if (c.noAplica) return f;
  const g = c.gapInicial;
  if (validarNumero(g.gapRealMm, LIMITES_TRITURACION.gapMm).valor === null) f.push("Gap real inicial");
  if (!g.posicion.trim()) f.push("Posición de referencia");
  if (validarNumero(g.masaKg, LIMITES_TRITURACION.masaPorcionKg).valor === null) f.push("Masa de la porción");
  if (g.alimentacionEstable === null) f.push("¿Alimentación estable?");
  if (!g.mantenimiento.nombre.trim()) f.push("Mantenimiento responsable");
  return f;
}

/** Registro D: comprobación inicial del gap de un grupo (Anexo B 1–4). */
export function FormularioComprobacion({
  inicial,
  soloLectura,
  onGuardada,
  onCancelar,
}: {
  inicial: ComprobacionInicial;
  soloLectura: boolean;
  onGuardada: () => void;
  onCancelar: () => void;
}) {
  const [c, setC] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const set = (cambios: Partial<ComprobacionInicial>) => setC((x) => ({ ...x, ...cambios }));
  const setGap = (cambios: Partial<ComprobacionInicial["gapInicial"]>) =>
    setC((x) => ({ ...x, gapInicial: { ...x.gapInicial, ...cambios } }));
  const setIntento = (id: string, cambios: Partial<IntentoComprobacion>) =>
    setC((x) => ({ ...x, intentos: x.intentos.map((i) => (i.id === id ? { ...i, ...cambios } : i)) }));
  const setControl = (id: string, cambios: Partial<ControlApertura>) =>
    setC((x) => ({ ...x, intentos: x.intentos.map((i) => (i.id === id ? { ...i, control: { ...i.control, ...cambios } } : i)) }));
  const alternar = (id: string) => setC((x) => ({ ...x, checks: { ...x.checks, [id]: !x.checks[id] } }));

  const f = faltantes(c);

  function guardar() {
    if (soloLectura) return;
    if (f.length) {
      setError(`Complete: ${f.join(", ")}`);
      return;
    }
    const ahora = new Date().toISOString();
    // Guardar confirma la firma de Mantenimiento (fecha y hora de la confirmación).
    const r = saveComprobacion(sellarFirmas({ ...c, updatedAt: ahora }, ahora));
    if (r.ok) onGuardada();
    else setError(r.error);
  }

  return (
    <div className="flex flex-col gap-6">
      {soloLectura && (
        <Aviso tono="info" titulo="Comprobación usada en una versión aprobada">
          Es de solo lectura. Para cambiar un gap, registre una comprobación nueva y apruebe otra versión de la tabla.
        </Aviso>
      )}

      <SectionCard title="Registro D · Comprobación inicial" subtitle="Una comprobación por grupo" icon={ClipboardCheck}>
        <fieldset disabled={soloLectura} className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-bold text-marine-light mb-2">Grupo</p>
            <div role="radiogroup" aria-label="Grupo" className="grid grid-cols-3 gap-2">
              {GRUPOS.map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={c.grupo === g}
                  onClick={() => set({ grupo: g as Grupo })}
                  className={`px-3 py-2.5 rounded-xl border-2 text-sm font-bold ${
                    c.grupo === g ? "border-marine bg-marine text-white" : "border-slate-200 bg-white text-marine"
                  }`}
                >
                  {g} · {DEFINICION_GRUPOS[g].nombre}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Fecha" required>
              <StyledInput type="date" value={c.fecha} onChange={(e) => set({ fecha: e.target.value })} />
            </FormField>
            <FormField label="Equipo y modelo">
              <StyledInput value={c.equipoModelo} onChange={(e) => set({ equipoModelo: e.target.value })} placeholder="Trituradora de rodillos" />
            </FormField>
          </div>
          <Interruptor
            activo={c.noAplica}
            onChange={(noAplica) => set({ noAplica })}
            etiqueta="El grupo no se presenta: NO APLICA"
            descripcion={NOTA_ANEXO_B5}
          />
        </fieldset>
      </SectionCard>

      <SectionCard title="1. Equipo y recorrido" subtitle="Registro C y D" icon={ClipboardCheck}>
        <fieldset disabled={soloLectura} className="flex flex-col gap-3">
          <Checklist items={CHECK_ANEXO_B1} checks={c.checks} onToggle={alternar} />
          <p className="text-xs font-medium text-slate-500">{RESULTADO_ANEXO_B1}</p>
        </fieldset>
      </SectionCard>

      <SectionCard title="2. Clasificación por paso" subtitle="Registro B y D" icon={ClipboardCheck}>
        <fieldset disabled={soloLectura} className="flex flex-col gap-3">
          <Checklist items={CHECK_ANEXO_B2} checks={c.checks} onToggle={alternar} />
          <p className="text-xs font-medium text-slate-500">{RESULTADO_ANEXO_B2}</p>
        </fieldset>
      </SectionCard>

      {!c.noAplica && (
        <>
          <SectionCard title={`3. Gap inicial del grupo ${c.grupo}`} subtitle="Mantenimiento, con el equipo aislado" icon={Ruler}>
            <fieldset disabled={soloLectura} className="flex flex-col gap-4">
              <p className="text-sm font-medium text-slate-700 leading-relaxed">{INSTRUCCION_ANEXO_B3}</p>
              <Aviso tono="alerta" titulo={NOTA_ANEXO_B3} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Gap real (mm)" required>
                  <NumeroInput unidad="mm" value={c.gapInicial.gapRealMm} onChange={(gapRealMm) => setGap({ gapRealMm })} />
                </FormField>
                <FormField label="Posición de referencia" required>
                  <StyledInput value={c.gapInicial.posicion} onChange={(e) => setGap({ posicion: e.target.value })} />
                </FormField>
                <FormField label="Masa de la porción (kg)" required ayuda={`Referencia interna inicial: ${formatear(MASA_PORCION_COMPROBACION_KG, 1)} kg`}>
                  <NumeroInput unidad="kg" value={c.gapInicial.masaKg} onChange={(masaKg) => setGap({ masaKg })} />
                </FormField>
              </div>
              <SiNo
                pregunta="¿Alimentación estable?"
                value={c.gapInicial.alimentacionEstable}
                onChange={(alimentacionEstable) => setGap({ alimentacionEstable })}
                siEsBueno
              />
              {c.gapInicial.alimentacionEstable === false && (
                <Aviso tono="alerta" titulo="Documente la corrección necesaria antes de continuar." />
              )}
              <CampoFirma
                etiqueta="Responsable de Mantenimiento"
                nombre={c.gapInicial.mantenimiento.nombre}
                rol="Mantenimiento"
                rolFijo="Mantenimiento"
                onNombre={(nombre) => setGap({ mantenimiento: escribirFirma(c.gapInicial.mantenimiento, nombre, "Mantenimiento") })}
              />
            </fieldset>
          </SectionCard>

          <SectionCard title="4. Resultado y corrección" subtitle="Control de la actividad 9 por intento" icon={FlaskConical}>
            <fieldset disabled={soloLectura} className="flex flex-col gap-4">
              <p className="text-sm font-medium text-slate-700 leading-relaxed">{INSTRUCCION_ANEXO_B4}</p>
              <p className="text-xs font-medium text-slate-500">{NOTA_ANEXO_B4}</p>
              {c.intentos.map((it, i) => (
                <div key={it.id} className="rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-marine">
                      Intento {i + 1} <BadgeResultadoControl resultado={evaluarControl(it.control).resultado} />
                    </p>
                    {!soloLectura && c.intentos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => set({ intentos: c.intentos.filter((x) => x.id !== it.id) })}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600"
                        aria-label={`Quitar intento ${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] gap-3">
                    <FormField label="Gap (mm)" required>
                      <NumeroInput unidad="mm" value={it.gapMm} onChange={(gapMm) => setIntento(it.id, { gapMm })} />
                    </FormField>
                    <FormField label="Posición">
                      <StyledInput value={it.posicion} onChange={(e) => setIntento(it.id, { posicion: e.target.value })} />
                    </FormField>
                  </div>
                  {i > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Condición anterior" required>
                        <StyledInput value={it.condicionAnterior} onChange={(e) => setIntento(it.id, { condicionAnterior: e.target.value })} />
                      </FormField>
                      <FormField label="Condición nueva" required ayuda="Cambie una sola condición">
                        <StyledInput value={it.condicionNueva} onChange={(e) => setIntento(it.id, { condicionNueva: e.target.value })} />
                      </FormField>
                    </div>
                  )}
                  <ControlAperturaForm control={it.control} onChange={(cambios) => setControl(it.id, cambios)} bloqueado={soloLectura} />
                  <FormField label="Disposición de las porciones">
                    <StyledInput
                      value={it.disposicionPorciones}
                      onChange={(e) => setIntento(it.id, { disposicionPorciones: e.target.value })}
                      placeholder="Ej.: retenidas para evaluación de Calidad"
                    />
                  </FormField>
                </div>
              ))}
              {!soloLectura && (
                <button
                  type="button"
                  onClick={() =>
                    set({ intentos: [...c.intentos, intentoNuevo(c.intentos[c.intentos.length - 1], c.gapInicial)] })
                  }
                  className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-marine hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4" />
                  {c.intentos.length === 0 ? "Registrar el primer control" : "Nuevo intento (cambiando una sola condición)"}
                </button>
              )}
            </fieldset>
          </SectionCard>
        </>
      )}

      <FormField label="Observaciones">
        <textarea
          rows={2}
          value={c.observaciones}
          onChange={(e) => set({ observaciones: e.target.value })}
          disabled={soloLectura}
          className={`${inputBaseClasses} resize-y`}
        />
      </FormField>

      {error && <Aviso tono="error" titulo={error} />}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button type="button" onClick={onCancelar} className="px-5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50">
          {soloLectura ? "Volver" : "Cancelar"}
        </button>
        {!soloLectura && (
          <button type="button" onClick={guardar} className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-marine border border-marine-dark hover:bg-marine-light">
            Guardar comprobación
          </button>
        )}
      </div>
    </div>
  );
}

export function comprobacionVacia(fecha: string, ahora: string): ComprobacionInicial {
  return {
    id: nuevoId(),
    fecha,
    grupo: "G",
    noAplica: false,
    equipoModelo: "",
    checks: {},
    gapInicial: {
      gapRealMm: "",
      posicion: "",
      masaKg: formatear(MASA_PORCION_COMPROBACION_KG, 1),
      alimentacionEstable: null,
      mantenimiento: { nombre: "", rol: "Mantenimiento", fecha: "" },
    },
    intentos: [],
    observaciones: "",
    creadaEn: ahora,
    updatedAt: ahora,
  };
}
