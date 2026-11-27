"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, PackageCheck, Search } from "lucide-react";
import { DECIMALES } from "@/lib/config/recepcion";
import { AVISO_ACLARAR_ENTREGA, NOTA_PESO_ENTRADA, TITULO_MODULO } from "@/lib/config/trituracion-textos";
import { getLotes } from "@/lib/recepcion/almacen";
import { horaLocalAhora, nuevoId } from "@/lib/recepcion/borrador";
import { esLegacy, type LoteAlmacenado } from "@/lib/recepcion/tipos";
import { filaReporte } from "@/lib/recepcion/reporte";
import { formatear } from "@/lib/recepcion/validacion";
import { getRegistros, saveRegistro } from "@/lib/trituracion/almacen";
import { elegibilidad } from "@/lib/trituracion/elegibilidad";
import { crearRegistro } from "@/lib/trituracion/registro";
import { enlaceRegistro } from "@/lib/trituracion/rutas";
import type { RegistroTrituracion } from "@/lib/trituracion/tipos";
import { useEsCliente } from "@/lib/use-es-cliente";
import { Aviso, SectionCard } from "@/components/recepcion/WizardUI";
import { EncabezadoPagina } from "@/components/comun/EncabezadoPagina";
import { EstadoBadge } from "@/components/lote/EstadoBadge";
import { fechaCorta } from "@/components/lote/InformeLote";

export default function NuevoRegistroTrituracionPage({ searchParams }: { searchParams: Promise<{ lote?: string }> }) {
  const { lote } = use(searchParams);
  const esCliente = useEsCliente();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EncabezadoPagina volverHref="/trituracion" volverTexto="Trituración" titulo={`${TITULO_MODULO} · nuevo registro`} ancho="max-w-3xl" />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {esCliente ? <Selector inicial={lote ?? null} /> : <p className="text-marine font-bold text-center py-20">Cargando...</p>}
      </main>
    </div>
  );
}

/** Paso 1 (parte inicial): elegir el lote de Recepción. Solo los elegibles se pueden seleccionar. */
function Selector({ inicial }: { inicial: string | null }) {
  const router = useRouter();
  const [datos] = useState(() => {
    const registros = getRegistros();
    const porLote = new Map<string, RegistroTrituracion>(registros.map((r) => [r.loteId, r]));
    return { lotes: getLotes(), porLote };
  });
  const [busqueda, setBusqueda] = useState("");
  const [elegido, setElegido] = useState<string | null>(() => {
    const l = inicial ? datos.lotes.find((x) => x.id === inicial) : null;
    return l && (elegibilidad(l).ok || datos.porLote.has(l.id)) ? l.id : null;
  });
  const [error, setError] = useState<string | null>(null);

  const q = busqueda.trim().toLowerCase();
  const lotes = datos.lotes.filter((l) => !q || (l.codigoLote ?? "").toLowerCase().includes(q) || (l.proveedor ?? "").toLowerCase().includes(q));
  const seleccionado = elegido ? (datos.lotes.find((l) => l.id === elegido) ?? null) : null;
  const existente = seleccionado ? datos.porLote.get(seleccionado.id) : undefined;

  function iniciar() {
    if (!seleccionado || esLegacy(seleccionado)) return;
    if (existente) {
      router.push(enlaceRegistro(existente));
      return;
    }
    const ahora = new Date().toISOString();
    const reg = crearRegistro(seleccionado, nuevoId(), ahora, horaLocalAhora());
    const r = saveRegistro(reg);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.push(enlaceRegistro(reg));
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-black text-marine">Recibir el lote liberado</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Paso 1 · elija el lote de Recepción por su código</p>
      </div>

      <SectionCard title="Elegir lote" subtitle="Solo LIBERADO, con disposición firmada y peso disponible definitivo" icon={PackageCheck}>
        <div className="flex flex-col gap-4">
          <label className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o proveedor…"
              aria-label="Buscar lote"
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-3 text-sm text-marine placeholder:text-slate-400 focus:outline-none focus:border-marine"
            />
          </label>
          {lotes.length === 0 ? (
            <p className="text-sm font-medium text-slate-500 text-center py-6">No hay lotes de Recepción en este dispositivo.</p>
          ) : (
            <ul role="radiogroup" aria-label="Lotes de Recepción" className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {lotes.map((l) => (
                <FilaLote
                  key={l.id}
                  lote={l}
                  registro={datos.porLote.get(l.id)}
                  activo={elegido === l.id}
                  onElegir={() => {
                    setError(null);
                    setElegido(l.id);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </SectionCard>

      {seleccionado && !esLegacy(seleccionado) && (
        <SectionCard title={`Lote ${seleccionado.codigoLote}`} subtitle={existente ? "Ya tiene un registro: se reanuda" : "Ficha de Recepción"} icon={PackageCheck}>
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-slate-700">
              {seleccionado.variedad} · {seleccionado.proveedor} · {seleccionado.origen}
            </p>
            <div className="rounded-2xl bg-marine text-white p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-light">Peso disponible</p>
              <p className="text-4xl font-black font-mono">{formatear(seleccionado.pesoDisponible.kg, DECIMALES.kg)} kg</p>
              <p className="text-sm text-white/80 mt-1">{NOTA_PESO_ENTRADA}</p>
            </div>
            {error && <Aviso tono="error" titulo={error} />}
            <button
              type="button"
              onClick={iniciar}
              className="self-start px-5 py-3 rounded-xl bg-marine text-white text-sm font-bold border border-marine-dark hover:bg-marine-light"
            >
              {existente ? "Reanudar el registro" : "Iniciar el registro de trituración"}
            </button>
          </div>
        </SectionCard>
      )}
      <Link href="/trituracion" className="text-sm font-bold text-gold-dark hover:underline">
        ← Volver a Trituración
      </Link>
    </>
  );
}

function FilaLote({
  lote,
  registro,
  activo,
  onElegir,
}: {
  lote: LoteAlmacenado;
  registro?: RegistroTrituracion;
  activo: boolean;
  onElegir: () => void;
}) {
  const f = filaReporte(lote);
  const eleg = elegibilidad(lote);
  const seleccionable = eleg.ok || !!registro;
  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={activo}
        disabled={!seleccionable}
        onClick={onElegir}
        className={`w-full flex items-start gap-3 px-3 sm:px-4 py-3 text-left ${
          activo ? "bg-marine/5" : seleccionable ? "bg-white hover:bg-slate-50" : "bg-slate-50 cursor-not-allowed"
        }`}
      >
        {activo ? <CheckCircle2 className="w-5 h-5 text-marine flex-shrink-0 mt-0.5" /> : <Circle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${seleccionable ? "text-slate-300" : "text-slate-200"}`} />}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono text-sm font-bold ${seleccionable ? "text-marine" : "text-slate-400"}`}>{f.codigoLote}</span>
            <EstadoBadge estado={f.estado} />
          </div>
          <p className="text-xs font-medium text-slate-500 truncate">
            {f.proveedor} · {f.variedad} · {fechaCorta(f.fecha)}
          </p>
          {registro ? (
            <p className="text-xs font-bold text-sky-700">Ya tiene un registro de trituración: se reanuda</p>
          ) : !eleg.ok ? (
            <p className="text-xs font-bold text-slate-500">
              No disponible: {eleg.motivo}. {AVISO_ACLARAR_ENTREGA}
            </p>
          ) : null}
        </div>
        {!esLegacy(lote) && (
          <span className="font-mono text-sm font-black text-marine whitespace-nowrap">{formatear(lote.pesoDisponible.kg, DECIMALES.kg)} kg</span>
        )}
      </button>
    </li>
  );
}
