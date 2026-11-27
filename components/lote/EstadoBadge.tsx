import React from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { EstadoLote } from "@/lib/recepcion/tipos";

export const ESTILO_ESTADO: Record<
  EstadoLote,
  { texto: string; chip: string; bloque: string; barra: string; Icon: React.ElementType }
> = {
  LIBERADO: {
    texto: "LIBERADO",
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bloque: "bg-emerald-600 text-white border-emerald-700",
    barra: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  RETENIDO: {
    texto: "RETENIDO",
    chip: "bg-amber-100 text-amber-800 border-amber-200",
    bloque: "bg-amber-500 text-white border-amber-600",
    barra: "bg-amber-500",
    Icon: AlertTriangle,
  },
  RECHAZADO: {
    texto: "RECHAZADO",
    chip: "bg-red-100 text-red-800 border-red-200",
    bloque: "bg-red-600 text-white border-red-700",
    barra: "bg-red-500",
    Icon: XCircle,
  },
};

/** Etiqueta de estado del lote (verde / ámbar / rojo). */
export function EstadoBadge({ estado, grande }: { estado: EstadoLote; grande?: boolean }) {
  const e = ESTILO_ESTADO[estado];
  if (grande) {
    return (
      <span className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-xl sm:text-2xl font-black tracking-wide shadow-sm ${e.bloque}`}>
        <e.Icon className="w-6 h-6 sm:w-7 sm:h-7" />
        {e.texto}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border whitespace-nowrap ${e.chip}`}>
      <e.Icon className="w-3.5 h-3.5" />
      {e.texto}
    </span>
  );
}
