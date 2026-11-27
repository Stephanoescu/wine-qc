import { useSyncExternalStore } from "react";

const suscribirNada = () => () => {};

/**
 * true solo en el navegador (false durante el render del servidor y la hidratación).
 * Permite leer localStorage en el inicializador de un componente hijo sin
 * desajustes de hidratación ni setState dentro de un efecto.
 */
export function useEsCliente(): boolean {
  return useSyncExternalStore(
    suscribirNada,
    () => true,
    () => false,
  );
}
