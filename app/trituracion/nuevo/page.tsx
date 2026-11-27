"use client";

import React from "react";
import Link from "next/link";
import { Hourglass } from "lucide-react";
import { TITULO_MODULO } from "@/lib/config/trituracion-textos";
import { EncabezadoPagina } from "@/components/comun/EncabezadoPagina";
import { SectionCard } from "@/components/recepcion/WizardUI";

/** Marcador: el asistente de trituración (pasos 1 a 6) se construye en las fases 3 a 5. */
export default function NuevoRegistroTrituracionPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EncabezadoPagina volverHref="/trituracion" volverTexto="Trituración" titulo={TITULO_MODULO} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <SectionCard title="Nuevo registro" subtitle="Disponible en la próxima fase" icon={Hourglass}>
          <p className="text-sm font-medium text-slate-600">
            El asistente de recepción del lote, despalillado y clasificación está en construcción.{" "}
            <Link href="/trituracion" className="font-bold text-marine underline">
              Volver a Trituración
            </Link>
          </p>
        </SectionCard>
      </main>
    </div>
  );
}
