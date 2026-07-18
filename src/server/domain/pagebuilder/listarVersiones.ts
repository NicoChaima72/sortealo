import { type PrismaClient } from "@prisma/client";

/**
 * Historial de publicaciones de una Página (F12, ADR-0016). Lista las `StorefrontPageVersion`
 * (snapshots append-only) de la Tienda, más reciente primero. Tenant-scoped server-side (I1). NO
 * devuelve el documento completo de cada snapshot (solo metadatos) — el rollback lo resuelve por
 * `revision`. Tope de cordura para no traer un historial enorme.
 */
const MAX_VERSIONES = 50;

export async function listarVersiones({
  db,
  tenantId,
  slug = "home",
}: {
  db: Pick<PrismaClient, "storefrontPageVersion">;
  tenantId: string;
  slug?: string;
}): Promise<
  Array<{ revision: number; publishedBy: string | null; createdAt: Date }>
> {
  return db.storefrontPageVersion.findMany({
    where: { tenantId, slug },
    orderBy: { revision: "desc" },
    take: MAX_VERSIONES,
    select: { revision: true, publishedBy: true, createdAt: true },
  });
}
