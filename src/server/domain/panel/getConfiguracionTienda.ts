import { type PrismaClient, type TenantStatus } from "@prisma/client";

import { type AccesoPanel, resolverTenantAutorizado } from "~/server/authPolicy";

/**
 * Use case del panel (F04, D8): lee la config editable de la Tienda para poblar el formulario
 * de configuración. El `tenantId` sale de `acceso` (server-side); sin membresía ⇒ `FORBIDDEN`.
 * No devuelve nada sensible (las CredencialFlow tienen su propio estado leíble sin secretos).
 */
export async function getConfiguracionTienda({
  db,
  acceso,
}: {
  db: PrismaClient;
  acceso: AccesoPanel;
}): Promise<{
  nombre: string;
  slug: string;
  estado: TenantStatus;
  descripcion: string | null;
  logoUrl: string | null;
  colorPrimario: string | null;
  basesSorteo: string | null;
  heroTitulo: string | null;
  heroSubtitulo: string | null;
  heroImageUrl: string | null;
  avisoTexto: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  whatsappUrl: string | null;
  contactoEmail: string | null;
}> {
  const tenantId = resolverTenantAutorizado({
    esOperador: acceso.esOperador,
    tenantIdsDeMembresia: acceso.tenantIds,
  });

  // `logoUrl`/`heroImageUrl` se DEVUELVEN (para mostrar el asset actual en el uploader) pero se
  // ESCRIBEN por el flujo de subida, no por guardarConfiguracionTienda (D4/I6). Jamás secretos.
  const tienda = await db.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      nombre: true,
      slug: true,
      estado: true,
      descripcion: true,
      logoUrl: true,
      colorPrimario: true,
      basesSorteo: true,
      heroTitulo: true,
      heroSubtitulo: true,
      heroImageUrl: true,
      avisoTexto: true,
      instagramUrl: true,
      tiktokUrl: true,
      whatsappUrl: true,
      contactoEmail: true,
    },
  });

  return tienda;
}
