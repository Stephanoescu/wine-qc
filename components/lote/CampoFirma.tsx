"use client";

import React from "react";
import { ROLES, type Rol } from "@/lib/config/roles";
import { FormField, StyledInput, StyledSelect } from "@/components/recepcion/WizardUI";

/**
 * Nombre + rol de quien firma. Con `rolFijo`, el rol se muestra sin poder cambiarse
 * (p. ej. Enología o Mantenimiento).
 */
export function CampoFirma({
  etiqueta,
  nombre,
  rol,
  onNombre,
  onRol,
  rolFijo,
  requerido = true,
  rolRequerido = requerido,
  placeholder = "Nombre y apellido",
}: {
  etiqueta: string;
  nombre: string;
  rol: Rol | "";
  onNombre: (v: string) => void;
  onRol?: (v: Rol | "") => void;
  rolFijo?: Rol;
  requerido?: boolean;
  rolRequerido?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_12rem] gap-3">
      <FormField label={etiqueta} required={requerido}>
        <StyledInput value={nombre} onChange={(e) => onNombre(e.target.value)} placeholder={placeholder} autoComplete="name" />
      </FormField>
      <FormField label="Rol" required={rolRequerido && !rolFijo}>
        {rolFijo ? (
          <span className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-marine">{rolFijo}</span>
        ) : (
          <StyledSelect value={rol} onChange={(e) => onRol?.(e.target.value as Rol | "")} options={ROLES} />
        )}
      </FormField>
    </div>
  );
}
