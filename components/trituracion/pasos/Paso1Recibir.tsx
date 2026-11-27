"use client";

import React from "react";
import Link from "next/link";
import { ClipboardList, FileText, PackageCheck } from "lucide-react";
import { DECIMALES } from "@/lib/config/recepcion";
import { CHECK_ACT1, CHECK_CONDICION_GENERAL, NOTA_PESO_ENTRADA } from "@/lib/config/trituracion-textos";
import type { LoteV2 } from "@/lib/recepcion/tipos";
import { formatear } from "@/lib/recepcion/validacion";
import type { RegistroTrituracion } from "@/lib/trituracion/tipos";
import { Aviso, Checklist, FormField, SectionCard, StyledInput } from "@/components/recepcion/WizardUI";
import { CampoFirma } from "@/components/lote/CampoFirma";
import { conRol } from "@/components/lote/InformeLote";
import type { Cambiar } from "../AsistenteTrituracion";

/** Paso 1 — Recibir el lote liberado (actividad 1, Registro A). */
export function Paso1Recibir({
  r,
  lote,
  onToggle,
  cambiar,
}: {
  r: RegistroTrituracion;
  /** Ficha actual en Recepción (para avisar si cambió después de recibir el lote). */
  lote: LoteV2 | null;
  onToggle: (id: string) => void;
  cambiar: Cambiar;
}) {
  const e = r.entrada;
  const a = r.recepcion;
  const setA = (cambios: Partial<RegistroTrituracion["recepcion"]>) =>
    cambiar((x) => ({ ...x, recepcion: { ...x.recepcion, ...cambios } }));
  const cambioPeso = lote && Math.abs(lote.pesoDisponible.kg - e.pesoDisponibleKg) > 0.0005;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Condición general" subtitle="Una sola verificación por registro" icon={ClipboardList}>
        <Checklist items={CHECK_CONDICION_GENERAL} checks={r.checks} onToggle={onToggle} />
      </SectionCard>

      <SectionCard title="Ficha vinculada de Recepción" subtitle="Solo lectura" icon={FileText}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ["Código de lote", r.codigoLote],
              ["Estado", e.estadoLote],
              ["Variedad", e.variedad],
              ["Proveedor / Viña", e.proveedor],
              ["Origen", e.origen],
              ["Autorizado por", conRol(e.disposicion.nombre, e.disposicion.rol)],
              ["Destino autorizado", e.disposicion.destino],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k}</p>
                <p className="text-sm font-bold text-marine break-words font-mono">{v || "—"}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-marine/20 bg-marine text-white p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-light">Peso disponible (entrada)</p>
            <p className="text-4xl sm:text-5xl font-black font-mono mt-1">
              {formatear(e.pesoDisponibleKg, DECIMALES.kg)} <span className="text-lg">kg</span>
            </p>
            <p className="text-sm font-medium text-white/80 mt-1">{NOTA_PESO_ENTRADA}</p>
          </div>
          {cambioPeso && (
            <Aviso tono="alerta" titulo="La ficha de Recepción cambió después de recibir el lote">
              El peso disponible actual es {formatear(lote.pesoDisponible.kg, DECIMALES.kg)} kg. Este registro conserva el
              valor recibido; aclare la diferencia con Recepción.
            </Aviso>
          )}
          <Link href={`/reportes/${encodeURIComponent(r.loteId)}`} className="self-start text-sm font-bold text-gold-dark hover:underline">
            Ver la ficha completa en Recepción →
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="1. Recibir el lote liberado" subtitle="Lote, autorización y destino coincidentes" icon={PackageCheck}>
        <Checklist items={CHECK_ACT1} checks={r.checks} onToggle={onToggle} />
      </SectionCard>

      <SectionCard title="Registro A" subtitle="Vínculo con la ficha, hora de entrega y responsable" icon={FileText}>
        <div className="flex flex-col gap-4">
          <div className="sm:max-w-[12rem]">
            <FormField label="Hora de entrega" required>
              <StyledInput type="time" value={a.horaEntrega} onChange={(ev) => setA({ horaEntrega: ev.target.value })} />
            </FormField>
          </div>
          <CampoFirma
            etiqueta="Responsable que recibe"
            nombre={a.recibe.nombre}
            rol={a.recibe.rol}
            onNombre={(nombre) => setA({ recibe: { ...a.recibe, nombre } })}
            onRol={(rol) => setA({ recibe: { ...a.recibe, rol } })}
          />
          <CampoFirma
            etiqueta="Entregado por"
            nombre={a.entregadoPor.nombre}
            rol="Recepción"
            rolFijo="Recepción"
            onNombre={(nombre) => setA({ entregadoPor: { ...a.entregadoPor, nombre, rol: "Recepción" } })}
          />
        </div>
      </SectionCard>
    </div>
  );
}
