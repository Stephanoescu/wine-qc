"use client";

import React from "react";
import { PackageCheck, Plus, ShieldAlert, Sparkles, Stamp, Trash2 } from "lucide-react";
import { DECIMALES } from "@/lib/config/recepcion";
import { ROL_ENOLOGIA } from "@/lib/config/roles";
import { SECUENCIA_TRITURACION } from "@/lib/config/trituracion";
import { CHECK_ACT10, CHECK_LIMPIEZA, NOTA_DISPOSICION_PORCIONES, NOTA_LIMPIEZA } from "@/lib/config/trituracion-textos";
import { horaLocalAhora, nuevoId } from "@/lib/recepcion/borrador";
import { formatear } from "@/lib/recepcion/validacion";
import { calcularBalance } from "@/lib/trituracion/balance";
import { estadoDeCierre, salidasEntregables } from "@/lib/trituracion/cierre";
import { escribirFirma } from "@/lib/trituracion/firmas";
import { NOMBRE_FRACCION } from "@/lib/trituracion/registro";
import type { Entrega, RegistroTrituracion, TipoFraccion } from "@/lib/trituracion/tipos";
import { Aviso, Checklist, FormField, NumeroInput, SectionCard, StyledInput, inputBaseClasses } from "@/components/recepcion/WizardUI";
import { CampoFirma } from "@/components/lote/CampoFirma";
import { EstadoRegistroBadge } from "../EstadoRegistroBadge";
import type { Cambiar } from "../AsistenteTrituracion";

const kg = (n: number) => `${formatear(n, DECIMALES.kg)} kg`;

/** Paso 6 — Entregar el producto y cerrar la operación (actividad 10). */
export function Paso6Entrega({ r, onToggle, cambiar }: { r: RegistroTrituracion; onToggle: (id: string) => void; cambiar: Cambiar }) {
  const salidas = salidasEntregables(r);
  const balance = calcularBalance(r);
  const setEntrega = (fn: (e: RegistroTrituracion["entrega"]) => RegistroTrituracion["entrega"]) =>
    cambiar((x) => ({ ...x, entrega: fn(x.entrega) }));
  const setFila = (id: string, cambios: Partial<Entrega>) =>
    setEntrega((e) => ({ ...e, entregas: e.entregas.map((x) => (x.id === id ? { ...x, ...cambios } : x)) }));
  const retenciones = r.tandas.flatMap((t) =>
    SECUENCIA_TRITURACION.flatMap((g) => (t.proceso[g]?.retenciones ?? []).map((rt) => ({ tanda: t.numero, grupo: g, rt }))),
  );
  const e = r.entrega;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="10. Entregar el producto y cerrar la operación" subtitle="Solo la salida autorizada, con trazabilidad" icon={PackageCheck}>
        <Checklist items={CHECK_ACT10} checks={r.checks} onToggle={onToggle} />
      </SectionCard>

      <SectionCard title="Entrega por grupo y tanda" subtitle="Lote, grupo, cantidad, hora y destino" icon={PackageCheck}>
        <div className="flex flex-col gap-4">
          {salidas.length === 0 && <Aviso tono="info" titulo="No hay grupos triturados." />}
          {salidas.map((s) => {
            const filas = e.entregas.filter((x) => x.tanda === s.tanda && x.grupo === s.grupo);
            return (
              <div key={`${s.tanda}${s.grupo}`} className="rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-black text-marine">
                    Tanda {s.tanda} · grupo {s.grupo} · lote {r.codigoLote}
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-600">
                    Triturado {kg(s.triturado)} · retenido sin autorizar {kg(s.retenidoNoAutorizado)} · autorizado {kg(s.entregable)} · entregado {kg(s.entregado)}
                  </p>
                </div>
                {s.entregable <= 0 ? (
                  <Aviso tono="alerta" titulo="Sin salida autorizada: lo retenido sin disposición favorable no se entrega." />
                ) : (
                  <>
                    {filas.map((f) => (
                      <div key={f.id} className="grid grid-cols-2 sm:grid-cols-[8rem_7rem_minmax(0,1fr)_2rem] gap-2 items-end">
                        <FormField label="Cantidad (kg)" required>
                          <NumeroInput compacto value={f.kg} onChange={(v) => setFila(f.id, { kg: v })} />
                        </FormField>
                        <FormField label="Hora" required>
                          <StyledInput type="time" value={f.hora} onChange={(ev) => setFila(f.id, { hora: ev.target.value })} className="px-2! py-2!" />
                        </FormField>
                        <div className="col-span-2 sm:col-span-1">
                          <FormField label="Destino" required>
                            <StyledInput value={f.destino} onChange={(ev) => setFila(f.id, { destino: ev.target.value })} placeholder="Ej.: Tanque T-07 (maceración)" className="py-2!" />
                          </FormField>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEntrega((x) => ({ ...x, entregas: x.entregas.filter((y) => y.id !== f.id) }))}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600"
                          aria-label="Quitar entrega"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {s.entregado > s.entregable + 1e-9 && (
                      <Aviso tono="error" titulo={`Lo entregado supera la salida autorizada (${kg(s.entregable)})`} />
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setEntrega((x) => ({
                          ...x,
                          entregas: [
                            ...x.entregas,
                            {
                              id: nuevoId(),
                              tanda: s.tanda,
                              grupo: s.grupo,
                              kg: filas.length === 0 ? String(s.entregable).replace(".", ",") : "",
                              hora: horaLocalAhora(),
                              destino: "",
                            },
                          ],
                        }))
                      }
                      className="self-start flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-marine hover:bg-slate-50"
                    >
                      <Plus className="w-4 h-4" /> Entrega
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Retenidos y remanentes" subtitle="Disposición de Calidad o Enología" icon={ShieldAlert}>
        <div className="flex flex-col gap-4">
          {retenciones.length === 0 ? (
            <p className="text-sm font-medium text-slate-500">No hubo material retenido.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {retenciones.map(({ tanda, grupo, rt }) => (
                <li key={rt.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-sm">
                  <p className="font-bold text-marine">
                    Tanda {tanda} · grupo {grupo} · {rt.kg} kg · {rt.recipientes}
                  </p>
                  <p className="text-xs font-medium text-slate-600">
                    {rt.disposicion.decision === "autorizar_entrega" ? "Entrega autorizada" : "No entregar"} · {rt.disposicion.texto} ·{" "}
                    {rt.disposicion.firma.nombre}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs font-medium text-slate-600">
            Fracciones separadas:{" "}
            {(Object.keys(balance.fracciones) as TipoFraccion[]).map((k) => `${NOMBRE_FRACCION[k]} ${kg(balance.fracciones[k])}`).join(" · ")}
          </p>
          <Aviso tono="info" titulo={NOTA_DISPOSICION_PORCIONES} />
          <FormField label="Disposición de las porciones examinadas y las pruebas iniciales" required>
            <textarea
              rows={2}
              value={e.disposicionPorciones.texto}
              onChange={(ev) => setEntrega((x) => ({ ...x, disposicionPorciones: { ...x.disposicionPorciones, texto: ev.target.value } }))}
              className={`${inputBaseClasses} resize-y`}
            />
          </FormField>
          <CampoFirma
            etiqueta="Dispuesto por"
            nombre={e.disposicionPorciones.firma.nombre}
            rol={ROL_ENOLOGIA}
            rolFijo={ROL_ENOLOGIA}
            onNombre={(n) =>
              setEntrega((x) => ({ ...x, disposicionPorciones: { ...x.disposicionPorciones, firma: escribirFirma(x.disposicionPorciones.firma, n, ROL_ENOLOGIA) } }))
            }
          />
        </div>
      </SectionCard>

      <SectionCard title="Cierre de limpieza" subtitle="Equipos aislados, limpieza final y útiles devueltos" icon={Sparkles}>
        <div className="flex flex-col gap-4">
          <Checklist items={CHECK_LIMPIEZA} checks={r.checks} onToggle={onToggle} />
          <Aviso tono="alerta" titulo={NOTA_LIMPIEZA} />
          <CampoFirma
            etiqueta="Responsable de la limpieza"
            nombre={e.limpieza.responsable.nombre}
            rol={e.limpieza.responsable.rol}
            onNombre={(n) => setEntrega((x) => ({ ...x, limpieza: { ...x.limpieza, responsable: escribirFirma(x.limpieza.responsable, n) } }))}
            onRol={(rol) =>
              setEntrega((x) => ({ ...x, limpieza: { ...x.limpieza, responsable: escribirFirma(x.limpieza.responsable, x.limpieza.responsable.nombre, rol) } }))
            }
          />
          <div className="sm:max-w-[10rem]">
            <FormField label="Hora" required>
              <StyledInput type="time" value={e.limpieza.hora} onChange={(ev) => setEntrega((x) => ({ ...x, limpieza: { ...x.limpieza, hora: ev.target.value } }))} />
            </FormField>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Cerrar operación" subtitle="Firma de Producción" icon={Stamp}>
        <div className="flex flex-col gap-4">
          <CampoFirma
            etiqueta="Cierra la operación"
            nombre={e.cierre.nombre}
            rol="Producción"
            rolFijo="Producción"
            onNombre={(n) => setEntrega((x) => ({ ...x, cierre: escribirFirma(x.cierre, n, "Producción") }))}
          />
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
            El registro quedará <EstadoRegistroBadge estado={estadoDeCierre(r)} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
