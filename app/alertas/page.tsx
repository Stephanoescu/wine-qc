"use client";

import React, { useState } from "react";
import { MOCK_ALERT, RECENT_ALERTS } from "@/lib/mock-data";
import { AlertModal } from "@/components/alerts/AlertModal";
import { AlertInline } from "@/components/alerts/AlertModal";
import { AlertsTable } from "@/components/dashboard/AlertsTable";
import { TopBar } from "@/components/layout/Navigation";
import { AlertTriangle, ShieldCheck, Bell } from "lucide-react";

export default function AlertasPage() {
  const [showModal, setShowModal] = useState(false);
  const [activeAlerts] = useState([MOCK_ALERT]);

  return (
    <>
      <TopBar title="Alertas" />

      <div className="flex-1 px-4 lg:px-8 py-8 flex flex-col gap-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Centro de Alertas</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Parámetros fuera de rango detectados durante el turno
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-sm font-medium text-amber-400 hover:bg-amber-500/25 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Simular alerta de pH
          </button>
        </div>

        {/* Status banner */}
        <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${
          activeAlerts.length > 0
            ? "bg-amber-500/5 border-amber-500/20"
            : "bg-emerald-500/5 border-emerald-500/20"
        }`}>
          {activeAlerts.length > 0 ? (
            <>
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-zinc-200">
                  {activeAlerts.length} alerta{activeAlerts.length !== 1 ? "s" : ""} pendiente{activeAlerts.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Requiere atención del operario y del enólogo responsable
                </p>
              </div>
            </>
          ) : (
            <>
              <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-zinc-200">Sin alertas pendientes</p>
                <p className="text-xs text-zinc-500 mt-0.5">Todos los parámetros dentro del rango aceptable</p>
              </div>
            </>
          )}
        </div>

        {/* Inline alert detail */}
        {activeAlerts.map((alert) => (
          <AlertInline key={alert.id} alert={alert} />
        ))}

        {/* All alerts table */}
        <AlertsTable alerts={RECENT_ALERTS} />
      </div>

      {/* Modal demo */}
      {showModal && (
        <AlertModal alert={MOCK_ALERT} onDismiss={() => setShowModal(false)} />
      )}
    </>
  );
}
