"use client";

import React from "react";
import { User } from "lucide-react";
import { VARIEDADES_UVA, type IdentificacionData } from "@/lib/recepcion-data";
import { FormField, StyledInput, StyledSelect, SectionCard, NavButtons } from "./WizardUI";

interface Paso1Props {
  data: IdentificacionData;
  onChange: (data: IdentificacionData) => void;
  onNext: () => void;
}

function isValid(data: IdentificacionData): boolean {
  return (
    data.proveedor.trim() !== "" &&
    data.procedencia.trim() !== "" &&
    data.fecha !== "" &&
    data.hora !== "" &&
    data.variedad !== "" &&
    data.peso !== "" &&
    parseFloat(data.peso) > 0 &&
    data.codigoLote.trim() !== ""
  );
}

export function Paso1Identificacion({ data, onChange, onNext }: Paso1Props) {
  const set = (field: keyof IdentificacionData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onChange({ ...data, [field]: e.target.value });

  const valid = isValid(data);

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Identificación del Lote"
        subtitle="Complete todos los campos obligatorios antes de continuar"
        icon={User}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Proveedor / Viña" required>
            <StyledInput
              placeholder="Ej. Viña Santa Rosa"
              value={data.proveedor}
              onChange={set("proveedor")}
            />
          </FormField>

          <FormField label="Procedencia (Cuartel / Sector)" required>
            <StyledInput
              placeholder="Ej. Cuartel 4, Valle del Maipo"
              value={data.procedencia}
              onChange={set("procedencia")}
            />
          </FormField>

          <FormField label="Fecha de ingreso" required>
            <StyledInput
              type="date"
              value={data.fecha}
              onChange={set("fecha")}
            />
          </FormField>

          <FormField label="Hora de ingreso" required>
            <StyledInput
              type="time"
              value={data.hora}
              onChange={set("hora")}
            />
          </FormField>

          <FormField label="Variedad de uva" required>
            <StyledSelect
              options={VARIEDADES_UVA}
              value={data.variedad}
              onChange={set("variedad")}
            />
          </FormField>

          <FormField label="Peso neto del lote (kg)" required>
            <StyledInput
              type="number"
              placeholder="Ej. 2400"
              value={data.peso}
              onChange={set("peso")}
              min="0"
            />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Código de Lote" required>
              <StyledInput
                placeholder="Ej. LOT-2024-011"
                value={data.codigoLote}
                onChange={set("codigoLote")}
              />
            </FormField>
          </div>
        </div>
      </SectionCard>

      <NavButtons
        onNext={onNext}
        nextLabel="Siguiente — Inspección Visual"
        disabledNext={!valid}
      />
    </div>
  );
}
