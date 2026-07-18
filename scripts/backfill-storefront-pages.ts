import { PrismaClient } from "@prisma/client";

import { documentoInicial } from "~/lib/pagebuilder/factory";

/**
 * Backfill IDEMPOTENTE de la Página de tienda para los Tenants existentes (F03, ADR-0016). Por cada
 * Tienda SIN fila `StorefrontPage(slug='home')`, crea una con `draft = published = documentoInicial`
 * (la factory fotografía la plantilla actual desde las columnas de branding). El pivote es aditivo:
 * el render NO cambia hasta F05 (que lee `publishedJson`), así que correr esto es seguro y no altera
 * nada visible todavía.
 *
 * IDEMPOTENCIA (F03): una 2ª corrida encuentra la fila y NO la toca — jamás pisa un draft ya editado.
 * El guard es la existencia de la fila `(tenantId, 'home')`, no un timestamp.
 *
 * Patrón núcleo testeable + wrapper (backend-conventions § Scripts CLI):
 * - `backfillPaginas({ db })` es el núcleo: recibe el cliente INYECTADO, es puro respecto de env, no
 *   instancia Prisma, no hace exit; devuelve un resultado estructurado. Lo testean los specs.
 * - `main()` es el wrapper: instancia su propio PrismaClient (excepción aceptada al singleton para
 *   scripts tsx), desconecta en finally y formatea la salida.
 */

export interface ResultadoBackfillPagina {
  tenantId: string;
  slug: string;
  /** `true` = fila creada; `false` = ya existía (idempotente, no se tocó). */
  paginaCreada: boolean;
}

type DbBackfill = Pick<PrismaClient, "tenant" | "storefrontPage">;

export async function backfillPaginas({
  db,
}: {
  db: DbBackfill;
}): Promise<ResultadoBackfillPagina[]> {
  const tenants = await db.tenant.findMany({
    select: {
      id: true,
      slug: true,
      heroTitulo: true,
      heroSubtitulo: true,
      heroImageUrl: true,
      avisoTexto: true,
    },
  });

  const resultados: ResultadoBackfillPagina[] = [];

  for (const t of tenants) {
    // Guard de idempotencia: si ya hay Página 'home', NO la tocamos (jamás pisar un draft editado).
    const existente = await db.storefrontPage.findUnique({
      where: { tenantId_slug: { tenantId: t.id, slug: "home" } },
      select: { id: true },
    });
    if (existente) {
      resultados.push({ tenantId: t.id, slug: t.slug, paginaCreada: false });
      continue;
    }

    // draft Y published = documento inicial equivalente a la plantilla actual (F05 leerá published).
    const doc = documentoInicial({
      heroTitulo: t.heroTitulo,
      heroSubtitulo: t.heroSubtitulo,
      heroImageUrl: t.heroImageUrl,
      avisoTexto: t.avisoTexto,
    });
    await db.storefrontPage.create({
      data: {
        tenantId: t.id,
        slug: "home",
        draftJson: doc,
        publishedJson: doc,
        publishedAt: new Date(),
      },
    });
    resultados.push({ tenantId: t.id, slug: t.slug, paginaCreada: true });
  }

  return resultados;
}

async function main() {
  // Node 20.6+/24: carga .env sin dependencia externa (mismo patrón que seed-tenants).
  try {
    process.loadEnvFile();
  } catch {
    // .env ausente: seguimos con process.env tal cual (CI/entornos con env inyectado).
  }

  const db = new PrismaClient();
  try {
    const res = await backfillPaginas({ db });
    const creadas = res.filter((r) => r.paginaCreada).length;
    for (const r of res) {
      console.log(
        `${r.paginaCreada ? "✓ creada  " : "= existía"} página de "${r.slug}" (${r.tenantId})`,
      );
    }
    console.log(
      `\nBackfill terminado: ${creadas} página(s) creada(s), ${res.length - creadas} ya existía(n). ` +
        `Total tenants: ${res.length}.`,
    );
  } finally {
    await db.$disconnect();
  }
}

// Solo corre como script invocado; importar el núcleo desde un test NO dispara main().
if (process.argv[1]?.includes("backfill-storefront-pages")) {
  main().catch((e) => {
    console.error(
      "✗ Falló el backfill de páginas:",
      e instanceof Error ? e.message : e,
    );
    process.exit(1);
  });
}
