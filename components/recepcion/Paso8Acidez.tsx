"use client";

import React from "react";
import { Beaker } from "lucide-react";
import { DECIMALES, RANGOS } from "@/lib/config/recepcion";
import { AVISO_ACIDEZ_FUERA, PREGUNTA_ACIDEZ_CONFIRMADA } from "@/lib/config/recepcion-textos";
import type { EstadoPaso8 } from "@/lib/recepcion/pasos";
import type { BorradorLote } from "@/lib/recepcion/tipos";
import { formatear } from "@/lib/recepcion/validacion";
import { Aviso, BadgeConformidad, Checklist, FormField, Interruptor, NumeroInput, SectionCard, SiNo, StyledInput } from "./WizardUI";

type CambiosAcidez = Partial<BorradorLote["acidez"]>;

export function Paso8Acidez({
  borrador,
  estado,
  onToggle,
  onAcidez,
}: {
  borrador: BorradorLote;
  estado: EstadoPaso8;
  onToggle: (id: string) => void;
  onAcidez: (cambios: CambiosAcidez) => void;
}) {
  const a = borrador.acidez;
  const r = estado.acidez;
  const rango = `${formatear(RANGOS.acidez.min, 0)} a ${formatear(RANGOS.acidez.max, 0)} g/L`;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Acidez de laboratorio" subtitle={`Rango de referencia: ${rango}`} icon={Beaker}>
        <div className="flex flex-col gap-5">
          <Checklist items={estado.itemsAplicables} checks={borrador.checks} onToggle={onToggle} />

          <Interruptor
            activo={a.pendiente}
            onChange={(pendiente) => onAcidez({ pendiente })}
            etiqueta="El resultado del laboratorio aún no está disponible"
            descripcion="El lote se guardará con la acidez pendiente y podrá completarla después desde el detalle del lote en Reportes."
          />

          {a.pendiente ? (
            <Aviso tono="alerta" titulo="Acidez pendiente">
              El lote quedará RETENIDO con el motivo «Acidez pendiente» hasta que se registre el resultado del
              laboratorio.
            </Aviso>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Método" required>
                  <StyledInput
                    value={a.metodo}
                    onChange={(e) => onAcidez({ metodo: e.target.value })}
                    placeholder="Ej.: titulación con NaOH 0,1 N"
                  />
                </FormField>
                <FormField label="Punto final" required>
                  <StyledInput
                    value={a.puntoFinal}
                    onChange={(e) => onAcidez({ puntoFinal: e.target.value })}
                    placeholder="Ej.: pH 8,2"
                  />
                </FormField>
              </div>
              <div className="sm:max-w-xs">
                <FormField label="Valor (g/L como ácido tartárico)" required error={estado.errores.valor}>
                  <NumeroInput
                    unidad="g/L"
                    placeholder="0.00"
                    value={a.valor}
                    onChange={(valor) => onAcidez({ valor })}
                    error={estado.errores.valor}
                  />
                </FormField>
              </div>

              {r.conforme === true && (
                <div className="flex flex-wrap items-center gap-3">
                  <BadgeConformidad estado="conforme" />
                  <span className="text-sm font-medium text-slate-600">
                    {formatear(r.valor, DECIMALES.acidez)} g/L dentro de {rango}
                  </span>
                </div>
              )}

              {r.requiereConfirmacion && (
                <div className="flex flex-col gap-3">
                  <Aviso
                    tono="alerta"
                    titulo={`${formatear(r.valor, DECIMALES.acidez)} g/L está fuera del rango (${rango})`}
                  >
                    {AVISO_ACIDEZ_FUERA}
                  </Aviso>
                  <SiNo
                    pregunta={PREGUNTA_ACIDEZ_CONFIRMADA}
                    value={a.confirmado}
                    onChange={(confirmado) => onAcidez({ confirmado })}
                    etiquetaSi="Sí, lo confirmó"
                    etiquetaNo="Aún no"
                  />
                  {a.confirmado === true && (
                    <p className="text-sm font-medium text-slate-600">
                      Resultado confirmado: el lote quedará RETENIDO para evaluación de Enología.
                    </p>
                  )}
                  {a.confirmado === false && (
                    <p className="text-sm font-medium text-slate-600">
                      Si el laboratorio corrige el resultado, reemplace el valor. Si guarda sin confirmación, el lote
                      quedará RETENIDO con la confirmación pendiente.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
