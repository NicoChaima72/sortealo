import { type PrismaClient } from "@prisma/client";

import { esHex } from "~/styles/tenantTheme";

/**
 * Use case: escribe el SEGUNDO color de marca del tenant (`Tenant.colorAcento`, builder-tanda-1
 * F01/D2). El `colorAcento` vive FUERA del Documento de Página (I-T1) — por eso NO es una mutación del
 * doc sino un procedure propio. El `tenantId` viene del gate de membresía (`exigirEditor`, server-side,
 * I1), jamás del input. El hex ya lo validó el borde (`setColorAcentoInput`); acá se re-normaliza como
 * defensa (un valor no-hex se guarda como `null` ⇒ degradación a marca, I-T2). Devuelve el valor
 * efectivamente persistido para que el editor refleje el estado.
 */
export async function setColorAcento({
  db,
  tenantId,
  colorAcento,
}: {
  db: PrismaClient;
  tenantId: string;
  colorAcento: string | null;
}): Promise<{ colorAcento: string | null }> {
  const valor = esHex(colorAcento) ? colorAcento : null;
  await db.tenant.update({
    where: { id: tenantId },
    data: { colorAcento: valor },
  });
  return { colorAcento: valor };
}
