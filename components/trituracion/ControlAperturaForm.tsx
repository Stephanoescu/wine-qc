"use client";

import React from "react";
import { CRITERIOS_ACT9 } from "@/lib/config/trituracion";
import { NOTA_CRITERIOS_ACT9, NOTA_RESULTADO_CERO, TEXTO_NO_EVALUABLE } from "@/lib/config/trituracion-textos";
import { evaluarControl, type ResultadoControl } from "@/lib/trituracion/control";
import type { ControlApertura } from "@/lib/trituracion/tipos";
import { BadgeConformidad, FormField, Interruptor, NumeroInput, StyledInput } from "@/components/recepcion/WizardUI";

export function BadgeResultadoControl({ resultado }: { resultado: ResultadoControl }) {
  if (resultado === "conforme") return <BadgeConformidad estado="conforme" />;
  if (resultado === "no_conforme") return <BadgeConformidad estado="no_conforme" />;
  if (resultado === "no_evaluable") return <BadgeConformidad estado="pendiente" texto="No evaluable" />;
  return <span className="text-xs font-bold text-slate-400">Complete el control</span>;
}

/**
 * Control de la actividad 9 (también en el Registro D del Anexo B):
 * conteo de bayas abiertas y enteras, semillas revisadas y dañadas,
 * con el resultado automático según los criterios de la configuración.
 */
export function ControlAperturaForm({
  control,
  onChange,
  bloqueado,
}: {
  control: ControlApertura;
  onChange: (cambios: Partial<ControlApertura>) => void;
  bloqueado?: boolean;
}) {
  const ev = evaluarControl(control);
  const e = ev.errores;
  const campo = (
    clave: "bayasRevisadas" | "abiertas" | "enteras" | "semillasRevisadas" | "semillasDaniadas",
    etiqueta: string,
    ayuda?: string,
  ) => (
    <FormField label={etiqueta} required error={e[clave] && control[clave] !== "" ? e[clave] : undefined} ayuda={ayuda}>
      <NumeroInput
        entero
        compacto
        value={control[clave]}
        onChange={(v) => onChange({ [clave]: v })}
        error={e[clave] && control[clave] !== "" ? e[clave] : undefined}
        disabled={bloqueado}
        className="font-mono"
      />
    </FormField>
  );

  return (
    <div className="flex flex-col gap-4">
      <Interruptor
        activo={control.noEvaluable}
        onChange={(noEvaluable) => !bloqueado && onChange({ noEvaluable })}
        etiqueta={TEXTO_NO_EVALUABLE}
      />
      {!control.noEvaluable && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {campo("bayasRevisadas", "Bayas revisadas")}
          {campo("abiertas", "Bayas abiertas", `Mínimo ${ev.criterios.abiertasMin}`)}
          {campo("enteras", "Bayas enteras", `Máximo ${ev.criterios.enterasMax}`)}
          {campo("semillasRevisadas", "Semillas revisadas", `Al menos ${CRITERIOS_ACT9.semillasRevisadasMin}`)}
          {campo("semillasDaniadas", "Semillas dañadas o fragmentos", `Máximo ${ev.criterios.semillasDaniadasMax}`)}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] gap-3">
        <FormField label="Hora" required>
          <StyledInput type="time" value={control.hora} onChange={(ev) => onChange({ hora: ev.target.value })} disabled={bloqueado} />
        </FormField>
        <FormField label="Recipientes afectados" ayuda="Identificadores, si corresponde">
          <StyledInput
            value={control.recipientesAfectados}
            onChange={(ev) => onChange({ recipientesAfectados: ev.target.value })}
            placeholder="Ej.: P-T1-1"
            disabled={bloqueado}
          />
        </FormField>
      </div>
      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Resultado</span>
          <BadgeResultadoControl resultado={ev.resultado} />
        </div>
        {ev.motivos.length > 0 && (
          <ul className="text-xs font-medium text-red-700 list-disc pl-4">
            {ev.motivos.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        <p className="text-[11px] font-medium text-slate-500">{NOTA_CRITERIOS_ACT9}</p>
        <p className="text-[11px] font-medium text-slate-500">{NOTA_RESULTADO_CERO}</p>
      </div>
    </div>
  );
}
