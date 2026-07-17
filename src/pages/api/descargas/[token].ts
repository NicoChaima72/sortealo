import { type NextApiRequest, type NextApiResponse } from "next";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  type GrantParaDescarga,
  manejarDescarga,
} from "~/server/descargas/manejarDescarga";
import { crearStorageDeEnv } from "~/server/storage/storageDeEnv";

/**
 * Endpoint público de descarga del Comprador (F03/D5) — wrapper Next (borde de cableado).
 *
 * Es la ÚNICA parte que lee env, cablea los adapters reales (repo de grants contra `db`,
 * presigner de R2) y escribe `res`. Toda la política (gate de método, 404 neutral, defensa
 * de prefijo I9, 302) vive en el núcleo testeable `manejarDescarga`.
 *
 * NO exige sesión (ADR-0004: el Comprador no tiene cuenta; el token del `DownloadGrant` ES la
 * autoridad). No loguea token ni path (I4).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Fail-fast de config R2 (sin volcar secretos): sin storage no se puede presignar. Mejor un
  // 500 explícito que un efecto roto (patrón del webhook con la clave de cifrado). En un deploy
  // bien configurado esto nunca ocurre, así que no rompe la neutralidad de los 404 reales.
  if (
    !env.R2_ENDPOINT ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET
  ) {
    res.status(500).json({ error: "server_misconfigured" });
    return;
  }

  const storage = crearStorageDeEnv();

  const { status, headers, body } = await manejarDescarga({
    req,
    buscarGrant: buscarGrantPorToken,
    presignarDescarga: (input) => storage.presignarDescarga(input),
  });

  if (headers) {
    for (const [clave, valor] of Object.entries(headers)) {
      res.setHeader(clave, valor);
    }
  }
  if (status === 302) {
    res.status(302).end();
    return;
  }
  res.status(status).send(body ?? "");
}

/**
 * Repo del grant: token ⇒ grant (unique global) ⇒ tenant/producto. Devuelve solo la proyección
 * que el núcleo necesita para decidir y presignar. Un token inexistente ⇒ null (⇒ 404 neutral).
 */
async function buscarGrantPorToken(
  token: string,
): Promise<GrantParaDescarga | null> {
  const grant = await db.downloadGrant.findUnique({
    where: { token },
    select: {
      tenantId: true,
      expiresAt: true,
      product: { select: { pdfPath: true, titulo: true } },
    },
  });
  if (!grant) return null;
  return {
    tenantId: grant.tenantId,
    pdfPath: grant.product.pdfPath,
    titulo: grant.product.titulo,
    expiresAt: grant.expiresAt,
  };
}
