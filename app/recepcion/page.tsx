"use client";

import React from "react";
import { useEsCliente } from "@/lib/use-es-cliente";
import { AsistenteRecepcion } from "@/components/recepcion/AsistenteRecepcion";

export default function RecepcionPage() {
  const esCliente = useEsCliente();
  if (!esCliente) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-marine font-bold">Cargando...</p>
      </div>
    );
  }
  return <AsistenteRecepcion modo={{ tipo: "nuevo" }} />;
}
