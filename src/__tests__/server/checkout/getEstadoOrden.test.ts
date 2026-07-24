import { type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { getEstadoOrden } from "~/server/domain/checkout/getEstadoOrden";

/**
 * Tests del use case `getEstadoOrden` (estado de orden por token de Flow, builder-tanda-1 F08/D12).
 * Devuelve SOLO el estado enum — jamás correo, montos ni ítems (I-T6) — y tenant-scoped por el contexto
 * (I1): un token de OTRA Tienda o inexistente ⇒ `{ estado: null }` neutral. Es SOLO-LECTURA: no confirma
 * ni marca nada (la confirmación es exclusiva del webhook, I6/ADR-0001).
 */

interface PaymentFake {
  token: string;
  tenantId: string;
  order: { estado: string; email: string; total: string };
}

/** Fake db: `payment.findFirst` filtra por token + tenantId y proyecta SOLO lo pedido en `select`. */
function fakeDb(payments: PaymentFake[]) {
  return {
    payment: {
      findFirst: async ({
        where,
        select,
      }: {
        where: { token: string; tenantId: string };
        select?: { order?: { select?: { estado?: boolean; email?: boolean } } };
      }) => {
        const p = payments.find((x) => x.token === where.token && x.tenantId === where.tenantId);
        if (!p) return null;
        // Emula la proyección de Prisma: solo devuelve lo que el `select` pidió (el use case pide
        // únicamente `order.estado` ⇒ el correo/total NUNCA salen del use case).
        const wantEmail = select?.order?.select?.email === true;
        return { order: { estado: p.order.estado, ...(wantEmail ? { email: p.order.email } : {}) } };
      },
    },
  } as unknown as PrismaClient;
}

const TENANT_A = "tenant-A";
const TENANT_B = "tenant-B";

const pago = (over: Partial<PaymentFake>): PaymentFake => ({
  token: "tok-1",
  tenantId: TENANT_A,
  order: { estado: "PENDIENTE", email: "comprador@ejemplo.cl", total: "3000" },
  ...over,
});

describe("domain/checkout/getEstadoOrden (fake db, tenant-scoped, sin PII)", () => {
  // estado.001 — token de la Tienda del contexto ⇒ SOLO el estado (PENDIENTE mientras el webhook no confirma)
  it("devuelve solo el estado de la orden de la Tienda del contexto", async () => {
    const db = fakeDb([pago({ token: "tok-1", order: { estado: "PENDIENTE", email: "x@y.cl", total: "3000" } })]);
    const res = await getEstadoOrden({ db, tenantId: TENANT_A, token: "tok-1" });
    expect(res).toEqual({ estado: "PENDIENTE" });
  });

  // estado.001b — cuando el webhook ya confirmó, la query LEE PAGADO (no lo confirma ella)
  it("lee PAGADO cuando el webhook ya transicionó la orden", async () => {
    const db = fakeDb([pago({ token: "tok-1", order: { estado: "PAGADO", email: "x@y.cl", total: "3000" } })]);
    const res = await getEstadoOrden({ db, tenantId: TENANT_A, token: "tok-1" });
    expect(res.estado).toBe("PAGADO");
  });

  // estado.002 — token de OTRA Tienda ⇒ null neutral (aislamiento cross-tenant, I1)
  it("un token de otra Tienda ⇒ estado null (no filtra existencia)", async () => {
    const db = fakeDb([pago({ token: "tok-B", tenantId: TENANT_B })]);
    const res = await getEstadoOrden({ db, tenantId: TENANT_A, token: "tok-B" });
    expect(res).toEqual({ estado: null });
  });

  // estado.003 — token inexistente ⇒ null neutral
  it("un token inexistente ⇒ estado null", async () => {
    const db = fakeDb([]);
    const res = await getEstadoOrden({ db, tenantId: TENANT_A, token: "nope" });
    expect(res).toEqual({ estado: null });
  });

  // estado.004 — la RESPUESTA no lleva PII (correo/total): la forma es exactamente { estado } (I-T6)
  it("la respuesta es solo { estado } — sin correo ni montos (I-T6)", async () => {
    const db = fakeDb([pago({ token: "tok-1" })]);
    const res = await getEstadoOrden({ db, tenantId: TENANT_A, token: "tok-1" });
    expect(Object.keys(res)).toEqual(["estado"]);
    expect(JSON.stringify(res)).not.toContain("@"); // ningún correo se filtra
    expect(JSON.stringify(res)).not.toContain("3000"); // ningún monto se filtra
  });
});
