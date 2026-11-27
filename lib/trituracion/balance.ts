// ============================================================
// Balance de masa del registro de trituración (informe B3).
// La «diferencia no asignada» es solo informativa: no se completa
// como merma supuesta.
// ============================================================
import { GRUPOS, LIMITES_TRITURACION, SECUENCIA_TRITURACION, type Grupo } from "@/lib/config/trituracion";
import { redondear, validarNumero } from "@/lib/recepcion/validacion";
import { evaluarControl } from "./control";
import { evaluarProceso } from "./proceso";
import { totalesTanda } from "./registro";
import type { RegistroTrituracion, TipoFraccion } from "./tipos";

export interface BalanceGrupo {
  clasificado: number;
  /** % sobre el peso de entrada. */
  pctEntrada: number | null;
  /** % sobre el total clasificado en G, M y P (distribución). */
  pctClasificado: number | null;
  triturado: number;
  retenido: number;
  retenidoNoAutorizado: number;
  entregable: number;
  entregado: number;
}

export interface Balance {
  entradaKg: number;
  grupos: Record<Grupo, BalanceGrupo>;
  clasificado: number;
  fracciones: Record<TipoFraccion, number>;
  totalFracciones: number;
  triturado: number;
  retenido: number;
  retenidoNoAutorizado: number;
  entregado: number;
  /** Entrada − (clasificado + fracciones separadas). Solo informativa. */
  diferenciaNoAsignada: number;
  controles: { conforme: number; no_conforme: number; no_evaluable: number };
}

const pct = (v: number, base: number) => (base > 0 ? redondear((v / base) * 100, 2) : null);

export function calcularBalance(r: RegistroTrituracion): Balance {
  const grupos = Object.fromEntries(
    GRUPOS.map((g) => [g, { clasificado: 0, pctEntrada: null, pctClasificado: null, triturado: 0, retenido: 0, retenidoNoAutorizado: 0, entregable: 0, entregado: 0 }]),
  ) as unknown as Record<Grupo, BalanceGrupo>;
  const fracciones = { FRUTA_ROTA: 0, TALLOS: 0, PRUEBA: 0, REMANENTE: 0 } as Record<TipoFraccion, number>;
  const controles = { conforme: 0, no_conforme: 0, no_evaluable: 0 };

  for (const t of r.tandas) {
    const tot = totalesTanda(t);
    for (const g of GRUPOS) grupos[g].clasificado += tot.grupos[g];
    for (const k of Object.keys(fracciones) as TipoFraccion[]) fracciones[k] += tot.fracciones[k];
    for (const g of SECUENCIA_TRITURACION) {
      const p = t.proceso[g];
      if (!p) continue;
      const ev = evaluarProceso(t, g);
      grupos[g].triturado += ev.kgTriturados ?? 0;
      grupos[g].retenido += ev.kgRetenidos;
      grupos[g].retenidoNoAutorizado += ev.kgRetenidoNoAutorizado;
      grupos[g].entregable += ev.kgEntregable;
      for (const c of p.controles) {
        const res = evaluarControl(c).resultado;
        if (res === "conforme" || res === "no_conforme" || res === "no_evaluable") controles[res]++;
      }
    }
  }
  for (const e of r.entrega.entregas) {
    grupos[e.grupo].entregado += validarNumero(e.kg, LIMITES_TRITURACION.kgTriturados).valor ?? 0;
  }

  const entradaKg = r.entrada.pesoDisponibleKg;
  let clasificado = 0;
  for (const g of GRUPOS) {
    const b = grupos[g];
    for (const k of ["clasificado", "triturado", "retenido", "retenidoNoAutorizado", "entregable", "entregado"] as const) b[k] = redondear(b[k]);
    clasificado += b.clasificado;
  }
  clasificado = redondear(clasificado);
  for (const g of GRUPOS) {
    grupos[g].pctEntrada = pct(grupos[g].clasificado, entradaKg);
    grupos[g].pctClasificado = pct(grupos[g].clasificado, clasificado);
  }
  for (const k of Object.keys(fracciones) as TipoFraccion[]) fracciones[k] = redondear(fracciones[k]);
  const totalFracciones = redondear(Object.values(fracciones).reduce((s, v) => s + v, 0));
  const suma = (k: keyof BalanceGrupo) => redondear(GRUPOS.reduce((s, g) => s + (grupos[g][k] as number), 0));

  return {
    entradaKg,
    grupos,
    clasificado,
    fracciones,
    totalFracciones,
    triturado: suma("triturado"),
    retenido: suma("retenido"),
    retenidoNoAutorizado: suma("retenidoNoAutorizado"),
    entregado: suma("entregado"),
    diferenciaNoAsignada: redondear(entradaKg - clasificado - totalFracciones),
    controles,
  };
}
