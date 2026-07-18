import { type PrismaClient } from "@prisma/client";

import { type PageDocument } from "~/lib/pagebuilder/schema";
import { TIPOS_SECCION, WIDGET_REGISTRY } from "~/lib/pagebuilder/widgets";
import { DomainError } from "~/server/domain/errors";
import { aplicarMutacionPagina } from "~/server/domain/pagebuilder/aplicarMutacionPagina";
import { getPagina } from "~/server/domain/pagebuilder/getPagina";
import { listarVersiones } from "~/server/domain/pagebuilder/listarVersiones";
import { publicarPagina } from "~/server/domain/pagebuilder/publicarPagina";
import { revertirPagina } from "~/server/domain/pagebuilder/revertirPagina";
import {
  type CualDocumento,
  type MutacionPagina,
} from "~/server/domain/pagebuilder/schemas";

/**
 * Lógica de las tools del Editor MCP (F06/PD5/D10, ADR-0016). CERO lógica propia: cada tool resuelve
 * el `tenantId` desde `storeSlug` SERVER-SIDE (I1 — jamás un `tenantId` crudo del cliente) y delega
 * en los use cases de F04. Testeable sin HTTP (el borde `route.ts` solo cabla mcp-handler + auth).
 *
 * El MCP escribe SOLO el Borrador (I6): `publish_page` es la única acción que toca lo publicado, y es
 * el checkpoint humano del Operador. El MCP no expone efectos fuera del documento (I12).
 */
type DbMcp = Pick<
  PrismaClient,
  "tenant" | "storefrontPage" | "storefrontPageVersion" | "product" | "$transaction"
>;

/** Etiqueta de auditoría del publicador vía MCP (god-mode del Operador, F12). */
const PUBLICADOR_MCP = "operador";

/**
 * Resuelve el `tenantId` desde `storeSlug` (I1). GOD-MODE del Operador: resuelve CUALQUIER tienda por
 * slug sin importar su estado (edita drafts de tiendas no publicadas). `NOT_FOUND` si el slug no existe.
 */
export async function resolverTenantIdPorSlug({
  db,
  storeSlug,
}: {
  db: Pick<PrismaClient, "tenant">;
  storeSlug: string;
}): Promise<string> {
  const t = await db.tenant.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  });
  if (!t) {
    throw new DomainError("NOT_FOUND", `No existe una tienda con slug "${storeSlug}".`);
  }
  return t.id;
}

/** Outline numerado de las secciones — direcciona las mutaciones del LLM por índice + id. */
export function outlineDe(doc: PageDocument): string {
  if (doc.secciones.length === 0) return "(sin secciones)";
  return doc.secciones.map((s, i) => `${i}. ${s.tipo} · id=${s.id}`).join("\n");
}

/** `get_page`: lee el Borrador (o el Publicado) con outline + JSON + version (para expectedVersion). */
export async function mcpGetPage({
  db,
  storeSlug,
  cual,
}: {
  db: DbMcp;
  storeSlug: string;
  cual?: CualDocumento;
}) {
  const tenantId = await resolverTenantIdPorSlug({ db, storeSlug });
  const res = await getPagina({ db, tenantId, cual: cual ?? "draft" });
  return {
    version: res.version,
    publicado: res.publicado,
    publishedAt: res.publishedAt,
    outline: outlineDe(res.documento),
    documento: res.documento,
  };
}

/** `list_widget_types`: los tipos de sección disponibles + sus defaultProps (no toca tenant). */
export function mcpListWidgetTypes() {
  return TIPOS_SECCION.map((tipo) => ({
    tipo,
    categoria: WIDGET_REGISTRY[tipo].categoria,
    v: WIDGET_REGISTRY[tipo].v,
    defaultProps: WIDGET_REGISTRY[tipo].defaultProps,
  }));
}

/** `list_products`: los productos de la tienda (para referenciar en un catálogo `modo:'seleccion'`). */
export async function mcpListProducts({
  db,
  storeSlug,
}: {
  db: DbMcp;
  storeSlug: string;
}) {
  const tenantId = await resolverTenantIdPorSlug({ db, storeSlug });
  const productos = await db.product.findMany({
    where: { tenantId }, // tenant-scoped server-side (I1)
    select: {
      id: true,
      titulo: true,
      precio: true,
      activo: true,
      participaEnSorteo: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return productos.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    // precio como número: DISPLAY-ONLY para el LLM (referenciar el producto). NO se hace aritmética
    // con él — el monto autoritativo es `Product.precio` (Decimal), que congela iniciarCheckout (I2/I4).
    precio: p.precio.toNumber(),
    activo: p.activo,
    participaEnSorteo: p.participaEnSorteo,
  }));
}

/** Núcleo de las 6 tools de mutación: resuelve tenant + delega en `aplicarMutacionPagina` (F04). */
export async function mcpMutar({
  db,
  storeSlug,
  mutacion,
  expectedVersion,
}: {
  db: DbMcp;
  storeSlug: string;
  mutacion: MutacionPagina;
  expectedVersion: number;
}) {
  const tenantId = await resolverTenantIdPorSlug({ db, storeSlug });
  const res = await aplicarMutacionPagina({
    db,
    tenantId,
    mutacion,
    expectedVersion,
  });
  return {
    version: res.version,
    outline: outlineDe(res.documento),
    documento: res.documento,
  };
}

/** `publish_page`: publica el Borrador (checkpoint humano del Operador, I6) + snapshot de revisión (F12). */
export async function mcpPublishPage({
  db,
  storeSlug,
  expectedVersion,
}: {
  db: DbMcp;
  storeSlug: string;
  expectedVersion?: number;
}) {
  const tenantId = await resolverTenantIdPorSlug({ db, storeSlug });
  return publicarPagina({ db, tenantId, expectedVersion, publicadoPor: PUBLICADOR_MCP });
}

/** `list_versions`: historial de publicaciones (revisiones) de la Página (F12). */
export async function mcpListVersions({
  db,
  storeSlug,
}: {
  db: DbMcp;
  storeSlug: string;
}) {
  const tenantId = await resolverTenantIdPorSlug({ db, storeSlug });
  return listarVersiones({ db, tenantId });
}

/** `rollback_page`: copia una `revision` vieja al Borrador (D4); hay que RE-PUBLICAR para hacerla visible (I6). */
export async function mcpRollback({
  db,
  storeSlug,
  revision,
}: {
  db: DbMcp;
  storeSlug: string;
  revision: number;
}) {
  const tenantId = await resolverTenantIdPorSlug({ db, storeSlug });
  const res = await revertirPagina({ db, tenantId, revision });
  return {
    version: res.version,
    outline: outlineDe(res.documento),
    documento: res.documento,
    nota: "Se copió la revisión al borrador. Publicá (publish_page) para hacerla visible.",
  };
}
