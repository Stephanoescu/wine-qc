import React from "react";
import { Scale } from "lucide-react";
import { DECIMALES } from "@/lib/config/recepcion";
import type { PesoDisponible } from "@/lib/recepcion/tipos";
import { formatear } from "@/lib/recepcion/validacion";

const kg = (n: number) => `${formatear(n, DECIMALES.kg)} kg`;

/** Peso disponible para Trituración con el desglose de sus descuentos. */
export function BloquePesoDisponible({ netoTotal, peso }: { netoTotal: number; peso: PesoDisponible }) {
  const d = peso.descuentos;
  const filas: [string, number][] = [
    ["Materia extraña", d.materiaExtranaKg],
    ["Uva dañada", d.uvaDaniadaKg],
    ["Bolsa de muestra", d.bolsaMuestraKg],
  ];
  return (
    <section className="rounded-2xl border border-gold/40 bg-white p-4 sm:p-5 shadow-sm break-inside-avoid print:shadow-none">
      <div className="flex items-center gap-2">
        <Scale className="w-4 h-4 text-gold-dark" />
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Peso disponible para Trituración</h3>
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
        <p className="text-3xl sm:text-4xl font-black font-mono text-marine">
          {formatear(peso.kg, DECIMALES.kg)}
          <span className="text-base font-bold text-slate-400 ml-1.5">kg</span>
        </p>
        {peso.provisional && (
          <span className="text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded-md">
            Provisional: hay taras pendientes. Trituración no puede usar el lote hasta completarlas.
          </span>
        )}
      </div>
      <dl className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-sm max-w-sm">
        <dt className="font-medium text-slate-600">Peso neto total</dt>
        <dd className="font-mono font-bold text-marine text-right">{kg(netoTotal)}</dd>
        {filas.map(([n, v]) => (
          <React.Fragment key={n}>
            <dt className="font-medium text-slate-600">− {n}</dt>
            <dd className="font-mono text-slate-700 text-right">{kg(v)}</dd>
          </React.Fragment>
        ))}
        <dt className="font-bold text-marine border-t border-slate-200 pt-1">= Peso disponible</dt>
        <dd className="font-mono font-black text-marine text-right border-t border-slate-200 pt-1">{kg(peso.kg)}</dd>
      </dl>
    </section>
  );
}
