// ============================================================
// Registro de trituración: creación desde el lote de Recepción,
// recipientes, tandas y totales (funciones puras).
// ============================================================
import { GRUPOS, LIMITES_TRITURACION, type Grupo } from "@/lib/config/trituracion";
import type { LoteV2 } from "@/lib/recepcion/tipos";
import { redondear, validarNumero } from "@/lib/recepcion/validacion";
import { firmaVacia } from "./config-gaps";
import type { ControlSalida, Fraccion, Recipiente, RegistroTrituracion, Tanda, TipoFraccion } from "./tipos";

/** Registro nuevo (EN_CURSO, paso 1) con la copia de la ficha de Recepción. */
export function crearRegistro(lote: LoteV2, id: string, ahora: string, horaActual: string): RegistroTrituracion {
  return {
    version: 1,
    id,
    loteId: lote.id,
    codigoLote: lote.codigoLote,
    entrada: {
      pesoDisponibleKg: lote.pesoDisponible.kg,
      variedad: lote.variedad,
      proveedor: lote.proveedor,
      origen: lote.origen,
      estadoLote: lote.liberadoConObservaciones ? "LIBERADO (con observaciones)" : lote.estado,
      disposicion: {
        nombre: lote.disposicion?.nombre ?? "",
        ...(lote.disposicion?.rol ? { rol: lote.disposicion.rol } : {}),
        destino: lote.disposicion?.destino ?? "",
      },
      capturadaEn: ahora,
    },
    estado: "EN_CURSO",
    paso: 1,
    checks: {},
    recepcion: {
      horaEntrega: horaActual,
      recibe: firmaVacia(),
      entregadoPor: { nombre: "", rol: "Recepción", fecha: "" },
    },
    despalillado: { anomalia: null, incidencias: [] },
    salida: { controles: [] },
    tandas: [],
    entrega: {
      entregas: [],
      disposicionPorciones: { texto: "", firma: firmaVacia() },
      limpieza: { responsable: firmaVacia(), hora: "" },
      cierre: { nombre: "", rol: "Producción", fecha: "" },
    },
    bitacora: [],
    creadoEn: ahora,
    updatedAt: ahora,
  };
}

// ─────────────────────────────────────────
// Despalillado: control de salida
// ─────────────────────────────────────────
export function controlSalidaVacio(id: string, hora: string): ControlSalida {
  return {
    id,
    hora,
    resultado: null,
    comentarioFrutaRota: "",
    tallosObservados: null,
    danio: "",
    fotoIds: [],
    detencion: { solicitada: false, correccion: "" },
    verificaProduccion: { nombre: "", rol: "Producción", fecha: "" },
  };
}

// ─────────────────────────────────────────
// Clasificación: recipientes y tandas
// ─────────────────────────────────────────
export interface EvaluacionRecipiente {
  neto: number | null;
  errorBruto: string | null;
  errorTara: string | null;
}

/** Neto = peso bruto − tara (la tara se descuenta una sola vez). */
export function evaluarRecipiente(r: Recipiente): EvaluacionRecipiente {
  const b = validarNumero(r.brutoKg, LIMITES_TRITURACION.pesoRecipienteKg);
  const t = validarNumero(r.taraKg, LIMITES_TRITURACION.taraRecipienteKg);
  let errorTara = t.vacio ? null : t.error;
  let neto: number | null = null;
  if (b.valor !== null && t.valor !== null) {
    if (t.valor >= b.valor) errorTara = "La tara debe ser menor que el peso bruto";
    else neto = redondear(b.valor - t.valor);
  }
  return { neto, errorBruto: b.vacio ? null : b.error, errorTara };
}

/** «G-T1-1», «M-T2-3»… */
export function identificadorSugerido(grupo: Grupo, tanda: number, correlativo: number): string {
  return `${grupo}-T${tanda}-${correlativo}`;
}

export function recipienteNuevo(id: string, grupo: Grupo, tanda: number, correlativo: number, hora: string): Recipiente {
  return { id, identificador: identificadorSugerido(grupo, tanda, correlativo), brutoKg: "", taraKg: "", hora };
}

export function tandaNueva(numero: number): Tanda {
  const grupos = Object.fromEntries(GRUPOS.map((g) => [g, { noAparecio: false, recipientes: [] }])) as unknown as Tanda["grupos"];
  return { numero, cerrada: false, cerradaEn: "", checks: {}, grupos, fracciones: [], proceso: {} };
}

export const NOMBRE_FRACCION: Record<TipoFraccion, string> = {
  FRUTA_ROTA: "FRUTA ROTA",
  TALLOS: "TALLOS",
  PRUEBA: "PRUEBA",
  REMANENTE: "Remanente medido",
};

export function fraccionNueva(id: string, tipo: TipoFraccion, hora: string): Fraccion {
  return { id, tipo, kg: "", recipiente: "", hora };
}

export interface TotalesTanda {
  /** Neto por grupo (kg); 0 si «No apareció». */
  grupos: Record<Grupo, number>;
  clasificado: number;
  fracciones: Record<TipoFraccion, number>;
  totalFracciones: number;
}

export function totalesTanda(t: Tanda): TotalesTanda {
  const grupos = { G: 0, M: 0, P: 0 } as Record<Grupo, number>;
  for (const g of GRUPOS) {
    const d = t.grupos[g];
    if (d.noAparecio) continue;
    grupos[g] = redondear(d.recipientes.reduce((s, r) => s + (evaluarRecipiente(r).neto ?? 0), 0));
  }
  const fracciones = { FRUTA_ROTA: 0, TALLOS: 0, PRUEBA: 0, REMANENTE: 0 } as Record<TipoFraccion, number>;
  for (const f of t.fracciones) {
    fracciones[f.tipo] = redondear(fracciones[f.tipo] + (validarNumero(f.kg, LIMITES_TRITURACION.fraccionKg).valor ?? 0));
  }
  const clasificado = redondear(GRUPOS.reduce((s, g) => s + grupos[g], 0));
  const totalFracciones = redondear(Object.values(fracciones).reduce((s, v) => s + v, 0));
  return { grupos, clasificado, fracciones, totalFracciones };
}

/** Grupos de la tanda que se trituran (con kg > 0), en la secuencia P → M → G. */
export function gruposATriturar(t: Tanda, secuencia: readonly Grupo[]): Grupo[] {
  const tot = totalesTanda(t);
  return secuencia.filter((g) => !t.grupos[g].noAparecio && tot.grupos[g] > 0);
}

/**
 * La tanda cerrada ya se trituró: todos sus grupos con kg tienen la trituración
 * completa (la Fase 4 define «completa»; aquí: kg triturados y control final).
 */
export function tandaTriturada(t: Tanda, secuencia: readonly Grupo[], completo: (t: Tanda, g: Grupo) => boolean): boolean {
  return t.cerrada && gruposATriturar(t, secuencia).every((g) => completo(t, g));
}
