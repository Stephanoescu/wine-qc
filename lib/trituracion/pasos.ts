// ============================================================
// Validación de los pasos del asistente de trituración: decide si
// «Siguiente» se habilita y explica qué falta.
// ============================================================
import { GRUPOS, LIMITES_TRITURACION, SECUENCIA_TRITURACION } from "@/lib/config/trituracion";
import {
  CHECK_ACT1,
  CHECK_ACT2,
  CHECK_ACT3,
  CHECK_ACT4,
  CHECK_ACT5,
  CHECK_ACT6,
  CHECK_CONDICION_GENERAL,
} from "@/lib/config/trituracion-textos";
import type { ItemChecklist } from "@/lib/config/recepcion-textos";
import { contarMarcados, type EstadoPaso } from "@/lib/recepcion/pasos";
import { validarNumero } from "@/lib/recepcion/validacion";
import { grupoActual, grupoCompleto } from "./proceso";
import { evaluarRecipiente, tandaTriturada, totalesTanda } from "./registro";
import type { RegistroTrituracion, Tanda } from "./tipos";

export type { EstadoPaso } from "@/lib/recepcion/pasos";

function faltaLista(nombre: string, items: ItemChecklist[], checks: Record<string, boolean>): string | null {
  const n = contarMarcados(items, checks);
  return n === items.length ? null : `Marque todos los ítems de «${nombre}» (${n} de ${items.length})`;
}

// ── Paso 1: recibir el lote liberado (actividad 1, Registro A) ──
export function estadoPasoT1(r: RegistroTrituracion): EstadoPaso {
  const f: string[] = [];
  for (const [n, items] of [
    ["Condición general", CHECK_CONDICION_GENERAL],
    ["Recibir el lote liberado", CHECK_ACT1],
  ] as const) {
    const x = faltaLista(n, items, r.checks);
    if (x) f.push(x);
  }
  const a = r.recepcion;
  if (!a.horaEntrega) f.push("Indique la hora de entrega");
  if (!a.recibe.nombre.trim() || !a.recibe.rol) f.push("Complete quién recibe (nombre y rol)");
  if (!a.entregadoPor.nombre.trim()) f.push("Complete quién entrega (Recepción)");
  return { valido: f.length === 0, faltantes: f };
}

// ── Paso 2: introducir los racimos (actividad 2) ──
export function estadoPasoT2(r: RegistroTrituracion): EstadoPaso {
  const f: string[] = [];
  const x = faltaLista("Introducir los racimos", CHECK_ACT2, r.checks);
  if (x) f.push(x);
  const d = r.despalillado;
  if (d.anomalia === null) f.push("Indique si hubo atasco, ruido o vibración anormal");
  if (d.anomalia === true) {
    if (d.incidencias.length === 0) f.push("Registre la incidencia");
    if (d.incidencias.some((i) => !i.hora || !i.descripcion.trim() || !i.mantenimiento.trim())) {
      f.push("Complete hora, descripción y Mantenimiento de cada incidencia");
    }
  }
  return { valido: f.length === 0, faltantes: f };
}

// ── Paso 3: comprobar la salida del despalillado (actividad 3) ──
export interface EstadoPasoT3 extends EstadoPaso {
  /** Hay algún control con fruta rota (sus kg se registran en la clasificación). */
  huboFrutaRota: boolean;
  /** El último control permite avanzar (fruta conforme, sin tallos, sin detención). */
  ultimoConforme: boolean;
}

export function estadoPasoT3(r: RegistroTrituracion): EstadoPasoT3 {
  const f: string[] = [];
  const x = faltaLista("Comprobar la salida del despalillado", CHECK_ACT3, r.checks);
  if (x) f.push(x);
  const cs = r.salida.controles;
  if (cs.length === 0) f.push("Registre el control de la salida");
  cs.forEach((c, i) => {
    const n = i + 1;
    if (!c.hora) f.push(`Control ${n}: indique la hora`);
    if (c.resultado === null) f.push(`Control ${n}: indique «Fruta conforme» o «Fruta rota»`);
    if (c.resultado === "fruta_rota" && !c.comentarioFrutaRota.trim()) f.push(`Control ${n}: describa cómo se separó la FRUTA ROTA`);
    if (c.tallosObservados === null) f.push(`Control ${n}: indique si se observan tallos`);
    if (c.detencion.solicitada && !c.detencion.correccion.trim()) f.push(`Control ${n}: registre la corrección del equipo`);
    // Producción verifica la salida tras la intervención (control que sigue a una detención).
    if (i > 0 && cs[i - 1].detencion.solicitada && !c.verificaProduccion.nombre.trim()) {
      f.push(`Control ${n}: Producción debe verificar la salida tras la intervención`);
    }
  });
  const u = cs[cs.length - 1];
  const ultimoConforme = !!u && u.resultado === "conforme" && u.tallosObservados === false && !u.detencion.solicitada;
  if (u && !ultimoConforme && f.length === 0) {
    f.push("Solo se avanza con un control con fruta conforme y sin tallos: detenga, corrija y repita el control");
  }
  return { valido: f.length === 0, faltantes: f, huboFrutaRota: cs.some((c) => c.resultado === "fruta_rota"), ultimoConforme };
}

// ── Paso 4: clasificación por cribas y tandas (actividades 4, 5 y 6) ──
/** Qué falta para cerrar una tanda. */
export function faltantesCerrarTanda(t: Tanda): string[] {
  const f: string[] = [];
  const x = faltaLista(`Tanda ${t.numero} · identificar y cerrar`, CHECK_ACT6, t.checks);
  if (x) f.push(x);
  for (const g of GRUPOS) {
    const d = t.grupos[g];
    if (d.noAparecio) continue;
    if (d.recipientes.length === 0) f.push(`Grupo ${g}: registre al menos un recipiente o marque «No apareció (0 kg)»`);
    d.recipientes.forEach((rc) => {
      const e = evaluarRecipiente(rc);
      if (!rc.identificador.trim()) f.push(`Grupo ${g}: identifique cada recipiente`);
      if (e.errorBruto || e.errorTara) f.push(`Grupo ${g} · ${rc.identificador || "recipiente"}: corrija el peso o la tara`);
      else if (e.neto === null) f.push(`Grupo ${g} · ${rc.identificador || "recipiente"}: registre peso bruto y tara`);
      if (!rc.hora) f.push(`Grupo ${g} · ${rc.identificador || "recipiente"}: indique la hora de clasificación`);
    });
  }
  for (const fr of t.fracciones) {
    const v = validarNumero(fr.kg, LIMITES_TRITURACION.fraccionKg);
    if (v.vacio || v.error) f.push("Complete los kg de cada fracción separada");
    if (!fr.hora) f.push("Indique la hora de cada fracción separada");
  }
  if (totalesTanda(t).clasificado <= 0 && f.length === 0) f.push("La tanda no tiene kg clasificados en G, M ni P");
  return [...new Set(f)];
}

export function tandaPendienteDeTriturar(r: RegistroTrituracion): Tanda | null {
  return r.tandas.find((t) => t.cerrada && !tandaTriturada(t, SECUENCIA_TRITURACION, grupoCompleto)) ?? null;
}

export function estadoPasoT4(r: RegistroTrituracion): EstadoPaso {
  const f: string[] = [];
  for (const [n, items] of [
    ["Pasar las bayas a las cribas", CHECK_ACT4],
    ["Recoger las uvas en tres recipientes", CHECK_ACT5],
  ] as const) {
    const x = faltaLista(n, items, r.checks);
    if (x) f.push(x);
  }
  if (!r.tandas.some((t) => t.cerrada)) f.push("Cierre al menos una tanda para pasar a la trituración");
  return { valido: f.length === 0, faltantes: f };
}

// ── Paso 5: triturar (actividades 7, 8 y 9) ──
export function estadoPasoT5(r: RegistroTrituracion): EstadoPaso {
  const f: string[] = [];
  const abierta = r.tandas.find((t) => !t.cerrada);
  if (abierta) f.push(`Cierre la tanda ${abierta.numero} en el paso 4 (o descártela si está vacía)`);
  if (!r.tandas.some((t) => t.cerrada)) f.push("No hay tandas cerradas para triturar");
  const actual = grupoActual(r);
  if (actual) f.push(`Complete la trituración del grupo ${actual.grupo} de la tanda ${actual.tanda}`);
  return { valido: f.length === 0, faltantes: f };
}
