"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, CircleHelp, FileSignature, FlaskConical, History, Ruler, Scale, TriangleAlert, Truck, XCircle } from "lucide-react";
import { DECIMALES } from "@/lib/config/recepcion";
import { GRUPOS, SECUENCIA_TRITURACION, type Grupo } from "@/lib/config/trituracion";
import { DEFINICION_GRUPOS, REGLA_MERMA, TITULO_MODULO } from "@/lib/config/trituracion-textos";
import { formatear } from "@/lib/recepcion/validacion";
import { calcularBalance, type Balance } from "@/lib/trituracion/balance";
import { evaluarControl } from "@/lib/trituracion/control";
import { evaluarProceso } from "@/lib/trituracion/proceso";
import { NOMBRE_FRACCION } from "@/lib/trituracion/registro";
import type { FirmaRol, RegistroTrituracion, TipoFraccion } from "@/lib/trituracion/tipos";
import { Aviso, BadgeConformidad } from "@/components/recepcion/WizardUI";
import { BitacoraCambios, conRol, fechaHora } from "@/components/lote/InformeLote";
import { GaleriaFotos } from "@/components/lote/FotoMiniatura";
import { BadgeResultadoControl } from "./ControlAperturaForm";
import { EstadoRegistroBadge } from "./EstadoRegistroBadge";

const kg = (n: number | null) => (n === null ? "—" : `${formatear(n, DECIMALES.kg)} kg`);
const pct = (n: number | null) => (n === null ? "—" : `${formatear(n, 1)} %`);

/** Colores de G, M y P (paleta categórica validada; siempre con etiqueta visible y tabla). */
const COLOR_GRUPO: Record<Grupo, string> = { G: "#257de0", M: "#f47230", P: "#00b894" };
const MOMENTO: Record<string, string> = { inicio: "Inicio", tras_parada: "Tras parada o ajuste", final: "Final", comprobacion: "Comprobación" };

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

// ─────────────────────────────────────────
// Gráficos simples
// ─────────────────────────────────────────
/** Distribución G/M/P: barra apilada con separación de 2 px, etiquetas visibles y leyenda. */
function DistribucionGMP({ b }: { b: Balance }) {
  const total = b.clasificado;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Distribución G / M / P (kg clasificados)</p>
      {total <= 0 ? (
        <p className="text-sm font-medium text-slate-500">Sin kg clasificados.</p>
      ) : (
        <>
          <div className="flex h-7 gap-0.5 bg-white" role="img" aria-label={GRUPOS.map((g) => `${g} ${pct(b.grupos[g].pctClasificado)}`).join(", ")}>
            {GRUPOS.filter((g) => b.grupos[g].clasificado > 0).map((g, i, arr) => (
              <div
                key={g}
                title={`${g} · ${DEFINICION_GRUPOS[g].nombre}: ${kg(b.grupos[g].clasificado)} (${pct(b.grupos[g].pctClasificado)})`}
                className={`${i === 0 ? "rounded-l" : ""} ${i === arr.length - 1 ? "rounded-r" : ""} print:[print-color-adjust:exact]`}
                style={{ width: `${(b.grupos[g].clasificado / total) * 100}%`, background: COLOR_GRUPO[g] }}
              />
            ))}
          </div>
          <ul className="flex flex-col gap-1.5">
            {GRUPOS.map((g) => (
              <li key={g} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: COLOR_GRUPO[g] }} aria-hidden />
                <span className="font-bold text-marine w-28">
                  {g} · {DEFINICION_GRUPOS[g].nombre}
                </span>
                <span className="font-mono text-slate-700">{kg(b.grupos[g].clasificado)}</span>
                <span className="font-mono text-slate-500 ml-auto">{pct(b.grupos[g].pctClasificado)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Resultados de los controles de la actividad 9 (estado con ícono y etiqueta, nunca solo color). */
function ResultadosControles({ b }: { b: Balance }) {
  const filas = [
    { k: "conforme" as const, t: "Conforme", Icon: CheckCircle2, color: "#0aac23" },
    { k: "no_conforme" as const, t: "No conforme", Icon: XCircle, color: "#dc3c3d" },
    { k: "no_evaluable" as const, t: "No evaluable", Icon: CircleHelp, color: "#fbb315" },
  ];
  const max = Math.max(1, ...filas.map((f) => b.controles[f.k]));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Controles de apertura e integridad (actividad 9)</p>
      {filas.map((f) => (
        <div key={f.k} className="flex items-center gap-2 text-sm" title={`${f.t}: ${b.controles[f.k]}`}>
          <f.Icon className="w-4 h-4 flex-shrink-0" style={{ color: f.color }} />
          <span className="font-bold text-marine w-28">{f.t}</span>
          <span className="flex-1 h-2.5 rounded bg-slate-100 overflow-hidden">
            <span className="block h-full rounded print:[print-color-adjust:exact]" style={{ width: `${(b.controles[f.k] / max) * 100}%`, background: f.color }} />
          </span>
          <span className="font-mono font-bold text-marine w-8 text-right">{b.controles[f.k]}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Informe
// ─────────────────────────────────────────
export function InformeTrituracion({ r, pesoActualRecepcion }: { r: RegistroTrituracion; pesoActualRecepcion: number | null }) {
  const b = calcularBalance(r);
  const procesos = r.tandas.flatMap((t) => SECUENCIA_TRITURACION.filter((g) => t.proceso[g]).map((g) => ({ t, g, p: t.proceso[g]!, ev: evaluarProceso(t, g) })));
  const versiones = [...new Set(procesos.map((x) => x.p.gap.tablaVersion))];
  const cambioRecepcion = pesoActualRecepcion !== null && Math.abs(pesoActualRecepcion - r.entrada.pesoDisponibleKg) > 0.0005;

  const firmas: { rol: string; f: FirmaRol | { nombre: string; rol: string; fecha: string }; detalle: string }[] = [
    { rol: "Recibe el lote", f: r.recepcion.recibe, detalle: `Registro A · ${r.recepcion.horaEntrega}` },
    { rol: "Entrega (Recepción)", f: r.recepcion.entregadoPor, detalle: "Registro A" },
    ...r.salida.controles
      .filter((c) => c.verificaProduccion.nombre)
      .map((c) => ({ rol: "Verifica la salida", f: c.verificaProduccion, detalle: `Control de salida ${c.hora}` })),
    ...procesos.flatMap(({ t, g, p }) => [
      { rol: "Aplica el gap", f: p.gap.mantenimiento, detalle: `Tanda ${t.numero} · grupo ${g}` },
      ...p.retenciones.flatMap((rt) => [
        ...(rt.ajusteGap ? [{ rol: "Ajusta el gap", f: rt.ajusteGap.mantenimiento, detalle: `Tanda ${t.numero} · grupo ${g}` }] : []),
        { rol: "Conformidad", f: rt.conformidadProduccion, detalle: `Tanda ${t.numero} · grupo ${g} · retención` },
        { rol: "Disposición", f: rt.disposicion.firma, detalle: `Tanda ${t.numero} · grupo ${g} · ${rt.disposicion.decision === "autorizar_entrega" ? "autoriza entrega" : "no entregar"}` },
      ]),
    ]),
    { rol: "Disposición de porciones y pruebas", f: r.entrega.disposicionPorciones.firma, detalle: r.entrega.disposicionPorciones.texto },
    { rol: "Limpieza", f: r.entrega.limpieza.responsable, detalle: r.entrega.limpieza.hora },
    { rol: "Cierra la operación", f: r.entrega.cierre, detalle: r.cerradoEn ? fechaHora(r.cerradoEn) : "" },
  ].filter((x) => x.f.nombre.trim());

  return (
    <div className="flex flex-col gap-5 print:gap-3">
      {/* Encabezado */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden break-inside-avoid print:shadow-none">
        <div className="bg-marine text-white px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:bg-white print:text-marine print:border-b print:border-slate-300">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold-light print:text-gold-dark">Informe · {TITULO_MODULO}</p>
            <Link href={`/reportes/${encodeURIComponent(r.loteId)}`} className="block text-2xl sm:text-3xl font-black font-mono mt-1 break-all hover:underline">
              {r.codigoLote}
            </Link>
            <p className="text-sm text-white/80 font-medium mt-1 print:text-slate-600">
              {r.entrada.variedad} · {r.entrada.proveedor} · {r.entrada.origen}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <EstadoRegistroBadge estado={r.estado} />
            <p className="text-xs text-white/80 print:text-slate-600">
              Inicio {fechaHora(r.creadoEn)}
              {r.cerradoEn ? ` · cierre ${fechaHora(r.cerradoEn)}` : ""}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 sm:px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Peso disponible de entrada</p>
            <p className="text-2xl font-black font-mono text-marine">{kg(r.entrada.pesoDisponibleKg)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Estado en Recepción</p>
            <p className="text-sm font-bold text-marine">{r.entrada.estadoLote}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Autorizado por</p>
            <p className="text-sm font-bold text-marine">{conRol(r.entrada.disposicion.nombre, r.entrada.disposicion.rol)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tabla de gaps usada</p>
            <p className="text-sm font-bold text-marine">{versiones.length ? versiones.map((v) => `versión ${v}`).join(", ") : "—"}</p>
          </div>
        </div>
      </section>

      {cambioRecepcion && (
        <Aviso tono="alerta" titulo="La ficha de Recepción cambió después de recibir el lote">
          Peso disponible actual en Recepción: {kg(pesoActualRecepcion)}. Este registro conserva el peso recibido.
        </Aviso>
      )}

      {/* Balance de masa */}
      <Seccion titulo="Balance de masa" icon={Scale}>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr className="font-black text-marine">
                  <td className="py-2">Entrada (peso disponible)</td>
                  <td className="py-2 text-right font-mono">{kg(b.entradaKg)}</td>
                  <td className="py-2 text-right font-mono text-slate-400">100 %</td>
                </tr>
                {GRUPOS.map((g) => (
                  <tr key={g}>
                    <td className="py-1.5 font-medium text-slate-700">
                      Clasificado {g} · {DEFINICION_GRUPOS[g].nombre}
                    </td>
                    <td className="py-1.5 text-right font-mono">{kg(b.grupos[g].clasificado)}</td>
                    <td className="py-1.5 text-right font-mono text-slate-500">{pct(b.grupos[g].pctEntrada)}</td>
                  </tr>
                ))}
                {(Object.keys(b.fracciones) as TipoFraccion[]).map((k) => (
                  <tr key={k}>
                    <td className="py-1.5 font-medium text-slate-700">{NOMBRE_FRACCION[k]}</td>
                    <td className="py-1.5 text-right font-mono">{kg(b.fracciones[k])}</td>
                    <td />
                  </tr>
                ))}
                {GRUPOS.map((g) => (
                  <tr key={`t${g}`}>
                    <td className="py-1.5 font-medium text-slate-700">Triturado {g}</td>
                    <td className="py-1.5 text-right font-mono">{kg(b.grupos[g].triturado)}</td>
                    <td />
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 font-medium text-slate-700">Retenido (sin autorizar / total)</td>
                  <td className="py-1.5 text-right font-mono">
                    {kg(b.retenidoNoAutorizado)} / {kg(b.retenido)}
                  </td>
                  <td />
                </tr>
                <tr className="font-bold text-marine">
                  <td className="py-1.5">Entregado</td>
                  <td className="py-1.5 text-right font-mono">{kg(b.entregado)}</td>
                  <td />
                </tr>
                <tr className="text-slate-600">
                  <td className="py-2 font-bold">Diferencia no asignada</td>
                  <td className="py-2 text-right font-mono font-bold">{kg(b.diferenciaNoAsignada)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Solo informativa: entrada − (clasificado + fracciones separadas). No se completa como merma supuesta. {REGLA_MERMA}
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <DistribucionGMP b={b} />
            <ResultadosControles b={b} />
          </div>
        </div>
      </Seccion>

      {/* Gaps */}
      <Seccion titulo="Gaps por grupo" icon={Ruler}>
        {procesos.length === 0 ? (
          <p className="text-sm font-medium text-slate-500">Aún no se trituró ningún grupo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3">Tanda · grupo</th>
                  <th className="py-2 pr-3">Tabla</th>
                  <th className="py-2 pr-3 text-right">Estándar</th>
                  <th className="py-2 pr-3 text-right">Aplicado</th>
                  <th className="py-2 pr-3">Mantenimiento</th>
                  <th className="py-2">Desviaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {procesos.map(({ t, g, p, ev }) => (
                  <tr key={`${t.numero}${g}`}>
                    <td className="py-1.5 pr-3 font-bold text-marine whitespace-nowrap">
                      T{t.numero} · {g}
                    </td>
                    <td className="py-1.5 pr-3">v{p.gap.tablaVersion}</td>
                    <td className="py-1.5 pr-3 text-right font-mono">{formatear(p.gap.estandarMm, 2, 0)} mm</td>
                    <td className="py-1.5 pr-3 text-right font-mono">{p.gap.aplicadoMm} mm</td>
                    <td className="py-1.5 pr-3">{p.gap.mantenimiento.nombre || "—"}</td>
                    <td className="py-1.5 text-xs">
                      {ev.desviaciones.length ? ev.desviaciones.map((d) => `ajuste a ${formatear(d.nuevoMm, 2, 0)} mm (${d.mantenimiento})`).join("; ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>

      {/* Controles */}
      <Seccion titulo="Línea de tiempo de controles" icon={FlaskConical}>
        <ol className="flex flex-col gap-2 text-sm">
          {r.salida.controles.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-xs text-slate-500 w-12">{c.hora}</span>
              <span className="font-bold text-marine">Salida del despalillado {i + 1}</span>
              <BadgeConformidad
                estado={c.resultado === "conforme" && !c.tallosObservados && !c.detencion.solicitada ? "conforme" : "no_conforme"}
                texto={`${c.resultado === "fruta_rota" ? "Fruta rota" : "Fruta conforme"}${c.tallosObservados ? " · tallos" : ""}${c.detencion.solicitada ? " · detenido" : ""}`}
              />
            </li>
          ))}
          {procesos.flatMap(({ t, g, p }) =>
            p.controles.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-slate-500 w-12">{c.hora}</span>
                <span className="font-bold text-marine">
                  T{t.numero} · {g} · {MOMENTO[c.momento]}
                </span>
                <BadgeResultadoControl resultado={evaluarControl(c).resultado} />
                {!c.noEvaluable && (
                  <span className="text-xs text-slate-500">
                    {c.abiertas}/{c.bayasRevisadas} abiertas · {c.enteras} enteras · {c.semillasDaniadas} semillas dañadas de {c.semillasRevisadas}
                  </span>
                )}
              </li>
            )),
          )}
        </ol>
      </Seccion>

      {/* Incidencias */}
      <Seccion titulo="Incidencias" icon={TriangleAlert}>
        <div className="flex flex-col gap-3 text-sm">
          {r.despalillado.incidencias.length === 0 && procesos.every(({ p }) => p.retenciones.every((rt) => rt.origen !== "perdida_identificacion")) && (
            <p className="font-medium text-slate-500">Sin incidencias registradas.</p>
          )}
          {r.despalillado.incidencias.map((i) => (
            <p key={i.id} className="font-medium text-slate-700">
              <span className="font-mono text-xs text-slate-500 mr-2">{i.hora}</span>
              Despalillado: {i.descripcion} · Mantenimiento: {i.mantenimiento}
            </p>
          ))}
          {procesos.flatMap(({ t, g, p }) =>
            p.retenciones
              .filter((rt) => rt.origen === "perdida_identificacion")
              .map((rt) => (
                <p key={rt.id} className="font-medium text-slate-700">
                  T{t.numero} · {g}: entró otro grupo o se perdió la identificación — {rt.descripcion} ({rt.kg} kg retenidos)
                </p>
              )),
          )}
          {r.salida.controles
            .filter((c) => c.fotoIds.length > 0)
            .map((c, i) => (
              <div key={c.id} className="flex flex-col gap-1">
                <p className="text-xs font-bold text-slate-500">Fotos del control de salida {c.hora}</p>
                <GaleriaFotos ids={c.fotoIds} nombre={`el control de salida ${i + 1}`} />
              </div>
            ))}
        </div>
      </Seccion>

      {/* Retenidos y entregas */}
      <Seccion titulo="Retenidos y entregas" icon={Truck}>
        <div className="flex flex-col gap-4 text-sm">
          {procesos.flatMap(({ t, g, p }) =>
            p.retenciones.map((rt) => (
              <div key={rt.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                <p className="font-bold text-marine">
                  T{t.numero} · {g} · {rt.kg} kg retenidos · {rt.recipientes}
                </p>
                <p className="text-xs font-medium text-slate-600">
                  {rt.origen === "control" ? `Acción: ${rt.accion ?? "—"} · corrección: ${rt.correccion}` : "Pérdida de identificación"} · Calidad:{" "}
                  {rt.disposicion.decision === "autorizar_entrega" ? "autoriza la entrega" : "no entregar"} · {rt.disposicion.texto}
                </p>
              </div>
            )),
          )}
          {r.entrega.entregas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Tanda · grupo</th>
                    <th className="py-2 pr-3 text-right">Cantidad</th>
                    <th className="py-2 pr-3">Hora</th>
                    <th className="py-2">Destino</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {r.entrega.entregas.map((e) => (
                    <tr key={e.id}>
                      <td className="py-1.5 pr-3 font-bold text-marine">
                        T{e.tanda} · {e.grupo}
                      </td>
                      <td className="py-1.5 pr-3 text-right font-mono">{e.kg} kg</td>
                      <td className="py-1.5 pr-3 font-mono">{e.hora}</td>
                      <td className="py-1.5">{e.destino}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="font-medium text-slate-500">Aún no hay entregas registradas.</p>
          )}
          {r.entrega.disposicionPorciones.texto && (
            <p className="text-xs font-medium text-slate-600">Porciones examinadas y pruebas: {r.entrega.disposicionPorciones.texto}</p>
          )}
        </div>
      </Seccion>

      {/* Firmas */}
      <Seccion titulo="Firmas y responsables" icon={FileSignature}>
        {firmas.length === 0 ? (
          <p className="text-sm font-medium text-slate-500">Sin firmas registradas.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 text-sm">
            {firmas.map((x, i) => (
              <li key={i} className="py-2 flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="font-bold text-slate-500 w-44">{x.rol}</span>
                <span className="font-bold text-marine">{conRol(x.f.nombre, x.f.rol || undefined)}</span>
                <span className="font-mono text-xs text-slate-500">{x.f.fecha ? fechaHora(x.f.fecha) : "sin confirmar"}</span>
                {x.detalle && <span className="text-xs text-slate-500 w-full sm:w-auto">{x.detalle}</span>}
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {r.bitacora.length > 0 && (
        <Seccion titulo={`Bitácora de cambios (${r.bitacora.length})`} icon={History}>
          <BitacoraCambios entradas={r.bitacora} />
        </Seccion>
      )}

    </div>
  );
}
