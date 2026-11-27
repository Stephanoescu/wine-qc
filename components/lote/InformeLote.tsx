"use client";

import React from "react";
import {
  Beaker,
  ClipboardList,
  Droplets,
  Eye,
  FileSignature,
  FlaskConical,
  History,
  Recycle,
  Scale,
  Thermometer,
  Truck,
} from "lucide-react";
import { DECIMALES, RANGOS } from "@/lib/config/recepcion";
import { PARAMETROS_VISUALES } from "@/lib/config/recepcion-textos";
import type { ClaveParametroVisual, LoteLegacy, LoteV2, Ronda } from "@/lib/recepcion/tipos";
import { formatear } from "@/lib/recepcion/validacion";
import { estadoLegacy } from "@/lib/recepcion/reporte";
import { BadgeConformidad } from "@/components/recepcion/WizardUI";
import { ListaMotivos } from "@/components/recepcion/Paso9Decision";
import { EstadoBadge } from "./EstadoBadge";
import { GaleriaFotos } from "./FotoMiniatura";

const NOMBRE_PARAMETRO = Object.fromEntries(PARAMETROS_VISUALES.map((p) => [p.clave, p.nombre])) as Record<
  ClaveParametroVisual,
  string
>;

/** "2026-11-26" → "26/11/2026" */
export function fechaCorta(f: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : f || "—";
}

/** Fecha y hora de un ISO (zona local). */
export function fechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

type Conformidad = "conforme" | "no_conforme" | "pendiente";

// ─────────────────────────────────────────
// Bloques comunes
// ─────────────────────────────────────────
function Tarjeta({
  titulo,
  icon: Icon,
  conformidad,
  textoConformidad,
  children,
}: {
  titulo: string;
  icon: React.ElementType;
  conformidad?: Conformidad;
  textoConformidad?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col gap-3 break-inside-avoid print:shadow-none">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-gold-dark flex-shrink-0" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 truncate">{titulo}</h3>
        </div>
        {conformidad && <BadgeConformidad estado={conformidad} texto={textoConformidad} />}
      </div>
      {children}
    </section>
  );
}

function Seccion({ titulo, icon: Icon, children }: { titulo: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm break-inside-avoid print:shadow-none">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50">
        <Icon className="w-4 h-4 text-gold-dark" />
        <h3 className="text-sm font-bold text-marine">{titulo}</h3>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Valor({ valor, unidad, rojo }: { valor: string; unidad?: string; rojo?: boolean }) {
  return (
    <p className={`text-3xl font-black font-mono ${rojo ? "text-red-600" : "text-marine"}`}>
      {valor}
      {unidad && <span className="text-sm font-bold text-slate-400 ml-1.5">{unidad}</span>}
    </p>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{etiqueta}</p>
      <p className="text-sm font-bold text-marine break-words">{valor || "—"}</p>
    </div>
  );
}

function Rondas({ rondas, decimales, conDiferencia }: { rondas: Ronda[]; decimales: number; conDiferencia?: boolean }) {
  return (
    <ul className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      {rondas.map((r, i) => (
        <li key={i} className="flex flex-wrap gap-x-2">
          <span className="font-bold text-slate-500">{i + 1}.ª ronda:</span>
          <span className="font-mono">{r.lecturas.map((v) => formatear(v, decimales)).join(" · ")}</span>
          <span>
            → <span className={`font-mono font-bold ${r.conforme ? "text-emerald-700" : "text-red-600"}`}>{formatear(r.promedio, decimales)}</span>
          </span>
          {conDiferencia && r.diferencia !== undefined && (
            <span className="text-slate-500">(dif. {formatear(r.diferencia, decimales)})</span>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────
// Informe del lote (formato v2)
// ─────────────────────────────────────────
export function InformeLote({ lote }: { lote: LoteV2 }) {
  const temps = lote.muestreo.temperaturas;
  const tMin = temps.length ? Math.min(...temps.map((t) => t.temperatura)) : null;
  const tMax = temps.length ? Math.max(...temps.map((t) => t.temperatura)) : null;
  const tempConforme = temps.every((t) => t.conforme);
  const brixUlt = lote.brix.rondas[lote.brix.rondas.length - 1];
  const phUlt = lote.ph.rondas[lote.ph.rondas.length - 1];
  const a = lote.acidez;
  const obs = lote.cajas.parametros.filter((p) => p.observado);
  const observado = (claves: ClaveParametroVisual[]) => obs.some((p) => claves.includes(p.clave));
  const provisional = lote.cajas.contenidoProvisional ? " (provisional)" : "";

  return (
    <div className="flex flex-col gap-5 print:gap-3">
      {/* ── Encabezado ── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden break-inside-avoid print:shadow-none">
        <div className="bg-marine text-white px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:bg-white print:text-marine print:border-b print:border-slate-300">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold-light print:text-gold-dark">
              Informe de recepción de uva
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono mt-1 break-all">{lote.codigoLote}</p>
            <p className="text-sm text-white/80 font-medium mt-1 print:text-slate-600">
              {lote.variedad} · {lote.proveedor} · {lote.origen}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <EstadoBadge estado={lote.estado} grande />
            {lote.liberadoConObservaciones && (
              <span className="text-xs font-bold bg-white/15 text-white px-2 py-1 rounded-md print:text-amber-800 print:bg-amber-100">
                Liberado con observaciones (Enología)
              </span>
            )}
            {lote.estado !== lote.estadoSugerido && !lote.liberadoConObservaciones && (
              <span className="text-xs font-medium text-white/70 print:text-slate-500">
                Estado sugerido por el sistema: {lote.estadoSugerido}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 sm:px-6 py-4">
          <Dato etiqueta="Fecha y hora" valor={`${fechaCorta(lote.fecha)} ${lote.hora}`} />
          <Dato etiqueta="Proveedor / Viña" valor={lote.proveedor} />
          <Dato etiqueta="Origen" valor={lote.origen} />
          <Dato etiqueta="N° de jabas" valor={lote.numJabas} />
        </div>
        <div className="mx-4 sm:mx-6 mb-5 rounded-xl border border-marine/15 bg-slate-50 px-4 py-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Peso neto total</p>
            <p className="text-4xl font-black font-mono text-marine">
              {formatear(lote.pesado.pesoNetoTotal, DECIMALES.kg)}
              <span className="text-base font-bold text-slate-400 ml-1.5">kg</span>
            </p>
          </div>
          {lote.pesado.parcial && (
            <span className="text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
              Total parcial: hay taras pendientes
            </span>
          )}
          {lote.pesado.usoFuncionTara && (
            <span className="text-xs font-medium text-slate-500">Pesado con la función TARA de la balanza</span>
          )}
        </div>
      </section>

      {/* ── Resultados ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
        <Tarjeta
          titulo="Temperatura"
          icon={Thermometer}
          conformidad={temps.length ? (tempConforme ? "conforme" : "no_conforme") : "pendiente"}
        >
          <div className="flex gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Mínima</p>
              <Valor valor={formatear(tMin, DECIMALES.temperatura)} unidad="°C" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Máxima</p>
              <Valor valor={formatear(tMax, DECIMALES.temperatura)} unidad="°C" rojo={!tempConforme} />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {temps.map((t) => (
              <span
                key={t.jaba}
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                  t.conforme ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                N° {t.jaba}: {formatear(t.temperatura, DECIMALES.temperatura)} °C
              </span>
            ))}
          </div>
          <p className="text-xs font-medium text-slate-500">
            Conforme ≤ {RANGOS.temperatura.maxConforme} °C · Bolsa de bayas:{" "}
            {formatear(lote.muestreo.pesoBolsaBayasG, 0)} g
          </p>
        </Tarjeta>

        <Tarjeta titulo="°Brix promedio" icon={Droplets} conformidad={lote.brix.conforme ? "conforme" : "no_conforme"}>
          <Valor valor={formatear(brixUlt?.promedio, DECIMALES.brix)} unidad="°Brix" rojo={!lote.brix.conforme} />
          <Rondas rondas={lote.brix.rondas} decimales={DECIMALES.brix} />
          <p className="text-xs font-medium text-slate-500">
            Rango {RANGOS.brix.min}–{RANGOS.brix.max} °Brix
          </p>
        </Tarjeta>

        <Tarjeta titulo="pH promedio" icon={FlaskConical} conformidad={lote.ph.conforme ? "conforme" : "no_conforme"}>
          <div className="flex gap-6 items-end">
            <Valor valor={formatear(phUlt?.promedio, DECIMALES.ph)} rojo={!lote.ph.conforme} />
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Diferencia</p>
              <p className="text-lg font-black font-mono text-marine">{formatear(phUlt?.diferencia, DECIMALES.ph)}</p>
            </div>
          </div>
          <Rondas rondas={lote.ph.rondas} decimales={DECIMALES.ph} conDiferencia />
          <p className="text-xs font-medium text-slate-500">
            Rango {formatear(RANGOS.ph.min, 1)}–{formatear(RANGOS.ph.max, 1)}
            {lote.ph.temperaturaJugo !== undefined &&
              ` · Jugo a ${formatear(lote.ph.temperaturaJugo, DECIMALES.temperatura)} °C`}
          </p>
        </Tarjeta>

        <Tarjeta
          titulo="Acidez titulable"
          icon={Beaker}
          conformidad={a.pendiente || a.conforme === null ? "pendiente" : a.conforme ? "conforme" : "no_conforme"}
        >
          {a.pendiente ? (
            <p className="text-2xl font-black text-amber-700">Pendiente</p>
          ) : (
            <Valor valor={formatear(a.valor, DECIMALES.acidez)} unidad="g/L" rojo={a.conforme === false} />
          )}
          {!a.pendiente && (
            <p className="text-xs font-medium text-slate-600">
              Método: {a.metodo || "—"} · Punto final: {a.puntoFinal || "—"}
            </p>
          )}
          {a.conforme === false && (
            <p className="text-xs font-bold text-red-700">
              {a.confirmadoPorLab ? "Confirmada por el laboratorio" : "Confirmación del laboratorio pendiente"}
            </p>
          )}
          <p className="text-xs font-medium text-slate-500">
            Rango {RANGOS.acidez.min}–{RANGOS.acidez.max} g/L como ácido tartárico
          </p>
        </Tarjeta>

        <Tarjeta
          titulo="Materia extraña"
          icon={Recycle}
          conformidad={observado(["materiaExtrana"]) ? "no_conforme" : "conforme"}
          textoConformidad={observado(["materiaExtrana"]) ? "Observado" : undefined}
        >
          <Valor
            valor={lote.cajas.materiaExtranaPct === null ? "—" : formatear(lote.cajas.materiaExtranaPct, DECIMALES.porcentaje)}
            unidad="%"
          />
          <p className="text-xs font-medium text-slate-500">
            {formatear(lote.cajas.materiaExtranaKg, DECIMALES.kg)} kg de{" "}
            {formatear(lote.cajas.contenidoInspeccionadoKg, DECIMALES.kg)} kg inspeccionados{provisional}
          </p>
        </Tarjeta>

        <Tarjeta
          titulo="Uva dañada"
          icon={Scale}
          conformidad={observado(["podredumbre", "bayasDaniadas", "deshidratacion", "bayasVerdes"]) ? "no_conforme" : "conforme"}
          textoConformidad={
            observado(["podredumbre", "bayasDaniadas", "deshidratacion", "bayasVerdes"]) ? "Observado" : undefined
          }
        >
          <Valor
            valor={lote.cajas.uvaDaniadaPct === null ? "—" : formatear(lote.cajas.uvaDaniadaPct, DECIMALES.porcentaje)}
            unidad="%"
          />
          <p className="text-xs font-medium text-slate-500">
            {formatear(lote.cajas.uvaDaniadaKg, DECIMALES.kg)} kg de{" "}
            {formatear(lote.cajas.contenidoInspeccionadoKg, DECIMALES.kg)} kg inspeccionados{provisional}
          </p>
        </Tarjeta>
      </div>

      {/* ── Motivos ── */}
      {lote.motivos.length > 0 && (
        <Seccion titulo={`No conformidades (${lote.motivos.length})`} icon={ClipboardList}>
          <ListaMotivos motivos={lote.motivos} />
        </Seccion>
      )}

      {/* ── Observaciones ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
        <Seccion titulo="Observaciones de carga" icon={Truck}>
          {lote.carga.observaciones.length === 0 ? (
            <p className="text-sm font-medium text-slate-500">Sin observaciones.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lote.carga.observaciones.map((o, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 font-mono font-bold text-marine">N° {o.jaba}</span>
                  <span className="font-medium text-slate-700">{o.descripcion}</span>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion titulo="Inspección de las cajas" icon={Eye}>
          <p className="text-xs font-medium text-slate-500 mb-3">
            Jabas inspeccionadas: N° {lote.muestreo.jabasSeleccionadas.join(", ") || "—"}
          </p>
          {obs.length === 0 ? (
            <p className="text-sm font-medium text-slate-500">Ningún parámetro observado.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {obs.map((p) => (
                <li key={p.clave} className="flex flex-col gap-2">
                  <p className="text-sm">
                    <span className="font-bold text-amber-800">{NOMBRE_PARAMETRO[p.clave]}</span>
                    {p.comentario && <span className="font-medium text-slate-600"> — {p.comentario}</span>}
                  </p>
                  {p.fotoIds.length > 0 && <GaleriaFotos ids={p.fotoIds} nombre={NOMBRE_PARAMETRO[p.clave]} />}
                </li>
              ))}
            </ul>
          )}
          {lote.cajas.decisionEnologia && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <Dato etiqueta="Decisión de Enología (inspección)" valor={lote.cajas.decisionEnologia} />
            </div>
          )}
        </Seccion>
      </div>

      {/* ── Firmas ── */}
      <Seccion titulo="Decisión, autorización y destino" icon={FileSignature}>
        <div className="flex flex-col gap-4">
          {lote.disposicion && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Dato etiqueta="Autorizado por" valor={lote.disposicion.nombre} />
              <Dato etiqueta="Destino" valor={lote.disposicion.destino} />
              <Dato etiqueta="Fecha" valor={fechaHora(lote.disposicion.fecha)} />
            </div>
          )}
          {lote.enologia && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 first:pt-0 first:border-0">
              <Dato etiqueta="Confirmado por (Enología)" valor={lote.enologia.nombre} />
              <Dato etiqueta="Destino" valor={lote.enologia.destino} />
              <Dato etiqueta="Fecha" valor={fechaHora(lote.enologia.fecha)} />
              <div className="sm:col-span-3">
                <Dato etiqueta="Motivo" valor={lote.enologia.motivo} />
              </div>
            </div>
          )}
          {!lote.disposicion && !lote.enologia && (
            <p className="text-sm font-medium text-slate-600">
              Lote retenido: pendiente de la decisión de Enología.
              {lote.responsable && ` Registrado por ${lote.responsable}.`}
            </p>
          )}
        </div>
      </Seccion>

      {/* ── Historial ── */}
      {lote.historial.length > 0 && (
        <Seccion titulo="Historial" icon={History}>
          <ol className="flex flex-col gap-2">
            {lote.historial.map((h, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-mono text-xs text-slate-500">{fechaHora(h.fecha)}</span>
                <EstadoBadge estado={h.estado} />
                <span className="font-bold text-marine">{h.por}</span>
                {h.nota && <span className="font-medium text-slate-600">{h.nota}</span>}
              </li>
            ))}
          </ol>
        </Seccion>
      )}

      {/* ── Pesado por jaba ── */}
      <details className="rounded-2xl border border-slate-200 bg-white shadow-sm print:hidden">
        <summary className="cursor-pointer px-4 sm:px-5 py-3 text-sm font-bold text-marine">
          Detalle del pesado por jaba ({lote.pesado.jabas.length})
        </summary>
        <div className="px-4 sm:px-5 pb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500 text-left">
                <th className="py-2 pr-3">N°</th>
                <th className="py-2 pr-3">{lote.pesado.usoFuncionTara ? "Lectura (neto)" : "Lleno"}</th>
                {!lote.pesado.usoFuncionTara && <th className="py-2 pr-3">Tara</th>}
                <th className="py-2">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {lote.pesado.jabas.map((j) => (
                <tr key={j.numero}>
                  <td className="py-1.5 pr-3 font-bold text-marine">{j.numero}</td>
                  <td className="py-1.5 pr-3">{formatear(j.pesoLleno, DECIMALES.kg)}</td>
                  {!lote.pesado.usoFuncionTara && (
                    <td className="py-1.5 pr-3">{j.taraPendiente ? <span className="text-amber-700 font-sans font-bold text-xs">Pendiente</span> : formatear(j.tara, DECIMALES.kg)}</td>
                  )}
                  <td className="py-1.5 font-bold">{formatear(j.neto, DECIMALES.kg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

// ─────────────────────────────────────────
// Lote en formato anterior (solo lectura)
// ─────────────────────────────────────────
export function InformeLegacy({ lote }: { lote: LoteLegacy }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-marine text-white px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:bg-white print:text-marine">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold-light print:text-gold-dark">
              Informe de recepción · formato anterior
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono mt-1 break-all">{lote.codigoLote}</p>
            <p className="text-sm text-white/80 font-medium mt-1 print:text-slate-600">
              {lote.variedad} · {lote.proveedor}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <EstadoBadge estado={estadoLegacy(lote)} grande />
            <span className="text-xs font-medium text-white/70 print:text-slate-500">
              Categoría original: {lote.categoria ?? "sin categoría"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-4 sm:px-6 py-5">
          <Dato etiqueta="Fecha y hora" valor={`${fechaCorta(lote.fecha)} ${lote.hora ?? ""}`} />
          <Dato etiqueta="Procedencia" valor={lote.procedencia} />
          <Dato etiqueta="Peso" valor={`${formatear(lote.peso, DECIMALES.kg)} kg`} />
          <Dato etiqueta="°Brix promedio" valor={formatear(lote.brixPromedio, DECIMALES.brix)} />
          <Dato etiqueta="pH promedio" valor={formatear(lote.phPromedio, DECIMALES.ph)} />
        </div>
        <p className="px-4 sm:px-6 pb-5 text-xs font-medium text-slate-500">
          Lote registrado con la clasificación A/B/C anterior (A → Liberado, B → Retenido, C → Rechazado). Sus valores se
          evaluaron con otros rangos, por eso se muestran sin color. Es de solo lectura.
        </p>
      </section>
      {lote.observaciones?.length > 0 && (
        <Seccion titulo="Observaciones" icon={ClipboardList}>
          <ul className="flex flex-col gap-1.5">
            {lote.observaciones.map((o, i) => (
              <li key={i} className="text-sm font-medium text-slate-700">
                • {o}
              </li>
            ))}
          </ul>
        </Seccion>
      )}
    </div>
  );
}
