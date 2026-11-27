// ============================================================
// Etiquetas legibles de los valores internos de Trituración
// (estados, acciones, decisiones, momentos y resultados de control).
// Se usan en el informe, en la bitácora y en el asistente.
// ============================================================
import type { ResultadoControl } from "./control";
import type { ControlApertura, EstadoRegistro, Retencion } from "./tipos";

export const ETIQUETA_ESTADO: Record<EstadoRegistro, string> = {
  EN_CURSO: "En curso",
  CERRADO: "Cerrado",
  CERRADO_CON_RETENIDOS: "Cerrado con retenidos",
};

export const ETIQUETA_ACCION: Record<NonNullable<Retencion["accion"]>, string> = {
  revision: "Revisión",
  ajuste_gap: "Ajustar gap",
  detener: "Detener",
};

export const ETIQUETA_ORIGEN: Record<Retencion["origen"], string> = {
  control: "Control de apertura",
  perdida_identificacion: "Pérdida de identificación",
};

export const ETIQUETA_DECISION: Record<NonNullable<Retencion["disposicion"]["decision"]>, string> = {
  autorizar_entrega: "Autorizar entrega",
  no_entregar: "No entregar",
};

export const ETIQUETA_MOMENTO: Record<ControlApertura["momento"], string> = {
  inicio: "Inicio",
  tras_parada: "Tras parada o ajuste",
  final: "Final",
  comprobacion: "Comprobación",
};

export const ETIQUETA_RESULTADO: Record<ResultadoControl, string> = {
  conforme: "Conforme",
  no_conforme: "No conforme",
  no_evaluable: "No evaluable",
  incompleto: "Incompleto",
};

/**
 * Traduce las claves internas que quedaron guardadas en entradas antiguas
 * de la bitácora (antes de usar etiquetas). Solo reemplaza claves
 * inequívocas y respeta el texto libre.
 */
export function bitacoraLegible(texto: string): string {
  if (texto in ETIQUETA_ESTADO) return ETIQUETA_ESTADO[texto as EstadoRegistro];
  let s = texto;
  const claves: Record<string, string> = {
    CERRADO_CON_RETENIDOS: ETIQUETA_ESTADO.CERRADO_CON_RETENIDOS,
    EN_CURSO: ETIQUETA_ESTADO.EN_CURSO,
    autorizar_entrega: ETIQUETA_DECISION.autorizar_entrega,
    no_entregar: ETIQUETA_DECISION.no_entregar,
    ajuste_gap: ETIQUETA_ACCION.ajuste_gap,
    perdida_identificacion: ETIQUETA_ORIGEN.perdida_identificacion,
    tras_parada: ETIQUETA_MOMENTO.tras_parada,
    no_conforme: ETIQUETA_RESULTADO.no_conforme,
    no_evaluable: ETIQUETA_RESULTADO.no_evaluable,
  };
  for (const [k, v] of Object.entries(claves)) s = s.replace(new RegExp(`\\b${k}\\b`, "g"), v);
  // Acción de la retención: «… kg · recipientes · revision · …»
  s = s.replace(/ · (revision|detener|control) · /g, (_, k: string) => ` · ${k === "control" ? ETIQUETA_ORIGEN.control : ETIQUETA_ACCION[k as "revision" | "detener"]} · `);
  // Controles de apertura: «inicio 10:01 · … · conforme»
  s = s.replace(/^(inicio|final|comprobacion) (?=\d)/, (_, k: ControlApertura["momento"]) => `${ETIQUETA_MOMENTO[k]} `);
  s = s.replace(/ · (conforme|incompleto)$/, (_, k: ResultadoControl) => ` · ${ETIQUETA_RESULTADO[k]}`);
  return s;
}
