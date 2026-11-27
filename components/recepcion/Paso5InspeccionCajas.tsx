"use client";

import React, { useRef, useState } from "react";
import { Camera, Eye, ImagePlus, Loader2, Recycle, Wind, X } from "lucide-react";
import { DECIMALES, FOTOS } from "@/lib/config/recepcion";
import {
  AVISO_PARAMETRO_OBSERVADO,
  INSTRUCCIONES_INSPECCION_CAJAS,
  INSTRUCCION_SEPARACION,
  PARAMETROS_VISUALES,
  type DefinicionParametroVisual,
} from "@/lib/config/recepcion-textos";
import { listaCorta } from "@/lib/recepcion/evaluacion";
import { agregarFoto } from "@/lib/recepcion/fotos";
import { FotoMiniatura } from "@/components/lote/FotoMiniatura";
import type { EstadoPaso5 } from "@/lib/recepcion/pasos";
import type { BorradorLote, ClaveParametroVisual, ParamVisualBorrador } from "@/lib/recepcion/tipos";
import { formatear } from "@/lib/recepcion/validacion";
import { Aviso, FormField, NumeroInput, SectionCard, SiNo, StyledInput, inputBaseClasses } from "./WizardUI";

interface Paso5Props {
  borrador: BorradorLote;
  estado: EstadoPaso5;
  /** "Se observa" / "No se observa" (al pasar a "No se observa" se borran sus fotos). */
  onObservado: (clave: ClaveParametroVisual, observado: boolean) => void;
  onComentario: (clave: ClaveParametroVisual, comentario: string) => void;
  onAgregarFotos: (clave: ClaveParametroVisual, ids: string[]) => void;
  onQuitarFoto: (clave: ClaveParametroVisual, id: string) => void;
  onCajas: (cambios: Partial<Pick<BorradorLote["cajas"], "decisionEnologia" | "materiaExtranaKg" | "uvaDaniadaKg">>) => void;
}

export function Paso5InspeccionCajas({
  borrador,
  estado,
  onObservado,
  onComentario,
  onAgregarFotos,
  onQuitarFoto,
  onCajas,
}: Paso5Props) {
  const { contenido } = estado;
  const seleccion = contenido.detalle.map((d) => d.jaba);
  const nombres = Object.fromEntries(PARAMETROS_VISUALES.map((p) => [p.clave, p.nombre]));

  return (
    <div className="flex flex-col gap-6">
      {/* ── Instrucciones ── */}
      <SectionCard
        title="Inspección de las cajas"
        subtitle={seleccion.length ? `Jabas seleccionadas: N° ${listaCorta(seleccion, 15)}` : undefined}
        icon={Eye}
      >
        <ol className="flex flex-col gap-3">
          {INSTRUCCIONES_INSPECCION_CAJAS.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700 font-medium leading-relaxed">
              <span className="flex-shrink-0 text-xs font-bold font-mono px-2 py-0.5 h-fit rounded-md bg-marine/10 text-marine">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </SectionCard>

      {/* ── Parámetros ── */}
      <div className="flex flex-col gap-4">
        {PARAMETROS_VISUALES.map((def) => (
          <TarjetaParametro
            key={def.clave}
            def={def}
            valor={borrador.cajas.parametros[def.clave]}
            onObservado={onObservado}
            onComentario={onComentario}
            onAgregarFotos={onAgregarFotos}
            onQuitarFoto={onQuitarFoto}
          />
        ))}
      </div>

      {estado.observados.length > 0 && (
        <div className="flex flex-col gap-4">
          <Aviso tono="alerta" titulo={AVISO_PARAMETRO_OBSERVADO}>
            Parámetros observados: {estado.observados.map((c) => nombres[c]).join(", ")}. El lote quedará RETENIDO hasta
            su evaluación.
          </Aviso>
          <FormField label="Decisión de Enología" required error={estado.errores.decision}>
            <textarea
              rows={3}
              value={borrador.cajas.decisionEnologia}
              onChange={(e) => onCajas({ decisionEnologia: e.target.value })}
              placeholder="Quién decide y qué se hace con el lote (p. ej. retirar racimos afectados, segregar jabas, rechazar)"
              className={`${inputBaseClasses} resize-y ${
                estado.errores.decision && borrador.cajas.decisionEnologia.trim() === "" ? "border-amber-400" : ""
              }`}
            />
          </FormField>
        </div>
      )}

      {/* ── Separación de hallazgos ── */}
      <SectionCard title="Separación de hallazgos" subtitle="Porcentajes sobre el contenido inspeccionado" icon={Recycle}>
        <div className="flex flex-col gap-5">
          <p className="text-sm text-slate-700 font-medium leading-relaxed">{INSTRUCCION_SEPARACION}</p>

          {/* Contenido inspeccionado */}
          <div className="rounded-2xl border border-marine/20 bg-marine text-white p-4 sm:p-5 shadow-md shadow-marine/20">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-light">kg de contenido inspeccionado</p>
            <p className="text-3xl sm:text-4xl font-black font-mono mt-1">
              {formatear(contenido.kg, DECIMALES.kg)}
              {contenido.provisional && (
                <span className="ml-2 align-middle inline-flex px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 text-xs font-bold">
                  Provisional
                </span>
              )}
            </p>
            <p className="text-xs text-white/70 font-medium mt-1">Suma de los pesos netos (paso 3) de las jabas seleccionadas</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {contenido.detalle.map((d) => (
                <span
                  key={d.jaba}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                    d.neto === null ? "bg-amber-400/20 text-amber-200" : "bg-white/10 text-white/90"
                  }`}
                >
                  N° {d.jaba}: {d.neto === null ? "sin neto" : `${formatear(d.neto, DECIMALES.kg)} kg`}
                </span>
              ))}
            </div>
          </div>

          {contenido.provisional && (
            <Aviso tono="alerta" titulo={`Falta la tara de la jaba N° ${listaCorta(contenido.sinNeto, 10)}`}>
              El contenido inspeccionado y los porcentajes son provisionales: no incluyen esa jaba. Se recalcularán al
              completar la tara desde el detalle del lote.
            </Aviso>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoSeparado
              etiqueta="Peso de materia extraña (kg)"
              formula="Materia extraña (%) = kg de materia extraña ÷ kg de contenido inspeccionado × 100"
              valor={borrador.cajas.materiaExtranaKg}
              onChange={(v) => onCajas({ materiaExtranaKg: v })}
              error={estado.errores.materiaExtranaKg}
              pct={estado.materiaExtranaPct}
              provisional={contenido.provisional}
            />
            <CampoSeparado
              etiqueta="Peso de uva dañada (kg)"
              formula="Uva dañada (%) = kg de uva dañada ÷ kg de contenido inspeccionado × 100"
              valor={borrador.cajas.uvaDaniadaKg}
              onChange={(v) => onCajas({ uvaDaniadaKg: v })}
              error={estado.errores.uvaDaniadaKg}
              pct={estado.uvaDaniadaPct}
              provisional={contenido.provisional}
            />
          </div>

          {estado.errores.exceso && <Aviso tono="error" titulo={estado.errores.exceso} />}
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────
// Campo de kg separado con su porcentaje
// ─────────────────────────────────────────
function CampoSeparado({
  etiqueta,
  formula,
  valor,
  onChange,
  error,
  pct,
  provisional,
}: {
  etiqueta: string;
  formula: string;
  valor: string;
  onChange: (v: string) => void;
  error?: string;
  pct: number | null;
  provisional: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
      <FormField label={etiqueta} required error={error} ayuda="Ingrese 0 si no hubo hallazgos">
        <NumeroInput unidad="kg" placeholder="0.00" value={valor} onChange={onChange} error={error} />
      </FormField>
      <p className="text-[11px] text-slate-500 font-medium leading-snug">{formula}</p>
      <p className="text-sm font-bold text-marine">
        = <span className="font-mono text-lg">{pct === null ? "—" : `${formatear(pct, DECIMALES.porcentaje)} %`}</span>
        {provisional && pct !== null && <span className="ml-1.5 text-xs text-amber-700">(provisional)</span>}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────
// Tarjeta de un parámetro visual
// ─────────────────────────────────────────
function TarjetaParametro({
  def,
  valor,
  onObservado,
  onComentario,
  onAgregarFotos,
  onQuitarFoto,
}: {
  def: DefinicionParametroVisual;
  valor: ParamVisualBorrador;
  onObservado: Paso5Props["onObservado"];
  onComentario: Paso5Props["onComentario"];
  onAgregarFotos: Paso5Props["onAgregarFotos"];
  onQuitarFoto: Paso5Props["onQuitarFoto"];
}) {
  const borde =
    valor.observado === true
      ? "border-amber-300 bg-amber-50/40"
      : valor.observado === false
        ? "border-emerald-200 bg-emerald-50/30"
        : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-colors ${borde}`}>
      <div className="flex gap-3 sm:gap-4">
        <div className="w-20 h-20 sm:w-28 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
          {def.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={def.imagen} alt={def.nombre} className="w-full h-full object-cover" />
          ) : (
            <Wind className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-marine">{def.nombre}</h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-1">{def.descripcion}</p>
        </div>
      </div>

      <div className="mt-4">
        <SiNo
          value={valor.observado}
          onChange={(v) => onObservado(def.clave, v)}
          etiquetaSi="Se observa"
          etiquetaNo="No se observa"
        />
      </div>

      {valor.observado && (
        <div className="mt-4 pt-4 border-t border-amber-200/70 flex flex-col gap-4">
          <FotosParametro
            clave={def.clave}
            nombre={def.nombre}
            fotoIds={valor.fotoIds}
            onAgregar={onAgregarFotos}
            onQuitar={onQuitarFoto}
          />
          <FormField label="N° de jaba / comentario" ayuda="Opcional">
            <StyledInput
              value={valor.comentario}
              onChange={(e) => onComentario(def.clave, e.target.value)}
              placeholder="Ej.: jaba 12, moho en 3 racimos del fondo"
            />
          </FormField>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Fotos de un parámetro (tomar / adjuntar, miniaturas)
// ─────────────────────────────────────────
function FotosParametro({
  clave,
  nombre,
  fotoIds,
  onAgregar,
  onQuitar,
}: {
  clave: ClaveParametroVisual;
  nombre: string;
  fotoIds: string[];
  onAgregar: Paso5Props["onAgregarFotos"];
  onQuitar: Paso5Props["onQuitarFoto"];
}) {
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ampliada, setAmpliada] = useState<string | null>(null);
  const restantes = FOTOS.maxPorParametro - fotoIds.length;

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []).slice(0, Math.max(0, restantes));
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (archivos.length === 0) return;
    setProcesando(true);
    setError(null);
    const ids: string[] = [];
    try {
      for (const a of archivos) ids.push(await agregarFoto(a));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la foto.");
    } finally {
      if (ids.length) onAgregar(clave, ids);
      setProcesando(false);
    }
  }

  const boton =
    "inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-marine-light">Fotos</span>
        <span className="text-xs font-mono text-slate-500">
          {fotoIds.length} / {FOTOS.maxPorParametro}
        </span>
      </div>

      {fotoIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotoIds.map((id, i) => (
            <div key={id} className="relative">
              <button
                type="button"
                onClick={() => setAmpliada(id)}
                className="block w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                aria-label={`Ver foto ${i + 1} de ${nombre}`}
              >
                <FotoMiniatura id={id} alt={`Foto ${i + 1} de ${nombre}`} className="w-full h-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => onQuitar(clave, id)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-300 shadow flex items-center justify-center"
                aria-label={`Quitar foto ${i + 1}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {restantes > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={procesando}
            onClick={() => camara.current?.click()}
            className={`${boton} bg-marine text-white border-marine-dark hover:bg-marine-light`}
          >
            {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Tomar foto
          </button>
          <button
            type="button"
            disabled={procesando}
            onClick={() => galeria.current?.click()}
            className={`${boton} bg-white text-marine border-slate-300 hover:bg-slate-50`}
          >
            <ImagePlus className="w-4 h-4" />
            Adjuntar
          </button>
          <input ref={camara} type="file" accept="image/*" capture="environment" className="hidden" onChange={alElegir} />
          <input ref={galeria} type="file" accept="image/*" multiple className="hidden" onChange={alElegir} />
        </div>
      )}
      {procesando && <span className="text-xs text-slate-500 font-medium">Comprimiendo y guardando…</span>}
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}

      {ampliada && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${nombre}`}
          onClick={() => setAmpliada(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <FotoMiniatura id={ampliada} alt={`Foto de ${nombre}`} className="max-w-full max-h-full rounded-lg shadow-2xl" />
          <button
            type="button"
            onClick={() => setAmpliada(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 text-marine flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
