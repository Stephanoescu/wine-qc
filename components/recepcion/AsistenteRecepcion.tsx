"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, X } from "lucide-react";
import { PASOS_ASISTENTE } from "@/lib/config/recepcion-textos";
import type { Rol } from "@/lib/config/roles";
import {
  borrarBorrador,
  cargarBorrador,
  claveEdicion,
  crearBorradorVacio,
  fotosDelBorrador,
  guardarBorrador,
  nuevoId,
} from "@/lib/recepcion/borrador";
import { asegurarSeleccion, FILA_JABA_VACIA, filasMuestraNuevas } from "@/lib/recepcion/evaluacion";
import { existeCodigo, fotosDelLote, saveLote, updateLote } from "@/lib/recepcion/almacen";
import { aplicarEdicion, faltantesEdicion, loteABorrador, previsualizarEdicion } from "@/lib/recepcion/edicion";
import { borrarFotos } from "@/lib/recepcion/fotos";
import { aplicarDecision, construirLote, estadoPaso9 } from "@/lib/recepcion/lote";
import {
  estadoPaso1,
  estadoPaso2,
  estadoPaso3,
  estadoPaso4,
  estadoPaso5,
  estadoPaso6,
  estadoPaso7,
  estadoPaso8,
  numJabasValido,
  type EstadoPaso,
} from "@/lib/recepcion/pasos";
import type {
  BorradorLote,
  ClaveParametroVisual,
  FilaJaba,
  FilaMuestra,
  LoteV2,
  ParamVisualBorrador,
} from "@/lib/recepcion/tipos";
import { Aviso, NavButtons, WizardProgress } from "./WizardUI";
import { Paso1Identificacion } from "./Paso1Identificacion";
import { Paso2Instrumentos } from "./Paso2Instrumentos";
import { Paso3CargaPesado } from "./Paso3CargaPesado";
import { Paso4MuestreoTemperatura } from "./Paso4MuestreoTemperatura";
import { Paso5InspeccionCajas } from "./Paso5InspeccionCajas";
import { Paso6Brix } from "./Paso6Brix";
import { Paso7PH } from "./Paso7PH";
import { Paso8Acidez } from "./Paso8Acidez";
import { Paso9Decision } from "./Paso9Decision";
import { Paso9Edicion, type DatosEdicion } from "./Paso9Edicion";

const TOTAL_PASOS = PASOS_ASISTENTE.length;
/** Fecha fija para la vista previa de la edición (la real se toma al guardar). */
const VISTA_PREVIA = "1970-01-01T00:00:00.000Z";

export type ModoAsistente = { tipo: "nuevo" } | { tipo: "editar"; lote: LoteV2; trituracionVinculada: boolean };

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

/**
 * Asistente de 9 pasos de Recepción. En modo «editar» se abre con los datos
 * del lote guardado, se puede saltar entre pasos y el paso 9 guarda la edición
 * con su firma en la bitácora. Solo se renderiza en el navegador.
 */
export function AsistenteRecepcion({ modo }: { modo: ModoAsistente }) {
  const edicion = modo.tipo === "editar" ? modo : null;
  const antes = edicion?.lote ?? null;
  const clave = antes ? claveEdicion(antes.id) : undefined;

  // Lee el borrador guardado (registro nuevo o edición en curso) una sola vez.
  const [inicio] = useState(() => {
    const guardado = cargarBorrador(clave);
    if (antes) {
      return guardado ? { borrador: guardado, recuperado: true } : { borrador: loteABorrador(antes), recuperado: false };
    }
    const util = guardado && tieneDatos(guardado) ? guardado : null;
    return { borrador: util ?? crearBorradorVacio(), recuperado: !!util };
  });
  const [b, setB] = useState<BorradorLote>(inicio.borrador);
  const [mostrarRecuperado, setMostrarRecuperado] = useState(inicio.recuperado);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  // Fotos del lote original: en modo edición no se borran hasta guardar.
  const fotosOriginales = useMemo(() => new Set(antes ? fotosDelLote(antes) : []), [antes]);
  const descartarFotos = useCallback(
    (ids: string[]) => {
      const borrables = ids.filter((id) => !fotosOriginales.has(id));
      if (borrables.length) borrarFotos(borrables).catch(() => {});
    },
    [fotosOriginales],
  );

  // Autosalvado del borrador en cada cambio (salvo cuando ya se guardó).
  useEffect(() => {
    if (!guardando) guardarBorrador(b, clave);
  }, [b, guardando, clave]);

  const paso = b.paso;
  const numJabas = numJabasValido(b.identificacion);

  const irA = useCallback((p: number) => {
    setB((prev) => {
      const paso = Math.min(Math.max(p, 1), TOTAL_PASOS);
      const siguiente = { ...prev, paso };
      // Al llegar (o volver) al muestreo, generar o ajustar la selección de jabas.
      if (paso >= 4) {
        const filas = asegurarSeleccion(prev.muestreo.filas, numJabasValido(prev.identificacion), nuevoId);
        if (filas !== prev.muestreo.filas) siguiente.muestreo = { ...prev.muestreo, filas };
      }
      return siguiente;
    });
    setErrorGuardado(null);
    window.scrollTo({ top: 0 });
  }, []);

  const alternarCheck = useCallback((id: string) => {
    setB((prev) => ({ ...prev, checks: { ...prev.checks, [id]: !prev.checks[id] } }));
  }, []);

  // ── Paso 3 ──
  const actualizarJaba = useCallback((i: number, cambios: Partial<FilaJaba>) => {
    setB((prev) => {
      const jabas = prev.pesado.jabas.slice();
      while (jabas.length <= i) jabas.push({ ...FILA_JABA_VACIA });
      jabas[i] = { ...jabas[i], ...cambios };
      return { ...prev, pesado: { ...prev.pesado, jabas } };
    });
  }, []);

  const fotosObservacion = useCallback((id: string, cambio: (ids: string[]) => string[]) => {
    setB((prev) => ({
      ...prev,
      carga: {
        ...prev.carga,
        observaciones: prev.carga.observaciones.map((o) => (o.id === id ? { ...o, fotoIds: cambio(o.fotoIds) } : o)),
      },
    }));
  }, []);

  function quitarObservacion(id: string) {
    const fila = b.carga.observaciones.find((o) => o.id === id);
    if (fila) descartarFotos(fila.fotoIds);
    setB((prev) => ({ ...prev, carga: { ...prev.carga, observaciones: prev.carga.observaciones.filter((o) => o.id !== id) } }));
  }

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
      descartarFotos(fotos);
    }
    actualizarParametro(clave, (p) => ({ ...p, observado, fotoIds: observado ? p.fotoIds : [] }));
  }

  function quitarFotoParametro(clave: ClaveParametroVisual, id: string) {
    descartarFotos([id]);
    actualizarParametro(clave, (p) => ({ ...p, fotoIds: p.fotoIds.filter((f) => f !== id) }));
  }

  // ── Pasos 6 y 7 ──
  const actualizarLectura = useCallback((medida: "brix" | "ph", ronda: number, indice: number, valor: string) => {
    setB((prev) => {
      const rondas = prev[medida].rondas.map((r, ri) => (ri === ronda ? r.map((v, i) => (i === indice ? valor : v)) : r));
      return { ...prev, [medida]: { ...prev[medida], rondas } };
    });
  }, []);

  // ── Paso 8 ──
  const actualizarAcidez = useCallback((cambios: Partial<BorradorLote["acidez"]>) => {
    setB((prev) => {
      const acidez = { ...prev.acidez, ...cambios };
      // Un valor nuevo necesita su propia confirmación del laboratorio.
      if (cambios.valor !== undefined && cambios.valor !== prev.acidez.valor) acidez.confirmado = null;
      return { ...prev, acidez };
    });
  }, []);

  // ── Paso 9 ──
  const actualizarDecision = (cambios: Partial<BorradorLote["decision"]>) => {
    setErrorGuardado(null);
    setB((prev) => ({ ...prev, decision: { ...prev.decision, ...cambios } }));
  };
  const actualizarEdicion = (cambios: Partial<DatosEdicion>) => {
    setErrorGuardado(null);
    setB((prev) => ({
      ...prev,
      edicion: { ...(prev.edicion ?? { por: "", rol: "", motivo: "", trituracionInformada: false }), ...cambios },
    }));
  };

  function guardarNuevo(estadoFinal: ReturnType<typeof estadoPaso9>) {
    if (guardando || !estadoFinal.valido) return;
    const ahora = new Date().toISOString();
    const id = nuevoId();
    const lote = aplicarDecision(construirLote(b, id, ahora), estadoFinal.elegido, b.decision, ahora);
    const r = saveLote(lote);
    if (!r.ok) {
      setErrorGuardado(r.error);
      return;
    }
    setGuardando(true);
    borrarBorrador();
    router.push(`/reportes/${encodeURIComponent(id)}?nuevo=1`);
  }

  function guardarEdicion() {
    if (!antes || !edicion || guardando) return;
    const e = b.edicion;
    if (!e || !e.rol) return;
    try {
      const ahora = new Date().toISOString();
      const r = aplicarEdicion(
        antes,
        b,
        { por: e.por, rol: e.rol as Rol, motivo: e.motivo },
        { trituracionVinculada: edicion.trituracionVinculada, trituracionInformada: e.trituracionInformada },
        ahora,
      );
      const g = updateLote(r.lote);
      if (!g.ok) {
        setErrorGuardado(g.error);
        return;
      }
      setGuardando(true);
      if (r.fotosQuitadas.length) borrarFotos(r.fotosQuitadas).catch(() => {});
      borrarBorrador(clave);
      router.push(`/reportes/${encodeURIComponent(antes.id)}?editado=1`);
    } catch (err) {
      setErrorGuardado(err instanceof Error ? err.message : "No se pudo guardar la edición.");
    }
  }

  function descartar() {
    if (antes) {
      if (!confirm("¿Cancelar la edición? Se perderán los cambios no guardados.")) return;
      descartarFotos(fotosDelBorrador(b));
      borrarBorrador(clave);
      setGuardando(true);
      router.push(`/reportes/${encodeURIComponent(antes.id)}`);
      return;
    }
    if (!confirm("¿Descartar el registro en curso y empezar uno nuevo? Se perderán los datos ingresados.")) return;
    borrarFotos(fotosDelBorrador(b)).catch(() => {});
    borrarBorrador();
    setB(crearBorradorVacio());
    setMostrarRecuperado(false);
    window.scrollTo({ top: 0 });
  }

  /** Edición recuperada: volver a los datos del informe guardado. */
  function reiniciarEdicion() {
    if (!antes) return;
    if (!confirm("¿Descartar los cambios sin guardar y volver a los datos del informe?")) return;
    descartarFotos(fotosDelBorrador(b));
    setB(loteABorrador(antes));
    setMostrarRecuperado(false);
  }

  // ── Contenido y validación del paso actual ──
  let contenido: React.ReactNode;
  let estado: EstadoPaso;
  let alGuardar: (() => void) | null = null;
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
          onAgregarFotosObservacion={(id, ids) => fotosObservacion(id, (actuales) => [...actuales, ...ids])}
          onQuitarFotoObservacion={(id, fotoId) => {
            descartarFotos([fotoId]);
            fotosObservacion(id, (actuales) => actuales.filter((f) => f !== fotoId));
          }}
          onQuitarObservacion={quitarObservacion}
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
          onComentario={(c, comentario) => actualizarParametro(c, (p) => ({ ...p, comentario }))}
          onAgregarFotos={(c, ids) => actualizarParametro(c, (p) => ({ ...p, fotoIds: [...p.fotoIds, ...ids] }))}
          onQuitarFoto={quitarFotoParametro}
          onCajas={(cambios) => setB((prev) => ({ ...prev, cajas: { ...prev.cajas, ...cambios } }))}
        />
      );
      break;
    }
    case 6: {
      const e = estadoPaso6(b);
      estado = e;
      contenido = (
        <Paso6Brix borrador={b} estado={e} onToggle={alternarCheck} onLectura={(r, i, v) => actualizarLectura("brix", r, i, v)} />
      );
      break;
    }
    case 7: {
      const e = estadoPaso7(b);
      estado = e;
      contenido = (
        <Paso7PH borrador={b} estado={e} onToggle={alternarCheck} onLectura={(r, i, v) => actualizarLectura("ph", r, i, v)} />
      );
      break;
    }
    case 8: {
      const e = estadoPaso8(b);
      estado = e;
      contenido = <Paso8Acidez borrador={b} estado={e} onToggle={alternarCheck} onAcidez={actualizarAcidez} />;
      break;
    }
    default: {
      // Tras un guardado exitoso el lote ya existe con ese código: no es un duplicado.
      const codigoDuplicado = !guardando && existeCodigo(b.identificacion.codigoLote, antes?.id);
      if (antes && edicion) {
        const e = b.edicion;
        const vista = previsualizarEdicion(
          antes,
          b,
          { por: e?.por ?? "", rol: (e?.rol || "Operario/a") as Rol, motivo: e?.motivo ?? "" },
          VISTA_PREVIA,
        );
        const faltantes = faltantesEdicion(antes, b, vista, { trituracionVinculada: edicion.trituracionVinculada, codigoDuplicado });
        estado = { valido: faltantes.length === 0, faltantes };
        alGuardar = guardarEdicion;
        contenido = (
          <Paso9Edicion
            borrador={b}
            antes={antes}
            vista={vista}
            trituracionVinculada={edicion.trituracionVinculada}
            onDecision={actualizarDecision}
            onEdicion={actualizarEdicion}
            onIrAPaso={irA}
            errorGuardado={errorGuardado}
          />
        );
      } else {
        const e = estadoPaso9(b, { codigoDuplicado });
        estado = e;
        alGuardar = () => guardarNuevo(e);
        contenido = (
          <Paso9Decision
            borrador={b}
            estado={e}
            onToggle={alternarCheck}
            onDecision={actualizarDecision}
            errorGuardado={errorGuardado}
            onIrAPaso={irA}
          />
        );
      }
    }
  }

  const esUltimo = paso === TOTAL_PASOS;
  const textoGuardar = antes ? "Guardar cambios" : "Guardar lote y generar informe";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <Link
            href={antes ? `/reportes/${encodeURIComponent(antes.id)}` : "/inicio"}
            className="flex items-center gap-1.5 text-slate-500 hover:text-marine transition-colors text-sm font-medium"
            aria-label={antes ? "Volver al informe" : "Volver al inicio"}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{antes ? "Informe" : "Inicio"}</span>
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold text-marine truncate">
              {antes ? `Editar informe · ${antes.codigoLote}` : "Recepción y Evaluación de Uva"}
            </span>
          </div>
          <button
            type="button"
            onClick={descartar}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
            title={antes ? "Cancelar la edición" : "Descartar el registro en curso"}
          >
            {antes ? <X className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
            <span className="hidden sm:inline">{antes ? "Cancelar edición" : "Reiniciar"}</span>
          </button>
          <span className="hidden sm:inline text-xs text-slate-500 font-mono font-medium flex-shrink-0 bg-slate-100 px-2.5 py-1 rounded-md">
            Paso {paso}/{TOTAL_PASOS}
          </span>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-3 sm:pb-4">
          <WizardProgress steps={PASOS_ASISTENTE} currentStep={paso} onSeleccionarPaso={antes ? irA : undefined} />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {antes && edicion?.trituracionVinculada && paso === 1 && (
          <Aviso tono="alerta" titulo="Este lote ya tiene un registro de Trituración vinculado">
            Los cambios no actualizan Trituración. Si cambia el peso disponible, deberá confirmar que Trituración fue
            informada.
          </Aviso>
        )}
        {mostrarRecuperado && (
          <Aviso
            tono="info"
            titulo={antes ? "Se recuperó una edición sin guardar" : `Se recuperó el registro en curso (${b.identificacion.codigoLote})`}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>Puede continuar donde lo dejó.</span>
              <button type="button" onClick={() => setMostrarRecuperado(false)} className="font-bold text-marine underline">
                Continuar
              </button>
              <button type="button" onClick={antes ? reiniciarEdicion : descartar} className="font-bold text-red-600 underline">
                {antes ? "Descartar los cambios" : "Descartar y empezar uno nuevo"}
              </button>
            </div>
          </Aviso>
        )}

        {contenido}

        <NavButtons
          onPrev={paso > 1 ? () => irA(paso - 1) : undefined}
          onNext={() => (esUltimo ? alGuardar?.() : irA(paso + 1))}
          nextLabel={esUltimo ? (guardando ? "Guardando…" : textoGuardar) : `Siguiente — ${PASOS_ASISTENTE[paso]}`}
          isLastStep={esUltimo}
          disabledNext={!estado.valido || guardando}
          faltantes={estado.faltantes}
        />
      </main>
    </div>
  );
}
