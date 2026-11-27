"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { getRegistro } from "@/lib/trituracion/almacen";
import { useEsCliente } from "@/lib/use-es-cliente";
import { AsistenteTrituracion } from "@/components/trituracion/AsistenteTrituracion";

export default function RegistroTrituracionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  const { id } = use(params);
  const { editar } = use(searchParams);
  const esCliente = useEsCliente();
  if (!esCliente) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-marine font-bold">Cargando...</p>
      </div>
    );
  }
  return <Registro id={decodeURIComponent(id)} editar={editar === "1"} />;
}

function Registro({ id, editar }: { id: string; editar: boolean }) {
  // Solo en el navegador: lee el registro una vez.
  const [registro] = useState(() => getRegistro(id));
  // Un registro cerrado solo se abre para editar su informe (con bitácora).
  if (!registro || (registro.estado !== "EN_CURSO" && !editar)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-black text-marine">{registro ? "Registro cerrado" : "Registro no encontrado"}</p>
        <p className="text-sm font-medium text-slate-500 max-w-md">
          {registro
            ? "Este registro ya se cerró. Puede ver su informe y editarlo desde ahí."
            : "Los registros se guardan en el navegador de cada dispositivo."}
        </p>
        <Link href={registro ? `/trituracion/${encodeURIComponent(id)}` : "/trituracion"} className="text-sm font-bold text-gold-dark hover:underline">
          {registro ? "Ver el informe" : "← Volver a Trituración"}
        </Link>
      </div>
    );
  }
  return <AsistenteTrituracion inicial={registro} editar={editar && registro.estado !== "EN_CURSO"} />;
}
