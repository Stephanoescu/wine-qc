"use client";

import React, { useState } from "react";
import { ClipboardCheck, History, Plus, Settings2, Table2 } from "lucide-react";
import { GRUPOS } from "@/lib/config/trituracion";
import { DEFINICION_GRUPOS, INSTRUCCION_ANEXO_B5, INTRO_ANEXO_B, NOTA_TABLA_GAPS } from "@/lib/config/trituracion-textos";
import { fechaLocalHoy } from "@/lib/recepcion/borrador";
import { formatear, parseNumero } from "@/lib/recepcion/validacion";
import {
  comprobacionUsada,
  conflictoVigente,
  versionesDuplicadas,
  deleteComprobacion,
  filaGapVacia,
  getComprobaciones,
  getVersiones,
  propuestaDesdeComprobaciones,
  resultadoComprobacion,
} from "@/lib/trituracion/config-gaps";
import type { ComprobacionInicial, VersionTablaGaps } from "@/lib/trituracion/tipos";
import { useEsCliente } from "@/lib/use-es-cliente";
import { Aviso, SectionCard } from "@/components/recepcion/WizardUI";
import { EncabezadoPagina } from "@/components/comun/EncabezadoPagina";
import { fechaCorta } from "@/components/lote/InformeLote";
import { TablaGaps } from "@/components/trituracion/TablaGaps";
import { AvisoConflictoGaps, textoVersion } from "@/components/trituracion/AvisoConflictoGaps";
import { FormularioVersion, type PropuestaVersion } from "@/components/trituracion/config/FormularioVersion";
import { comprobacionVacia, FormularioComprobacion } from "@/components/trituracion/config/FormularioComprobacion";

export default function ConfiguracionTrituracionPage() {
  const esCliente = useEsCliente();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EncabezadoPagina volverHref="/trituracion" volverTexto="Trituración" titulo="Configuración de gaps" />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {esCliente ? <Configuracion /> : <p className="text-marine font-bold text-center py-20">Cargando...</p>}
      </main>
    </div>
  );
}

type Vista =
  | { tipo: "inicio" }
  | { tipo: "version"; propuesta: PropuestaVersion }
  | { tipo: "comprobacion"; c: ComprobacionInicial; soloLectura: boolean };

function Configuracion() {
  // Solo en el navegador: lee el almacenamiento al iniciar.
  const [versiones, setVersiones] = useState<VersionTablaGaps[]>(() => getVersiones());
  const [comprobaciones, setComprobaciones] = useState<ComprobacionInicial[]>(() => getComprobaciones());
  const [vista, setVista] = useState<Vista>({ tipo: "inicio" });
  const [mensaje, setMensaje] = useState<string | null>(null);

  const vigente = versiones[0] ?? null;
  const conflicto = conflictoVigente(versiones);
  const duplicados = new Set(versionesDuplicadas(versiones).map((d) => d.version));
  const recargar = () => {
    setVersiones(getVersiones());
    setComprobaciones(getComprobaciones());
  };
  const volver = () => {
    setVista({ tipo: "inicio" });
    window.scrollTo({ top: 0 });
  };

  function nuevaVersionDesdeVigente() {
    setMensaje(null);
    setVista({
      tipo: "version",
      propuesta: {
        filas: vigente ? structuredClone(vigente.filas) : { G: filaGapVacia(), M: filaGapVacia(), P: filaGapVacia() },
        equipoModelo: vigente?.equipoModelo ?? "",
        configuracionVersion: "",
        responsableComprobacion: vigente?.responsableComprobacion ?? "",
        comprobacionIds: [],
        origen: vigente ? `parte de la versión ${vigente.version}` : "tabla vacía",
      },
    });
  }

  function nuevaVersionDesdeComprobaciones() {
    setMensaje(null);
    const p = propuestaDesdeComprobaciones(comprobaciones);
    setVista({
      tipo: "version",
      propuesta: {
        ...p,
        configuracionVersion: "",
        responsableComprobacion: "",
        origen: "gaps comprobados en el Registro D",
      },
    });
  }

  if (vista.tipo === "version") {
    return (
      <SectionCard title="Nueva versión de la tabla estándar" subtitle="Sección 4.2 y Anexo B (5)" icon={Table2}>
        <FormularioVersion
          propuesta={vista.propuesta}
          numero={(vigente?.version ?? 0) + 1}
          onCancelar={volver}
          onAprobada={(v) => {
            recargar();
            setMensaje(`Versión ${v.version} aprobada y vigente.`);
            volver();
          }}
        />
      </SectionCard>
    );
  }

  if (vista.tipo === "comprobacion") {
    return (
      <FormularioComprobacion
        inicial={vista.c}
        soloLectura={vista.soloLectura}
        onCancelar={volver}
        onGuardada={() => {
          recargar();
          setMensaje("Comprobación guardada.");
          volver();
        }}
      />
    );
  }

  const conResultado = comprobaciones.some((c) => resultadoComprobacion(c).tipo !== "sin_resultado");

  return (
    <>
      <div>
        <h1 className="text-2xl font-black text-marine">Configuración de gaps</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Tabla estándar por grupo y comprobaciones de las primeras visitas</p>
      </div>
      {mensaje && <Aviso tono="ok" titulo={mensaje} />}

      {conflicto && <AvisoConflictoGaps conflicto={conflicto} onResolver={nuevaVersionDesdeVigente} />}

      {/* ── Tabla vigente ── */}
      <SectionCard
        title={vigente ? `Tabla estándar vigente · versión ${vigente.version}${conflicto ? " (número repetido)" : ""}` : "Tabla estándar vigente"}
        subtitle="Cada trituración guarda la versión que usó"
        icon={Settings2}
      >
        <div className="flex flex-col gap-4">
          {vigente ? (
            <TablaGaps version={vigente} />
          ) : (
            <Aviso tono="alerta" titulo="No hay una tabla aprobada: la trituración está bloqueada">
              {NOTA_TABLA_GAPS}
            </Aviso>
          )}
          {vigente && <p className="text-xs font-medium text-slate-500">{NOTA_TABLA_GAPS}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={nuevaVersionDesdeComprobaciones}
              disabled={!conResultado}
              title={conResultado ? undefined : "Aún no hay comprobaciones con un gap comprobado o NO APLICA"}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-white text-sm font-bold border border-gold-dark hover:bg-gold-dark disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
            >
              <Table2 className="w-4 h-4" />
              Pasar los gaps comprobados a una nueva versión
            </button>
            <button
              type="button"
              onClick={nuevaVersionDesdeVigente}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-marine hover:bg-slate-50"
            >
              <Plus className="w-4 h-4" />
              {vigente ? "Nueva versión a partir de la vigente" : "Cargar la tabla manualmente"}
            </button>
          </div>
          <p className="text-xs font-medium text-slate-500">{INSTRUCCION_ANEXO_B5}</p>
        </div>
      </SectionCard>

      {/* ── Comprobaciones (Registro D) ── */}
      <SectionCard title="Comprobaciones iniciales (Registro D)" subtitle="Anexo B · primeras visitas" icon={ClipboardCheck}>
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-slate-700 leading-relaxed">{INTRO_ANEXO_B}</p>
          {comprobaciones.length === 0 ? (
            <p className="text-sm font-medium text-slate-500 py-3 text-center bg-slate-50 rounded-xl border border-slate-100">
              Aún no hay comprobaciones registradas.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {comprobaciones.map((c) => {
                const r = resultadoComprobacion(c);
                const usada = comprobacionUsada(c.id, versiones);
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 sm:px-4 py-3 bg-white">
                    <span className="font-black font-mono text-marine text-lg w-6">{c.grupo}</span>
                    <div className="flex-1 min-w-[12rem]">
                      <p className="text-sm font-bold text-marine">
                        {DEFINICION_GRUPOS[c.grupo].nombre} · {fechaCorta(c.fecha)}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        {r.tipo === "no_aplica"
                          ? "NO APLICA: el grupo no se presentó"
                          : r.tipo === "comprobado"
                            ? `Gap comprobado: ${r.gapMm} mm · posición ${r.posicion || "—"} · ${c.intentos.length} intento(s)`
                            : `Sin resultado conforme aún · ${c.intentos.length} intento(s)`}
                      </p>
                    </div>
                    {usada && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        En tabla
                      </span>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVista({ tipo: "comprobacion", c, soloLectura: usada })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-marine hover:bg-slate-50"
                      >
                        {usada ? "Ver" : "Abrir"}
                      </button>
                      {!usada && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm("¿Eliminar esta comprobación?")) return;
                            deleteComprobacion(c.id);
                            recargar();
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              const ahora = new Date();
              setVista({ tipo: "comprobacion", c: comprobacionVacia(fechaLocalHoy(ahora), ahora.toISOString()), soloLectura: false });
              window.scrollTo({ top: 0 });
            }}
            className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl bg-marine text-white text-sm font-bold border border-marine-dark hover:bg-marine-light"
          >
            <Plus className="w-4 h-4" />
            Nueva comprobación
          </button>
        </div>
      </SectionCard>

      {/* ── Historial de versiones ── */}
      {versiones.length > 1 && (
        <SectionCard title="Historial de versiones" subtitle="Las versiones anteriores no se modifican" icon={History}>
          <div className="flex flex-col gap-3">
            {versiones.slice(1).map((v) => (
              <details key={v.id} className="rounded-xl border border-slate-200 bg-white">
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-marine">
                  {textoVersion(v, v.creadaEn)}
                  {duplicados.has(v.version) && <span className="ml-1 text-amber-700">(número repetido)</span>} ·{" "}
                  {GRUPOS.map((g) => {
                    const f = v.filas[g];
                    return `${g} ${f.noAplica ? "NO APLICA" : parseNumero(f.gapMm) !== null ? `${formatear(parseNumero(f.gapMm), 2, 0)} mm` : "—"}`;
                  }).join(" · ")}
                </summary>
                <div className="px-4 pb-4">
                  <TablaGaps version={v} />
                </div>
              </details>
            ))}
          </div>
        </SectionCard>
      )}
    </>
  );
}
