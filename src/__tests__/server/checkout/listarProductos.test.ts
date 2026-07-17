import { Prisma, type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { listarProductos } from "~/server/domain/checkout/listarProductos";

/**
 * Test del use case `listarProductos` (catálogo del STOREFRONT). Cierra la otra mitad de la
 * Validación F02 "activar/desactivar": el catálogo del comprador filtra `activo: true`, así
 * que un producto desactivado desde el panel deja de listarse. Complementa
 * `actualizarProducto.test.ts` (que verifica que desactivar escribe `activo: false`).
 */

interface ProductoFake {
  id: string;
  tenantId: string;
  titulo: string;
  descripcion: string;
  precio: Prisma.Decimal;
  portadaUrl: string | null;
  participaEnSorteo: boolean;
  activo: boolean;
  createdAt: Date;
}

function fakeDb(productos: ProductoFake[]) {
  return {
    product: {
      findMany: async ({
        where,
      }: {
        where: { tenantId: string; activo: boolean };
      }) =>
        productos.filter(
          (p) => p.tenantId === where.tenantId && p.activo === where.activo,
        ),
    },
  } as unknown as PrismaClient;
}

const dec = (v: string) => new Prisma.Decimal(v);

const prod = (over: Partial<ProductoFake>): ProductoFake => ({
  id: "p1",
  tenantId: "A",
  titulo: "Producto",
  descripcion: "d",
  precio: dec("3000"),
  portadaUrl: null,
  participaEnSorteo: false,
  activo: true,
  createdAt: new Date(),
  ...over,
});

describe("domain/checkout/listarProductos (storefront filtra activo:true)", () => {
  // checkout.listar.storefront.001 — el catálogo excluye productos inactivos
  it("no lista los productos desactivados (activo:false)", async () => {
    const db = fakeDb([
      prod({ id: "act", titulo: "Activo", activo: true }),
      prod({ id: "inact", titulo: "Desactivado", activo: false }),
    ]);
    const res = await listarProductos({ db, tenantId: "A" });
    expect(res.map((p) => p.id)).toEqual(["act"]);
    expect(res.some((p) => p.id === "inact")).toBe(false);
  });

  // checkout.listar.storefront.002 — devuelve portadaUrl + participaEnSorteo por producto (F02)
  it("devuelve portadaUrl y participaEnSorteo de cada producto (para el catálogo rico)", async () => {
    const db = fakeDb([
      prod({
        id: "p1",
        portadaUrl: "https://pub.r2.dev/A/productos/p1/portada?v=3",
        participaEnSorteo: true,
      }),
    ]);
    const res = await listarProductos({ db, tenantId: "A" });
    expect(res[0]).toMatchObject({
      id: "p1",
      portadaUrl: "https://pub.r2.dev/A/productos/p1/portada?v=3",
      participaEnSorteo: true,
    });
  });

  // checkout.listar.storefront.003 — tenant-scoped: un producto de otra Tienda no aparece (I1)
  it("no lista un producto de otra Tienda (tenant-scoped server-side)", async () => {
    const db = fakeDb([
      prod({ id: "propio", tenantId: "A" }),
      prod({ id: "ajeno", tenantId: "B" }),
    ]);
    const res = await listarProductos({ db, tenantId: "A" });
    expect(res.map((p) => p.id)).toEqual(["propio"]);
  });
});
