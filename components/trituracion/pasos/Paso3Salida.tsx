"use client";

import React from "react";
import { CircleStop, Eye, RotateCw } from "lucide-react";
import { AVISO_DETENER_SALIDA, AVISO_FRUTA_ROTA, CHECK_ACT3, CRITERIO_ACT3 } from "@/lib/config/trituracion-textos";
import { horaLocalAhora, nuevoId } from "@/lib/recepcion/borrador";
import { controlSalidaVacio } from "@/lib/trituracion/registro";
import type { ControlSalida, RegistroTrituracion } from "@/lib/trituracion/tipos";
import { Aviso, BadgeConformidad, Checklist, FormField, SectionCard, SiNo, StyledInput, inputBaseClasses } from "@/components/recepcion/WizardUI";
import { CampoFirma } from "@/components/lote/CampoFirma";
import { FotosCampo } from "@/components/lote/FotosCampo";
import { GaleriaFotos } from "@/components/lote/FotoMiniatura";
import type { Cambiar } from "../AsistenteTrituracion";

function resumenControl(c: ControlSalida): { texto: string; estado: "conforme" | "no_conforme" | "pendiente" } {
  if (c.resultado === null || c.tallosObservados === null) return { texto: "Incompleto", estado: "pendiente" };
  if (c.resultado === "conforme" && !c.tallosObservados && !c.detencion.solicitada) return { texto: "Fruta conforme", estado: "conforme" };
  const partes = [c.resultado === "fruta_rota" ? "Fruta rota" : "Fruta conforme"];
  if (c.tallosObservados) partes.push("con tallos");
  if (c.detencion.solicitada) partes.push("equipo detenido");
  return { texto: partes.join(" · "), estado: "no_conforme" };
}

/** Paso 3 — Comprobar la salida del despalillado (actividad 3). */
export function Paso3Salida({
  r,
  onToggle,
  cambiar,
  descartarFotos,
}: {
  r: RegistroTrituracion;
  onToggle: (id: string) => void;
  cambiar: Cambiar;
  descartarFotos: (ids: string[]) => void;
}) {
  const cs = r.salida.controles;
  const actual = cs[cs.length - 1];
  const anterior = cs[cs.length - 2];
  const setControl = (id: string, fn: (c: ControlSalida) => ControlSalida) =>
    cambiar((x) => ({ ...x, salida: { controles: x.salida.controles.map((c) => (c.id === id ? fn(c) : c)) } }));
  const nuevoControl = () =>
    cambiar((x) => ({ ...x, salida: { controles: [...x.salida.controles, controlSalidaVacio(nuevoId(), horaLocalAhora())] } }));

  const completo = actual && actual.resultado !== null && actual.tallosObservados !== null;
  const noConforme = completo && (actual.resultado === "fruta_rota" || actual.tallosObservados === true);
  const puedeRepetir = completo && (noConforme || actual.detencion.solicitada) && (!actual.detencion.solicitada || actual.detencion.correccion.trim() !== "");

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="3. Comprobar la salida del despalillado" subtitle="Control del resultado de la máquina" icon={Eye}>
        <div className="flex flex-col gap-4">
          <Checklist items={CHECK_ACT3} checks={r.checks} onToggle={onToggle} />
          <p className="text-xs font-medium text-slate-500">{CRITERIO_ACT3}</p>
        </div>
      </SectionCard>

      {/* Historial de controles anteriores */}
      {cs.length > 1 && (
        <SectionCard title="Controles anteriores" subtitle="Historial con su hora" icon={Eye}>
          <ol className="flex flex-col gap-3">
            {cs.slice(0, -1).map((c, i) => {
              const s = resumenControl(c);
              return (
                <li key={c.id} className="rounded-xl border border-slate-200 p-3 flex flex-col gap-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-marine">Control {i + 1}</span>
                    <span className="font-mono text-xs text-slate-500">{c.hora}</span>
                    <BadgeConformidad estado={s.estado} texto={s.texto} />
                  </div>
                  {c.comentarioFrutaRota && <p className="text-xs font-medium text-slate-600">Fruta rota: {c.comentarioFrutaRota}</p>}
                  {c.danio && <p className="text-xs font-medium text-slate-600">Daño: {c.danio}</p>}
                  {c.detencion.solicitada && <p className="text-xs font-medium text-slate-600">Corrección: {c.detencion.correccion}</p>}
                  {c.fotoIds.length > 0 && <GaleriaFotos ids={c.fotoIds} nombre={`el control ${i + 1}`} />}
                </li>
              );
            })}
          </ol>
        </SectionCard>
      )}

      {/* Control actual */}
      {!actual ? (
        <button
          type="button"
          onClick={nuevoControl}
          className="self-start px-5 py-3 rounded-xl bg-marine text-white text-sm font-bold border border-marine-dark hover:bg-marine-light"
        >
          Registrar el control de la salida
        </button>
      ) : (
        <SectionCard title={`Control ${cs.length}`} subtitle="Resultado de la salida" icon={Eye}>
          <div className="flex flex-col gap-4">
            <div className="sm:max-w-[10rem]">
              <FormField label="Hora" required>
                <StyledInput type="time" value={actual.hora} onChange={(e) => setControl(actual.id, (c) => ({ ...c, hora: e.target.value }))} />
              </FormField>
            </div>
            <div role="radiogroup" aria-label="Resultado de la salida" className="grid grid-cols-2 gap-3">
              {(
                [
                  ["conforme", "Fruta conforme", "bg-emerald-100 border-emerald-300 text-emerald-800"],
                  ["fruta_rota", "Fruta rota", "bg-amber-100 border-amber-300 text-amber-800"],
                ] as const
              ).map(([v, t, cls]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={actual.resultado === v}
                  onClick={() => setControl(actual.id, (c) => ({ ...c, resultado: v }))}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-bold ${
                    actual.resultado === v ? cls : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {actual.resultado === "fruta_rota" && (
              <>
                <Aviso tono="alerta" titulo={AVISO_FRUTA_ROTA}>
                  Registre los kg de FRUTA ROTA como fracción separada de la tanda en el paso 4.
                </Aviso>
                <FormField label="Cómo se separó la FRUTA ROTA" required>
                  <StyledInput
                    value={actual.comentarioFrutaRota}
                    onChange={(e) => setControl(actual.id, (c) => ({ ...c, comentarioFrutaRota: e.target.value }))}
                    placeholder="Ej.: recipiente FRUTA ROTA identificado con el lote"
                  />
                </FormField>
              </>
            )}
            <SiNo
              pregunta="¿Se observan tallos en la salida?"
              value={actual.tallosObservados}
              onChange={(tallosObservados) => setControl(actual.id, (c) => ({ ...c, tallosObservados }))}
            />
            <FormField label="Daño generado en el despalillado" ayuda="Opcional">
              <StyledInput value={actual.danio} onChange={(e) => setControl(actual.id, (c) => ({ ...c, danio: e.target.value }))} placeholder="Ej.: bayas aplastadas, piel rota" />
            </FormField>
            <FotosCampo
              nombre={`el control ${cs.length}`}
              etiqueta="Foto (opcional)"
              fotoIds={actual.fotoIds}
              onAgregar={(ids) => setControl(actual.id, (c) => ({ ...c, fotoIds: [...c.fotoIds, ...ids] }))}
              onQuitar={(id) => {
                descartarFotos([id]);
                setControl(actual.id, (c) => ({ ...c, fotoIds: c.fotoIds.filter((f) => f !== id) }));
              }}
            />

            {anterior?.detencion.solicitada && (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
                <p className="text-sm font-bold text-marine">Producción verifica la salida tras la intervención</p>
                <CampoFirma
                  etiqueta="Verificado por"
                  nombre={actual.verificaProduccion.nombre}
                  rol="Producción"
                  rolFijo="Producción"
                  onNombre={(nombre) => setControl(actual.id, (c) => ({ ...c, verificaProduccion: { ...c.verificaProduccion, nombre, rol: "Producción" } }))}
                />
              </div>
            )}

            {completo && !noConforme && !actual.detencion.solicitada && (
              <Aviso tono="ok" titulo="Salida conforme: bayas sueltas, mayormente enteras y sin el tallo principal" />
            )}

            {completo && (noConforme || actual.detencion.solicitada) && (
              <div className="flex flex-col gap-3 p-3 sm:p-4 rounded-xl border border-red-200 bg-red-50/50">
                <Aviso tono="error" titulo={AVISO_DETENER_SALIDA} />
                {!actual.detencion.solicitada ? (
                  <button
                    type="button"
                    onClick={() => setControl(actual.id, (c) => ({ ...c, detencion: { ...c.detencion, solicitada: true } }))}
                    className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold border border-red-700 hover:bg-red-700"
                  >
                    <CircleStop className="w-4 h-4" /> Detener y solicitar revisión del equipo
                  </button>
                ) : (
                  <FormField label="Corrección realizada" required>
                    <textarea
                      rows={2}
                      value={actual.detencion.correccion}
                      onChange={(e) => setControl(actual.id, (c) => ({ ...c, detencion: { ...c.detencion, correccion: e.target.value } }))}
                      placeholder="Qué se corrigió en el equipo"
                      className={`${inputBaseClasses} resize-y`}
                    />
                  </FormField>
                )}
                <button
                  type="button"
                  disabled={!puedeRepetir}
                  onClick={nuevoControl}
                  className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl border border-marine/30 bg-white text-sm font-bold text-marine hover:bg-slate-50 disabled:opacity-50"
                >
                  <RotateCw className="w-4 h-4" /> Repetir el control
                </button>
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
