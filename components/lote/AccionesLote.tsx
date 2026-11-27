"use client";

import React, { useState } from "react";
import { Beaker, CheckSquare, Gavel, Scale, Square } from "lucide-react";
import { DECIMALES, LIMITES_ENTRADA, RANGOS } from "@/lib/config/recepcion";
import { AVISO_ACIDEZ_FUERA, CHECK_FINAL, PREGUNTA_ACIDEZ_CONFIRMADA } from "@/lib/config/recepcion-textos";
import type { Resultado } from "@/lib/recepcion/almacen";
import {
  accionesDisponibles,
  cambiarEstado,
  completarAcidez,
  completarTaras,
  validarFirmaAccion,
  validarTara,
  type AccionEstado,
} from "@/lib/recepcion/lote";
import type { LoteV2 } from "@/lib/recepcion/tipos";
import { formatear, redondear, validarNumero } from "@/lib/recepcion/validacion";
import {
  Aviso,
  FormField,
  NumeroInput,
  SectionCard,
  SiNo,
  StyledInput,
  inputBaseClasses,
} from "@/components/recepcion/WizardUI";

type Guardar = (nuevo: LoteV2) => Resultado;

const botonPrimario =
  "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-marine text-white border border-marine-dark hover:bg-marine-light shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:shadow-none";

/** Acciones del detalle: completar pendientes y cambiar el estado con firma. */
export function AccionesLote({ lote, onGuardar }: { lote: LoteV2; onGuardar: Guardar }) {
  const taraPendiente = lote.pesado.jabas.some((j) => j.taraPendiente);
  const a = lote.acidez;
  const acidezAbierta = a.pendiente || (a.conforme === false && !a.confirmadoPorLab);
  const retenido = lote.estado === "RETENIDO";

  if (!taraPendiente && !acidezAbierta && !retenido) return null;

  return (
    <div className="flex flex-col gap-6 print:hidden">
      <h2 className="text-lg font-black text-marine">Acciones</h2>
      {/* key: al guardar cambia updatedAt y el formulario se reinicia */}
      {taraPendiente && <CompletarTara key={`t-${lote.updatedAt}`} lote={lote} onGuardar={onGuardar} />}
      {acidezAbierta && <CompletarAcidez key={`a-${lote.updatedAt}`} lote={lote} onGuardar={onGuardar} />}
      {retenido && <CambiarEstado key={`e-${lote.updatedAt}`} lote={lote} onGuardar={onGuardar} />}
    </div>
  );
}

function Mensaje({ error, ok }: { error: string | null; ok: string | null }) {
  if (error) return <Aviso tono="error" titulo={error} />;
  if (ok) return <Aviso tono="ok" titulo={ok} />;
  return null;
}

// ─────────────────────────────────────────
// Tara pendiente
// ─────────────────────────────────────────
function CompletarTara({ lote, onGuardar }: { lote: LoteV2; onGuardar: Guardar }) {
  const pendientes = lote.pesado.jabas.filter((j) => j.taraPendiente);
  const [taras, setTaras] = useState<Record<number, string>>({});
  const [por, setPor] = useState("");
  const [error, setError] = useState<string | null>(null);

  const evaluadas = pendientes.map((j) => ({ jaba: j, v: validarTara(taras[j.numero] ?? "", j.pesoLleno) }));
  const validas = evaluadas.filter((e) => e.v.valor !== null);
  const hayError = evaluadas.some((e) => e.v.error);
  const puede = validas.length > 0 && !hayError && por.trim() !== "";

  function guardar() {
    if (!puede) return;
    const mapa = Object.fromEntries(validas.map((e) => [e.jaba.numero, e.v.valor as number]));
    const r = onGuardar(completarTaras(lote, mapa, por, new Date().toISOString()));
    setError(r.ok ? null : r.error);
  }

  return (
    <SectionCard
      title="Completar tara pendiente"
      subtitle={`${pendientes.length} jaba(s) sin tara · puede completar solo algunas`}
      icon={Scale}
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <div className="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 px-3 py-2 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
            <span>N°</span>
            <span>Lleno (kg)</span>
            <span>Tara (kg)</span>
            <span className="text-right">Neto</span>
          </div>
          {evaluadas.map(({ jaba, v }) => (
            <div key={jaba.numero} className="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 px-3 py-2 items-start">
              <span className="font-mono font-bold text-marine pt-2">{jaba.numero}</span>
              <span className="font-mono text-sm text-slate-600 pt-2">{formatear(jaba.pesoLleno, DECIMALES.kg)}</span>
              <div className="flex flex-col gap-1">
                <NumeroInput
                  compacto
                  aria-label={`Tara de la jaba ${jaba.numero}`}
                  placeholder="0.00"
                  value={taras[jaba.numero] ?? ""}
                  onChange={(t) => setTaras((prev) => ({ ...prev, [jaba.numero]: t }))}
                  error={v.error}
                />
                {v.error && <span className="text-[11px] text-red-600 font-medium">{v.error}</span>}
              </div>
              <span className="font-mono font-bold text-marine text-right pt-2">
                {v.valor !== null ? formatear(redondear(jaba.pesoLleno - v.valor), DECIMALES.kg) : "—"}
              </span>
            </div>
          ))}
        </div>
        <div className="sm:max-w-sm">
          <FormField label="Registrado por" required>
            <StyledInput value={por} onChange={(e) => setPor(e.target.value)} placeholder="Nombre y apellido" />
          </FormField>
        </div>
        <Mensaje error={error} ok={null} />
        <button type="button" disabled={!puede} onClick={guardar} className={`${botonPrimario} self-start`}>
          Guardar tara{validas.length > 1 ? "s" : ""}
          {validas.length > 0 ? ` (${validas.length})` : ""}
        </button>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────
// Acidez pendiente o sin confirmar
// ─────────────────────────────────────────
function CompletarAcidez({ lote, onGuardar }: { lote: LoteV2; onGuardar: Guardar }) {
  const a = lote.acidez;
  const [metodo, setMetodo] = useState(a.metodo);
  const [puntoFinal, setPuntoFinal] = useState(a.puntoFinal);
  const [valor, setValor] = useState(a.valor === null ? "" : String(a.valor));
  const [confirmado, setConfirmado] = useState<boolean | null>(null);
  const [por, setPor] = useState("");
  const [error, setError] = useState<string | null>(null);

  const v = validarNumero(valor, LIMITES_ENTRADA.acidezGL);
  const fuera = v.valor !== null && (v.valor < RANGOS.acidez.min || v.valor > RANGOS.acidez.max);
  const puede = metodo.trim() !== "" && puntoFinal.trim() !== "" && v.valor !== null && por.trim() !== "";

  function guardar() {
    if (!puede || v.valor === null) return;
    const r = onGuardar(
      completarAcidez(lote, { metodo, puntoFinal, valor: v.valor, confirmadoPorLab: fuera ? confirmado === true : undefined }, por, new Date().toISOString()),
    );
    setError(r.ok ? null : r.error);
  }

  return (
    <SectionCard
      title={a.pendiente ? "Registrar acidez del laboratorio" : "Confirmar acidez fuera de rango"}
      subtitle={`Rango de referencia: ${RANGOS.acidez.min} a ${RANGOS.acidez.max} g/L como ácido tartárico`}
      icon={Beaker}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Método" required>
            <StyledInput value={metodo} onChange={(e) => setMetodo(e.target.value)} placeholder="Ej.: titulación con NaOH 0,1 N" />
          </FormField>
          <FormField label="Punto final" required>
            <StyledInput value={puntoFinal} onChange={(e) => setPuntoFinal(e.target.value)} placeholder="Ej.: pH 8,2" />
          </FormField>
          <FormField label="Valor (g/L)" required error={v.error}>
            <NumeroInput
              unidad="g/L"
              value={valor}
              onChange={(t) => {
                setValor(t);
                setConfirmado(null);
              }}
              error={v.error}
            />
          </FormField>
        </div>
        {fuera && (
          <div className="flex flex-col gap-3">
            <Aviso tono="alerta" titulo={`${formatear(v.valor, DECIMALES.acidez)} g/L está fuera de rango`}>
              {AVISO_ACIDEZ_FUERA}
            </Aviso>
            <SiNo pregunta={PREGUNTA_ACIDEZ_CONFIRMADA} value={confirmado} onChange={setConfirmado} etiquetaSi="Sí, lo confirmó" etiquetaNo="Aún no" />
          </div>
        )}
        <div className="sm:max-w-sm">
          <FormField label="Registrado por" required>
            <StyledInput value={por} onChange={(e) => setPor(e.target.value)} placeholder="Nombre y apellido" />
          </FormField>
        </div>
        <Mensaje error={error} ok={null} />
        <button type="button" disabled={!puede} onClick={guardar} className={`${botonPrimario} self-start`}>
          Guardar acidez
        </button>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────
// Cambio de estado (solo lotes RETENIDOS)
// ─────────────────────────────────────────
const ETIQUETA_ACCION: Record<AccionEstado, string> = {
  liberar: "Liberar",
  liberarConObservaciones: "Liberar con observaciones",
  rechazar: "Rechazar",
};

function CambiarEstado({ lote, onGuardar }: { lote: LoteV2; onGuardar: Guardar }) {
  const disponibles = accionesDisponibles(lote);
  const [accion, setAccion] = useState<AccionEstado | null>(null);
  const [nombre, setNombre] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [destinoVerificado, setDestinoVerificado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errores = accion ? validarFirmaAccion(accion, { nombre, destino, motivo }) : {};
  const requiereVerificacion = accion === "liberar" || accion === "liberarConObservaciones";
  const puede = accion !== null && Object.keys(errores).length === 0 && (!requiereVerificacion || destinoVerificado);

  function confirmar() {
    if (!accion || !puede) return;
    const texto =
      accion === "rechazar"
        ? `¿Confirmar el RECHAZO del lote ${lote.codigoLote}? Esta decisión es final.`
        : `¿Confirmar la LIBERACIÓN del lote ${lote.codigoLote} hacia «${destino.trim()}»?`;
    if (!confirm(texto)) return;
    try {
      const r = onGuardar(cambiarEstado(lote, accion, { nombre, destino, motivo }, new Date().toISOString()));
      setError(r.ok ? null : r.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar el estado.");
    }
  }

  const conEnologia = accion === "liberarConObservaciones" || accion === "rechazar";

  return (
    <SectionCard title="Cambiar estado" subtitle="El lote está RETENIDO" icon={Gavel}>
      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="Acción" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.keys(ETIQUETA_ACCION) as AccionEstado[]).map((k) => {
            const d = disponibles[k];
            const activo = accion === k;
            const color =
              k === "rechazar" ? "bg-red-100 border-red-300 text-red-800" : "bg-emerald-100 border-emerald-300 text-emerald-800";
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={activo}
                disabled={!d.permitido}
                onClick={() => setAccion(k)}
                className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-bold transition-colors ${
                  activo
                    ? color
                    : d.permitido
                      ? "bg-white border-slate-200 text-marine hover:border-slate-300"
                      : "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {ETIQUETA_ACCION[k]}
                {!d.permitido && d.razon && <span className="block text-xs font-medium mt-1">{d.razon}</span>}
              </button>
            );
          })}
        </div>

        {accion && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <FormField label={conEnologia ? "Confirmado por (Enología)" : "Autorizado por"} required>
              <StyledInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" />
            </FormField>
            <FormField label="Destino" required ayuda="Código o tanque">
              <StyledInput value={destino} onChange={(e) => setDestino(e.target.value)} />
            </FormField>
            {conEnologia && (
              <div className="sm:col-span-2">
                <FormField label="Motivo" required>
                  <textarea
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className={`${inputBaseClasses} resize-y`}
                    placeholder={
                      accion === "rechazar" ? "Por qué se rechaza el lote" : "Por qué se libera pese a las observaciones"
                    }
                  />
                </FormField>
              </div>
            )}
            {requiereVerificacion && (
              <button
                type="button"
                role="checkbox"
                aria-checked={destinoVerificado}
                onClick={() => setDestinoVerificado((x) => !x)}
                className="sm:col-span-2 flex items-start gap-3 text-left p-3 rounded-xl border border-slate-200 bg-white"
              >
                {destinoVerificado ? (
                  <CheckSquare className="w-5 h-5 text-marine flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-marine">{CHECK_FINAL[0].texto}</span>
              </button>
            )}
          </div>
        )}

        <Mensaje error={error} ok={null} />
        {accion && (
          <button
            type="button"
            disabled={!puede}
            onClick={confirmar}
            className={`${botonPrimario} self-start ${accion === "rechazar" && puede ? "bg-red-600! border-red-700! hover:bg-red-700!" : ""}`}
          >
            Confirmar: {ETIQUETA_ACCION[accion].toLowerCase()}
          </button>
        )}
      </div>
    </SectionCard>
  );
}
