"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Hourglass, RotateCcw } from "lucide-react";
import { PASOS_ASISTENTE } from "@/lib/config/recepcion-textos";
import {
  borrarBorrador,
  cargarBorrador,
  crearBorradorVacio,
  fotosDelBorrador,
  guardarBorrador,
  nuevoId,
} from "@/lib/recepcion/borrador";
import { asegurarSeleccion, FILA_JABA_VACIA, filasMuestraNuevas } from "@/lib/recepcion/evaluacion";
import { borrarFotos } from "@/lib/recepcion/fotos";
import {
  estadoPaso1,
  estadoPaso2,
  estadoPaso3,
  estadoPaso4,
  estadoPaso5,
  numJabasValido,
  type EstadoPaso,
} from "@/lib/recepcion/pasos";
import type {
  BorradorLote,
  ClaveParametroVisual,
  FilaJaba,
  FilaMuestra,
  ParamVisualBorrador,
} from "@/lib/recepcion/tipos";
import { useEsCliente } from "@/lib/use-es-cliente";
import { Aviso, NavButtons, SectionCard, WizardProgress } from "@/components/recepcion/WizardUI";
import { Paso1Identificacion } from "@/components/recepcion/Paso1Identificacion";
import { Paso2Instrumentos } from "@/components/recepcion/Paso2Instrumentos";
import { Paso3CargaPesado } from "@/components/recepcion/Paso3CargaPesado";
import { Paso4MuestreoTemperatura } from "@/components/recepcion/Paso4MuestreoTemperatura";
import { Paso5InspeccionCajas } from "@/components/recepcion/Paso5InspeccionCajas";

const TOTAL_PASOS = PASOS_ASISTENTE.length;

/** El borrador tiene algo escrito por el usuario (si no, se descarta y se empieza de cero). */
function tieneDatos(b: BorradorLote): boolean {
  const id = b.identificacion;
  return (
    b.paso > 1 ||
    id.proveedor.trim() !== "" ||
    id.origen.trim() !== "" ||
    id.numJabas.trim() !== "" ||
    fotosDelBorrador(b).length > 0 ||
    Object.values(b.checks).some(Boolean)
  );
}

export default function RecepcionPage() {
  const esCliente = useEsCliente();
  if (!esCliente) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-marine font-bold">Cargando...</p>
      </div>
    );
  }
  return <AsistenteRecepcion />;
}

function AsistenteRecepcion() {
  // Solo se ejecuta en el navegador (ver useEsCliente), así que puede leer localStorage.
  const [inicio] = useState(() => {
    const guardado = cargarBorrador();
    const util = guardado && tieneDatos(guardado) ? guardado : null;
    return { borrador: util ?? crearBorradorVacio(), recuperado: !!util };
  });
  const [b, setB] = useState<BorradorLote>(inicio.borrador);
  const [mostrarRecuperado, setMostrarRecuperado] = useState(inicio.recuperado);

  // Autosalvado del borrador en cada cambio.
  useEffect(() => {
    guardarBorrador(b);
  }, [b]);

  const paso = b.paso;
  const numJabas = numJabasValido(b.identificacion);

  const irA = useCallback((p: number) => {
    setB((prev) => {
      const paso = Math.min(Math.max(p, 1), TOTAL_PASOS);
      const siguiente = { ...prev, paso };
      // Al llegar al muestreo, generar (o ajustar) la selección de jabas.
      if (paso === 4) {
        const filas = asegurarSeleccion(prev.muestreo.filas, numJabasValido(prev.identificacion), nuevoId);
        if (filas !== prev.muestreo.filas) siguiente.muestreo = { ...prev.muestreo, filas };
      }
      return siguiente;
    });
    window.scrollTo({ top: 0 });
  }, []);

  const alternarCheck = useCallback((id: string) => {
    setB((prev) => ({ ...prev, checks: { ...prev.checks, [id]: !prev.checks[id] } }));
  }, []);

  const actualizarJaba = useCallback((i: number, cambios: Partial<FilaJaba>) => {
    setB((prev) => {
      const jabas = prev.pesado.jabas.slice();
      while (jabas.length <= i) jabas.push({ ...FILA_JABA_VACIA });
      jabas[i] = { ...jabas[i], ...cambios };
      return { ...prev, pesado: { ...prev.pesado, jabas } };
    });
  }, []);

  // ── Paso 4 ──
  const actualizarFilaMuestra = useCallback((id: string, cambios: Partial<FilaMuestra>) => {
    setB((prev) => ({
      ...prev,
      muestreo: { ...prev.muestreo, filas: prev.muestreo.filas.map((f) => (f.id === id ? { ...f, ...cambios } : f)) },
    }));
  }, []);

  function regenerarSeleccion() {
    const conTemperaturas = b.muestreo.filas.some((f) => f.temperatura.trim() !== "");
    if (conTemperaturas && !confirm("¿Generar otra selección? Se borrarán las temperaturas registradas.")) return;
    const filas = filasMuestraNuevas(numJabas, nuevoId);
    setB((prev) => ({ ...prev, muestreo: { ...prev.muestreo, filas } }));
  }

  // ── Paso 5 ──
  const actualizarParametro = useCallback(
    (clave: ClaveParametroVisual, cambio: (p: ParamVisualBorrador) => ParamVisualBorrador) => {
      setB((prev) => ({
        ...prev,
        cajas: {
          ...prev.cajas,
          parametros: { ...prev.cajas.parametros, [clave]: cambio(prev.cajas.parametros[clave]) },
        },
      }));
    },
    [],
  );

  function marcarObservado(clave: ClaveParametroVisual, observado: boolean) {
    const fotos = b.cajas.parametros[clave].fotoIds;
    if (!observado && fotos.length > 0) {
      if (!confirm("Se eliminarán las fotos adjuntas a este parámetro. ¿Continuar?")) return;
      borrarFotos(fotos).catch(() => {});
    }
    actualizarParametro(clave, (p) => ({ ...p, observado, fotoIds: observado ? p.fotoIds : [] }));
  }

  function quitarFoto(clave: ClaveParametroVisual, id: string) {
    borrarFotos([id]).catch(() => {});
    actualizarParametro(clave, (p) => ({ ...p, fotoIds: p.fotoIds.filter((f) => f !== id) }));
  }

  function descartar() {
    if (!confirm("¿Descartar el registro en curso y empezar uno nuevo? Se perderán los datos ingresados.")) return;
    borrarFotos(fotosDelBorrador(b)).catch(() => {});
    borrarBorrador();
    setB(crearBorradorVacio());
    setMostrarRecuperado(false);
    window.scrollTo({ top: 0 });
  }

  // ── Contenido y validación del paso actual ──
  let contenido: React.ReactNode;
  let estado: EstadoPaso;
  switch (paso) {
    case 1: {
      const e = estadoPaso1(b.identificacion);
      estado = e;
      contenido = (
        <Paso1Identificacion
          data={b.identificacion}
          errores={e.errores}
          onChange={(identificacion) => setB((prev) => ({ ...prev, identificacion }))}
        />
      );
      break;
    }
    case 2:
      estado = estadoPaso2(b);
      contenido = <Paso2Instrumentos checks={b.checks} onToggle={alternarCheck} />;
      break;
    case 3: {
      const e = estadoPaso3(b);
      estado = e;
      contenido = (
        <Paso3CargaPesado
          borrador={b}
          estado={e}
          numJabas={numJabas}
          onToggle={alternarCheck}
          onCarga={(carga) => setB((prev) => ({ ...prev, carga }))}
          onUsoTara={(usoFuncionTara) => setB((prev) => ({ ...prev, pesado: { ...prev.pesado, usoFuncionTara } }))}
          onJaba={actualizarJaba}
        />
      );
      break;
    }
    case 4: {
      const e = estadoPaso4(b);
      estado = e;
      contenido = (
        <Paso4MuestreoTemperatura
          borrador={b}
          estado={e}
          numJabas={numJabas}
          onToggle={alternarCheck}
          onFila={actualizarFilaMuestra}
          onRegenerar={regenerarSeleccion}
          onPesoBolsa={(pesoBolsaG) => setB((prev) => ({ ...prev, muestreo: { ...prev.muestreo, pesoBolsaG } }))}
        />
      );
      break;
    }
    case 5: {
      const e = estadoPaso5(b);
      estado = e;
      contenido = (
        <Paso5InspeccionCajas
          borrador={b}
          estado={e}
          onObservado={marcarObservado}
          onComentario={(clave, comentario) => actualizarParametro(clave, (p) => ({ ...p, comentario }))}
          onAgregarFotos={(clave, ids) => actualizarParametro(clave, (p) => ({ ...p, fotoIds: [...p.fotoIds, ...ids] }))}
          onQuitarFoto={quitarFoto}
          onCajas={(cambios) => setB((prev) => ({ ...prev, cajas: { ...prev.cajas, ...cambios } }))}
        />
      );
      break;
    }
    default:
      estado = { valido: true, faltantes: [] };
      contenido = (
        <SectionCard title={PASOS_ASISTENTE[paso - 1]} subtitle="Disponible en la próxima fase" icon={Hourglass}>
          <p className="text-sm text-slate-600 font-medium">Este paso está en construcción.</p>
        </SectionCard>
      );
  }

  const esUltimo = paso === TOTAL_PASOS;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <Link
            href="/inicio"
            className="flex items-center gap-1.5 text-slate-500 hover:text-marine transition-colors text-sm font-medium"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold text-marine truncate">Recepción y Evaluación de Uva</span>
          </div>
          <button
            type="button"
            onClick={descartar}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
            title="Descartar el registro en curso"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
          <span className="hidden sm:inline text-xs text-slate-500 font-mono font-medium flex-shrink-0 bg-slate-100 px-2.5 py-1 rounded-md">
            Paso {paso}/{TOTAL_PASOS}
          </span>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-3 sm:pb-4">
          <WizardProgress steps={PASOS_ASISTENTE} currentStep={paso} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {mostrarRecuperado && (
          <Aviso tono="info" titulo={`Se recuperó el registro en curso (${b.identificacion.codigoLote})`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>Puede continuar donde lo dejó.</span>
              <button type="button" onClick={() => setMostrarRecuperado(false)} className="font-bold text-marine underline">
                Continuar
              </button>
              <button type="button" onClick={descartar} className="font-bold text-red-600 underline">
                Descartar y empezar uno nuevo
              </button>
            </div>
          </Aviso>
        )}

        {contenido}

        <NavButtons
          onPrev={paso > 1 ? () => irA(paso - 1) : undefined}
          onNext={() => irA(paso + 1)}
          nextLabel={esUltimo ? "Guardar lote y generar informe" : `Siguiente — ${PASOS_ASISTENTE[paso]}`}
          isLastStep={esUltimo}
          disabledNext={!estado.valido || esUltimo}
          faltantes={estado.faltantes}
        />
      </main>
    </div>
  );
}
