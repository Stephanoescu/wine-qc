"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePen, Play, Printer, Trash2 } from "lucide-react";
import { TITULO_MODULO } from "@/lib/config/trituracion-textos";
import { getLote } from "@/lib/recepcion/almacen";
import { descargarRespaldo } from "@/lib/recepcion/respaldo";
import { esLegacy } from "@/lib/recepcion/tipos";
import { deleteRegistro, getRegistro } from "@/lib/trituracion/almacen";
import { getVersiones } from "@/lib/trituracion/config-gaps";
import { useEsCliente } from "@/lib/use-es-cliente";
import { Aviso } from "@/components/recepcion/WizardUI";
import { EncabezadoPagina } from "@/components/comun/EncabezadoPagina";
import { DialogoEliminar } from "@/components/lote/EliminarLote";
import { InformeTrituracion } from "@/components/trituracion/InformeTrituracion";

export default function InformeTrituracionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cerrado?: string; editado?: string }>;
}) {
  const { id } = use(params);
  const { cerrado, editado } = use(searchParams);
  const esCliente = useEsCliente();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white">
      <EncabezadoPagina volverHref="/trituracion" volverTexto="Trituración" titulo={`Informe · ${TITULO_MODULO}`}>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-marine hover:bg-slate-50"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimir / PDF</span>
        </button>
      </EncabezadoPagina>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 print:p-0 print:max-w-none">
        {esCliente ? (
          <Informe id={decodeURIComponent(id)} cerrado={cerrado === "1"} editado={editado === "1"} />
        ) : (
          <p className="text-marine font-bold text-center py-20">Cargando...</p>
        )}
      </main>
    </div>
  );
}

function Informe({ id, cerrado, editado }: { id: string; cerrado: boolean; editado: boolean }) {
  const router = useRouter();
  // Solo en el navegador: lee el registro y la ficha actual de Recepción una vez.
  const [datos] = useState(() => {
    const r = getRegistro(id);
    const l = r ? getLote(r.loteId) : null;
    return { r, pesoActual: l && !esLegacy(l) ? l.pesoDisponible.kg : null, versiones: getVersiones() };
  });
  const [eliminando, setEliminando] = useState(false);
  const r = datos.r;

  if (!r) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg font-black text-marine">Registro no encontrado</p>
        <p className="text-sm font-medium text-slate-500 max-w-md">
          Los registros se guardan en el navegador de cada dispositivo. Si lo hizo en otro equipo, exporte el respaldo allí e
          impórtelo aquí desde Reportes.
        </p>
        <Link href="/trituracion" className="text-sm font-bold text-gold-dark hover:underline">
          ← Volver a Trituración
        </Link>
      </div>
    );
  }

  const enCurso = r.estado === "EN_CURSO";
  return (
    <div className="flex flex-col gap-6">
      {cerrado && (
        <Aviso tono="ok" titulo="Operación cerrada">
          Este es el informe del registro de trituración.
        </Aviso>
      )}
      {editado && (
        <Aviso tono="ok" titulo="Cambios guardados">
          Los cambios quedaron en la bitácora del informe.
        </Aviso>
      )}
      {enCurso && (
        <Aviso tono="info" titulo="Registro en curso: informe parcial">
          El registro aún no se cerró.
        </Aviso>
      )}
      <div className="flex justify-end gap-2 print:hidden">
        {enCurso ? (
          <Link
            href={`/trituracion/${encodeURIComponent(r.id)}/registro`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-marine text-white text-sm font-bold border border-marine-dark hover:bg-marine-light"
          >
            <Play className="w-4 h-4" /> Continuar el registro
          </Link>
        ) : (
          <Link
            href={`/trituracion/${encodeURIComponent(r.id)}/registro?editar=1`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-marine/30 bg-white text-sm font-bold text-marine hover:bg-slate-50 shadow-sm"
          >
            <FilePen className="w-4 h-4" /> Editar informe
          </Link>
        )}
      </div>

      <InformeTrituracion r={r} pesoActualRecepcion={datos.pesoActual} versionesTabla={datos.versiones} />

      <div className="flex flex-col items-start gap-3 pt-4 border-t border-slate-200 print:hidden">
        <button
          type="button"
          onClick={() => setEliminando(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-sm font-bold text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar registro de trituración
        </button>
      </div>
      {eliminando && (
        <DialogoEliminar
          titulo="Eliminar registro de trituración"
          codigo={r.codigoLote}
          queSeBorra="el registro de trituración y sus fotos (el lote de Recepción no se modifica)"
          etiquetaExportar="Exportar este registro (JSON)"
          exportar={() => descargarRespaldo({ trituraciones: [r] }).then(() => undefined)}
          eliminar={(motivo, ahora) => deleteRegistro(r.id, motivo, ahora)}
          onCancelar={() => setEliminando(false)}
          onEliminado={() => router.push("/trituracion")}
        />
      )}
    </div>
  );
}
