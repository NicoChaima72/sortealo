import { type OrderStatus, type PrismaClient } from "@prisma/client";

/**
 * Estado de UNA orden por su token de Flow (builder-tanda-1 F08/D12). SOLO-LECTURA de solo el ESTADO
 * — jamás PII (correo), montos ni ítems (I-T6). La página de retorno la sondea para pasar a celebración
 * + confetti cuando el estado llega a `PAGADO`; esa transición la hace EXCLUSIVAMENTE el webhook
 * server-side contra Flow (I6/ADR-0001) — esta query solo LEE el resultado, no confirma nada.
 *
 * Tenant-scoped por el contexto (I1/ADR-0005): el `tenantId` viene del subdominio resuelto server-side,
 * nunca del input. El `token` de Flow es global-único (rutea token⇒Payment), pero además se filtra por
 * `tenantId` como defensa: una Tienda jamás lee el estado de una orden de otra. Token inexistente o de
 * otro tenant ⇒ `{ estado: null }` (neutral, sin filtrar existencia).
 */
export async function getEstadoOrden({
  db,
  tenantId,
  token,
}: {
  db: PrismaClient;
  tenantId: string;
  token: string;
}): Promise<{ estado: OrderStatus | null }> {
  const payment = await db.payment.findFirst({
    where: { token, tenantId },
    select: { order: { select: { estado: true } } },
  });
  return { estado: payment?.order.estado ?? null };
}
