// ============================================================
// Actividad 9: evaluación del control de apertura de piel e
// integridad de semillas. Función pura.
// ============================================================
import { CRITERIOS_ACT9, LIMITES_TRITURACION } from "@/lib/config/trituracion";
import { validarNumero } from "@/lib/recepcion/validacion";
import type { ControlApertura } from "./tipos";

export type ResultadoControl = "conforme" | "no_conforme" | "no_evaluable" | "incompleto";

export interface EvaluacionControl {
  resultado: ResultadoControl;
  /** Errores de los campos (por nombre de campo). */
  errores: Partial<Record<"bayasRevisadas" | "abiertas" | "enteras" | "semillasRevisadas" | "semillasDaniadas" | "hora", string>>;
  /** Criterios escalados a las bayas revisadas. */
  criterios: { abiertasMin: number; enterasMax: number; semillasDaniadasMax: number; semillasRevisadasMin: number };
  /** Motivos de un resultado No conforme. */
  motivos: string[];
}

export function criteriosEscalados(bayasRevisadas: number) {
  const c = CRITERIOS_ACT9;
  return {
    abiertasMin: Math.ceil((c.abiertasMinPct / 100) * bayasRevisadas),
    enterasMax: Math.floor((c.enterasMaxPct / 100) * bayasRevisadas),
    semillasDaniadasMax: c.semillasDaniadasMax,
    semillasRevisadasMin: c.semillasRevisadasMin,
  };
}

/**
 * Resultado automático: No evaluable (marcado), Conforme o No conforme.
 * «Incompleto» mientras falten datos o haya errores. Se exige revisar al menos
 * las semillas mínimas para registrar el control, y abiertas + enteras ≤ revisadas.
 */
export function evaluarControl(c: ControlApertura): EvaluacionControl {
  const errores: EvaluacionControl["errores"] = {};
  const conteo = LIMITES_TRITURACION.conteo;
  if (!c.hora.trim()) errores.hora = "Obligatorio";

  if (c.noEvaluable) {
    return {
      resultado: Object.keys(errores).length ? "incompleto" : "no_evaluable",
      errores,
      criterios: criteriosEscalados(0),
      motivos: [],
    };
  }

  const v = (campo: "bayasRevisadas" | "abiertas" | "enteras" | "semillasRevisadas" | "semillasDaniadas") => {
    const r = validarNumero(c[campo], conteo);
    if (r.vacio) errores[campo] = "Obligatorio";
    else if (r.error) errores[campo] = r.error;
    return r.valor;
  };
  const bayas = v("bayasRevisadas");
  const abiertas = v("abiertas");
  const enteras = v("enteras");
  const semillas = v("semillasRevisadas");
  const daniadas = v("semillasDaniadas");

  if (bayas !== null && bayas < 1) errores.bayasRevisadas = "Debe revisar al menos 1 baya";
  if (bayas !== null && abiertas !== null && enteras !== null && abiertas + enteras > bayas) {
    errores.enteras = "Abiertas + enteras no puede superar las bayas revisadas";
  }
  if (semillas !== null && semillas < CRITERIOS_ACT9.semillasRevisadasMin) {
    errores.semillasRevisadas = `Revise al menos ${CRITERIOS_ACT9.semillasRevisadasMin} semillas`;
  }

  const criterios = criteriosEscalados(bayas ?? 0);
  if (Object.keys(errores).length || bayas === null || abiertas === null || enteras === null || daniadas === null) {
    return { resultado: "incompleto", errores, criterios, motivos: [] };
  }

  const motivos: string[] = [];
  if (abiertas < criterios.abiertasMin) motivos.push(`${abiertas} abiertas de ${bayas} (mínimo ${criterios.abiertasMin})`);
  if (enteras > criterios.enterasMax) motivos.push(`${enteras} enteras de ${bayas} (máximo ${criterios.enterasMax})`);
  if (daniadas > criterios.semillasDaniadasMax) {
    motivos.push(`${daniadas} semillas dañadas o fragmentos (máximo ${criterios.semillasDaniadasMax})`);
  }
  return { resultado: motivos.length ? "no_conforme" : "conforme", errores, criterios, motivos };
}

export function controlVacio(id: string, momento: ControlApertura["momento"], hora = ""): ControlApertura {
  return {
    id,
    momento,
    hora,
    bayasRevisadas: String(CRITERIOS_ACT9.bayasRevisadasDefecto),
    abiertas: "",
    enteras: "",
    semillasRevisadas: String(CRITERIOS_ACT9.semillasRevisadasDefecto),
    semillasDaniadas: "",
    noEvaluable: false,
    recipientesAfectados: "",
  };
}
