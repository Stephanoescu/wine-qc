import React from "react";
import Link from "next/link";
import { GRUPOS } from "@/lib/config/trituracion";
import { fechaAprobacion, gapDeGrupo } from "@/lib/trituracion/config-gaps";
import type { VersionTablaGaps } from "@/lib/trituracion/tipos";
import { formatear } from "@/lib/recepcion/validacion";
import { Aviso } from "@/components/recepcion/WizardUI";
import { conRol, fechaHora } from "@/components/lote/InformeLote";

/** «versión 2 · aprobada 27/11/26 09:10 por Ana (Producción)» */
export function textoVersion(v: { version: number; aprobacion?: { nombre: string; rol: string; fecha: string } }, creadaEn = ""): string {
  const a = v.aprobacion;
  const fecha = a?.fecha || creadaEn;
  return `versión ${v.version}${fecha ? ` · aprobada ${fechaHora(fecha)}` : ""}${a?.nombre ? ` por ${conRol(a.nombre, a.rol || undefined)}` : ""}`;
}

function gaps(v: VersionTablaGaps): string {
  return GRUPOS.map((g) => {
    const r = gapDeGrupo(v, g);
    return `${g} ${r.ok ? `${formatear(r.gapMm, 2, 0)} mm` : v.filas[g].noAplica ? "NO APLICA" : "—"}`;
  }).join(" · ");
}

/**
 * Conflicto de versiones de la tabla de gaps (mismo número tras importar respaldos
 * de dos dispositivos). Se usa como vigente la de aprobación más reciente.
 */
export function AvisoConflictoGaps({
  conflicto,
  onResolver,
  enlaceConfiguracion,
}: {
  conflicto: { version: number; versiones: VersionTablaGaps[] };
  /** Botón para aprobar una nueva versión (en la configuración). */
  onResolver?: () => void;
  /** Enlace a la configuración (en las demás páginas). */
  enlaceConfiguracion?: boolean;
}) {
  const [vigente, ...otras] = conflicto.versiones;
  return (
    <Aviso tono="alerta" titulo={`Conflicto de versiones: hay ${conflicto.versiones.length} tablas aprobadas con el número ${conflicto.version}`}>
      <div className="flex flex-col gap-2">
        <span>
          Ocurre al importar respaldos de dos dispositivos. Mientras tanto se usa como vigente la de aprobación más reciente.
          Apruebe una nueva versión que resuelva el conflicto.
        </span>
        <ul className="flex flex-col gap-1">
          <li>
            <strong>Vigente:</strong> {textoVersion(vigente, vigente.creadaEn)} · {gaps(vigente)}
          </li>
          {otras.map((v) => (
            <li key={v.id} className="text-slate-500">
              En conflicto: {textoVersion(v, v.creadaEn)} · {gaps(v)}
            </li>
          ))}
        </ul>
        {onResolver && (
          <button
            type="button"
            onClick={onResolver}
            className="self-start px-4 py-2 rounded-lg bg-gold text-white text-sm font-bold border border-gold-dark hover:bg-gold-dark"
          >
            Aprobar una nueva versión
          </button>
        )}
        {enlaceConfiguracion && (
          <Link href="/configuracion/trituracion" className="self-start font-bold text-marine underline">
            Resolver en Configuración de gaps
          </Link>
        )}
      </div>
    </Aviso>
  );
}

export { fechaAprobacion };
