import React from "react";
import { GRUPOS } from "@/lib/config/trituracion";
import { DEFINICION_GRUPOS } from "@/lib/config/trituracion-textos";
import { gapDeGrupo } from "@/lib/trituracion/config-gaps";
import type { VersionTablaGaps } from "@/lib/trituracion/tipos";
import { formatear } from "@/lib/recepcion/validacion";
import { fechaHora, conRol } from "@/components/lote/InformeLote";

/** Tabla estándar de gaps por grupo (sección 4.2), de solo lectura. */
export function TablaGaps({ version, conMetadatos = true }: { version: VersionTablaGaps; conMetadatos?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-black uppercase tracking-wider text-slate-500 bg-slate-50">
              <th className="px-3 py-2.5">Grupo</th>
              <th className="px-3 py-2.5">Identificación en las cribas</th>
              <th className="px-3 py-2.5 text-right">Gap estándar</th>
              <th className="px-3 py-2.5">Posición o marca</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {GRUPOS.map((g) => {
              const f = version.filas[g];
              const r = gapDeGrupo(version, g);
              return (
                <tr key={g}>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-black font-mono text-marine">{g}</span>
                    <span className="ml-1.5 text-xs font-medium text-slate-500">{DEFINICION_GRUPOS[g].nombre}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-medium text-slate-600 min-w-[14rem]">
                    {DEFINICION_GRUPOS[g].identificacion}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {r.ok ? (
                      <span className="font-mono font-black text-marine">{formatear(r.gapMm, 2, 0)} mm</span>
                    ) : f.noAplica ? (
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">NO APLICA</span>
                    ) : (
                      <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        No establecido
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-sm font-medium text-slate-700">{f.posicion || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {conMetadatos && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ["Equipo y modelo", version.equipoModelo],
            ["Configuración y versión", version.configuracionVersion],
            ["Responsable de comprobación", version.responsableComprobacion],
            [
              "Fecha y aprobación",
              `${fechaHora(version.aprobacion.fecha || version.creadaEn)} · ${conRol(version.aprobacion.nombre, version.aprobacion.rol || undefined)}`,
            ],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
              <dd className="font-bold text-marine break-words">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
