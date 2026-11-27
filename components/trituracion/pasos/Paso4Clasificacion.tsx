"use client";

import React from "react";
import { CheckSquare, Layers, Lock, Plus, Square, Trash2 } from "lucide-react";
import { DECIMALES } from "@/lib/config/recepcion";
import { GRUPOS, SECUENCIA_TRITURACION, type Grupo } from "@/lib/config/trituracion";
import {
  AVISO_ACT4,
  AVISO_NUEVA_TANDA,
  CHECK_ACT4,
  CHECK_ACT5,
  CHECK_ACT6,
  CRITERIO_ACT6,
  DEFINICION_GRUPOS,
  EJEMPLO_ACT5,
  REGLA_MERMA,
} from "@/lib/config/trituracion-textos";
import { horaLocalAhora, nuevoId } from "@/lib/recepcion/borrador";
import { formatear } from "@/lib/recepcion/validacion";
import { faltantesCerrarTanda, tandaPendienteDeTriturar } from "@/lib/trituracion/pasos";
import { grupoCompleto } from "@/lib/trituracion/proceso";
import {
  evaluarRecipiente,
  fraccionNueva,
  NOMBRE_FRACCION,
  recipienteNuevo,
  tandaNueva,
  tandaTriturada,
  totalesTanda,
} from "@/lib/trituracion/registro";
import type { Fraccion, Recipiente, RegistroTrituracion, Tanda, TipoFraccion } from "@/lib/trituracion/tipos";
import { Aviso, Checklist, NumeroInput, SectionCard, StyledInput } from "@/components/recepcion/WizardUI";
import { PokaYokeCribas } from "../PokaYokeCribas";
import type { Cambiar } from "../AsistenteTrituracion";

const kg = (n: number) => `${formatear(n, DECIMALES.kg)} kg`;

/** Paso 4 — Clasificar por cribas e identificar los grupos (actividades 4, 5 y 6). */
export function Paso4Clasificacion({
  r,
  huboFrutaRota,
  onToggle,
  cambiar,
}: {
  r: RegistroTrituracion;
  huboFrutaRota: boolean;
  onToggle: (id: string) => void;
  cambiar: Cambiar;
}) {
  const abierta = r.tandas.find((t) => !t.cerrada) ?? null;
  const setTanda = (numero: number, fn: (t: Tanda) => Tanda) =>
    cambiar((x) => ({ ...x, tandas: x.tandas.map((t) => (t.numero === numero ? fn(t) : t)) }));

  const totalClasificado = r.tandas.reduce((s, t) => s + totalesTanda(t).clasificado + totalesTanda(t).totalFracciones, 0);
  const superaEntrada = totalClasificado > r.entrada.pesoDisponibleKg + 0.0005;

  function abrirTanda() {
    if (abierta) return;
    const pendiente = tandaPendienteDeTriturar(r);
    if (pendiente && !confirm(`La tanda ${pendiente.numero} está cerrada y aún no se trituró.\n\n${AVISO_NUEVA_TANDA}\n\n¿Abrir otra tanda de todos modos?`)) {
      return;
    }
    cambiar((x) => ({ ...x, tandas: [...x.tandas, tandaNueva(x.tandas.length + 1)] }));
  }

  function cerrarTanda(t: Tanda) {
    if (!confirm(`¿Cerrar la tanda ${t.numero}? Quedará bloqueada para clasificación y lista para triturar.`)) return;
    setTanda(t.numero, (x) => ({ ...x, cerrada: true, cerradaEn: new Date().toISOString() }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PokaYokeCribas />

      <SectionCard title="4. Pasar las bayas del depósito a las cribas" subtitle="Una sola capa sobre la criba de 20 mm" icon={Layers}>
        <div className="flex flex-col gap-4">
          <Checklist items={CHECK_ACT4} checks={r.checks} onToggle={onToggle} />
          <Aviso tono="alerta" titulo={AVISO_ACT4} />
        </div>
      </SectionCard>

      <SectionCard title="5. Recoger las uvas en tres recipientes separados" subtitle="G y M de las cribas; P debajo de la segunda" icon={Layers}>
        <div className="flex flex-col gap-4">
          <Checklist items={CHECK_ACT5} checks={r.checks} onToggle={onToggle} />
          <p className="text-xs font-medium text-slate-500">Ejemplo práctico: {EJEMPLO_ACT5}</p>
        </div>
      </SectionCard>

      {huboFrutaRota && (
        <Aviso tono="alerta" titulo="En la salida del despalillado se registró FRUTA ROTA">
          Registre sus kg como fracción separada de la tanda (FRUTA ROTA).
        </Aviso>
      )}

      {/* Tandas */}
      {r.tandas.map((t) =>
        t.cerrada ? (
          <TandaCerrada key={t.numero} t={t} />
        ) : (
          <TandaAbierta
            key={t.numero}
            t={t}
            setTanda={(fn) => setTanda(t.numero, fn)}
            onCerrar={() => cerrarTanda(t)}
            onDescartar={() => {
              if (!confirm(`¿Descartar la tanda ${t.numero}? Se perderán sus recipientes y fracciones.`)) return;
              cambiar((x) => ({ ...x, tandas: x.tandas.filter((y) => y.numero !== t.numero) }));
            }}
          />
        ),
      )}

      {superaEntrada && (
        <Aviso tono="info" titulo={`La suma clasificada y separada (${kg(totalClasificado)}) supera el peso de entrada (${kg(r.entrada.pesoDisponibleKg)})`}>
          Revise los pesos de los recipientes y sus taras.
        </Aviso>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={abrirTanda}
          disabled={!!abierta}
          className="self-start flex items-center gap-2 px-5 py-3 rounded-xl bg-marine text-white text-sm font-bold border border-marine-dark hover:bg-marine-light disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
        >
          <Plus className="w-4 h-4" /> Nueva tanda
        </button>
        {abierta && <p className="text-xs font-medium text-slate-500">Cierre la tanda {abierta.numero} antes de abrir otra.</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Tanda cerrada (solo lectura)
// ─────────────────────────────────────────
function TandaCerrada({ t }: { t: Tanda }) {
  const tot = totalesTanda(t);
  const triturada = tandaTriturada(t, SECUENCIA_TRITURACION, grupoCompleto);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50">
        <Lock className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-black text-marine">Tanda {t.numero}</h3>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
            triturada ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-sky-50 text-sky-800 border-sky-200"
          }`}
        >
          {triturada ? "Triturada" : "Cerrada · lista para triturar"}
        </span>
      </div>
      <div className="p-4 sm:p-5 grid grid-cols-3 gap-3">
        {GRUPOS.map((g) => (
          <div key={g} className="rounded-xl border border-gold/40 bg-gold/5 p-3">
            <p className="text-xs font-black text-marine">
              {g} · {DEFINICION_GRUPOS[g].nombre}
            </p>
            <p className="font-mono font-black text-marine">{t.grupos[g].noAparecio ? "0 kg · no apareció" : kg(tot.grupos[g])}</p>
            <p className="text-[11px] text-slate-500">{t.grupos[g].recipientes.length} recipiente(s)</p>
          </div>
        ))}
      </div>
      {t.fracciones.length > 0 && (
        <p className="px-4 sm:px-5 pb-4 text-xs font-medium text-slate-600">
          Fracciones separadas:{" "}
          {(Object.keys(tot.fracciones) as TipoFraccion[])
            .filter((k) => tot.fracciones[k] > 0)
            .map((k) => `${NOMBRE_FRACCION[k]} ${kg(tot.fracciones[k])}`)
            .join(" · ") || "0 kg"}
        </p>
      )}
    </section>
  );
}

// ─────────────────────────────────────────
// Tanda abierta (en clasificación)
// ─────────────────────────────────────────
function TandaAbierta({
  t,
  setTanda,
  onCerrar,
  onDescartar,
}: {
  t: Tanda;
  setTanda: (fn: (t: Tanda) => Tanda) => void;
  onCerrar: () => void;
  onDescartar: () => void;
}) {
  const tot = totalesTanda(t);
  const faltan = faltantesCerrarTanda(t);
  const alternar = (id: string) => setTanda((x) => ({ ...x, checks: { ...x.checks, [id]: !x.checks[id] } }));

  return (
    <SectionCard title={`Tanda ${t.numero} · en clasificación`} subtitle="6. Identificar los recipientes y cerrar la tanda" icon={Layers}>
      <div className="flex flex-col gap-5">
        <Checklist items={CHECK_ACT6} checks={t.checks} onToggle={alternar} />
        <p className="text-xs font-medium text-slate-500">{CRITERIO_ACT6}</p>

        {GRUPOS.map((g) => (
          <GrupoTanda key={g} t={t} g={g} total={tot.grupos[g]} setTanda={setTanda} />
        ))}

        <Fracciones t={t} setTanda={setTanda} />

        <div className="rounded-xl border border-marine/20 bg-slate-50 p-4 flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Total de la tanda {t.numero}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm font-bold text-marine">
            {GRUPOS.map((g) => (
              <span key={g}>
                {g}: {kg(tot.grupos[g])}
              </span>
            ))}
            <span>Clasificado: {kg(tot.clasificado)}</span>
            <span>Separado: {kg(tot.totalFracciones)}</span>
          </div>
          <p className="text-xs font-bold text-slate-600">{REGLA_MERMA}</p>
        </div>

        {faltan.length > 0 && (
          <ul className="flex flex-col gap-1 p-3 rounded-xl bg-slate-100 border border-slate-200">
            {faltan.map((f) => (
              <li key={f} className="text-xs font-medium text-slate-600">
                • {f}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onCerrar}
          disabled={faltan.length > 0}
          className="self-start flex items-center gap-2 px-5 py-3 rounded-xl bg-gold text-white text-sm font-bold border border-gold-dark hover:bg-gold-dark disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
        >
          <Lock className="w-4 h-4" /> Cerrar tanda {t.numero}
        </button>
        <button type="button" onClick={onDescartar} className="self-start text-xs font-bold text-red-700 hover:underline">
          Descartar la tanda {t.numero}
        </button>
      </div>
    </SectionCard>
  );
}

function GrupoTanda({ t, g, total, setTanda }: { t: Tanda; g: Grupo; total: number; setTanda: (fn: (t: Tanda) => Tanda) => void }) {
  const d = t.grupos[g];
  const setGrupo = (fn: (d: Tanda["grupos"][Grupo]) => Tanda["grupos"][Grupo]) =>
    setTanda((x) => ({ ...x, grupos: { ...x.grupos, [g]: fn(x.grupos[g]) } }));
  const setRec = (id: string, cambios: Partial<Recipiente>) =>
    setGrupo((x) => ({ ...x, recipientes: x.recipientes.map((rc) => (rc.id === id ? { ...rc, ...cambios } : rc)) }));
  const agregar = () =>
    setGrupo((x) => ({ ...x, recipientes: [...x.recipientes, recipienteNuevo(nuevoId(), g, t.numero, x.recipientes.length + 1, horaLocalAhora())] }));

  return (
    <div className="rounded-xl border border-gold/40 p-3 sm:p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black text-marine">
          <span className="inline-flex w-7 h-7 rounded-md bg-gold text-white font-mono items-center justify-center mr-2">{g}</span>
          {DEFINICION_GRUPOS[g].recipiente}
        </p>
        <span className="font-mono text-sm font-black text-marine">{d.noAparecio ? "0 kg" : kg(total)}</span>
      </div>
      <button
        type="button"
        role="checkbox"
        aria-checked={d.noAparecio}
        onClick={() => setGrupo((x) => ({ ...x, noAparecio: !x.noAparecio }))}
        className="self-start flex items-center gap-2 text-sm font-bold text-slate-600"
      >
        {d.noAparecio ? <CheckSquare className="w-5 h-5 text-marine" /> : <Square className="w-5 h-5 text-slate-300" />}
        No apareció (0 kg): se omite en la trituración de esta tanda
      </button>
      {!d.noAparecio && (
        <>
          {d.recipientes.map((rc) => {
            const e = evaluarRecipiente(rc);
            return (
              <div key={rc.id} className="grid grid-cols-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_5.5rem_6.5rem_2rem] gap-2 items-end p-2 rounded-lg bg-slate-50 border border-slate-200">
                <label className="col-span-2 sm:col-span-1 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-marine-light">Recipiente</span>
                  <StyledInput value={rc.identificador} onChange={(ev) => setRec(rc.id, { identificador: ev.target.value })} className="px-2.5! py-2! font-mono" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-marine-light">Peso bruto (kg)</span>
                  <NumeroInput compacto value={rc.brutoKg} onChange={(brutoKg) => setRec(rc.id, { brutoKg })} error={e.errorBruto} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-marine-light">Tara (kg)</span>
                  <NumeroInput compacto value={rc.taraKg} onChange={(taraKg) => setRec(rc.id, { taraKg })} error={e.errorTara} />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-marine-light">Neto</span>
                  <span className="py-2 font-mono text-sm font-black text-marine">{e.neto === null ? "—" : formatear(e.neto, DECIMALES.kg)}</span>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-marine-light">Hora</span>
                  <StyledInput type="time" value={rc.hora} onChange={(ev) => setRec(rc.id, { hora: ev.target.value })} className="px-2! py-2!" />
                </label>
                <button
                  type="button"
                  onClick={() => setGrupo((x) => ({ ...x, recipientes: x.recipientes.filter((y) => y.id !== rc.id) }))}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 justify-self-end"
                  aria-label={`Quitar ${rc.identificador}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {(e.errorBruto || e.errorTara) && (
                  <span className="col-span-2 sm:col-span-6 text-[11px] text-red-600 font-medium">{e.errorBruto ?? e.errorTara}</span>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={agregar}
            className="self-start flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-marine hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" />
            {d.recipientes.length === 0 ? `Recipiente ${g}` : "Recipiente adicional identificado del mismo grupo"}
          </button>
        </>
      )}
    </div>
  );
}

function Fracciones({ t, setTanda }: { t: Tanda; setTanda: (fn: (t: Tanda) => Tanda) => void }) {
  const set = (id: string, cambios: Partial<Fraccion>) =>
    setTanda((x) => ({ ...x, fracciones: x.fracciones.map((f) => (f.id === id ? { ...f, ...cambios } : f)) }));
  const agregar = (tipo: TipoFraccion) =>
    setTanda((x) => ({ ...x, fracciones: [...x.fracciones, fraccionNueva(nuevoId(), tipo, horaLocalAhora())] }));
  return (
    <div className="rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col gap-3">
      <p className="text-sm font-black text-marine">Fracciones separadas de la tanda</p>
      <p className="text-xs font-medium text-slate-500">Registre por separado fruta rota y remanentes medidos de la etapa, sin doble conteo. TALLOS es opcional.</p>
      {t.fracciones.map((f) => (
        <div key={f.id} className="grid grid-cols-2 sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.2fr)_6.5rem_2rem] gap-2 items-end p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="col-span-2 sm:col-span-1 text-xs font-black text-marine py-2">{NOMBRE_FRACCION[f.tipo]}</span>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-marine-light">kg</span>
            <NumeroInput compacto value={f.kg} onChange={(v) => set(f.id, { kg: v })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-marine-light">Recipiente</span>
            <StyledInput value={f.recipiente} onChange={(e) => set(f.id, { recipiente: e.target.value })} className="px-2.5! py-2!" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-marine-light">Hora</span>
            <StyledInput type="time" value={f.hora} onChange={(e) => set(f.id, { hora: e.target.value })} className="px-2! py-2!" />
          </label>
          <button
            type="button"
            onClick={() => setTanda((x) => ({ ...x, fracciones: x.fracciones.filter((y) => y.id !== f.id) }))}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 justify-self-end"
            aria-label={`Quitar ${NOMBRE_FRACCION[f.tipo]}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(NOMBRE_FRACCION) as TipoFraccion[]).map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => agregar(tipo)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-marine hover:bg-slate-50"
          >
            <Plus className="w-3.5 h-3.5" /> {NOMBRE_FRACCION[tipo]}
          </button>
        ))}
      </div>
    </div>
  );
}
