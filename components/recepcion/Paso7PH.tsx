"use client";

import React from "react";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { DECIMALES, PH_DIFERENCIA_AVISO, RANGOS } from "@/lib/config/recepcion";
import {
  AVISO_PH_RONDA1,
  AVISO_PH_RONDA2,
  avisoDiferenciaPh,
  CHECK_ELECTRODO,
  CHECK_PH,
  ETIQUETAS_PH,
} from "@/lib/config/recepcion-textos";
import type { EstadoPaso7 } from "@/lib/recepcion/pasos";
import type { BorradorLote } from "@/lib/recepcion/tipos";
import { formatear } from "@/lib/recepcion/validacion";
import { RondasMedicion } from "./RondasMedicion";
import { Checklist, SectionCard } from "./WizardUI";

export function Paso7PH({
  borrador,
  estado,
  onToggle,
  onLectura,
}: {
  borrador: BorradorLote;
  estado: EstadoPaso7;
  onToggle: (id: string) => void;
  onLectura: (ronda: number, indice: number, valor: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Medición de pH" subtitle="Marque cada ítem al completarlo" icon={FlaskConical}>
        <Checklist items={CHECK_PH} checks={borrador.checks} onToggle={onToggle} />
      </SectionCard>

      <SectionCard
        title="Lecturas del medidor de pH"
        subtitle={`Rango de referencia: pH ${formatear(RANGOS.ph.min, 1)} a ${formatear(RANGOS.ph.max, 1)}`}
        icon={FlaskConical}
      >
        <div className="flex flex-col gap-5">
          <RondasMedicion
            nombre="pH"
            etiquetas={ETIQUETAS_PH}
            rondas={borrador.ph.rondas}
            resultado={estado.rondas}
            onLectura={onLectura}
            rango={RANGOS.ph}
            decimales={DECIMALES.ph}
            decimalesRango={1}
            avisoRonda1={AVISO_PH_RONDA1}
            avisoRonda2={AVISO_PH_RONDA2}
            mostrarDiferencia
            avisoDiferencia={{
              umbral: PH_DIFERENCIA_AVISO,
              texto: avisoDiferenciaPh(formatear(PH_DIFERENCIA_AVISO, 2, 1)),
            }}
          />
        </div>
      </SectionCard>

      <SectionCard title="Cuidado del electrodo" subtitle="Al terminar las mediciones" icon={ShieldCheck}>
        <Checklist items={CHECK_ELECTRODO} checks={borrador.checks} onToggle={onToggle} />
      </SectionCard>
    </div>
  );
}
