import { type PrismaClient } from "@prisma/client";

import { parsearDocumento } from "~/lib/pagebuilder/migrate";
import { type PageDocument } from "~/lib/pagebuilder/schema";
import { DomainError } from "~/server/domain/errors";
import { type CualDocumento } from "~/server/domain/pagebuilder/schemas";

/**
 * Use case de lectura del Documento de Página (F04, ADR-0016). Lee la `StorefrontPage` de la Tienda
 * (tenant resuelto SERVER-SIDE, I1) y devuelve el documento parseado (migrate-on-read, I9) + su
 * `version` (para el lock optimista de la próxima mutación). `cual` elige Borrador (editar, MCP) o
 * Publicado (render/preview).
 */
export interface PaginaResuelta {
  documento: PageDocument;
  version: number;
  /** `true` sii la página ya se publicó alguna vez (published no-null). */
  publicado: boolean;
  publishedAt: Date | null;
}

export async function getPagina({
  db,
  tenantId,
  cual = "draft",
  slug = "home",
}: {
  db: Pick<PrismaClient, "storefrontPage">;
  tenantId: string;
  cual?: CualDocumento;
  slug?: string;
}): Promise<PaginaResuelta> {
  const page = await db.storefrontPage.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
    select: {
      draftJson: true,
      publishedJson: true,
      version: true,
      publishedAt: true,
    },
  });
  if (!page) {
    throw new DomainError("NOT_FOUND", "La página no existe.");
  }

  const raw = cual === "published" ? page.publishedJson : page.draftJson;
  if (cual === "published" && raw === null) {
    throw new DomainError("NOT_FOUND", "La página aún no se ha publicado.");
  }

  return {
    documento: parsearDocumento(raw),
    version: page.version,
    publicado: page.publishedJson !== null,
    publishedAt: page.publishedAt,
  };
}
