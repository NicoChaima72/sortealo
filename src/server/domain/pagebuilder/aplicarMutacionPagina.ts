import { type PrismaClient } from "@prisma/client";

import { parsearDocumento } from "~/lib/pagebuilder/migrate";
import { type PageDocument } from "~/lib/pagebuilder/schema";
import { DomainError } from "~/server/domain/errors";
import { validarReferencias } from "~/server/domain/pagebuilder/_referencias";
import { aplicarMutacion } from "~/server/domain/pagebuilder/mutaciones";
import { type MutacionPagina } from "~/server/domain/pagebuilder/schemas";

/**
 * Use case de mutación del Borrador (F04, ADR-0016). Aplica UNA mutación direccionada por `id` al
 * borrador de la Tienda (tenant SERVER-SIDE, I1) con lock optimista (I10) y validación de referencias
 * (D6/I2). El storefront público NO cambia — esto solo toca el Borrador; publicar es aparte (I6).
 *
 * Secuencia (una mutación inválida NO muta nada):
 *  1. Cargar borrador + `version`.
 *  2. Lock optimista: `version` ≠ `expectedVersion` ⇒ `CONFLICT` sin escribir.
 *  3. Aplicar la mutación PURA (revalida el documento COMPLETO ⇒ `INVALID`/`NOT_FOUND` si algo falla).
 *  4. Validar referencias tenant-scoped (`productoIds` del catálogo ⇒ `NOT_FOUND` indistinguible).
 *  5. Escritura CONDICIONAL por `version` (`updateMany where version=expectedVersion`) ⇒ cierra la
 *     carrera lectura→escritura; 0 filas afectadas ⇒ `CONFLICT`.
 */
export async function aplicarMutacionPagina({
  db,
  tenantId,
  mutacion,
  expectedVersion,
  slug = "home",
}: {
  db: Pick<PrismaClient, "storefrontPage" | "product">;
  tenantId: string;
  mutacion: MutacionPagina;
  expectedVersion: number;
  slug?: string;
}): Promise<{ version: number; documento: PageDocument }> {
  const page = await db.storefrontPage.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
    select: { draftJson: true, version: true },
  });
  if (!page) {
    throw new DomainError("NOT_FOUND", "La página no existe.");
  }
  if (page.version !== expectedVersion) {
    throw new DomainError(
      "CONFLICT",
      `El borrador cambió (versión ${page.version}, esperabas ${expectedVersion}). Recargá y reintentá.`,
    );
  }

  const actual = parsearDocumento(page.draftJson);
  const nuevo = aplicarMutacion(actual, mutacion); // INVALID / NOT_FOUND si la mutación es inválida
  await validarReferencias({ db, tenantId, documento: nuevo }); // D6/I2, NOT_FOUND indistinguible

  const res = await db.storefrontPage.updateMany({
    where: { tenantId, slug, version: expectedVersion }, // lock optimista atómico (I10)
    data: { draftJson: nuevo, version: { increment: 1 } },
  });
  if (res.count === 0) {
    throw new DomainError(
      "CONFLICT",
      "El borrador cambió durante la edición. Recargá y reintentá.",
    );
  }

  return { version: expectedVersion + 1, documento: nuevo };
}
