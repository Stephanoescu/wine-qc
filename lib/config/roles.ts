// ============================================================
// Roles del procedimiento (firmas, decisiones y bitácoras)
// ============================================================

export const ROLES = ["Operario/a", "Producción", "Mantenimiento", "Calidad o Enología", "Recepción"] as const;

export type Rol = (typeof ROLES)[number];

/** Rol fijo de las firmas de Enología (rechazo, liberación con observaciones, disposiciones). */
export const ROL_ENOLOGIA: Rol = "Calidad o Enología";

export function esRol(x: unknown): x is Rol {
  return typeof x === "string" && (ROLES as readonly string[]).includes(x);
}
