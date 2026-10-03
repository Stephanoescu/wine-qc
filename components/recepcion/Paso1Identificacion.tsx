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
              hasError={data.proveedor === ""}
            />
          </FormField>

          <FormField label="Procedencia (Cuartel / Sector)" required>
            <StyledInput
              placeholder="Ej. Cuartel 4, Valle del Maipo"
              value={data.procedencia}
              onChange={set("procedencia")}
              hasError={data.procedencia === ""}
            />
          </FormField>

          <FormField label="Fecha de ingreso" required>
            <StyledInput
              type="date"
              value={data.fecha}
              onChange={set("fecha")}
              hasError={data.fecha === ""}
            />
          </FormField>

          <FormField label="Hora de ingreso" required>
            <StyledInput
              type="time"
              value={data.hora}
              onChange={set("hora")}
              hasError={data.hora === ""}
            />
          </FormField>

          <FormField label="Variedad de uva" required>
            <StyledSelect
              value={data.variedad}
              onChange={set("variedad")}
              hasError={data.variedad === ""}
            >
              <option value="">— Seleccione variedad —</option>
              {VARIEDADES_UVA.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </StyledSelect>
          </FormField>

          <FormField label="Peso neto del lote (kg)" required>
            <StyledInput
              type="number"
              placeholder="Ej. 2400"
              value={data.peso}
              onChange={set("peso")}
              min="0"
              suffix="kg"
              hasError={data.peso !== "" && parseFloat(data.peso) <= 0}
            />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Código de Lote" required hint="Se generará automáticamente si se deja en blanco">
              <StyledInput
                placeholder="Ej. LOT-2024-011"
                value={data.codigoLote}
                onChange={set("codigoLote")}
                hasError={data.codigoLote === ""}
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
