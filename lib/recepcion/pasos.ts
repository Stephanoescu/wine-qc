// ============================================================
// Validación de cada paso del asistente: decide si "Siguiente"
// se habilita y explica qué falta.
// ============================================================
import { LIMITES_ENTRADA } from "@/lib/config/recepcion";
import {
  CHECK_CARGA,
  CHECK_INSTRUMENTOS,
  CHECK_PESADO,
  type ItemChecklist,
} from "@/lib/config/recepcion-textos";
import { listaCorta, resumenPesado, type ResumenPesado } from "./evaluacion";
import type { BorradorLote, IdentificacionBorrador } from "./tipos";
import { validarNumero } from "./validacion";

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
