import { type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { debeMostrarBanner } from "~/lib/pagebuilder/banner";
import { puedoEditar } from "~/server/domain/pagebuilder/puedoEditar";

/**
 * Tests del banner "Editar mi tienda" (F09/D11, ADR-0019): la autorización `puedoEditar` (por
 * TenantMembership/Operador server-side, jamás input del cliente) y la decisión pura de mostrar el
 * banner SOLO post-hidratación (para que el HTML SSR anónimo sea idéntico con/sin cookie ⇒ cacheable).
 */

function fakeDb(membresias: { tenantId: string; userId: string }[]) {
  return {
    tenantMembership: {
      findFirst: async ({ where }: { where: { tenantId: string; userId: string } }) => {
        const m = membresias.find(
          (x) => x.tenantId === where.tenantId && x.userId === where.userId,
        );
        return m ? { id: "m1" } : null;
      },
    },
  } as unknown as PrismaClient;
}

describe("pagebuilder/puedoEditar (autorización server-side)", () => {
  // page.editar.001 — con membresía para (tenant, user) ⇒ puede editar
  it("con TenantMembership para (tenant, usuario) ⇒ puede editar", async () => {
    const db = fakeDb([{ tenantId: "t1", userId: "u1" }]);
    expect(await puedoEditar({ db, tenantId: "t1", userId: "u1", esOperador: false })).toEqual({
      puedeEditar: true,
    });
  });

  // page.editar.002 — sin membresía y sin rol Operador ⇒ NO puede editar
  it("sin membresía y sin rol Operador ⇒ no puede editar", async () => {
    const db = fakeDb([{ tenantId: "t1", userId: "u1" }]);
    // Otro usuario en la misma tienda.
    expect(await puedoEditar({ db, tenantId: "t1", userId: "ajeno", esOperador: false })).toEqual({
      puedeEditar: false,
    });
    // Mismo usuario, OTRA tienda (no puede editar la ajena) — I1: scopeado por tenantId.
    expect(await puedoEditar({ db, tenantId: "otra", userId: "u1", esOperador: false })).toEqual({
      puedeEditar: false,
    });
  });

  // page.editar.003 — el Operador (god-mode) puede editar cualquier tienda, aun sin membresía
  it("el Operador puede editar cualquier tienda aunque no tenga membresía", async () => {
    const db = fakeDb([]); // sin membresías
    expect(await puedoEditar({ db, tenantId: "cualquiera", userId: "op", esOperador: true })).toEqual({
      puedeEditar: true,
    });
  });
});

describe("pagebuilder/debeMostrarBanner (post-hidratación, cache público)", () => {
  // page.editar.004 — en SSR/pre-hidratación (montado=false) el banner NUNCA aparece ⇒ HTML idéntico
  it("no muestra el banner antes de hidratar (montado=false), pase lo que pase con puedeEditar", () => {
    expect(debeMostrarBanner({ montado: false, puedeEditar: true })).toBe(false);
    expect(debeMostrarBanner({ montado: false, puedeEditar: false })).toBe(false);
  });

  // page.editar.005 — post-hidratación: solo si puede editar
  it("post-hidratación (montado=true): muestra solo si puede editar", () => {
    expect(debeMostrarBanner({ montado: true, puedeEditar: true })).toBe(true);
    expect(debeMostrarBanner({ montado: true, puedeEditar: false })).toBe(false);
  });
});
