import { type PrismaClient } from "@prisma/client";

import { type AccesoPanel } from "~/server/authPolicy";
import { DomainError } from "~/server/domain/errors";
import { type SuspenderTiendaInput } from "~/server/domain/operador/schemas";

/**
 * Use case del panel del Operador (F08/F04, D6/D9): suspende una Tienda — {ALTA|CONFIGURACION|
 * PUBLICADA}→SUSPENDIDA. Una Tienda SUSPENDIDA deja de resolver storefront en su subdominio
 * (`resolverTenantDesdeHost` solo sirve PUBLICADA): el efecto es sacarla de circulación.
 *
 * Autorización: `acceso.esOperador` (server-side); un no-operador ⇒ `FORBIDDEN` aunque mande el
 * `tenantId` (el input SELECCIONA, el flag AUTORIZA — I1/I5). El Operador solo cambia el ESTADO,
 * jamás edita contenido/credenciales de la Tienda (ADR-0006). `updateMany` con guard
 * `estado != SUSPENDIDA` es atómico: `count === 0` ⇒ no existe o ya estaba suspendida (`CONFLICT`).
 */
export async function suspenderTienda({
  db,
  acceso,
  input,
}: {
  db: PrismaClient;
  acceso: AccesoPanel;
  input: SuspenderTiendaInput;
}): Promise<{ estado: "SUSPENDIDA"; suspendida: true }> {
  if (!acceso.esOperador) {
    throw new DomainError(
      "FORBIDDEN",
      "Solo el Operador de plataforma puede suspender una tienda.",
    );
  }

  const { count } = await db.tenant.updateMany({
    where: { id: input.tenantId, estado: { not: "SUSPENDIDA" } },
    data: { estado: "SUSPENDIDA" },
  });

  if (count === 0) {
    throw new DomainError(
      "CONFLICT",
      "La tienda no existe o ya está suspendida.",
    );
  }

  return { estado: "SUSPENDIDA", suspendida: true };
}
