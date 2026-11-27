"use client";

import React from "react";
import { ClipboardList, Package, RefreshCw, Shuffle, Thermometer } from "lucide-react";
import { RANGOS } from "@/lib/config/recepcion";
import {
  CHECK_MUESTRA_BAYAS,
  CHECK_PREPARACION_MUESTRA,
  CHECK_TEMPERATURA,
  TEMPERATURA_CONFORME,
  TEMPERATURA_NO_CONFORME,
  textoTamanoMuestra,
} from "@/lib/config/recepcion-textos";
import { esMuestraTotal, listaCorta } from "@/lib/recepcion/evaluacion";
import type { EstadoPaso4 } from "@/lib/recepcion/pasos";
import type { BorradorLote, FilaMuestra } from "@/lib/recepcion/tipos";
import {
  Aviso,
  BadgeConformidad,
  Checklist,
  FormField,
  NumeroInput,
  SectionCard,
  useNavegacionEnter,
} from "./WizardUI";

interface Paso4Props {
  borrador: BorradorLote;
  estado: EstadoPaso4;
  numJabas: number;
  onToggle: (id: string) => void;
  onFila: (id: string, cambios: Partial<FilaMuestra>) => void;
  onRegenerar: () => void;
  onPesoBolsa: (valor: string) => void;
}

export function Paso4MuestreoTemperatura({
  borrador,
  estado,
  numJabas,
  onToggle,
  onFila,
  onRegenerar,
  onPesoBolsa,
}: Paso4Props) {
  const total = esMuestraTotal(numJabas);
  const { contenedor, alPresionarTecla } = useNavegacionEnter();
  const filasBorrador = borrador.muestreo.filas;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Tamaño de muestra ── */}
      <SectionCard title="Tamaño de muestra" subtitle="Jabas que se inspeccionan en los pasos 4 y 5" icon={Shuffle}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total de jabas</p>
              <p className="text-2xl sm:text-3xl font-black font-mono text-marine">{numJabas}</p>
            </div>
            <div className="rounded-xl border border-marine/20 bg-marine p-3 sm:p-4 text-white">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gold-light">A inspeccionar</p>
              <p className="text-2xl sm:text-3xl font-black font-mono">{estado.requeridas}</p>
            </div>
          </div>

          <Aviso tono="info" titulo={textoTamanoMuestra(estado.requeridas)}>
            {total
              ? `Con ${numJabas} jaba${numJabas === 1 ? "" : "s"} se inspeccionan todas.`
              : "Se sugiere esta selección aleatoria sin repetir. Puede cambiar cualquier número si toma otra jaba de la carga."}
          </Aviso>

          <div>
            <p className="text-sm font-bold text-marine-light mb-2">Jabas seleccionadas</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {estado.filas.map((f, i) => (
                <div key={f.id} className="flex flex-col gap-1">
                  {total ? (
                    <span className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold font-mono text-marine text-center">
                      N° {filasBorrador[i]?.jaba}
                    </span>
                  ) : (
                    <NumeroInput
                      compacto
                      entero
                      aria-label={`Jaba seleccionada ${i + 1}`}
                      value={filasBorrador[i]?.jaba ?? ""}
                      onChange={(v) => onFila(f.id, { jaba: v })}
                      error={f.errorJaba}
                      className="text-center font-mono font-bold"
                    />
                  )}
                  {f.errorJaba && <span className="text-[11px] text-red-600 font-medium text-center">{f.errorJaba}</span>}
                </div>
              ))}
            </div>
          </div>

          {!total && (
            <button
              type="button"
              onClick={onRegenerar}
              className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-marine/30 text-sm font-bold text-marine hover:bg-marine/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Generar otra selección
            </button>
          )}
        </div>
      </SectionCard>

      {/* ── Preparación ── */}
      <SectionCard title="Preparación" subtitle="Marque cada ítem al completarlo" icon={ClipboardList}>
        <Checklist items={CHECK_PREPARACION_MUESTRA} checks={borrador.checks} onToggle={onToggle} />
      </SectionCard>

      {/* ── Temperatura ── */}
      <SectionCard
        title="Medición de temperatura"
        subtitle={`Conforme si la lectura es ≤ ${RANGOS.temperatura.maxConforme} °C`}
        icon={Thermometer}
      >
        <div className="flex flex-col gap-5">
          <Checklist items={CHECK_TEMPERATURA} checks={borrador.checks} onToggle={onToggle} />

          <div>
            <p className="text-sm font-bold text-marine-light mb-2">Registro de temperaturas</p>
            <div ref={contenedor} className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {estado.filas.map((f, i) => (
                <div key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                  <span className="w-20 flex-shrink-0 text-sm font-bold text-marine font-mono">
                    Jaba {f.jaba ?? "—"}
                  </span>
                  <div className="w-28 flex-shrink-0">
                    <NumeroInput
                      compacto
                      data-nav
                      enterKeyHint="next"
                      aria-label={`Temperatura de la jaba ${f.jaba ?? i + 1} en °C`}
                      placeholder="°C"
                      value={filasBorrador[i]?.temperatura ?? ""}
                      onChange={(v) => onFila(f.id, { temperatura: v })}
                      onKeyDown={alPresionarTecla}
                      error={f.errorTemperatura}
                      className="font-mono"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 -ml-1">°C</span>
                  <div className="flex-1 min-w-[10rem]">
                    {f.errorTemperatura ? (
                      <span className="text-xs text-red-600 font-medium">{f.errorTemperatura}</span>
                    ) : f.conforme === true ? (
                      <BadgeConformidad estado="conforme" texto={TEMPERATURA_CONFORME} />
                    ) : f.conforme === false ? (
                      <BadgeConformidad estado="no_conforme" texto={TEMPERATURA_NO_CONFORME} />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {estado.noConformes.length > 0 && (
            <Aviso
              tono="alerta"
              titulo={`Temperatura mayor a ${RANGOS.temperatura.maxConforme} °C en la${
                estado.noConformes.length > 1 ? "s" : ""
              } jaba${estado.noConformes.length > 1 ? "s" : ""} N° ${listaCorta(estado.noConformes, 10)}`}
            >
              Avise a Enología. El lote quedará RETENIDO hasta su evaluación.
            </Aviso>
          )}
        </div>
      </SectionCard>

      {/* ── Muestra de bayas ── */}
      <SectionCard title="Muestra de bayas" subtitle="20 racimos × 5 bayas, en una bolsa rotulada" icon={Package}>
        <div className="flex flex-col gap-5">
          <Checklist items={CHECK_MUESTRA_BAYAS} checks={borrador.checks} onToggle={onToggle} />
          <div className="sm:max-w-xs">
            <FormField label="Peso de la bolsa con bayas (g)" required error={estado.errorBolsa}>
              <NumeroInput
                unidad="g"
                placeholder="0"
                value={borrador.muestreo.pesoBolsaG}
                onChange={onPesoBolsa}
                error={estado.errorBolsa}
              />
            </FormField>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
