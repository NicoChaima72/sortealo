import { type PrismaClient } from "@prisma/client";

/**
 * ¿Puede el usuario logueado EDITAR esta Tienda? (F09/D11, ADR-0019). El poder de editar sale SIEMPRE
 * de la capa de datos (I7): una `TenantMembership` para (usuario, tienda), o el flag Operador de
 * plataforma. La cookie wildcard es IDENTIDAD, no autorización — este use case es la autorización.
 *
 * Tenancy (I1): recibe `tenantId` YA resuelto server-side (del host, en el procedure) y `userId` de
 * la sesión — NUNCA un `tenantId` del input del cliente. El Operador (god-mode) puede editar cualquier
 * tienda; un Organizador solo la suya.
 */
export async function puedoEditar({
  db,
  tenantId,
  userId,
  esOperador,
}: {
  db: Pick<PrismaClient, "tenantMembership">;
  tenantId: string;
  userId: string;
  esOperador: boolean;
}): Promise<{ puedeEditar: boolean }> {
  if (esOperador) return { puedeEditar: true }; // god-mode de plataforma
  const membresia = await db.tenantMembership.findFirst({
    where: { tenantId, userId }, // server-side (I1); jamás input del cliente
    select: { id: true },
  });
  return { puedeEditar: membresia !== null };
}
