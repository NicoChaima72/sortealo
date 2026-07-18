import { type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { documentoInicial } from "~/lib/pagebuilder/factory";
import { migrarAvisoABarra } from "../../../scripts/migrar-aviso-a-overlay";

/**
 * Tests del núcleo `migrarAvisoABarra` (F10, R1): migra el `avisoTexto` del Tenant a un overlay
 * `aviso_barra` en su Página (draft + published), IDEMPOTENTE. Fake db stateful.
 */

interface PageState {
  draftJson: unknown;
  publishedJson: unknown;
}

function fakeDb(
  tenants: { id: string; slug: string; avisoTexto: string | null }[],
  pages: Record<string, PageState>,
) {
  return {
    tenant: {
      findMany: async ({ where }: { where: { avisoTexto: { not: null } } }) =>
        where.avisoTexto?.not === null
          ? tenants.filter((t) => t.avisoTexto !== null)
          : tenants,
    },
    storefrontPage: {
      findUnique: async ({
        where,
      }: {
        where: { tenantId_slug: { tenantId: string } };
      }) => pages[where.tenantId_slug.tenantId] ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { tenantId_slug: { tenantId: string } };
        data: { draftJson?: unknown; publishedJson?: unknown };
      }) => {
        const p = pages[where.tenantId_slug.tenantId]!;
        if (data.draftJson !== undefined) p.draftJson = data.draftJson;
        if (data.publishedJson !== undefined) p.publishedJson = data.publishedJson;
        return { id: "p" };
      },
    },
  } as unknown as PrismaClient;
}

const docSinAviso = () =>
  documentoInicial({ heroTitulo: null, heroSubtitulo: null, heroImageUrl: null, avisoTexto: null });

function avisoCount(doc: unknown): number {
  const overlays = (doc as { overlays?: { tipo: string }[] }).overlays ?? [];
  return overlays.filter((o) => o.tipo === "aviso_barra").length;
}

describe("scripts/migrarAvisoABarra (fake db)", () => {
  // page.pro.migra.001 — migra el avisoTexto a overlay en draft y published
  it("agrega el overlay aviso_barra al draft y al published del tenant con avisoTexto", async () => {
    const doc = docSinAviso();
    const pages = { t1: { draftJson: doc, publishedJson: doc } };
    const db = fakeDb([{ id: "t1", slug: "autora", avisoTexto: "Recibes el PDF por correo" }], pages);

    const res = await migrarAvisoABarra({ db });
    expect(res).toEqual([{ slug: "autora", migrado: true }]);
    expect(avisoCount(pages.t1.draftJson)).toBe(1);
    expect(avisoCount(pages.t1.publishedJson)).toBe(1);
  });

  // page.pro.migra.002 — idempotente: 2ª corrida no duplica ni reporta cambio
  it("es idempotente: la 2ª corrida no duplica el overlay", async () => {
    const doc = docSinAviso();
    const pages = { t1: { draftJson: doc, publishedJson: doc } };
    const db = fakeDb([{ id: "t1", slug: "autora", avisoTexto: "Aviso" }], pages);

    await migrarAvisoABarra({ db });
    const res2 = await migrarAvisoABarra({ db });
    expect(res2).toEqual([{ slug: "autora", migrado: false }]); // nada nuevo
    expect(avisoCount(pages.t1.draftJson)).toBe(1); // sigue habiendo 1, sin duplicar
  });

  // page.pro.migra.003 — un tenant sin página aún ⇒ no rompe (migrado false)
  it("un tenant con avisoTexto pero sin página no rompe", async () => {
    const db = fakeDb([{ id: "t2", slug: "prueba", avisoTexto: "Hola" }], {});
    const res = await migrarAvisoABarra({ db });
    expect(res).toEqual([{ slug: "prueba", migrado: false }]);
  });
});
