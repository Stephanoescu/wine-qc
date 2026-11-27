"use client";

import React from "react";
import { User } from "lucide-react";
import { VARIEDADES_UVA } from "@/lib/config/recepcion";
import type { ErroresIdentificacion } from "@/lib/recepcion/pasos";
import type { IdentificacionBorrador } from "@/lib/recepcion/tipos";
import { FormField, NumeroInput, SectionCard, StyledInput, StyledSelect } from "./WizardUI";

interface Paso1Props {
  data: IdentificacionBorrador;
  errores: ErroresIdentificacion;
  onChange: (data: IdentificacionBorrador) => void;
}

export function Paso1Identificacion({ data, errores, onChange }: Paso1Props) {
  const set =
    (field: keyof IdentificacionBorrador) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...data, [field]: e.target.value });

  return (
    <SectionCard
      title="Identificación del lote"
      subtitle="Complete todos los campos obligatorios antes de continuar"
      icon={User}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Proveedor / Viña" required>
          <StyledInput placeholder="Ej. Viña Santa Rosa" value={data.proveedor} onChange={set("proveedor")} />
        </FormField>

        <FormField label="Origen" required>
          <StyledInput placeholder="Ej. Fundo San Benito, Lunahuaná" value={data.origen} onChange={set("origen")} />
        </FormField>

        <FormField label="Fecha de ingreso" required>
          <StyledInput type="date" value={data.fecha} onChange={set("fecha")} />
        </FormField>

        <FormField label="Hora de ingreso" required>
          <StyledInput type="time" value={data.hora} onChange={set("hora")} />
        </FormField>

        <FormField label="Variedad de uva" required>
          <StyledSelect options={VARIEDADES_UVA} value={data.variedad} onChange={set("variedad")} />
        </FormField>

        <FormField
          label="Número de jabas"
          required
          error={errores.numJabas}
        >
          <NumeroInput
            entero
            placeholder="Ej. 120"
            value={data.numJabas}
            onChange={(v) => onChange({ ...data, numJabas: v })}
            error={errores.numJabas}
            unidad="jabas"
          />
        </FormField>

        <div className="sm:col-span-2">
          <FormField label="Código de lote" required ayuda="Generado automáticamente. Puede modificarlo si es necesario.">
            <StyledInput placeholder="Ej. LOT-2026-0011" value={data.codigoLote} onChange={set("codigoLote")} />
          </FormField>
        </div>
      </div>
    </SectionCard>
  );
}
