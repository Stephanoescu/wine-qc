"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, CircleDashed, Cog, FlaskConical, Play, Plus, Ruler, Trash2, TriangleAlert } from "lucide-react";
import { DECIMALES } from "@/lib/config/recepcion";
import { SECUENCIA_TRITURACION, type Grupo } from "@/lib/config/trituracion";
import {
  AVISO_GAP_DISTINTO,
  AVISO_GAP_NO_ESTABLECIDO,
  AVISO_NO_REAJUSTAR,
  AVISO_PERDIDA_ID,
  AVISO_UNA_PASADA,
  CHECK_ACT7,
  CHECK_ACT8,
  CRITERIO_ACT7,
  DEFINICION_GRUPOS,
  INCIDENCIA_PERDIDA_ID,
  INSTRUCCIONES_ACT9,
} from "@/lib/config/trituracion-textos";
import { horaLocalAhora, nuevoId } from "@/lib/recepcion/borrador";
import { formatear } from "@/lib/recepcion/validacion";
import { controlVacio } from "@/lib/trituracion/control";
import { ETIQUETA_MOMENTO } from "@/lib/trituracion/etiquetas";
import { gapDeGrupo } from "@/lib/trituracion/config-gaps";
import {
  evaluarProceso,
  iniciarProceso,
  ordenTrituracion,
  retencionNueva,
  type ControlEvaluado,
  type EstadoGrupoProceso,
} from "@/lib/trituracion/proceso";
import type { ControlApertura, ProcesoGrupo, RegistroTrituracion, Retencion, Tanda, VersionTablaGaps } from "@/lib/trituracion/tipos";
import { Aviso, Checklist, FormField, NumeroInput, SectionCard, StyledInput } from "@/components/recepcion/WizardUI";
import { CampoFirma } from "@/components/lote/CampoFirma";
import { BadgeResultadoControl, ControlAperturaForm } from "../ControlAperturaForm";
import { RetencionForm, firmar } from "./RetencionForm";
import { AvisoConflictoGaps, textoVersion } from "../AvisoConflictoGaps";
import type { Cambiar } from "../AsistenteTrituracion";

const kg = (n: number | null) => (n === null ? "—" : `${formatear(n, DECIMALES.kg)} kg`);
const mm = (n: number) => `${formatear(n, 2, 0)} mm`;

const MOMENTO = ETIQUETA_MOMENTO;

const CHIP: Record<EstadoGrupoProceso, { cls: string; t: string }> = {
  completo: { cls: "bg-emerald-50 border-emerald-200 text-emerald-800", t: "Completo" },
  actual: { cls: "bg-marine text-white border-marine", t: "En proceso" },
  pendiente: { cls: "bg-white border-slate-200 text-slate-500", t: "Pendiente" },
  omitido: { cls: "bg-slate-50 border-slate-200 text-slate-400", t: "0 kg · omitido" },
};

/** Paso 5 — Triturar con la configuración correspondiente (actividades 7, 8 y 9). */
export function Paso5Trituracion({
  r,
  vigente,
  cambiar,
  edicion = false,
  conflicto = null,
}: {
  r: RegistroTrituracion;
  vigente: VersionTablaGaps | null;
  /** Conflicto de versiones con el mismo número (se usa la de aprobación más reciente). */
  conflicto?: { version: number; versiones: VersionTablaGaps[] } | null;
  cambiar: Cambiar;
  /** Edición del informe: todos los grupos triturados se pueden corregir. */
  edicion?: boolean;
}) {
  const orden = ordenTrituracion(r);
  const actual = orden.find((p) => p.estado === "actual") ?? null;
  const tandaActual = actual ? r.tandas.find((t) => t.numero === actual.tanda) ?? null : null;

  const setProceso = (numero: number, g: Grupo, fn: (p: ProcesoGrupo) => ProcesoGrupo, sellar = false) =>
    cambiar(
      (x) => ({
        ...x,
        tandas: x.tandas.map((t) => (t.numero === numero && t.proceso[g] ? { ...t, proceso: { ...t.proceso, [g]: fn(t.proceso[g]!) } } : t)),
      }),
      { sellar },
    );

  function iniciar(numero: number, g: Grupo) {
    const ini = iniciarProceso(vigente, g);
    if (!ini.ok) return;
    cambiar((x) => ({
      ...x,
      tandas: x.tandas.map((t) => (t.numero === numero ? { ...t, proceso: { ...t.proceso, [g]: ini.proceso } } : t)),
    }), { sellar: true });
  }

  const tandasCerradas = r.tandas.filter((t) => t.cerrada);

  return (
    <div className="flex flex-col gap-6">
      {conflicto && <AvisoConflictoGaps conflicto={conflicto} enlaceConfiguracion />}
      <SectionCard title="5. Triturar con la configuración correspondiente" subtitle="Secuencia P → M → G por tanda, sin intercalar grupos" icon={Cog}>
        {tandasCerradas.length === 0 ? (
          <Aviso tono="info" titulo="No hay tandas cerradas. Cierre una tanda en el paso 4." />
        ) : (
          <div className="flex flex-col gap-3">
            {tandasCerradas.map((t) => (
              <div key={t.numero} className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-marine w-16">Tanda {t.numero}</span>
                {SECUENCIA_TRITURACION.map((g) => {
                  const p = orden.find((x) => x.tanda === t.numero && x.grupo === g)!;
                  const c = CHIP[p.estado];
                  return (
                    <span key={g} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${c.cls}`}>
                      <span className="font-mono font-black">{g}</span>
                      {p.estado === "completo" ? <CheckCircle2 className="w-3.5 h-3.5" /> : p.estado === "omitido" ? <CircleDashed className="w-3.5 h-3.5" /> : null}
                      {c.t}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Grupos completados: solo lectura (en la edición del informe se corrigen) */}
      {orden
        .filter((p) => p.estado === "completo")
        .map((p) => {
          const t = r.tandas.find((x) => x.numero === p.tanda)!;
          return edicion ? (
            <GrupoEnProceso key={`${p.tanda}${p.grupo}`} t={t} g={p.grupo} set={(fn, sellar) => setProceso(t.numero, p.grupo, fn, sellar)} />
          ) : (
            <ResumenGrupo key={`${p.tanda}${p.grupo}`} t={t} g={p.grupo} />
          );
        })}

      {/* Grupo actual */}
      {actual && tandaActual && (
        tandaActual.proceso[actual.grupo] ? (
          <GrupoEnProceso
            t={tandaActual}
            g={actual.grupo}
            set={(fn, sellar) => setProceso(tandaActual.numero, actual.grupo, fn, sellar)}
          />
        ) : (
          <InicioGrupo t={tandaActual} g={actual.grupo} vigente={vigente} onIniciar={() => iniciar(tandaActual.numero, actual.grupo)} />
        )
      )}

      {tandasCerradas.length > 0 && !actual && (
        <Aviso tono="ok" titulo="Todas las tandas cerradas están trituradas">
          {r.tandas.some((t) => !t.cerrada)
            ? "Hay una tanda abierta en el paso 4: ciérrela y vuelva para triturarla."
            : "Si queda uva por clasificar, vuelva al paso 4 y abra otra tanda; si no, continúe con la entrega."}
        </Aviso>
      )}
    </div>
  );
}

function InicioGrupo({ t, g, vigente, onIniciar }: { t: Tanda; g: Grupo; vigente: VersionTablaGaps | null; onIniciar: () => void }) {
  const gap = gapDeGrupo(vigente, g);
  const ev = evaluarProceso(t, g);
  return (
    <SectionCard title={`Tanda ${t.numero} · grupo ${g} (${DEFINICION_GRUPOS[g].nombre})`} subtitle={`${kg(ev.kgClasificado)} clasificados`} icon={Ruler}>
      {gap.ok ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-marine text-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-light">Gap estándar del grupo {g}</p>
            <p className="text-4xl font-black font-mono">{mm(gap.gapMm)}</p>
            <p className="text-sm text-white/80 mt-1">
              Tabla {textoVersion(gap.version, gap.version.creadaEn)} · {gap.version.equipoModelo} · Posición o marca: {gap.posicion}
            </p>
          </div>
          <button
            type="button"
            onClick={onIniciar}
            className="self-start flex items-center gap-2 px-5 py-3 rounded-xl bg-marine text-white text-sm font-bold border border-marine-dark hover:bg-marine-light"
          >
            <Play className="w-4 h-4" /> Iniciar el grupo {g}
          </button>
        </div>
      ) : (
        <Aviso tono="error" titulo={AVISO_GAP_NO_ESTABLECIDO}>
          {gap.motivo === "sin_tabla" ? "No hay una tabla estándar aprobada." : gap.motivo === "no_aplica" ? `La tabla vigente indica NO APLICA para el grupo ${g}.` : `La tabla vigente no tiene gap para el grupo ${g}.`}{" "}
          <Link href="/configuracion/trituracion" className="font-bold text-marine underline">
            Ir a Configuración de gaps
          </Link>
        </Aviso>
      )}
    </SectionCard>
  );
}

function ResumenGrupo({ t, g }: { t: Tanda; g: Grupo }) {
  const p = t.proceso[g]!;
  const ev = evaluarProceso(t, g);
  return (
    <details className="rounded-2xl border border-emerald-200 bg-white shadow-sm">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-marine flex flex-wrap gap-x-3 gap-y-1 items-center">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        Tanda {t.numero} · grupo {g}: {kg(ev.kgTriturados)} triturados con {mm(p.gap.estandarMm)}
        {ev.kgRetenidos > 0 && <span className="text-xs font-bold text-amber-700">· {kg(ev.kgRetenidos)} retenidos</span>}
      </summary>
      <div className="px-4 pb-4 text-xs font-medium text-slate-600 flex flex-col gap-1">
        <p>
          Gap aplicado {p.gap.aplicadoMm} mm (estándar {mm(p.gap.estandarMm)}, tabla versión {p.gap.tablaVersion}) por {p.gap.mantenimiento.nombre}.
        </p>
        {ev.desviaciones.map((d, i) => (
          <p key={i}>Desviación: ajuste a {mm(d.nuevoMm)} por {d.mantenimiento}.</p>
        ))}
        <p>
          {p.inicio}–{p.fin} · {p.controles.length} control(es):{" "}
          {ev.controles.map((c) => `${MOMENTO[c.control.momento]} ${c.control.hora} ${c.resultado === "conforme" ? "✓" : "✗"}`).join(" · ")}
        </p>
      </div>
    </details>
  );
}

function GrupoEnProceso({
  t,
  g,
  set,
}: {
  t: Tanda;
  g: Grupo;
  /** `sellar`: la acción confirma las firmas escritas (agregar control, registrar retención). */
  set: (fn: (p: ProcesoGrupo) => ProcesoGrupo, sellar?: boolean) => void;
}) {
  const p = t.proceso[g]!;
  const ev = evaluarProceso(t, g);
  const alternar = (id: string) => set((x) => ({ ...x, checks: { ...x.checks, [id]: !x.checks[id] } }));
  const setRet = (id: string, fn: (r: Retencion) => Retencion) =>
    set((x) => ({ ...x, retenciones: x.retenciones.map((rt) => (rt.id === id ? fn(rt) : rt)) }));
  const setControl = (id: string, cambios: Partial<ControlApertura>) =>
    set((x) => ({ ...x, controles: x.controles.map((c) => (c.id === id ? { ...c, ...cambios } : c)) }));
  const agregarControl = (momento: ControlApertura["momento"]) =>
    set((x) => ({ ...x, controles: [...x.controles, controlVacio(nuevoId(), momento, horaLocalAhora())] }), true);
  const tieneInicio = p.controles.some((c) => c.momento === "inicio");
  const perdidas = p.retenciones.filter((rt) => rt.origen === "perdida_identificacion");

  return (
    <>
      <div className="rounded-2xl bg-marine text-white px-4 sm:px-5 py-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-light">En proceso</p>
          <p className="text-2xl font-black">
            Tanda {t.numero} · grupo {g} · {DEFINICION_GRUPOS[g].recipiente}
          </p>
        </div>
        <p className="font-mono text-lg font-black">{kg(ev.kgClasificado)} clasificados</p>
      </div>

      {/* Actividad 7 */}
      <SectionCard title={`7. Aplicar el gap estándar del grupo ${g}`} subtitle={`Tabla versión ${p.gap.tablaVersion} · posición o marca: ${p.gap.posicion}`} icon={Ruler}>
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold text-marine">
            Gap estándar: <span className="font-mono text-xl">{mm(p.gap.estandarMm)}</span>
          </p>
          <Checklist items={CHECK_ACT7} checks={p.checks} onToggle={alternar} />
          <p className="text-xs font-medium text-slate-500">{CRITERIO_ACT7}</p>
          <CampoFirma
            etiqueta="Mantenimiento que aplicó el gap"
            nombre={p.gap.mantenimiento.nombre}
            rol="Mantenimiento"
            rolFijo="Mantenimiento"
            onNombre={(n) => set((x) => ({ ...x, gap: { ...x.gap, mantenimiento: firmar(x.gap.mantenimiento, n, "Mantenimiento") } }))}
          />
          <div className="sm:max-w-[12rem]">
            <FormField label="Gap aplicado (mm)" required error={ev.errorGap && ev.errorGap !== "distinto" ? ev.errorGap : undefined}>
              <NumeroInput unidad="mm" value={p.gap.aplicadoMm} onChange={(aplicadoMm) => set((x) => ({ ...x, gap: { ...x.gap, aplicadoMm } }))} error={ev.errorGap} />
            </FormField>
          </div>
          {ev.errorGap === "distinto" && <Aviso tono="error" titulo={AVISO_GAP_DISTINTO} />}
          <Aviso tono="alerta" titulo={AVISO_NO_REAJUSTAR} />
        </div>
      </SectionCard>

      {/* Actividad 8 */}
      <SectionCard title={`8. Triturar las uvas del grupo ${g}`} subtitle="Una sola pasada por los rodillos" icon={Cog}>
        <div className="flex flex-col gap-4">
          <Checklist items={CHECK_ACT8} checks={p.checks} onToggle={alternar} />
          <Aviso tono="info" titulo={AVISO_UNA_PASADA} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="kg triturados" required error={ev.errorKg} ayuda={`Clasificados: ${kg(ev.kgClasificado)}`}>
              <NumeroInput unidad="kg" value={p.kgTriturados} onChange={(kgTriturados) => set((x) => ({ ...x, kgTriturados }))} error={ev.errorKg} />
            </FormField>
            <FormField label="Hora de inicio" required>
              <StyledInput type="time" value={p.inicio} onChange={(e) => set((x) => ({ ...x, inicio: e.target.value }))} />
            </FormField>
            <FormField label="Hora de fin" required>
              <StyledInput type="time" value={p.fin} onChange={(e) => set((x) => ({ ...x, fin: e.target.value }))} />
            </FormField>
          </div>

          {perdidas.map((rt) => (
            <div key={rt.id} className="flex flex-col gap-2">
              <Aviso tono="error" titulo={`${INCIDENCIA_PERDIDA_ID}: ${AVISO_PERDIDA_ID}`} />
              <RetencionForm
                rt={rt}
                desde="salida afectada"
                onChange={(fn) => setRet(rt.id, fn)}
                onQuitar={() => confirm("¿Quitar esta incidencia?") && set((x) => ({ ...x, retenciones: x.retenciones.filter((y) => y.id !== rt.id) }))}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => set((x) => ({ ...x, retenciones: [...x.retenciones, retencionNueva(nuevoId(), "perdida_identificacion")] }))}
            className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-white text-sm font-bold text-red-700 hover:bg-red-50"
          >
            <TriangleAlert className="w-4 h-4" /> {INCIDENCIA_PERDIDA_ID}
          </button>
        </div>
      </SectionCard>

      {/* Actividad 9 */}
      <SectionCard title="9. Comprobar la apertura de piel y la integridad de las semillas" subtitle="Al inicio, tras una parada o ajuste y al final" icon={FlaskConical}>
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-2">
            {INSTRUCCIONES_ACT9.map((x, i) => (
              <li key={i} className="flex gap-2 text-sm font-medium text-slate-700">
                <span className="flex-shrink-0 text-xs font-bold font-mono px-2 py-0.5 h-fit rounded-md bg-marine/10 text-marine">{i + 1}</span>
                {x}
              </li>
            ))}
          </ol>

          {ev.controles.map((c, i) => (
            <ControlDelGrupo
              key={c.control.id}
              ev={c}
              numero={i + 1}
              onControl={(cambios) => setControl(c.control.id, cambios)}
              onQuitar={() => {
                if (!confirm("¿Quitar este control?")) return;
                set((x) => ({
                  ...x,
                  controles: x.controles.filter((y) => y.id !== c.control.id),
                  retenciones: x.retenciones.filter((rt) => rt.controlId !== c.control.id),
                }));
              }}
              onRetener={() =>
                set((x) => ({
                  ...x,
                  retenciones: [
                    ...x.retenciones,
                    retencionNueva(nuevoId(), "control", { controlId: c.control.id, desdeControlId: c.ultimoConformeAnterior?.id ?? "" }),
                  ],
                }), true)
              }
              onRetencion={(fn) => c.retencion && setRet(c.retencion.id, fn)}
            />
          ))}

          <div className="flex flex-wrap gap-2">
            {!tieneInicio ? (
              <BotonControl onClick={() => agregarControl("inicio")}>Control de inicio</BotonControl>
            ) : (
              <>
                <BotonControl onClick={() => agregarControl("tras_parada")}>Control tras parada o ajuste</BotonControl>
                <BotonControl onClick={() => agregarControl("final")}>Control final</BotonControl>
              </>
            )}
          </div>
        </div>
      </SectionCard>

      {ev.completo ? (
        <Aviso tono="ok" titulo={`Grupo ${g} completo`}>
          Siguiente en la secuencia: aplique la actividad 7 para el próximo grupo.
        </Aviso>
      ) : (
        <ul className="flex flex-col gap-1 p-3 rounded-xl bg-slate-100 border border-slate-200">
          <li className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Para completar el grupo {g}</li>
          {ev.faltantes.map((f) => (
            <li key={f} className="text-xs font-medium text-slate-600">
              • {f}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function BotonControl({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-marine hover:bg-slate-50"
    >
      <Plus className="w-4 h-4" /> {children}
    </button>
  );
}

function ControlDelGrupo({
  ev,
  numero,
  onControl,
  onQuitar,
  onRetener,
  onRetencion,
}: {
  ev: ControlEvaluado;
  numero: number;
  onControl: (cambios: Partial<ControlApertura>) => void;
  onQuitar: () => void;
  onRetener: () => void;
  onRetencion: (fn: (r: Retencion) => Retencion) => void;
}) {
  const c = ev.control;
  const malo = ev.resultado === "no_conforme" || ev.resultado === "no_evaluable";
  const desde = ev.ultimoConformeAnterior
    ? `desde el control conforme de las ${ev.ultimoConformeAnterior.hora}`
    : "desde el inicio del grupo";
  return (
    <div className={`rounded-xl border p-3 sm:p-4 flex flex-col gap-4 ${malo ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black text-marine flex items-center gap-2">
          Control {numero} · {MOMENTO[c.momento]} <BadgeResultadoControl resultado={ev.resultado} />
        </p>
        <button type="button" onClick={onQuitar} className="p-2 rounded-lg text-slate-400 hover:text-red-600" aria-label={`Quitar control ${numero}`}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <ControlAperturaForm control={c} onChange={onControl} />
      {malo && (
        <div className="flex flex-col gap-3">
          <Aviso tono="error" titulo="Deje de alimentar, pare y mantenga identificado el material generado">
            Se retiene el material {desde}. Solicite la corrección, repita el control y continúe solo con la conformidad
            de Producción y la disposición de Calidad o Enología.
          </Aviso>
          {ev.retencion ? (
            <RetencionForm rt={ev.retencion} desde={desde} onChange={onRetencion} />
          ) : (
            <button
              type="button"
              onClick={onRetener}
              className="self-start px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold border border-amber-600 hover:bg-amber-600"
            >
              Registrar el material retenido
            </button>
          )}
        </div>
      )}
    </div>
  );
}
