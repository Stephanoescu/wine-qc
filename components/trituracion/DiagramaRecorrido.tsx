"use client";

import React, { useId } from "react";

const DESCRIPCION =
  "Recorrido: DESPALILLADORA (entrada de racimos) → tallos al recipiente TALLOS; bayas separadas → depósito UVA DESPALILLADA → el operario pasa porciones con el recipiente de trasvase → criba superior de 20 mm (retenidas → GRANDES G) → pasan por 20 mm → criba inferior de 18 mm (retenidas → MEDIANAS M) → pasan también por 18 mm → PEQUEÑAS P.";

function Caja({
  x,
  y,
  w,
  h,
  titulo,
  sub,
  tono = "marine",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  titulo: string;
  sub?: string;
  tono?: "marine" | "gold" | "gris";
}) {
  const relleno = tono === "marine" ? "#11294C" : tono === "gold" ? "#9C8E65" : "#F1F5F9";
  const texto = tono === "gris" ? "#11294C" : "#FFFFFF";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={relleno} stroke={tono === "gris" ? "#CBD5E1" : relleno} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 2 : h / 2 + 4)} textAnchor="middle" fontSize={11} fontWeight={800} fill={texto}>
        {titulo}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontSize={9} fontWeight={600} fill={texto} opacity={0.85}>
          {sub}
        </text>
      )}
    </g>
  );
}

function Flecha({ x1, y1, x2, y2, etiqueta, lado = "derecha", punta }: { x1: number; y1: number; x2: number; y2: number; etiqueta?: string; lado?: "derecha" | "arriba"; punta: string }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748B" strokeWidth={1.6} markerEnd={`url(#${punta})`} />
      {etiqueta && (
        <text
          x={lado === "derecha" ? mx + 8 : mx}
          y={lado === "derecha" ? my + 4 : my - 6}
          textAnchor={lado === "derecha" ? "start" : "middle"}
          fontSize={9}
          fontWeight={600}
          fill="#475569"
        >
          {etiqueta}
        </text>
      )}
    </g>
  );
}

function Criba({ y, etiqueta }: { y: number; etiqueta: string }) {
  const agujeros = Array.from({ length: 13 }, (_, i) => 92 + i * 12);
  return (
    <g>
      <rect x={84} y={y} width={164} height={14} rx={3} fill="#E2E8F0" stroke="#94A3B8" />
      {agujeros.map((cx) => (
        <circle key={cx} cx={cx} cy={y + 7} r={3.2} fill="#FFFFFF" stroke="#94A3B8" strokeWidth={0.8} />
      ))}
      <text x={166} y={y - 5} textAnchor="middle" fontSize={10} fontWeight={800} fill="#11294C">
        {etiqueta}
      </text>
    </g>
  );
}

/** Diagrama del recorrido de las uvas y sus recipientes (sección 4 del procedimiento). */
export function DiagramaRecorrido({ className }: { className?: string }) {
  const punta = `punta-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 360 372" role="img" aria-label={DESCRIPCION} className={className ?? "w-full h-auto max-w-md mx-auto"}>
      <title>Recorrido de las uvas y sus recipientes</title>
      <defs>
        <marker id={punta} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />
        </marker>
      </defs>

      <Caja x={96} y={8} w={140} h={42} titulo="DESPALILLADORA" sub="entrada de racimos" />
      <Caja x={270} y={11} w={84} h={36} titulo="TALLOS" sub="recipiente" tono="gris" />
      <Flecha punta={punta} x1={236} y1={29} x2={268} y2={29} />

      <Flecha punta={punta} x1={166} y1={50} x2={166} y2={84} etiqueta="bayas separadas" />
      <Caja x={86} y={86} w={160} h={42} titulo="UVA DESPALILLADA" sub="depósito de salida" tono="gris" />

      <Flecha punta={punta} x1={166} y1={128} x2={166} y2={168} etiqueta="porciones con el trasvase" />
      <Criba y={178} etiqueta="Criba superior 20 mm" />
      <Flecha punta={punta} x1={248} y1={185} x2={268} y2={185} />
      <Caja x={270} y={165} w={84} h={40} titulo="1 · GRANDES G" sub="retenidas" tono="gold" />

      <Flecha punta={punta} x1={166} y1={192} x2={166} y2={236} etiqueta="pasan por 20 mm" />
      <Criba y={246} etiqueta="Criba inferior 18 mm" />
      <Flecha punta={punta} x1={248} y1={253} x2={268} y2={253} />
      <Caja x={270} y={233} w={84} h={40} titulo="2 · MEDIANAS M" sub="retenidas" tono="gold" />

      <Flecha punta={punta} x1={166} y1={260} x2={166} y2={312} etiqueta="pasan también por 18 mm" />
      <Caja x={96} y={314} w={140} h={42} titulo="3 · PEQUEÑAS P" sub="debajo de ambas cribas" tono="gold" />
    </svg>
  );
}
