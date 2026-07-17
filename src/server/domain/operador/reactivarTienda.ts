import { type PrismaClient } from "@prisma/client";

import { type AccesoPanel } from "~/server/authPolicy";
import { DomainError } from "~/server/domain/errors";
import { type ReactivarTiendaInput } from "~/server/domain/operador/schemas";

/**
 * Use case del panel del Operador (F08/F04, D6/D9): reactiva una Tienda suspendida — SUSPENDIDA→
 * CONFIGURACION (SIEMPRE a CONFIGURACION, nunca directo a PUBLICADA): obliga al Organizador a
 * re-publicar conscientemente, re-evaluando el gate. El MVP no guarda el estado previo (S9).
 *
 * Autorización: `acceso.esOperador` (server-side); no-operador ⇒ `FORBIDDEN` aunque mande el
 * `tenantId` (I1/I5). `updateMany` con guard `estado = SUSPENDIDA` es atómico: `count === 0` ⇒
 * la Tienda no estaba suspendida (`CONFLICT`, nada que reactivar).
 */
export async function reactivarTienda({
  db,
  acceso,
  input,
}: {
  db: PrismaClient;
  acceso: AccesoPanel;
  input: ReactivarTiendaInput;
}): Promise<{ estado: "CONFIGURACION"; reactivada: true }> {
  if (!acceso.esOperador) {
    throw new DomainError(
      "FORBIDDEN",
      "Solo el Operador de plataforma puede reactivar una tienda.",
    );
  }

  const { count } = await db.tenant.updateMany({
    where: { id: input.tenantId, estado: "SUSPENDIDA" },
    data: { estado: "CONFIGURACION" },
  });

  if (count === 0) {
    throw new DomainError("CONFLICT", "La tienda no está suspendida.");
  }

  return { estado: "CONFIGURACION", reactivada: true };
}
