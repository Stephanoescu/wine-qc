// ============================================================
// Lógica de evaluación del lote (funciones puras, sin React)
// ============================================================
import { LIMITES_ENTRADA, TABLA_MUESTREO } from "@/lib/config/recepcion";
import type { FilaJaba } from "./tipos";
import { redondear, validarNumero } from "./validacion";

// ─────────────────────────────────────────
// Muestreo
// ─────────────────────────────────────────
/** Número mínimo de jabas a inspeccionar según el total (tabla en la configuración). */
export function tamanoMuestra(totalJabas: number): number {
  if (!Number.isInteger(totalJabas) || totalJabas < 1) return 0;
  for (const fila of TABLA_MUESTREO) {
    if (totalJabas <= fila.hasta) {
      return fila.muestra === "todas" ? totalJabas : Math.min(fila.muestra, totalJabas);
    }
  }
  return totalJabas;
}

/** `k` números de jaba distintos entre 1 y `total`, ordenados de menor a mayor. */
export function seleccionAleatoria(total: number, k: number, rng: () => number = Math.random): number[] {
  const n = Math.max(0, Math.min(k, total));
  const elegidos = new Set<number>();
  while (elegidos.size < n) {
    elegidos.add(1 + Math.floor(rng() * total));
  }
  return [...elegidos].sort((a, b) => a - b);
}

// ─────────────────────────────────────────
// Pesado por jaba
// ─────────────────────────────────────────
export interface EvaluacionJaba {
  numero: number;
  neto: number | null;
  taraPendiente: boolean;
  errorLleno: string | null;
  errorTara: string | null;
  /** Tiene datos suficientes y válidos (puede estar con tara pendiente). */
  completa: boolean;
}

export function evaluarJaba(fila: FilaJaba, numero: number, usoFuncionTara: boolean): EvaluacionJaba {
  const lleno = validarNumero(fila.pesoLleno, LIMITES_ENTRADA.pesoJabaKg);
  const base = { numero, errorLleno: lleno.error, errorTara: null as string | null };

  if (usoFuncionTara) {
    return { ...base, neto: lleno.valor, taraPendiente: false, completa: lleno.valor !== null };
  }
  if (fila.taraPendiente) {
    return { ...base, neto: null, taraPendiente: true, completa: lleno.valor !== null };
  }

  const tara = validarNumero(fila.tara, LIMITES_ENTRADA.taraKg);
  let errorTara = tara.error;
  let neto: number | null = null;
  if (tara.valor !== null && lleno.valor !== null) {
    if (tara.valor >= lleno.valor) {
      errorTara = "La tara debe ser menor que el peso lleno";
    } else {
      neto = redondear(lleno.valor - tara.valor);
    }
  }
  return { ...base, errorTara, neto, taraPendiente: false, completa: neto !== null };
}

export interface ResumenPesado {
  filas: EvaluacionJaba[];
  /** Suma de los netos conocidos (kg). */
  total: number;
  /** Jabas con la tara pendiente. */
  pendientes: number[];
  /** Jabas con algún valor inválido. */
  conError: number[];
  /** Jabas sin datos suficientes (y sin error). */
  incompletas: number[];
  /** El total no incluye todas las jabas. */
  parcial: boolean;
}

/** `jabas[i]` es la jaba N° i+1; las filas que faltan se tratan como vacías. */
export function resumenPesado(jabas: FilaJaba[], numJabas: number, usoFuncionTara: boolean): ResumenPesado {
  const filas: EvaluacionJaba[] = [];
  for (let i = 0; i < numJabas; i++) {
    filas.push(evaluarJaba(jabas[i] ?? FILA_JABA_VACIA, i + 1, usoFuncionTara));
  }
  let total = 0;
  const pendientes: number[] = [];
  const conError: number[] = [];
  const incompletas: number[] = [];
  for (const f of filas) {
    if (f.neto !== null) total += f.neto;
    if (f.errorLleno || f.errorTara) conError.push(f.numero);
    else if (f.taraPendiente && f.completa) pendientes.push(f.numero);
    else if (!f.completa) incompletas.push(f.numero);
  }
  return {
    filas,
    total: redondear(total),
    pendientes,
    conError,
    incompletas,
    parcial: pendientes.length > 0 || conError.length > 0 || incompletas.length > 0,
  };
}

export const FILA_JABA_VACIA: FilaJaba = { pesoLleno: "", tara: "", taraPendiente: false };

/** "3, 5, 8, 12, 20 y 4 más" */
export function listaCorta(numeros: number[], max = 5): string {
  if (numeros.length <= max) return numeros.join(", ");
  return `${numeros.slice(0, max).join(", ")} y ${numeros.length - max} más`;
}
