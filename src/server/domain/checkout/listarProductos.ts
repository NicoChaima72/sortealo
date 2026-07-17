import { type PrismaClient } from "@prisma/client";

/**
 * Use case de dominio: lista los productos activos del catálogo de UNA Tienda (I1 /
 * ADR-0005). El `tenantId` viene del contexto (subdominio), nunca del input: no existe
 * catálogo cross-tienda.
 *
 * El catálogo rico (plantilla-rica F02/F04) consume la `portadaUrl` (imagen pública del
 * producto; `null` ⇒ placeholder temático, D7) y el flag `participaEnSorteo` (para el badge
 * "Sorteo"). El `precio` se devuelve como número entero (CLP, display-only, para
 * `Intl.NumberFormat`): NO se hace aritmética de dinero con él — el monto autoritativo es
 * `Product.precio` (Decimal), que iniciarCheckout congela como snapshot en el `OrderItem`.
 */
export async function listarProductos({
  db,
  tenantId,
}: {
  db: PrismaClient;
  tenantId: string;
}): Promise<
  Array<{
    id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    portadaUrl: string | null;
    participaEnSorteo: boolean;
  }>
> {
  const productos = await db.product.findMany({
    where: { tenantId, activo: true },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      precio: true,
      portadaUrl: true,
      participaEnSorteo: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return productos.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    descripcion: p.descripcion,
    precio: p.precio.toNumber(),
    portadaUrl: p.portadaUrl,
    participaEnSorteo: p.participaEnSorteo,
  }));
}
