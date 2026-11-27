// ============================================================
// Validación de cada paso del asistente: decide si "Siguiente"
// se habilita y explica qué falta.
// ============================================================
import { LIMITES_ENTRADA } from "@/lib/config/recepcion";
import {
  CHECK_CARGA,
  CHECK_INSTRUMENTOS,
  CHECK_MUESTRA_BAYAS,
  CHECK_PESADO,
  CHECK_PREPARACION_MUESTRA,
  CHECK_TEMPERATURA,
  PARAMETROS_VISUALES,
  type ItemChecklist,
} from "@/lib/config/recepcion-textos";
import {
  contenidoInspeccionado,
  listaCorta,
  porcentajeSobre,
  resumenPesado,
  tamanoMuestra,
  temperaturaConforme,
  type ContenidoInspeccionado,
  type ResumenPesado,
} from "./evaluacion";
import type { BorradorLote, ClaveParametroVisual, IdentificacionBorrador } from "./tipos";
import { formatear, redondear, validarNumero } from "./validacion";

export interface EstadoPaso {
  valido: boolean;
  /** Mensajes cortos de lo que falta para continuar. */
  faltantes: string[];
}

export function contarMarcados(items: ItemChecklist[], checks: Record<string, boolean>): number {
  return items.filter((i) => checks[i.id]).length;
}

function faltaChecklist(nombre: string, items: ItemChecklist[], checks: Record<string, boolean>): string | null {
  const n = contarMarcados(items, checks);
  return n === items.length ? null : `Marque todos los ítems de «${nombre}» (${n} de ${items.length})`;
}

/** Número de jabas válido, o 0 si el paso 1 aún no lo tiene. */
export function numJabasValido(id: IdentificacionBorrador): number {
  return validarNumero(id.numJabas, LIMITES_ENTRADA.numJabas).valor ?? 0;
}

// ── Paso 1 ────────────────────────────────────────────────
export type ErroresIdentificacion = Partial<Record<keyof IdentificacionBorrador, string>>;

export function estadoPaso1(id: IdentificacionBorrador): EstadoPaso & { errores: ErroresIdentificacion } {
  const errores: ErroresIdentificacion = {};
  const faltantes: string[] = [];
  const requeridos: [keyof IdentificacionBorrador, string][] = [
    ["proveedor", "Proveedor / Viña"],
    ["origen", "Origen"],
    ["fecha", "Fecha de ingreso"],
    ["hora", "Hora de ingreso"],
    ["variedad", "Variedad de uva"],
    ["numJabas", "Número de jabas"],
    ["codigoLote", "Código de lote"],
  ];
  for (const [campo, etiqueta] of requeridos) {
    if (id[campo].trim() === "") faltantes.push(etiqueta);
  }
  const jabas = validarNumero(id.numJabas, LIMITES_ENTRADA.numJabas);
  if (jabas.error) {
    errores.numJabas = jabas.error;
  }
  const lista: string[] = [];
  if (faltantes.length) lista.push(`Complete: ${faltantes.join(", ")}`);
  if (Object.keys(errores).length) lista.push("Corrija los valores marcados en rojo");
  return { valido: lista.length === 0, faltantes: lista, errores };
}

// ── Paso 2 ────────────────────────────────────────────────
export function estadoPaso2(b: BorradorLote): EstadoPaso {
  const f = faltaChecklist("Instrumentos, equipos y materiales", CHECK_INSTRUMENTOS, b.checks);
  return { valido: !f, faltantes: f ? [f] : [] };
}

// ── Paso 3 ────────────────────────────────────────────────
export interface EstadoPaso3 extends EstadoPaso {
  /** Error por fila de observación (por id de fila). */
  erroresObs: Record<string, { jaba?: string; descripcion?: string }>;
  /** Cantidad de observaciones con descripción. */
  observacionesRegistradas: number;
  pesado: ResumenPesado;
}

export function estadoPaso3(b: BorradorLote): EstadoPaso3 {
  const n = numJabasValido(b.identificacion);
  const faltantes: string[] = [];

  const fCarga = faltaChecklist("Inspección de carga", CHECK_CARGA, b.checks);
  if (fCarga) faltantes.push(fCarga);

  // Observaciones de carga
  const erroresObs: EstadoPaso3["erroresObs"] = {};
  let observacionesRegistradas = 0;
  if (b.carga.hayObservaciones === null) {
    faltantes.push("Indique si hay observaciones en la carga (Sí/No)");
  } else if (b.carga.hayObservaciones) {
    if (b.carga.observaciones.length === 0) faltantes.push("Agregue al menos una observación de carga");
    let incompletas = false;
    for (const o of b.carga.observaciones) {
      const e: { jaba?: string; descripcion?: string } = {};
      const jaba = validarNumero(o.jaba, { min: 1, max: n, entero: true });
      if (jaba.vacio) incompletas = true;
      else if (jaba.error) e.jaba = n > 0 ? `N° de jaba entre 1 y ${n}` : jaba.error;
      if (o.descripcion.trim() === "") incompletas = true;
      else observacionesRegistradas++;
      if (e.jaba) erroresObs[o.id] = e;
    }
    if (incompletas) faltantes.push("Complete el N° de jaba y la descripción de cada observación");
    if (Object.keys(erroresObs).length) faltantes.push("Corrija el N° de jaba de las observaciones");
  }

  // Pesado
  const fPesado = faltaChecklist("Pesado", CHECK_PESADO, b.checks);
  if (fPesado) faltantes.push(fPesado);
  const pesado = resumenPesado(b.pesado.jabas, n, b.pesado.usoFuncionTara);
  if (pesado.conError.length) {
    faltantes.push(`Corrija los pesos de las jabas N° ${listaCorta(pesado.conError)}`);
  }
  if (pesado.incompletas.length) {
    faltantes.push(`Complete el peso de las jabas N° ${listaCorta(pesado.incompletas)}`);
  }

  return {
    valido: faltantes.length === 0,
    faltantes,
    erroresObs,
    observacionesRegistradas,
    pesado,
  };
}

// ── Paso 4 ────────────────────────────────────────────────
export interface FilaMuestraEvaluada {
  id: string;
  /** N° de jaba válido, o null. */
  jaba: number | null;
  errorJaba: string | null;
  temperatura: number | null;
  errorTemperatura: string | null;
  /** null mientras no haya una temperatura válida. */
  conforme: boolean | null;
}

export interface EstadoPaso4 extends EstadoPaso {
  /** Jabas a inspeccionar según la tabla de muestreo. */
  requeridas: number;
  filas: FilaMuestraEvaluada[];
  /** Jabas seleccionadas válidas, en el orden de la lista. */
  seleccion: number[];
  noConformes: number[];
  errorBolsa: string | null;
}

export function estadoPaso4(b: BorradorLote): EstadoPaso4 {
  const n = numJabasValido(b.identificacion);
  const requeridas = tamanoMuestra(n);
  const faltantes: string[] = [];

  // Números de jaba: enteros entre 1 y n, sin repetir.
  const conteo = new Map<string, number>();
  for (const f of b.muestreo.filas) {
    const v = validarNumero(f.jaba, { min: 1, max: n, entero: true }).valor;
    if (v !== null) conteo.set(String(v), (conteo.get(String(v)) ?? 0) + 1);
  }

  let jabasIncompletas = false;
  let tempsIncompletas = false;
  const filas: FilaMuestraEvaluada[] = b.muestreo.filas.map((f) => {
    const vj = validarNumero(f.jaba, { min: 1, max: n, entero: true });
    let errorJaba: string | null = null;
    if (vj.vacio) jabasIncompletas = true;
    else if (vj.error) errorJaba = `Entre 1 y ${n}`;
    else if ((conteo.get(String(vj.valor)) ?? 0) > 1) errorJaba = "Repetida";

    const vt = validarNumero(f.temperatura, LIMITES_ENTRADA.temperaturaC);
    if (vt.vacio) tempsIncompletas = true;
    return {
      id: f.id,
      jaba: errorJaba ? null : vj.valor,
      errorJaba,
      temperatura: vt.valor,
      errorTemperatura: vt.error,
      conforme: vt.valor === null ? null : temperaturaConforme(vt.valor),
    };
  });

  if (n === 0) faltantes.push("Indique el número de jabas en el paso 1");
  else if (filas.length !== requeridas) faltantes.push("Genere la selección de jabas");
  if (jabasIncompletas) faltantes.push("Complete los números de las jabas seleccionadas");
  if (filas.some((f) => f.errorJaba)) faltantes.push("Corrija los números de jaba marcados en rojo");

  for (const [nombre, items] of [
    ["Preparación", CHECK_PREPARACION_MUESTRA],
    ["Medición de temperatura", CHECK_TEMPERATURA],
  ] as const) {
    const f = faltaChecklist(nombre, items, b.checks);
    if (f) faltantes.push(f);
  }
  if (tempsIncompletas) faltantes.push("Registre la temperatura de cada jaba seleccionada");
  if (filas.some((f) => f.errorTemperatura)) faltantes.push("Corrija las temperaturas marcadas en rojo");

  const fBayas = faltaChecklist("Muestra de bayas", CHECK_MUESTRA_BAYAS, b.checks);
  if (fBayas) faltantes.push(fBayas);
  const bolsa = validarNumero(b.muestreo.pesoBolsaG, LIMITES_ENTRADA.pesoBolsaBayasG);
  if (bolsa.vacio) faltantes.push("Registre el peso de la bolsa con bayas");
  else if (bolsa.error) faltantes.push("Corrija el peso de la bolsa con bayas");

  const seleccion = filas.map((f) => f.jaba).filter((j): j is number => j !== null);
  const noConformes = filas
    .filter((f) => f.conforme === false && f.jaba !== null)
    .map((f) => f.jaba as number);

  return {
    valido: faltantes.length === 0,
    faltantes,
    requeridas,
    filas,
    seleccion,
    noConformes,
    errorBolsa: bolsa.error,
  };
}

// ── Paso 5 ────────────────────────────────────────────────
export interface EstadoPaso5 extends EstadoPaso {
  observados: ClaveParametroVisual[];
  contenido: ContenidoInspeccionado;
  materiaExtranaKg: number | null;
  uvaDaniadaKg: number | null;
  materiaExtranaPct: number | null;
  uvaDaniadaPct: number | null;
  errores: { materiaExtranaKg?: string; uvaDaniadaKg?: string; exceso?: string; decision?: string };
}

export function estadoPaso5(b: BorradorLote): EstadoPaso5 {
  const n = numJabasValido(b.identificacion);
  const faltantes: string[] = [];
  const errores: EstadoPaso5["errores"] = {};

  const sinElegir = PARAMETROS_VISUALES.filter((p) => b.cajas.parametros[p.clave].observado === null);
  if (sinElegir.length) {
    faltantes.push(`Indique «Se observa» o «No se observa» en: ${sinElegir.map((p) => p.nombre).join(", ")}`);
  }
  const observados = PARAMETROS_VISUALES.filter((p) => b.cajas.parametros[p.clave].observado === true).map(
    (p) => p.clave,
  );
  if (observados.length && b.cajas.decisionEnologia.trim() === "") {
    errores.decision = "Obligatorio cuando se observa algún parámetro";
    faltantes.push("Registre la decisión de Enología");
  }

  // Contenido inspeccionado = netos de las jabas seleccionadas en el paso 4.
  const seleccion = estadoPaso4(b).seleccion;
  const pesado = resumenPesado(b.pesado.jabas, n, b.pesado.usoFuncionTara);
  const contenido = contenidoInspeccionado(seleccion, pesado);

  const me = validarNumero(b.cajas.materiaExtranaKg, LIMITES_ENTRADA.separadoKg);
  const ud = validarNumero(b.cajas.uvaDaniadaKg, LIMITES_ENTRADA.separadoKg);
  if (me.error) errores.materiaExtranaKg = me.error;
  if (ud.error) errores.uvaDaniadaKg = ud.error;
  if (me.vacio || ud.vacio) faltantes.push("Registre el peso de materia extraña y de uva dañada (0 si no hay)");
  if (me.error || ud.error) faltantes.push("Corrija los pesos de la separación de hallazgos");

  if (me.valor !== null && ud.valor !== null) {
    const separado = redondear(me.valor + ud.valor);
    if (separado > contenido.maximoKg) {
      errores.exceso = `Los kg separados (${formatear(separado, 2)} kg) superan el contenido inspeccionado (${formatear(
        contenido.provisional ? contenido.maximoKg : contenido.kg,
        2,
      )} kg)`;
      faltantes.push("Los kg separados no pueden superar el contenido inspeccionado");
    }
  }

  return {
    valido: faltantes.length === 0,
    faltantes,
    observados,
    contenido,
    materiaExtranaKg: me.valor,
    uvaDaniadaKg: ud.valor,
    materiaExtranaPct: porcentajeSobre(me.valor, contenido.kg),
    uvaDaniadaPct: porcentajeSobre(ud.valor, contenido.kg),
    errores,
  };
}
