// ============================================================
// Trituración por grupo (actividades 7, 8 y 9). Funciones puras.
// La Fase 4 completa estas reglas (gap, retenciones, firmas).
// ============================================================
import { LIMITES_TRITURACION, type Grupo } from "@/lib/config/trituracion";
import { validarNumero } from "@/lib/recepcion/validacion";
import type { Tanda } from "./tipos";

/** Un grupo está completo con kg triturados, control de inicio y control final. */
export function grupoCompleto(t: Tanda, g: Grupo): boolean {
  const p = t.proceso[g];
  if (!p) return false;
  const kg = validarNumero(p.kgTriturados, LIMITES_TRITURACION.kgTriturados).valor;
  return kg !== null && p.controles.some((c) => c.momento === "inicio") && p.controles.some((c) => c.momento === "final");
}
