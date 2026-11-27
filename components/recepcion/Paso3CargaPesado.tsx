"use client";

import React, { memo, useCallback, useRef } from "react";
import { Clock, Plus, Scale, Trash2, Truck, Undo2 } from "lucide-react";
import { DECIMALES } from "@/lib/config/recepcion";
import {
  ATAJO_LIQUIDO_DESCONOCIDO,
  AVISO_INSPECCIONAR_CARGA,
  CHECK_CARGA,
  CHECK_PESADO,
  ID_CHECK_CARGA_OBSERVACIONES,
} from "@/lib/config/recepcion-textos";
import { nuevoId } from "@/lib/recepcion/borrador";
import { FILA_JABA_VACIA, listaCorta } from "@/lib/recepcion/evaluacion";
import type { EstadoPaso3 } from "@/lib/recepcion/pasos";
import type { BorradorLote, FilaJaba, FilaObsCarga } from "@/lib/recepcion/tipos";
import { FotosCampo } from "@/components/lote/FotosCampo";
import { formatear } from "@/lib/recepcion/validacion";
import { Aviso, Checklist, Interruptor, NumeroInput, SectionCard, SiNo, StyledInput } from "./WizardUI";

interface Paso3Props {
  borrador: BorradorLote;
  estado: EstadoPaso3;
  numJabas: number;
  onToggle: (id: string) => void;
  onCarga: (carga: BorradorLote["carga"]) => void;
  /** Agrega fotos a una observación (debe usar actualización funcional: la carga es asíncrona). */
  onAgregarFotosObservacion: (id: string, fotoIds: string[]) => void;
  /** Quita una foto de una observación y la descarta. */
  onQuitarFotoObservacion: (id: string, fotoId: string) => void;
  /** Quita una fila de observación y descarta sus fotos. */
  onQuitarObservacion: (id: string) => void;
  onUsoTara: (activo: boolean) => void;
  /** Actualiza la jaba de índice `i` (N° i+1). Debe ser estable (useCallback). */
  onJaba: (i: number, cambios: Partial<FilaJaba>) => void;
}

export function Paso3CargaPesado({
  borrador,
  estado,
  numJabas,
  onToggle,
  onCarga,
  onAgregarFotosObservacion,
  onQuitarFotoObservacion,
  onQuitarObservacion,
  onUsoTara,
  onJaba,
}: Paso3Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Sección A: Inspección de carga ── */}
      <SectionCard title="Inspección de carga" subtitle="Marque cada ítem al completarlo" icon={Truck}>
        <div className="flex flex-col gap-4">
          <Checklist
            items={CHECK_CARGA}
            checks={borrador.checks}
            onToggle={onToggle}
            extras={{
              [ID_CHECK_CARGA_OBSERVACIONES]: (
                <ObservacionesCarga
                  carga={borrador.carga}
                  numJabas={numJabas}
                  errores={estado.erroresObs}
                  onChange={onCarga}
                  onAgregarFotos={onAgregarFotosObservacion}
                  onQuitarFoto={onQuitarFotoObservacion}
                  onQuitar={onQuitarObservacion}
                />
              ),
            }}
          />
          {borrador.carga.hayObservaciones && estado.observacionesRegistradas > 0 && (
            <Aviso tono="alerta" titulo={AVISO_INSPECCIONAR_CARGA}>
              {estado.observacionesRegistradas === 1
                ? "Hay 1 observación registrada."
                : `Hay ${estado.observacionesRegistradas} observaciones registradas.`}{" "}
              El lote quedará RETENIDO hasta su evaluación.
            </Aviso>
          )}
        </div>
      </SectionCard>

      {/* ── Sección B: Pesado ── */}
      <SectionCard title="Pesado" subtitle="Registre el peso de cada jaba" icon={Scale}>
        <div className="flex flex-col gap-5">
          <Checklist items={CHECK_PESADO} checks={borrador.checks} onToggle={onToggle} />
          <Interruptor
            activo={borrador.pesado.usoFuncionTara}
            onChange={onUsoTara}
            etiqueta="Usé la función TARA de la balanza"
            descripcion="La lectura de la balanza ya es el peso neto de cada jaba; no se registra tara."
          />
          {numJabas === 0 ? (
            <Aviso tono="info">Indique el número de jabas en el paso 1 para registrar los pesos.</Aviso>
          ) : (
            <TablaJabas
              jabas={borrador.pesado.jabas}
              estado={estado}
              numJabas={numJabas}
              usoFuncionTara={borrador.pesado.usoFuncionTara}
              onJaba={onJaba}
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────
// Observaciones de carga
// ─────────────────────────────────────────
function ObservacionesCarga({
  carga,
  numJabas,
  errores,
  onChange,
  onAgregarFotos,
  onQuitarFoto,
  onQuitar,
}: {
  carga: BorradorLote["carga"];
  numJabas: number;
  errores: EstadoPaso3["erroresObs"];
  onChange: (carga: BorradorLote["carga"]) => void;
  onAgregarFotos: Paso3Props["onAgregarFotosObservacion"];
  onQuitarFoto: Paso3Props["onQuitarFotoObservacion"];
  onQuitar: Paso3Props["onQuitarObservacion"];
}) {
  const filaNueva = (): FilaObsCarga => ({ id: nuevoId(), jaba: "", descripcion: "", fotoIds: [] });

  function setHay(v: boolean) {
    const observaciones = v && carga.observaciones.length === 0 ? [filaNueva()] : carga.observaciones;
    onChange({ hayObservaciones: v, observaciones });
  }
  function setFila(id: string, cambios: { jaba?: string; descripcion?: string }) {
    onChange({
      ...carga,
      observaciones: carga.observaciones.map((o) => (o.id === id ? { ...o, ...cambios } : o)),
    });
  }
  function atajo(id: string, actual: string) {
    const t = actual.trim();
    if (t.toLowerCase().includes(ATAJO_LIQUIDO_DESCONOCIDO.toLowerCase())) return;
    setFila(id, { descripcion: t ? `${t}; ${ATAJO_LIQUIDO_DESCONOCIDO.toLowerCase()}` : ATAJO_LIQUIDO_DESCONOCIDO });
  }

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white">
      <SiNo pregunta="¿Hay observaciones?" value={carga.hayObservaciones} onChange={setHay} />

      {carga.hayObservaciones && (
        <div className="flex flex-col gap-3">
          {carga.observaciones.map((o, i) => (
            <div key={o.id} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-end gap-2">
                <div className="w-28 flex-shrink-0">
                  <label className="text-xs font-bold text-marine-light">N° de jaba</label>
                  <NumeroInput
                    entero
                    compacto
                    placeholder={numJabas > 0 ? `1–${numJabas}` : "N°"}
                    value={o.jaba}
                    onChange={(v) => setFila(o.id, { jaba: v })}
                    error={errores[o.id]?.jaba}
                    aria-label={`N° de jaba de la observación ${i + 1}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => atajo(o.id, o.descripcion)}
                  className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  + «{ATAJO_LIQUIDO_DESCONOCIDO.toLowerCase()}»
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (o.fotoIds.length > 0 && !confirm("Se eliminarán también las fotos de esta observación. ¿Continuar?")) return;
                    onQuitar(o.id);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                  title="Quitar observación"
                  aria-label={`Quitar observación ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {errores[o.id]?.jaba && <span className="text-xs text-red-600 font-medium">{errores[o.id]?.jaba}</span>}
              <div>
                <label className="text-xs font-bold text-marine-light">Descripción de lo observado</label>
                <StyledInput
                  placeholder="Ej. restos de aceite en el fondo de la caja"
                  value={o.descripcion}
                  onChange={(e) => setFila(o.id, { descripcion: e.target.value })}
                  className="py-2!"
                />
              </div>
              <FotosCampo
                nombre={`la observación ${i + 1}`}
                fotoIds={o.fotoIds}
                onAgregar={(ids) => onAgregarFotos(o.id, ids)}
                onQuitar={(fotoId) => onQuitarFoto(o.id, fotoId)}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...carga, observaciones: [...carga.observaciones, filaNueva()] })}
            className="self-start flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold text-marine hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar observación
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Tabla de pesado por jaba
// ─────────────────────────────────────────
function TablaJabas({
  jabas,
  estado,
  numJabas,
  usoFuncionTara,
  onJaba,
}: {
  jabas: FilaJaba[];
  estado: EstadoPaso3;
  numJabas: number;
  usoFuncionTara: boolean;
  onJaba: (i: number, cambios: Partial<FilaJaba>) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const { pesado } = estado;
  const registradas = pesado.filas.filter((f) => f.completa).length;

  // Enter (o "Siguiente" del teclado) pasa al siguiente campo de la tabla.
  const alPresionarTecla = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const campos = Array.from(contenedor.current?.querySelectorAll<HTMLInputElement>("input[data-nav]") ?? []);
    const siguiente = campos[campos.indexOf(e.currentTarget) + 1];
    if (siguiente) {
      siguiente.focus();
      siguiente.select();
    } else {
      e.currentTarget.blur();
    }
  }, []);

  const columnas = usoFuncionTara
    ? "grid-cols-[2.25rem_minmax(0,1fr)]"
    : "grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_4.25rem]";

  return (
    <div className="flex flex-col gap-4">
      <div ref={contenedor} className="rounded-xl border border-slate-200 overflow-hidden">
        <div
          className={`grid ${columnas} gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider`}
        >
          <span>N°</span>
          {usoFuncionTara ? (
            <span>Peso neto (kg)</span>
          ) : (
            <>
              <span>Lleno (kg)</span>
              <span>Tara (kg)</span>
              <span className="text-right">Neto</span>
            </>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {pesado.filas.map((f, i) => (
            <FilaJabaRow
              key={f.numero}
              indice={i}
              fila={jabas[i] ?? FILA_JABA_VACIA}
              neto={f.neto}
              errorLleno={f.errorLleno}
              errorTara={f.errorTara}
              usoFuncionTara={usoFuncionTara}
              columnas={columnas}
              onJaba={onJaba}
              onKeyDown={alPresionarTecla}
            />
          ))}
        </div>
      </div>

      {pesado.pendientes.length > 0 && (
        <Aviso tono="alerta" titulo={`Tara pendiente en ${pesado.pendientes.length} jaba(s)`}>
          Jabas N° {listaCorta(pesado.pendientes, 10)}. Complete la tara cuando la descarga esté autorizada (desde
          el detalle del lote en Reportes). Mientras tanto, el peso total es parcial y el lote quedará RETENIDO.
        </Aviso>
      )}

      {/* Total */}
      <div className="rounded-2xl border border-marine/20 bg-marine text-white p-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 shadow-md shadow-marine/20">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-light">Peso neto total (kg)</p>
          <p className="text-4xl sm:text-5xl font-black font-mono mt-1">{formatear(pesado.total, DECIMALES.kg)}</p>
        </div>
        <div className="text-sm font-medium text-white/80 sm:text-right">
          <p>
            Jabas registradas: <span className="font-bold text-white">{registradas}</span> de {numJabas}
          </p>
          {pesado.parcial && (
            <p className="mt-1 inline-flex px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 text-xs font-bold">
              Total parcial
              {pesado.pendientes.length > 0 && ` · ${pesado.pendientes.length} tara(s) pendiente(s)`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const FilaJabaRow = memo(function FilaJabaRow({
  indice,
  fila,
  neto,
  errorLleno,
  errorTara,
  usoFuncionTara,
  columnas,
  onJaba,
  onKeyDown,
}: {
  indice: number;
  fila: FilaJaba;
  neto: number | null;
  errorLleno: string | null;
  errorTara: string | null;
  usoFuncionTara: boolean;
  columnas: string;
  onJaba: (i: number, cambios: Partial<FilaJaba>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const numero = indice + 1;
  const error = errorLleno ?? errorTara;
  return (
    <div className={`px-3 py-2 ${error ? "bg-red-50/50" : fila.taraPendiente && !usoFuncionTara ? "bg-amber-50/50" : ""}`}>
      <div className={`grid ${columnas} gap-2 items-center`}>
        <span className="font-mono text-sm font-bold text-marine">{numero}</span>
        <NumeroInput
          compacto
          data-nav
          enterKeyHint="next"
          placeholder="0,00"
          value={fila.pesoLleno}
          onChange={(v) => onJaba(indice, { pesoLleno: v })}
          onKeyDown={onKeyDown}
          error={errorLleno}
          aria-label={usoFuncionTara ? `Peso neto jaba ${numero}` : `Peso lleno jaba ${numero}`}
        />
        {!usoFuncionTara && (
          <>
            {fila.taraPendiente ? (
              <button
                type="button"
                onClick={() => onJaba(indice, { taraPendiente: false })}
                className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-amber-300 bg-amber-100 text-xs font-bold text-amber-800"
                title="Registrar la tara ahora"
              >
                <Undo2 className="w-3.5 h-3.5" /> Pendiente
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <div className="flex-1 min-w-0">
                  <NumeroInput
                    compacto
                    data-nav
                    enterKeyHint="next"
                    placeholder="0,00"
                    value={fila.tara}
                    onChange={(v) => onJaba(indice, { tara: v })}
                    onKeyDown={onKeyDown}
                    error={errorTara}
                    aria-label={`Tara jaba ${numero}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onJaba(indice, { taraPendiente: true, tara: "" })}
                  className="flex-shrink-0 p-1.5 rounded-md text-slate-400 hover:text-amber-700 hover:bg-amber-50"
                  title="Marcar tara pendiente"
                  aria-label={`Marcar tara pendiente en jaba ${numero}`}
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            )}
            <span className="text-right font-mono text-sm font-bold text-marine">
              {fila.taraPendiente ? <span className="text-amber-700 text-xs">pend.</span> : formatear(neto, DECIMALES.kg)}
            </span>
          </>
        )}
      </div>
      {error && <p className="mt-1 pl-[2.75rem] text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
});
