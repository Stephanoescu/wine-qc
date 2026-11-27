"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FilePen, Plus, Printer, Trash2 } from "lucide-react";
import { getLote, updateLote } from "@/lib/recepcion/almacen";
import { esLegacy, type LoteAlmacenado, type LoteV2 } from "@/lib/recepcion/tipos";
import { trituracionDeLote } from "@/lib/trituracion/almacen";
import { useEsCliente } from "@/lib/use-es-cliente";
import { Aviso } from "@/components/recepcion/WizardUI";
import { InformeLegacy, InformeLote } from "@/components/lote/InformeLote";
import { AccionesLote } from "@/components/lote/AccionesLote";
import { DialogoEliminarLote } from "@/components/lote/EliminarLote";

export default function DetalleLotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string; editado?: string }>;
}) {
  const { id } = use(params);
  const { nuevo, editado } = use(searchParams);
  const esCliente = useEsCliente();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <Link
            href="/reportes"
            className="flex items-center gap-1.5 text-slate-500 hover:text-marine transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Reportes</span>
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold text-marine truncate">Detalle del lote</span>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-marine hover:bg-slate-50"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 print:p-0 print:max-w-none">
        {esCliente ? (
          <Detalle id={decodeURIComponent(id)} nuevo={nuevo === "1"} editado={editado === "1"} />
        ) : (
          <p className="text-marine font-bold text-center py-20">Cargando...</p>
        )}
      </main>
    </div>
  );
}

function Detalle({ id, nuevo, editado }: { id: string; nuevo: boolean; editado: boolean }) {
  // Solo en el navegador (ver useEsCliente): puede leer localStorage al iniciar.
  const [lote, setLote] = useState<LoteAlmacenado | null>(() => getLote(id));
  const [eliminando, setEliminando] = useState(false);
  const router = useRouter();

  if (!lote) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg font-black text-marine">Lote no encontrado</p>
        <p className="text-sm font-medium text-slate-500 max-w-md">
          Los lotes se guardan en el navegador de cada dispositivo. Si lo registró en otro equipo, exporte el respaldo
          allí e impórtelo aquí desde Reportes.
        </p>
        <Link href="/reportes" className="text-sm font-bold text-gold-dark hover:underline">
          ← Volver a Reportes
        </Link>
      </div>
    );
  }

  function editar() {
    if (!lote) return;
    if (
      trituracionDeLote(lote.id) &&
      !confirm(
        "Este lote ya tiene un registro de Trituración vinculado. Los cambios no actualizan Trituración y, si cambia el peso disponible, deberá confirmar que Trituración fue informada. ¿Continuar con la edición?",
      )
    ) {
      return;
    }
    router.push(`/reportes/${encodeURIComponent(lote.id)}/editar`);
  }

  function guardar(nuevoLote: LoteV2) {
    const r = updateLote(nuevoLote);
    if (r.ok) setLote(nuevoLote);
    return r;
  }

  return (
    <div className="flex flex-col gap-6">
      {nuevo && (
        <div className="print:hidden">
          <Aviso tono="ok" titulo="Lote guardado correctamente">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>Este es el informe final del lote.</span>
              <Link href="/recepcion" className="inline-flex items-center gap-1 font-bold text-marine underline">
                <Plus className="w-3.5 h-3.5" />
                Registrar otro lote
              </Link>
            </div>
          </Aviso>
        </div>
      )}
      {editado && (
        <div className="print:hidden">
          <Aviso tono="ok" titulo="Cambios guardados">
            Los cambios quedaron en la bitácora del informe.
          </Aviso>
        </div>
      )}
      {!esLegacy(lote) && (
        <div className="flex justify-end print:hidden">
          <button
            type="button"
            onClick={editar}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-marine/30 bg-white text-sm font-bold text-marine hover:bg-slate-50 shadow-sm"
          >
            <FilePen className="w-4 h-4" />
            Editar informe
          </button>
        </div>
      )}
      {esLegacy(lote) ? (
        <InformeLegacy lote={lote} />
      ) : (
        <>
          <InformeLote lote={lote} />
          <AccionesLote lote={lote} onGuardar={guardar} />
        </>
      )}
      <div className="flex flex-col items-start gap-3 pt-4 border-t border-slate-200 print:hidden">
        <button
          type="button"
          onClick={() => setEliminando(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-sm font-bold text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar lote
        </button>
      </div>
      {eliminando && (
        <DialogoEliminarLote lote={lote} onCancelar={() => setEliminando(false)} onEliminado={() => router.push("/reportes")} />
      )}
    </div>
  );
}
