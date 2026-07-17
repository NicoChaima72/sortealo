import { type PrismaClient, type TenantStatus } from "@prisma/client";

import { type AccesoPanel } from "~/server/authPolicy";
import { DomainError } from "~/server/domain/errors";

interface TiendaOperador {
  id: string;
  slug: string;
  nombre: string;
  estado: TenantStatus;
  createdAt: Date;
  productos: number;
  ordenes: number;
}

/**
 * Use case del panel del Operador (F08/F04, D9): lista TODAS las Tiendas de la plataforma con su
 * estado + KPIs mínimos (para SUPERVISAR, no operar). Gatea por `acceso.esOperador` (server-side,
 * del env `PLATFORM_OPERATOR_EMAILS`): un no-operador ⇒ `FORBIDDEN` (no ve ninguna Tienda).
 *
 * NO scopea por tenant (es la excepción de plataforma): el Operador ve el universo. No trae nada
 * sensible — jamás las columnas cifradas de `FlowCredential` (I5/ADR-0006), solo estado y conteos.
 */
export async function listarTiendas({
  db,
  acceso,
}: {
  db: PrismaClient;
  acceso: AccesoPanel;
}): Promise<{ tiendas: TiendaOperador[] }> {
  if (!acceso.esOperador) {
    throw new DomainError(
      "FORBIDDEN",
      "Solo el Operador de plataforma puede ver todas las tiendas.",
    );
  }

  const tiendas = await db.tenant.findMany({
    select: {
      id: true,
      slug: true,
      nombre: true,
      estado: true,
      createdAt: true,
      _count: { select: { products: true, orders: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return {
    tiendas: tiendas.map((t) => ({
      id: t.id,
      slug: t.slug,
      nombre: t.nombre,
      estado: t.estado,
      createdAt: t.createdAt,
      productos: t._count.products,
      ordenes: t._count.orders,
    })),
  };
}
