import { z } from "zod";

/**
 * Inputs del panel del Operador (F08/F04, D9). A DIFERENCIA del resto del panel, estos SÍ llevan
 * `tenantId`: el Operador opera sobre CUALQUIER Tienda. Pero el `tenantId` SELECCIONA, no AUTORIZA
 * (I1/I5): la autorización es el flag `acceso.esOperador` (server-side, del env
 * `PLATFORM_OPERATOR_EMAILS`), verificado dentro de cada use case. Un no-operador que mande un
 * `tenantId` recibe FORBIDDEN — pasar el id nunca es permiso (lección H1 de datawalt-app).
 */

export const suspenderTiendaInput = z.object({
  tenantId: z.string().cuid(),
});
export type SuspenderTiendaInput = z.infer<typeof suspenderTiendaInput>;

export const reactivarTiendaInput = z.object({
  tenantId: z.string().cuid(),
});
export type ReactivarTiendaInput = z.infer<typeof reactivarTiendaInput>;
