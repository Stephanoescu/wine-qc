import React from "react";
import { CheckCircle2, CircleDashed, Clock, ShieldAlert } from "lucide-react";
import type { EstadoRegistro } from "@/lib/trituracion/tipos";

const ESTILO: Record<EstadoRegistro | "SIN_INICIAR", { texto: string; cls: string; Icon: React.ElementType }> = {
  SIN_INICIAR: { texto: "Sin iniciar", cls: "bg-slate-100 text-slate-600 border-slate-200", Icon: CircleDashed },
  EN_CURSO: { texto: "En curso", cls: "bg-sky-100 text-sky-800 border-sky-200", Icon: Clock },
  CERRADO: { texto: "Cerrado", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", Icon: CheckCircle2 },
  CERRADO_CON_RETENIDOS: {
    texto: "Cerrado con retenidos",
    cls: "bg-amber-100 text-amber-800 border-amber-200",
    Icon: ShieldAlert,
  },
};

/** Estado de un registro de trituración (o «Sin iniciar» si el lote no tiene uno). */
export function EstadoRegistroBadge({ estado }: { estado: EstadoRegistro | "SIN_INICIAR" }) {
  const e = ESTILO[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border whitespace-nowrap ${e.cls}`}>
      <e.Icon className="w-3.5 h-3.5" />
      {e.texto}
    </span>
  );
}
