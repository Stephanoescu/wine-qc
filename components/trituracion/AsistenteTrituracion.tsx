"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Hourglass, Route, X } from "lucide-react";
import { PASOS_TRITURACION, TITULO_MODULO } from "@/lib/config/trituracion-textos";
import { getLote } from "@/lib/recepcion/almacen";
import { borrarFotos } from "@/lib/recepcion/fotos";
import { esLegacy } from "@/lib/recepcion/tipos";
import { saveRegistro } from "@/lib/trituracion/almacen";
import { getVigente } from "@/lib/trituracion/config-gaps";
import { estadoPasoT1, estadoPasoT2, estadoPasoT3, estadoPasoT4, estadoPasoT5, type EstadoPaso } from "@/lib/trituracion/pasos";
import type { RegistroTrituracion } from "@/lib/trituracion/tipos";
import { NavButtons, SectionCard, WizardProgress } from "@/components/recepcion/WizardUI";
import { EncabezadoPagina } from "@/components/comun/EncabezadoPagina";
import { DiagramaRecorrido } from "./DiagramaRecorrido";
import { Paso1Recibir } from "./pasos/Paso1Recibir";
import { Paso2Despalillar } from "./pasos/Paso2Despalillar";
import { Paso3Salida } from "./pasos/Paso3Salida";
import { Paso4Clasificacion } from "./pasos/Paso4Clasificacion";
import { Paso5Trituracion } from "./pasos/Paso5Trituracion";

/** Actualización funcional del registro (las fotos se agregan de forma asíncrona). */
export type Cambiar = (fn: (r: RegistroTrituracion) => RegistroTrituracion) => void;

const TOTAL = PASOS_TRITURACION.length;

/**
 * Asistente de 6 pasos. El registro EN_CURSO es su propio borrador: cada cambio
 * se guarda en el almacén y se puede reanudar desde la lista de Trituración.
 */
export function AsistenteTrituracion({ inicial }: { inicial: RegistroTrituracion }) {
  const [r, setR] = useState<RegistroTrituracion>(inicial);
  const [verRecorrido, setVerRecorrido] = useState(false);
  // Tabla estándar vigente (se copia en cada grupo al iniciarlo).
  const [vigente] = useState(() => getVigente());
  // Ficha actual del lote en Recepción (para avisar si cambió después de recibirlo).
  const [lote] = useState(() => {
    const l = getLote(inicial.loteId);
    return l && !esLegacy(l) ? l : null;
  });

  // Autosalvado del registro en cada cambio.
  useEffect(() => {
    saveRegistro({ ...r, updatedAt: new Date().toISOString() });
  }, [r]);

  const cambiar: Cambiar = useCallback((fn) => setR((prev) => fn(prev)), []);
  const alternar = useCallback((id: string) => setR((x) => ({ ...x, checks: { ...x.checks, [id]: !x.checks[id] } })), []);
  const irA = useCallback((p: number) => {
    setR((x) => ({ ...x, paso: Math.min(Math.max(p, 1), TOTAL) }));
    window.scrollTo({ top: 0 });
  }, []);

  // Fotos del registro al abrirlo: la edición del informe (Fase 5) no las borra hasta guardar.
  const originales = useMemo(() => new Set(inicial.salida.controles.flatMap((c) => c.fotoIds)), [inicial]);
  const descartarFotos = useCallback(
    (ids: string[]) => {
      const b = ids.filter((id) => !originales.has(id));
      if (b.length) borrarFotos(b).catch(() => {});
    },
    [originales],
  );

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
      contenido = <Paso4Clasificacion r={r} huboFrutaRota={e3.huboFrutaRota} onToggle={alternar} cambiar={cambiar} />;
      break;
    case 5:
      estado = estadoPasoT5(r);
      contenido = <Paso5Trituracion r={r} vigente={vigente} cambiar={cambiar} />;
      break;
    default:
      estado = { valido: false, faltantes: ["Disponible en la próxima fase"] };
      contenido = (
        <SectionCard title={PASOS_TRITURACION[paso - 1]} subtitle="Disponible en la próxima fase" icon={Hourglass}>
          <p className="text-sm text-slate-600 font-medium">Este paso está en construcción. El registro queda guardado y se puede reanudar.</p>
        </SectionCard>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EncabezadoPagina
        volverHref="/trituracion"
        volverTexto="Trituración"
        titulo={`${TITULO_MODULO} · ${r.codigoLote}`}
        ancho="max-w-3xl"
        inferior={<WizardProgress steps={PASOS_TRITURACION} currentStep={paso} />}
      >
        <button
          type="button"
          onClick={() => setVerRecorrido(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-marine hover:bg-slate-50"
        >
          <Route className="w-4 h-4" />
          <span className="hidden sm:inline">Ver recorrido</span>
        </button>
        <span className="hidden sm:inline text-xs text-slate-500 font-mono font-medium bg-slate-100 px-2.5 py-1 rounded-md">
          Paso {paso}/{TOTAL}
        </span>
      </EncabezadoPagina>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {contenido}
        <NavButtons
          onPrev={paso > 1 ? () => irA(paso - 1) : undefined}
          onNext={() => irA(paso + 1)}
          nextLabel={paso < TOTAL ? `Siguiente — ${PASOS_TRITURACION[paso]}` : "Cerrar operación"}
          isLastStep={paso === TOTAL}
          disabledNext={!estado.valido}
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
