import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "~/server/db";

/**
 * Tests DB-backed del SCHEMA de `StorefrontPage` (F01, ADR-0016). Se ejercen contra la DB real
 * porque lo que se verifica vive en Postgres/Prisma, no en un use case: el `@@unique([tenantId,
 * slug])` (una Página por Tienda+ruta), la FK a `Tenant`, el default `slug='home'`/`version=1` y el
 * round-trip jsonb del Documento (draft/published) sin pérdida.
 *
 * Slugs `test-schema-page-*` scopeados y limpiados antes/después (FK-safe: hijos antes que padres).
 */

const PREFIJO = "test-schema-page-";

async function limpiar() {
  const tenants = await db.tenant.findMany({
    where: { slug: { startsWith: PREFIJO } },
    select: { id: true },
  });
  const ids = tenants.map((t) => t.id);
  if (ids.length === 0) return;
  await db.storefrontPageVersion.deleteMany({ where: { tenantId: { in: ids } } });
  await db.storefrontPage.deleteMany({ where: { tenantId: { in: ids } } });
  await db.tenant.deleteMany({ where: { id: { in: ids } } });
}

beforeEach(limpiar);
afterEach(limpiar);

async function crearTenant(nombre: string) {
  return db.tenant.create({
    data: { slug: `${PREFIJO}${nombre}`, nombre, estado: "PUBLICADA" },
    select: { id: true },
  });
}

describe("schema/StorefrontPage (DB-backed)", () => {
  // page.schema.001 — 1 fila por (tenantId, slug); el duplicado viola el unique compuesto
  it("persiste 1 fila por (tenantId, slug) y rechaza el duplicado (unique compuesto)", async () => {
    const t = await crearTenant("a");

    const page = await db.storefrontPage.create({
      data: { tenantId: t.id, draftJson: { schemaVersion: 1, secciones: [] } },
      select: { id: true, slug: true, version: true, publishedJson: true, publishedAt: true },
    });
    // Defaults del schema: slug='home', version=1, published null hasta publicar.
    expect(page.slug).toBe("home");
    expect(page.version).toBe(1);
    expect(page.publishedJson).toBeNull();
    expect(page.publishedAt).toBeNull();

    // Segunda fila con el MISMO (tenantId, slug='home') ⇒ viola @@unique([tenantId, slug]).
    await expect(
      db.storefrontPage.create({
        data: { tenantId: t.id, draftJson: { schemaVersion: 1, secciones: [] } },
      }),
    ).rejects.toThrow();

    // Pero OTRA página del MISMO tenant con slug distinto ⇒ OK (multi-página futura).
    const otra = await db.storefrontPage.create({
      data: { tenantId: t.id, slug: "landing", draftJson: { schemaVersion: 1, secciones: [] } },
      select: { slug: true },
    });
    expect(otra.slug).toBe("landing");
  });

  // page.schema.002 — tenantId es FK real a Tenant; el documento round-tripea jsonb sin pérdida
  it("liga tenantId por FK a Tenant y round-tripea el Documento jsonb sin pérdida", async () => {
    const t = await crearTenant("b");

    // FK inválida ⇒ error (no existe ese Tenant).
    await expect(
      db.storefrontPage.create({
        data: { tenantId: "tenant-inexistente", draftJson: {} },
      }),
    ).rejects.toThrow();

    // Documento anidado con strings, arrays, booleans, nulls y objetos ⇒ debe volver idéntico.
    const doc = {
      schemaVersion: 1,
      root: { props: {} },
      secciones: [
        { id: "sec-hero", tipo: "hero", v: 1, props: { titulo: "Hola", mostrarBadgeSorteo: true } },
        { id: "sec-catalogo", tipo: "catalogo", v: 1, props: { modo: "seleccion", productoIds: ["p1", "p2"], columnas: 3 } },
      ],
      overlays: [],
    };
    const page = await db.storefrontPage.create({
      data: {
        tenantId: t.id,
        draftJson: doc,
        publishedJson: doc,
        version: 3,
        publishedAt: new Date(Date.UTC(2026, 6, 17)),
      },
      select: { draftJson: true, publishedJson: true, version: true },
    });
    expect(page.draftJson).toEqual(doc);
    expect(page.publishedJson).toEqual(doc);
    expect(page.version).toBe(3);

    // La FK conecta: la Tienda ve su página por la back-relation.
    const conPages = await db.tenant.findUnique({
      where: { id: t.id },
      select: { storefrontPages: { select: { id: true } } },
    });
    expect(conPages?.storefrontPages).toHaveLength(1);
  });

  // page.schema.003 — StorefrontPageVersion append-only: @@unique([tenantId,slug,revision]) fuerza
  //                   monotonía; dos revisiones distintas OK, misma revisión colisiona (F12)
  it("StorefrontPageVersion permite revisiones distintas y rechaza una revisión duplicada (unique)", async () => {
    const t = await crearTenant("v");
    const doc = { schemaVersion: 1, root: { props: {} }, secciones: [], overlays: [] };

    await db.storefrontPageVersion.createMany({
      data: [
        { tenantId: t.id, slug: "home", revision: 1, documento: doc, publishedBy: "operador" },
        { tenantId: t.id, slug: "home", revision: 2, documento: doc, publishedBy: "operador" },
      ],
    });
    expect(
      await db.storefrontPageVersion.count({ where: { tenantId: t.id } }),
    ).toBe(2);

    // Repetir la revisión 2 para (tenantId, 'home') ⇒ viola @@unique([tenantId, slug, revision]).
    await expect(
      db.storefrontPageVersion.create({
        data: { tenantId: t.id, slug: "home", revision: 2, documento: doc },
      }),
    ).rejects.toThrow();
  });
});
