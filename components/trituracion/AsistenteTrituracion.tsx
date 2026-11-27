"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Route, X } from "lucide-react";
import { PASOS_TRITURACION, TITULO_MODULO } from "@/lib/config/trituracion-textos";
import type { Rol } from "@/lib/config/roles";
import { borrarClave, escribirJSON, leerJSON } from "@/lib/almacen/local";
import { getLote } from "@/lib/recepcion/almacen";
import { borrarFotos } from "@/lib/recepcion/fotos";
import { esLegacy } from "@/lib/recepcion/tipos";
import { saveRegistro } from "@/lib/trituracion/almacen";
import { cerrarRegistro, estadoPasoT6 } from "@/lib/trituracion/cierre";
import { conflictoVigente, getVersiones, getVigente } from "@/lib/trituracion/config-gaps";
import {
  aplicarEdicionRegistro,
  entregasExigidasPorEdicion,
  faltantesEdicionRegistro,
  fotosDelRegistro,
  previsualizarEdicionRegistro,
} from "@/lib/trituracion/edicion";
import { sellarFirmas } from "@/lib/trituracion/firmas";
import { estadoPasoT1, estadoPasoT2, estadoPasoT3, estadoPasoT4, estadoPasoT5, type EstadoPaso } from "@/lib/trituracion/pasos";
import type { RegistroTrituracion } from "@/lib/trituracion/tipos";
import { Aviso, NavButtons, WizardProgress } from "@/components/recepcion/WizardUI";
import { EncabezadoPagina } from "@/components/comun/EncabezadoPagina";
import { DiagramaRecorrido } from "./DiagramaRecorrido";
import { PanelEdicionRegistro, type FirmaEdicion } from "./PanelEdicionRegistro";
import { Paso1Recibir } from "./pasos/Paso1Recibir";
import { Paso2Despalillar } from "./pasos/Paso2Despalillar";
import { Paso3Salida } from "./pasos/Paso3Salida";
import { Paso4Clasificacion } from "./pasos/Paso4Clasificacion";
import { Paso5Trituracion } from "./pasos/Paso5Trituracion";
import { Paso6Entrega } from "./pasos/Paso6Entrega";

/**
 * Actualización funcional del registro (las fotos se agregan de forma asíncrona).
 * Con `sellar`, la acción confirma las firmas escritas: se les pone fecha y hora.
 */
export type Cambiar = (fn: (r: RegistroTrituracion) => RegistroTrituracion, opciones?: { sellar?: boolean }) => void;

const TOTAL = PASOS_TRITURACION.length;

const claveEdicion = (id: string) => `wine_qc_edicion_trit_${id}`;
interface BorradorEdicion {
  registro: RegistroTrituracion;
  firma: FirmaEdicion;
}

/**
 * Asistente de 6 pasos.
 * - Registro EN_CURSO: es su propio borrador; cada cambio se guarda en el almacén.
 * - Edición del informe (`editar`): se trabaja sobre una copia guardada aparte; al
 *   guardar se exige firma y motivo, y los cambios van a la bitácora.
 */
export function AsistenteTrituracion({ inicial, editar = false }: { inicial: RegistroTrituracion; editar?: boolean }) {
  const router = useRouter();
  const clave = claveEdicion(inicial.id);
  const [inicio] = useState(() => {
    const d = editar ? leerJSON<BorradorEdicion>(clave) : null;
    return d?.registro?.id === inicial.id
      ? { registro: d.registro, firma: d.firma, recuperado: true }
      : { registro: { ...inicial, paso: editar ? 1 : inicial.paso }, firma: { por: "", rol: "" as Rol | "", motivo: "" }, recuperado: false };
  });
  const [r, setR] = useState<RegistroTrituracion>(inicio.registro);
  const [firma, setFirma] = useState<FirmaEdicion>(inicio.firma);
  const [recuperado, setRecuperado] = useState(inicio.recuperado);
  const [verRecorrido, setVerRecorrido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  // Tabla estándar vigente (se copia en cada grupo al iniciarlo).
  const [vigente] = useState(() => getVigente());
  const [conflictoGaps] = useState(() => conflictoVigente(getVersiones()));
  // Ficha actual del lote en Recepción (para avisar si cambió después de recibirlo).
  const [lote] = useState(() => {
    const l = getLote(inicial.loteId);
    return l && !esLegacy(l) ? l : null;
  });

  // Autosalvado: el registro en curso se guarda en el almacén; la edición, aparte.
  useEffect(() => {
    if (terminado) return;
    if (editar) escribirJSON(clave, { registro: r, firma } satisfies BorradorEdicion);
    else saveRegistro({ ...r, updatedAt: new Date().toISOString() });
  }, [r, firma, editar, clave, terminado]);

  const cambiar: Cambiar = useCallback((fn, opciones) => {
    const ahora = new Date().toISOString();
    setR((prev) => (opciones?.sellar ? sellarFirmas(fn(prev), ahora) : fn(prev)));
  }, []);
  const alternar = useCallback((id: string) => setR((x) => ({ ...x, checks: { ...x.checks, [id]: !x.checks[id] } })), []);
  // Pasar de paso confirma las firmas escritas en el paso.
  const irA = useCallback((p: number) => {
    const ahora = new Date().toISOString();
    setR((x) => sellarFirmas({ ...x, paso: Math.min(Math.max(p, 1), TOTAL) }, ahora));
    setError(null);
    window.scrollTo({ top: 0 });
  }, []);

  // En la edición, las fotos del informe guardado no se borran hasta guardar los cambios.
  const originales = useMemo(() => new Set(editar ? fotosDelRegistro(inicial) : []), [editar, inicial]);
  const descartarFotos = useCallback(
    (ids: string[]) => {
      const b = ids.filter((id) => !originales.has(id));
      if (b.length) borrarFotos(b).catch(() => {});
    },
    [originales],
  );

  function cerrar() {
    if (!confirm("¿Cerrar la operación? El registro quedará cerrado y se abrirá su informe.")) return;
    try {
      const cerrado = cerrarRegistro(r, new Date().toISOString());
      const g = saveRegistro(cerrado);
      if (!g.ok) return setError(g.error);
      setTerminado(true);
      router.push(`/trituracion/${encodeURIComponent(r.id)}?cerrado=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cerrar la operación.");
    }
  }

  function guardarEdicion() {
    if (!firma.rol) return;
    try {
      const ahora = new Date().toISOString();
      const nuevo = aplicarEdicionRegistro(inicial, sellarFirmas(r, ahora), { por: firma.por, rol: firma.rol, motivo: firma.motivo }, ahora);
      const g = saveRegistro(nuevo);
      if (!g.ok) return setError(g.error);
      const quedan = new Set(fotosDelRegistro(nuevo));
      const quitadas = fotosDelRegistro(inicial).filter((f) => !quedan.has(f));
      if (quitadas.length) borrarFotos(quitadas).catch(() => {});
      setTerminado(true);
      borrarClave(clave);
      router.push(`/trituracion/${encodeURIComponent(r.id)}?editado=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la edición.");
    }
  }

  function cancelarEdicion() {
    if (!confirm("¿Cancelar la edición? Se perderán los cambios no guardados.")) return;
    descartarFotos(fotosDelRegistro(r));
    setTerminado(true);
    borrarClave(clave);
    router.push(`/trituracion/${encodeURIComponent(r.id)}`);
  }

  const paso = r.paso;
  let estado: EstadoPaso;
  let contenido: React.ReactNode;
  const e3 = estadoPasoT3(r);
  switch (paso) {
    case 1:
      estado = estadoPasoT1(r);
      contenido = <Paso1Recibir r={r} lote={lote} onToggle={alternar} cambiar={cambiar} />;
      break;
    case 2:
      estado = estadoPasoT2(r);
      contenido = <Paso2Despalillar r={r} onToggle={alternar} cambiar={cambiar} />;
      break;
    case 3:
      estado = e3;
      contenido = <Paso3Salida r={r} onToggle={alternar} cambiar={cambiar} descartarFotos={descartarFotos} />;
      break;
    case 4:
      estado = estadoPasoT4(r);
      contenido = <Paso4Clasificacion r={r} huboFrutaRota={e3.huboFrutaRota} onToggle={alternar} cambiar={cambiar} edicion={editar} />;
      break;
    case 5:
      estado = estadoPasoT5(r);
      contenido = <Paso5Trituracion r={r} vigente={vigente} conflicto={conflictoGaps} cambiar={cambiar} edicion={editar} />;
      break;
    default: {
      if (editar) {
        const vista = previsualizarEdicionRegistro(inicial, r);
        const faltantes = faltantesEdicionRegistro(inicial, r, firma);
        estado = { valido: faltantes.length === 0, faltantes };
        contenido = (
          <>
            <Paso6Entrega r={r} onToggle={alternar} cambiar={cambiar} />
            <PanelEdicionRegistro
              cambios={vista.cambios}
              antes={inicial}
              despues={vista.registro}
              firma={firma}
              onFirma={setFirma}
              exigidas={entregasExigidasPorEdicion(inicial, r)}
            />
          </>
        );
      } else {
        estado = estadoPasoT6(r);
        contenido = <Paso6Entrega r={r} onToggle={alternar} cambiar={cambiar} />;
      }
    }
  }

  const esUltimo = paso === TOTAL;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EncabezadoPagina
        volverHref={editar ? `/trituracion/${encodeURIComponent(r.id)}` : "/trituracion"}
        volverTexto={editar ? "Informe" : "Trituración"}
        titulo={`${editar ? "Editar informe" : TITULO_MODULO} · ${r.codigoLote}`}
        ancho="max-w-3xl"
        inferior={<WizardProgress steps={PASOS_TRITURACION} currentStep={paso} onSeleccionarPaso={editar ? irA : undefined} />}
      >
        <button
          type="button"
          onClick={() => setVerRecorrido(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-marine hover:bg-slate-50"
        >
          <Route className="w-4 h-4" />
          <span className="hidden sm:inline">Ver recorrido</span>
        </button>
        {editar ? (
          <button type="button" onClick={cancelarEdicion} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600">
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancelar edición</span>
          </button>
        ) : (
          <Link
            href={`/trituracion/${encodeURIComponent(r.id)}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-marine hover:bg-slate-50"
            title="Informe parcial del registro"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Informe</span>
          </Link>
        )}
      </EncabezadoPagina>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {editar && recuperado && (
          <Aviso tono="info" titulo="Se recuperó una edición sin guardar">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <button type="button" onClick={() => setRecuperado(false)} className="font-bold text-marine underline">
                Continuar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirm("¿Descartar los cambios sin guardar?")) return;
                  descartarFotos(fotosDelRegistro(r));
                  setR({ ...inicial, paso: 1 });
                  setFirma({ por: "", rol: "", motivo: "" });
                  setRecuperado(false);
                }}
                className="font-bold text-red-600 underline"
              >
                Descartar los cambios
              </button>
            </div>
          </Aviso>
        )}
        {contenido}
        {error && <Aviso tono="error" titulo={error} />}
        <NavButtons
          onPrev={paso > 1 ? () => irA(paso - 1) : undefined}
          onNext={() => (esUltimo ? (editar ? guardarEdicion() : cerrar()) : irA(paso + 1))}
          nextLabel={esUltimo ? (editar ? "Guardar cambios" : "Cerrar operación") : `Siguiente — ${PASOS_TRITURACION[paso]}`}
          isLastStep={esUltimo}
          disabledNext={!estado.valido || terminado}
          faltantes={estado.faltantes}
        />
      </main>

      {verRecorrido && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Recorrido de las uvas"
          onClick={() => setVerRecorrido(false)}
          className="fixed inset-0 z-50 bg-marine-dark/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-marine">Recorrido de las uvas y sus recipientes</h2>
              <button type="button" onClick={() => setVerRecorrido(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <DiagramaRecorrido />
          </div>
        </div>
      )}
    </div>
  );
}
