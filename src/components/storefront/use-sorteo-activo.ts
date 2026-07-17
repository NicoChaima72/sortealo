import { api } from "~/utils/api";

/**
 * Query pública del sorteo ACTIVO de la Tienda del subdominio (plantilla-rica F04/D9). La consumen
 * el chip de countdown del header, el enlace a bases del footer y la vitrina del sorteo — react-query
 * DEDUPE las tres en una sola request por la misma query key. `retry: false`: es una sección
 * opcional/decorativa; si falla o no hay sorteo, el chrome degrada limpio (no rompe la home).
 */
export function useSorteoActivo() {
  return api.checkout.getSorteoActivoStorefront.useQuery(undefined, {
    retry: false,
  });
}
