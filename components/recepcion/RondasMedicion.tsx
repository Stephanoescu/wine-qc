"use client";

import React from "react";
import type { ResultadoRondas, RondaEvaluada } from "@/lib/recepcion/evaluacion";
import { formatear } from "@/lib/recepcion/validacion";
import { Aviso, BadgeConformidad, NumeroInput, useNavegacionEnter } from "./WizardUI";

/**
 * Lecturas en dos rondas (°Brix y pH): la 2.ª ronda aparece solo si el
 * promedio de la 1.ª queda fuera del rango de referencia.
 */
export function RondasMedicion({
  nombre,
  etiquetas,
  rondas,
  resultado,
  onLectura,
  rango,
  decimales,
  decimalesRango = 0,
  unidad,
  avisoRonda1,
  avisoRonda2,
  mostrarDiferencia,
  avisoDiferencia,
}: {
  /** "°Brix", "pH" (para etiquetas de accesibilidad y textos). */
  nombre: string;
  /** Etiquetas de los campos por ronda, p. ej. [["B1","B2","B3"],["B1'","B2'","B3'"]]. */
  etiquetas: readonly (readonly string[])[];
  /** Valores tal como se escriben. */
  rondas: string[][];
  resultado: ResultadoRondas;
  onLectura: (ronda: number, indice: number, valor: string) => void;
  rango: { min: number; max: number };
  decimales: number;
  /** Decimales con que se muestran los límites del rango (18 – 24, 3.0 – 3.5). */
  decimalesRango?: number;
  unidad?: string;
  avisoRonda1: string;
  avisoRonda2: string;
  mostrarDiferencia?: boolean;
  /** Aviso informativo si la diferencia de una ronda supera `umbral` (no bloquea). */
  avisoDiferencia?: { umbral: number; texto: string };
}) {
  const { contenedor, alPresionarTecla } = useNavegacionEnter();
  const r1 = resultado.rondas[0];
  const r2 = resultado.rondas[1];
  const textoRango = `${formatear(rango.min, decimalesRango)} – ${formatear(rango.max, decimalesRango)}${
    unidad ? ` ${unidad}` : ""
  }`;

  return (
    <div ref={contenedor} className="flex flex-col gap-4">
      <BloqueRonda
        titulo={resultado.segundaHabilitada ? "1.ª ronda" : "Lecturas"}
        nombre={nombre}
        etiquetas={etiquetas[0]}
        valores={rondas[0]}
        ronda={r1}
        onLectura={(i, v) => onLectura(0, i, v)}
        onKeyDown={alPresionarTecla}
        decimales={decimales}
        textoRango={textoRango}
        mostrarDiferencia={mostrarDiferencia}
      />
      <AvisoDiferencia ronda={r1} aviso={avisoDiferencia} />

      {r1.conforme === true && <BadgeConformidad estado="conforme" />}

      {resultado.segundaHabilitada && r2 && (
        <>
          <Aviso tono="alerta" titulo={`Promedio fuera del rango de referencia (${textoRango})`}>
            {avisoRonda1}
          </Aviso>
          <BloqueRonda
            titulo="2.ª ronda (jugo nuevo)"
            nombre={nombre}
            etiquetas={etiquetas[1]}
            valores={rondas[1]}
            ronda={r2}
            onLectura={(i, v) => onLectura(1, i, v)}
            onKeyDown={alPresionarTecla}
            decimales={decimales}
            textoRango={textoRango}
            mostrarDiferencia={mostrarDiferencia}
            destacada
          />
          <AvisoDiferencia ronda={r2} aviso={avisoDiferencia} />
          {r2.conforme === true && <BadgeConformidad estado="conforme" texto="Conforme en la 2.ª ronda" />}
          {r2.conforme === false && <Aviso tono="error" titulo={avisoRonda2} />}
        </>
      )}
    </div>
  );
}

function AvisoDiferencia({ ronda, aviso }: { ronda: RondaEvaluada; aviso?: { umbral: number; texto: string } }) {
  if (!aviso || ronda.diferencia === null || ronda.diferencia <= aviso.umbral) return null;
  return <Aviso tono="info" titulo={aviso.texto} />;
}

function BloqueRonda({
  titulo,
  nombre,
  etiquetas,
  valores,
  ronda,
  onLectura,
  onKeyDown,
  decimales,
  textoRango,
  mostrarDiferencia,
  destacada,
}: {
  titulo: string;
  nombre: string;
  etiquetas: readonly string[];
  valores: string[];
  ronda: RondaEvaluada;
  onLectura: (indice: number, valor: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  decimales: number;
  textoRango: string;
  mostrarDiferencia?: boolean;
  destacada?: boolean;
}) {
  const fuera = ronda.conforme === false;
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-4 ${
        destacada ? "border-amber-300 bg-amber-50/30" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{titulo}</p>
      <div className={`grid gap-3 ${etiquetas.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {etiquetas.map((et, i) => (
          <label key={et} className="flex flex-col gap-1.5 min-w-0">
            <span className="text-sm font-bold text-marine-light font-mono">
              {et} <span className="text-gold-dark">*</span>
            </span>
            <NumeroInput
              data-nav
              enterKeyHint="next"
              aria-label={`${nombre} ${et}`}
              placeholder="0.0"
              value={valores[i] ?? ""}
              onChange={(v) => onLectura(i, v)}
              onKeyDown={onKeyDown}
              error={ronda.errores[i]}
              className="font-mono text-center text-base! px-2!"
            />
            {ronda.errores[i] && <span className="text-[11px] text-red-600 font-medium">{ronda.errores[i]}</span>}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 pt-3 border-t border-slate-200/80">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Promedio</p>
          <p className={`text-3xl font-black font-mono ${fuera ? "text-red-600" : "text-marine"}`}>
            {formatear(ronda.promedio, decimales)}
          </p>
        </div>
        {mostrarDiferencia && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Diferencia (mayor − menor)</p>
            <p className="text-xl font-black font-mono text-marine">{formatear(ronda.diferencia, decimales)}</p>
          </div>
        )}
        <p className="text-xs font-medium text-slate-500 sm:ml-auto">Rango de referencia: {textoRango}</p>
      </div>
    </div>
  );
}
