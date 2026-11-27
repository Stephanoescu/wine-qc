"use client";

import React from "react";
import { Droplets } from "lucide-react";
import { DECIMALES, RANGOS } from "@/lib/config/recepcion";
import { AVISO_BRIX_RONDA1, AVISO_BRIX_RONDA2, CHECK_BRIX, ETIQUETAS_BRIX } from "@/lib/config/recepcion-textos";
import type { EstadoPaso6 } from "@/lib/recepcion/pasos";
import type { BorradorLote } from "@/lib/recepcion/tipos";
import { RondasMedicion } from "./RondasMedicion";
import { Checklist, SectionCard } from "./WizardUI";

export function Paso6Brix({
  borrador,
  estado,
  onToggle,
  onLectura,
}: {
  borrador: BorradorLote;
  estado: EstadoPaso6;
  onToggle: (id: string) => void;
  onLectura: (ronda: number, indice: number, valor: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Muestreo de jugo y °Brix" subtitle="Marque cada ítem al completarlo" icon={Droplets}>
        <Checklist items={CHECK_BRIX} checks={borrador.checks} onToggle={onToggle} />
      </SectionCard>

      <SectionCard
        title="Lecturas del refractómetro"
        subtitle={`Rango de referencia: ${RANGOS.brix.min} a ${RANGOS.brix.max} °Brix`}
        icon={Droplets}
      >
        <RondasMedicion
          nombre="°Brix"
          etiquetas={ETIQUETAS_BRIX}
          rondas={borrador.brix.rondas}
          resultado={estado.rondas}
          onLectura={onLectura}
          rango={RANGOS.brix}
          decimales={DECIMALES.brix}
          unidad="°Brix"
          avisoRonda1={AVISO_BRIX_RONDA1}
          avisoRonda2={AVISO_BRIX_RONDA2}
        />
      </SectionCard>
    </div>
  );
}
