import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Encabezado fijo de las páginas: volver, logo, título y acciones a la derecha. */
export function EncabezadoPagina({
  volverHref,
  volverTexto,
  titulo,
  children,
  ancho = "max-w-5xl",
  inferior,
}: {
  volverHref: string;
  volverTexto: string;
  titulo: string;
  children?: React.ReactNode;
  ancho?: string;
  /** Contenido bajo la fila principal (p. ej. la barra de pasos). */
  inferior?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm print:hidden">
      <div className={`${ancho} mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3`}>
        <Link
          href={volverHref}
          className="flex items-center gap-1.5 text-slate-500 hover:text-marine transition-colors text-sm font-medium"
          aria-label={`Volver a ${volverTexto}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{volverTexto}</span>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
          <span className="text-sm font-bold text-marine truncate">{titulo}</span>
        </div>
        {children}
      </div>
      {inferior && <div className={`${ancho} mx-auto px-4 sm:px-6 pb-3 sm:pb-4`}>{inferior}</div>}
    </header>
  );
}
