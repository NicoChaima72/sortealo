import { type PrismaClient } from "@prisma/client";

import { type PageDocument } from "~/lib/pagebuilder/schema";
import { DomainError } from "~/server/domain/errors";

/**
 * Validación de REFERENCIAS del documento contra el tenant (D6/I2/ADR-0017, F04). El documento guarda
 * `productoIds` (referencias), nunca copias; acá se verifica que TODO `productoId` de una sección de
 * catálogo `modo:'seleccion'` pertenezca al tenant resuelto SERVER-SIDE. Un id ajeno o inexistente da
 * el MISMO error `NOT_FOUND` (indistinguible, clase de bug H1/ADR-0005): un editor LLM no puede
 * inyectar el id de otra tienda para filtrar catálogo cruzado ni deducir qué ids existen en otra.
 *
 * Se corre en CADA mutación (no confía en referencias previas de otro origen). El render (F05) hace
 * lo simétrico pero SILENCIOSO: descarta lo ajeno/inactivo sin error (degradación elegante).
 */
export async function validarReferencias({
  db,
  tenantId,
  documento,
}: {
  db: Pick<PrismaClient, "product">;
  tenantId: string;
  documento: PageDocument;
}): Promise<void> {
  const ids = new Set<string>();
  for (const seccion of documento.secciones) {
    if (
      seccion.tipo === "catalogo" &&
      seccion.props.modo === "seleccion" &&
      seccion.props.productoIds
    ) {
      for (const id of seccion.props.productoIds) ids.add(id);
    }
  }
  if (ids.size === 0) return;

  const idList = [...ids];
  const encontrados = await db.product.findMany({
    where: { tenantId, id: { in: idList } }, // tenant-scoped SERVER-SIDE (I1)
    select: { id: true },
  });
  if (encontrados.length !== idList.length) {
    throw new DomainError(
      "NOT_FOUND",
      "Uno o más productos referenciados no existen en esta tienda.",
    );
  }
}
