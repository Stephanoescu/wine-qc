"use client";

import React from "react";
import { Wrench } from "lucide-react";
import { CHECK_INSTRUMENTOS } from "@/lib/config/recepcion-textos";
import { Checklist, SectionCard } from "./WizardUI";

interface Paso2Props {
  checks: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export function Paso2Instrumentos({ checks, onToggle }: Paso2Props) {
  return (
    <SectionCard
      title="Instrumentos, equipos y materiales"
      subtitle="Verifique que todo esté disponible y marque cada ítem"
      icon={Wrench}
    >
      <Checklist items={CHECK_INSTRUMENTOS} checks={checks} onToggle={onToggle} />
    </SectionCard>
  );
}
