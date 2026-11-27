"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Cog } from "lucide-react";
import { AVISO_ACLARAR_ENTREGA, TITULO_MODULO } from "@/lib/config/trituracion-textos";
import type { LoteV2 } from "@/lib/recepcion/tipos";
import type { VinculoTrituracion } from "@/lib/trituracion/almacen";
import { elegibilidad } from "@/lib/trituracion/elegibilidad";
import { enlaceNuevoRegistro, enlaceRegistro } from "@/lib/trituracion/rutas";
import { EstadoRegistroBadge } from "./EstadoRegistroBadge";

/** Estado de la trituración de un lote de Recepción, con el acceso para enviarlo o verla. */
export function TrituracionDelLote({ lote, vinculo }: { lote: LoteV2; vinculo: VinculoTrituracion | null }) {
  const eleg = elegibilidad(lote);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 break-inside-avoid print:shadow-none">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Cog className="w-5 h-5 text-gold-dark flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">{TITULO_MODULO}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <EstadoRegistroBadge estado={vinculo?.estado ?? "SIN_INICIAR"} />
            {!vinculo && !eleg.ok && (
              <span className="text-xs font-medium text-slate-600">
                No se puede enviar: {eleg.motivo}. {AVISO_ACLARAR_ENTREGA}
              </span>
            )}
          </div>
        </div>
      </div>
      {vinculo ? (
        <Link
          href={enlaceRegistro(vinculo)}
          className="print:hidden self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-marine/30 text-sm font-bold text-marine hover:bg-slate-50"
        >
          Ver trituración <ArrowRight className="w-4 h-4" />
        </Link>
      ) : eleg.ok ? (
        <Link
          href={enlaceNuevoRegistro(lote.id)}
          className="print:hidden self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-marine text-white text-sm font-bold border border-marine-dark hover:bg-marine-light"
        >
          Enviar a Trituración <ArrowRight className="w-4 h-4" />
        </Link>
      ) : null}
    </section>
  );
}
