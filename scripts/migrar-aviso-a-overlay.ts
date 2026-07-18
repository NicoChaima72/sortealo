import { PrismaClient } from "@prisma/client";

import { conAvisoBarra } from "~/lib/pagebuilder/factory";
import { leerDocumentoParaRender } from "~/lib/pagebuilder/migrate";
import { type PageDocument } from "~/lib/pagebuilder/schema";

/**
 * Migración IDEMPOTENTE del `avisoTexto` del chrome → overlay `aviso_barra` (F10, R1). Para cada
 * Tenant con `avisoTexto`, agrega el overlay al draft Y al published de su Página (si aún no lo tiene).
 * Corre UNA vez tras el switch de render de F10 (el chrome ya no muestra `avisoTexto`; ahora lo hace el
 * overlay). Idempotente: `conAvisoBarra` no duplica si ya existe.
 *
 * Núcleo testeable + wrapper (backend-conventions § Scripts CLI).
 */

export interface ResultadoMigracionAviso {
  slug: string;
  migrado: boolean; // true = se agregó el overlay (a draft y/o published)
}

type DbMigracion = Pick<PrismaClient, "tenant" | "storefrontPage">;

function tieneAviso(doc: PageDocument): boolean {
  return doc.overlays.some((o) => o.tipo === "aviso_barra");
}

export async function migrarAvisoABarra({
  db,
}: {
  db: DbMigracion;
}): Promise<ResultadoMigracionAviso[]> {
  const tenants = await db.tenant.findMany({
    where: { avisoTexto: { not: null } },
    select: { id: true, slug: true, avisoTexto: true },
  });

  const resultados: ResultadoMigracionAviso[] = [];

  for (const t of tenants) {
    const page = await db.storefrontPage.findUnique({
      where: { tenantId_slug: { tenantId: t.id, slug: "home" } },
      select: { draftJson: true, publishedJson: true },
    });
    if (!page) {
      resultados.push({ slug: t.slug, migrado: false });
      continue;
    }

    // draft (tolerante) + agregar aviso si falta.
    const draftDoc = leerDocumentoParaRender(page.draftJson);
    const draftNuevo = conAvisoBarra(draftDoc, t.avisoTexto);
    const draftCambio = !tieneAviso(draftDoc) && tieneAviso(draftNuevo);

    // published (si existe) + agregar aviso si falta.
    let publishedCambio = false;
    let publishedNuevo: PageDocument | null = null;
    if (page.publishedJson !== null) {
      const publishedDoc = leerDocumentoParaRender(page.publishedJson);
      publishedNuevo = conAvisoBarra(publishedDoc, t.avisoTexto);
      publishedCambio = !tieneAviso(publishedDoc) && tieneAviso(publishedNuevo);
    }

    if (draftCambio || publishedCambio) {
      await db.storefrontPage.update({
        where: { tenantId_slug: { tenantId: t.id, slug: "home" } },
        data: {
          ...(draftCambio ? { draftJson: draftNuevo } : {}),
          ...(publishedCambio && publishedNuevo ? { publishedJson: publishedNuevo } : {}),
        },
      });
    }
    resultados.push({ slug: t.slug, migrado: draftCambio || publishedCambio });
  }

  return resultados;
}

async function main() {
  try {
    process.loadEnvFile();
  } catch {
    // .env ausente: seguimos con process.env tal cual.
  }
  const db = new PrismaClient();
  try {
    const res = await migrarAvisoABarra({ db });
    const migrados = res.filter((r) => r.migrado).length;
    for (const r of res) {
      console.log(`${r.migrado ? "✓ migrado " : "= ya estaba"} aviso de "${r.slug}"`);
    }
    console.log(`\nMigración terminada: ${migrados} aviso(s) migrado(s) de ${res.length} tenant(s) con aviso.`);
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1]?.includes("migrar-aviso-a-overlay")) {
  main().catch((e) => {
    console.error("✗ Falló la migración de aviso:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
