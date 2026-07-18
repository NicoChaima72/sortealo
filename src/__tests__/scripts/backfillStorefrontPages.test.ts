import { type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { PageDocumentSchema } from "~/lib/pagebuilder/schema";
import { backfillPaginas } from "../../../scripts/backfill-storefront-pages";

/**
 * Tests del núcleo `backfillPaginas` (F03, ADR-0016) con `db` FAKE STATEFUL (patrón núcleo
 * testeable + wrapper). Verifica: crea una Página por Tienda sin fila; es idempotente (2ª corrida
 * no duplica); jamás pisa un draft ya editado; y todo draft/published resultante parsea contra
 * `PageDocumentSchema`.
 */

interface TenantFake {
  id: string;
  slug: string;
  heroTitulo: string | null;
  heroSubtitulo: string | null;
  heroImageUrl: string | null;
}

interface PageFake {
  tenantId: string;
  slug: string;
  draftJson: unknown;
  publishedJson: unknown;
  publishedAt: Date | null;
}

/** Fake stateful: tenants fijos + un store de páginas que persiste entre corridas del backfill. */
function fakeDb(tenants: TenantFake[]) {
  const pages = new Map<string, PageFake>();
  const key = (tenantId: string, slug: string) => `${tenantId}:${slug}`;

  const db = {
    tenant: {
      findMany: async () => tenants,
    },
    storefrontPage: {
      findUnique: async ({
        where,
      }: {
        where: { tenantId_slug: { tenantId: string; slug: string } };
      }) => pages.get(key(where.tenantId_slug.tenantId, where.tenantId_slug.slug)) ?? null,
      create: async ({ data }: { data: PageFake }) => {
        const k = key(data.tenantId, data.slug);
        if (pages.has(k)) throw new Error("unique violation (test)");
        pages.set(k, data);
        return { id: `page-${k}`, ...data };
      },
    },
  } as unknown as PrismaClient;

  return { db, pages };
}

const tenants: TenantFake[] = [
  {
    id: "t1",
    slug: "autora",
    heroTitulo: "Historias que enamoran",
    heroSubtitulo: "Guías digitales.",
    heroImageUrl: null,
  },
  {
    id: "t2",
    slug: "prueba",
    heroTitulo: null,
    heroSubtitulo: null,
    heroImageUrl: null,
  },
];

describe("scripts/backfillPaginas (fake db stateful)", () => {
  // page.backfill.001 — crea una Página por Tienda sin fila; draft y published parsean
  it("crea una Página 'home' por Tienda sin fila, con draft y published que parsean", async () => {
    const { db, pages } = fakeDb(tenants);
    const res = await backfillPaginas({ db });

    expect(res).toHaveLength(2);
    expect(res.every((r) => r.paginaCreada)).toBe(true);
    expect(pages.size).toBe(2);

    for (const page of pages.values()) {
      expect(page.slug).toBe("home");
      expect(page.publishedAt).toBeInstanceOf(Date);
      // draft y published son el mismo documento inicial y AMBOS parsean.
      expect(page.draftJson).toEqual(page.publishedJson);
      expect(PageDocumentSchema.safeParse(page.draftJson).success).toBe(true);
      expect(PageDocumentSchema.safeParse(page.publishedJson).success).toBe(true);
    }
  });

  // page.backfill.002 — idempotente: una 2ª corrida NO duplica ni crea de nuevo
  it("es idempotente: la 2ª corrida no crea nada nuevo", async () => {
    const { db, pages } = fakeDb(tenants);
    await backfillPaginas({ db });
    const res2 = await backfillPaginas({ db });

    expect(res2.every((r) => !r.paginaCreada)).toBe(true); // nada creado en la 2ª
    expect(pages.size).toBe(2); // sigue habiendo 2, sin duplicados
  });

  // page.backfill.003 — jamás pisa un draft ya editado entre corridas
  it("no pisa un draft existente editado (respeta la edición previa)", async () => {
    const { db, pages } = fakeDb(tenants);
    await backfillPaginas({ db });

    // Simula que alguien editó el draft de t1 entre corridas.
    const editado = { schemaVersion: 1, root: { props: {} }, secciones: [], overlays: [] };
    const p = pages.get("t1:home")!;
    pages.set("t1:home", { ...p, draftJson: editado });

    const res2 = await backfillPaginas({ db });
    expect(res2.find((r) => r.tenantId === "t1")!.paginaCreada).toBe(false);
    // El draft editado sigue intacto (no lo pisó el documento inicial).
    expect(pages.get("t1:home")!.draftJson).toEqual(editado);
  });
});
