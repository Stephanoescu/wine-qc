"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { getLote } from "@/lib/recepcion/almacen";
import { esLegacy } from "@/lib/recepcion/tipos";
import { trituracionDeLote } from "@/lib/trituracion/almacen";
import { useEsCliente } from "@/lib/use-es-cliente";
import { AsistenteRecepcion } from "@/components/recepcion/AsistenteRecepcion";

export default function EditarLotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const esCliente = useEsCliente();
  if (!esCliente) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-marine font-bold">Cargando...</p>
      </div>
    );
  }
  return <Edicion id={decodeURIComponent(id)} />;
}

function Edicion({ id }: { id: string }) {
  // Solo en el navegador: lee el lote y su vínculo con Trituración una sola vez.
  const [{ lote, trituracionVinculada }] = useState(() => {
    const l = getLote(id);
    return { lote: l, trituracionVinculada: l ? trituracionDeLote(l.id) !== null : false };
  });
  if (!lote || esLegacy(lote)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-black text-marine">{lote ? "Lote de formato anterior" : "Lote no encontrado"}</p>
        <p className="text-sm font-medium text-slate-500 max-w-md">
          {lote
            ? "Los lotes registrados con la clasificación A/B/C son de solo lectura."
            : "Los lotes se guardan en el navegador de cada dispositivo."}
        </p>
        <Link href={lote ? `/reportes/${encodeURIComponent(id)}` : "/reportes"} className="text-sm font-bold text-gold-dark hover:underline">
          ← Volver
        </Link>
      </div>
    );
  }
  return <AsistenteRecepcion modo={{ tipo: "editar", lote, trituracionVinculada }} />;
}
