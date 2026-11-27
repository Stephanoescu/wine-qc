"use client";

import React, { useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import { GRUPOS, type Grupo } from "@/lib/config/trituracion";
import { DEFINICION_GRUPOS, NOTA_CAMPO_VACIO, NOTA_TABLA_GAPS } from "@/lib/config/trituracion-textos";
import type { Rol } from "@/lib/config/roles";
import { nuevoId } from "@/lib/recepcion/borrador";
import { aprobarVersion, erroresVersion } from "@/lib/trituracion/config-gaps";
import type { FilaGap, VersionTablaGaps } from "@/lib/trituracion/tipos";
import { Aviso, FormField, NumeroInput, StyledInput } from "@/components/recepcion/WizardUI";
import { CampoFirma } from "@/components/lote/CampoFirma";

export interface PropuestaVersion {
  filas: Record<Grupo, FilaGap>;
  equipoModelo: string;
  configuracionVersion: string;
  responsableComprobacion: string;
  comprobacionIds: string[];
  /** Texto que explica de dónde salen los valores precargados. */
  origen: string;
}

/** Nueva versión de la tabla estándar: se completa, se firma y se aprueba (queda vigente). */
export function FormularioVersion({
  propuesta,
  numero,
  onAprobada,
  onCancelar,
}: {
  propuesta: PropuestaVersion;
  /** Número que tendrá la versión. */
  numero: number;
  onAprobada: (v: VersionTablaGaps) => void;
  onCancelar: () => void;
}) {
  const [filas, setFilas] = useState(propuesta.filas);
  const [equipoModelo, setEquipoModelo] = useState(propuesta.equipoModelo);
  const [configuracionVersion, setConfiguracionVersion] = useState(propuesta.configuracionVersion);
  const [responsable, setResponsable] = useState(propuesta.responsableComprobacion);
  const [aprueba, setAprueba] = useState("");
  const [rol, setRol] = useState<Rol | "">("");
  const [error, setError] = useState<string | null>(null);

  const borrador = {
    id: "",
    filas,
    equipoModelo,
    configuracionVersion,
    responsableComprobacion: responsable,
    aprobacion: { nombre: aprueba, rol, fecha: "" },
    creadaEn: "",
    comprobacionIds: propuesta.comprobacionIds,
  };
  const errores = erroresVersion(borrador);

  const setFila = (g: Grupo, cambios: Partial<FilaGap>) => setFilas((f) => ({ ...f, [g]: { ...f[g], ...cambios } }));

  function aprobar() {
    if (errores.length) return;
    if (!confirm(`¿Aprobar la versión ${numero} de la tabla estándar? Quedará vigente y no se podrá modificar.`)) return;
    const ahora = new Date().toISOString();
    const r = aprobarVersion({ ...borrador, id: nuevoId(), creadaEn: ahora, aprobacion: { nombre: aprueba.trim(), rol, fecha: ahora } });
    if (r.ok && r.version) onAprobada(r.version);
    else if (!r.ok) setError(r.error);
  }

  return (
    <div className="flex flex-col gap-5">
      <Aviso tono="info" titulo={`Versión ${numero} · ${propuesta.origen}`}>
        {NOTA_TABLA_GAPS} {NOTA_CAMPO_VACIO}
      </Aviso>

      <div className="flex flex-col gap-3">
        {GRUPOS.map((g) => {
          const f = filas[g];
          return (
            <div key={g} className="rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-black font-mono text-marine text-lg">{g}</span>
                <span className="text-sm font-bold text-marine">{DEFINICION_GRUPOS[g].nombre}</span>
                <span className="text-xs font-medium text-slate-500">{DEFINICION_GRUPOS[g].identificacion}</span>
              </div>
              <button
                type="button"
                role="checkbox"
                aria-checked={f.noAplica}
                onClick={() => setFila(g, { noAplica: !f.noAplica })}
                className="self-start flex items-center gap-2 text-sm font-bold text-slate-600"
              >
                {f.noAplica ? <CheckSquare className="w-5 h-5 text-marine" /> : <Square className="w-5 h-5 text-slate-300" />}
                NO APLICA (el grupo no se presentó en la comprobación)
              </button>
              {!f.noAplica && (
                <div className="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] gap-3">
                  <FormField label={`Gap ${g} (mm)`} ayuda="Vacío = no establecido">
                    <NumeroInput unidad="mm" value={f.gapMm} onChange={(gapMm) => setFila(g, { gapMm })} placeholder="—" />
                  </FormField>
                  <FormField label="Posición o marca" required={f.gapMm.trim() !== ""}>
                    <StyledInput value={f.posicion} onChange={(e) => setFila(g, { posicion: e.target.value })} placeholder="Ej.: marca 3 del regulador" />
                  </FormField>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Equipo y modelo" required>
          <StyledInput value={equipoModelo} onChange={(e) => setEquipoModelo(e.target.value)} placeholder="Trituradora de rodillos, marca y modelo" />
        </FormField>
        <FormField label="Configuración y versión" required>
          <StyledInput value={configuracionVersion} onChange={(e) => setConfiguracionVersion(e.target.value)} placeholder="Ej.: Configuración inicial v1" />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Responsable de comprobación" required>
            <StyledInput value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre de quien comprobó los gaps" />
          </FormField>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-gold/40 bg-gold/5 flex flex-col gap-3">
        <p className="text-sm font-bold text-marine">Fecha y aprobación</p>
        <CampoFirma etiqueta="Aprobado por" nombre={aprueba} rol={rol} onNombre={setAprueba} onRol={setRol} />
      </div>

      {errores.length > 0 && (
        <ul className="flex flex-col gap-1 p-3 rounded-xl bg-slate-100 border border-slate-200">
          {errores.map((e) => (
            <li key={e} className="text-xs font-medium text-slate-600">
              • {e}
            </li>
          ))}
        </ul>
      )}
      {error && <Aviso tono="error" titulo={error} />}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button type="button" onClick={onCancelar} className="px-5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
        <button
          type="button"
          onClick={aprobar}
          disabled={errores.length > 0}
          className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-gold border border-gold-dark hover:bg-gold-dark disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
        >
          Aprobar versión {numero}
        </button>
      </div>
    </div>
  );
}
