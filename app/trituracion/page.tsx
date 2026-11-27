"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Search, Settings2 } from "lucide-react";
import { DECIMALES } from "@/lib/config/recepcion";
import { GRUPOS } from "@/lib/config/trituracion";
import { AVISO_GAP_NO_ESTABLECIDO, TITULO_MODULO } from "@/lib/config/trituracion-textos";
import { getLotes } from "@/lib/recepcion/almacen";
import { esLegacy, type LoteV2 } from "@/lib/recepcion/tipos";
import { formatear } from "@/lib/recepcion/validacion";
import { getRegistros } from "@/lib/trituracion/almacen";
import { conflictoVigente, gapDeGrupo, getVersiones, getVigente } from "@/lib/trituracion/config-gaps";
import { AvisoConflictoGaps } from "@/components/trituracion/AvisoConflictoGaps";
import { elegibilidad } from "@/lib/trituracion/elegibilidad";
import { enlaceNuevoRegistro, enlaceRegistro } from "@/lib/trituracion/rutas";
import type { VersionTablaGaps } from "@/lib/trituracion/tipos";
import { useEsCliente } from "@/lib/use-es-cliente";
import { Aviso } from "@/components/recepcion/WizardUI";
import { EncabezadoPagina } from "@/components/comun/EncabezadoPagina";
import { fechaCorta, fechaHora } from "@/components/lote/InformeLote";
import { EstadoRegistroBadge } from "@/components/trituracion/EstadoRegistroBadge";

export default function TrituracionPage() {
  const esCliente = useEsCliente();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EncabezadoPagina volverHref="/inicio" volverTexto="Inicio" titulo={TITULO_MODULO}>
        <Link
          href="/configuracion/trituracion"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-marine hover:bg-slate-50"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Configuración de gaps</span>
          <span className="sm:hidden">Gaps</span>
        </Link>
      </EncabezadoPagina>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {esCliente ? <Contenido /> : <p className="text-marine font-bold text-center py-20">Cargando...</p>}
      </main>
    </div>
  );
}

function ResumenGaps({ vigente, versiones }: { vigente: VersionTablaGaps | null; versiones: VersionTablaGaps[] }) {
  const conflicto = conflictoVigente(versiones);
  if (!vigente) {
    return (
      <Aviso tono="alerta" titulo="Sin tabla de gaps aprobada: no se puede triturar">
        {AVISO_GAP_NO_ESTABLECIDO}{" "}
        <Link href="/configuracion/trituracion" className="font-bold text-marine underline">
          Ir a Configuración de gaps
        </Link>
      </Aviso>
    );
  }
  return (
    <>
    {conflicto && <AvisoConflictoGaps conflicto={conflicto} enlaceConfiguracion />}
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center gap-x-6 gap-y-2">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Tabla vigente · versión {vigente.version}</p>
      {GRUPOS.map((g) => {
        const r = gapDeGrupo(vigente, g);
        return (
          <span key={g} className="text-sm font-bold text-marine">
            <span className="font-mono font-black">{g}</span>{" "}
            {r.ok ? (
              `${formatear(r.gapMm, 2, 0)} mm`
            ) : vigente.filas[g].noAplica ? (
              <span className="text-slate-500">NO APLICA</span>
            ) : (
              <span className="text-red-700">no establecido</span>
            )}
          </span>
        );
      })}
    </div>
    </>
  );
}

function Contenido() {
  // Solo en el navegador: lee el almacenamiento al iniciar.
  const [datos] = useState(() => {
    const registros = getRegistros();
    const conRegistro = new Set(registros.map((r) => r.loteId));
    const listos = getLotes().filter(
      (l): l is LoteV2 => !esLegacy(l) && !conRegistro.has(l.id) && elegibilidad(l).ok,
    );
    return { registros, listos, vigente: getVigente(), versiones: getVersiones() };
  });
  const [busqueda, setBusqueda] = useState("");
  const q = busqueda.trim().toLowerCase();
  const registros = datos.registros.filter(
    (r) => !q || [r.codigoLote, r.entrada.proveedor, r.entrada.variedad].some((t) => t.toLowerCase().includes(q)),
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-marine">{TITULO_MODULO}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Uva Borgoña Blanca · ajuste de rodillos por grupo</p>
        </div>
        <Link
          href="/trituracion/nuevo"
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-marine hover:bg-marine-light text-sm font-bold text-white shadow-md shadow-marine/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo registro
        </Link>
      </div>

      <ResumenGaps vigente={datos.vigente} versiones={datos.versiones} />

      {/* Lotes listos */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <h2 className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 text-sm font-bold text-marine">
          Lotes liberados listos para triturar ({datos.listos.length})
        </h2>
        {datos.listos.length === 0 ? (
          <p className="px-4 sm:px-6 py-6 text-sm font-medium text-slate-500">
            No hay lotes LIBERADOS con disposición firmada y peso disponible definitivo sin registro de trituración.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {datos.listos.map((l) => (
              <li key={l.id}>
                <Link
                  href={enlaceNuevoRegistro(l.id)}
                  className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-slate-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-marine truncate">{l.codigoLote}</p>
                    <p className="text-xs font-medium text-slate-500 truncate">
                      {l.variedad} · {l.proveedor} · {fechaCorta(l.fecha)}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-black text-marine whitespace-nowrap">
                    {formatear(l.pesoDisponible.kg, DECIMALES.kg)} kg
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Registros */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-bold text-marine">
            Registros de trituración
            <span className="ml-2 text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {registros.length} de {datos.registros.length}
            </span>
          </h2>
          <label className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar lote, proveedor…"
              aria-label="Buscar registros"
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-marine placeholder:text-slate-400 focus:outline-none focus:border-marine"
            />
          </label>
        </div>
        {registros.length === 0 ? (
          <p className="px-4 sm:px-6 py-10 text-center text-sm font-medium text-slate-500">
            {datos.registros.length === 0 ? "Aún no hay registros de trituración en este dispositivo." : "Sin resultados para la búsqueda."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {registros.map((r) => (
              <li key={r.id}>
                <Link href={enlaceRegistro(r)} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-slate-50">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="font-mono text-sm font-bold text-marine truncate">{r.codigoLote}</p>
                    <p className="text-xs font-medium text-slate-500 truncate">
                      {r.entrada.variedad} · {formatear(r.entrada.pesoDisponibleKg, DECIMALES.kg)} kg de entrada · actualizado{" "}
                      {fechaHora(r.updatedAt)}
                    </p>
                  </div>
                  <EstadoRegistroBadge estado={r.estado} />
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
