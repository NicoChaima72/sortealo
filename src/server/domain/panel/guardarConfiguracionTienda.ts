import { type PrismaClient } from "@prisma/client";

import { type AccesoPanel, resolverTenantAutorizado } from "~/server/authPolicy";
import { textoOpcionalANull } from "~/server/domain/panel/_internal";
import { type GuardarConfiguracionTiendaInput } from "~/server/domain/panel/schemas";

/**
 * Use case del panel (F04, D8): guarda la config de texto de la Tienda — bases del sorteo (texto
 * borrador, ADR-0008) + plantilla (descripcion/colorPrimario/hero/aviso) + redes/contacto del footer
 * (plantilla-rica F02/D2). Los ASSETS de marca (logo/hero-image/portada/premio) NO se escriben acá:
 * los persiste el flujo de subida (confirmarImagenSubida) tras verificar el objeto en R2 (D4/I6). El
 * `tenantId` sale de `acceso` (server-side): el input NO lleva tenantId, así que no se puede escribir
 * la config de otra Tienda (I1); sin membresía ⇒ `FORBIDDEN`. Los campos vacíos se guardan como `null`.
 */
export async function guardarConfiguracionTienda({
  db,
  acceso,
  input,
}: {
  db: PrismaClient;
  acceso: AccesoPanel;
  input: GuardarConfiguracionTiendaInput;
}): Promise<{ guardada: true }> {
  const tenantId = resolverTenantAutorizado({
    esOperador: acceso.esOperador,
    tenantIdsDeMembresia: acceso.tenantIds,
  });

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      descripcion: textoOpcionalANull(input.descripcion),
      // `logoUrl` NO se escribe acá (D4/I6): lo persiste SOLO confirmarImagenSubida tras headObject.
      colorPrimario: textoOpcionalANull(input.colorPrimario),
      basesSorteo: textoOpcionalANull(input.basesSorteo),
      // Textos de la plantilla del storefront (F06/D4).
      heroTitulo: textoOpcionalANull(input.heroTitulo),
      heroSubtitulo: textoOpcionalANull(input.heroSubtitulo),
      avisoTexto: textoOpcionalANull(input.avisoTexto),
      // Redes y contacto del footer (plantilla-rica F02/F03/D2). Vacío ⇒ null (footer oculta, D7).
      instagramUrl: textoOpcionalANull(input.instagramUrl),
      tiktokUrl: textoOpcionalANull(input.tiktokUrl),
      whatsappUrl: textoOpcionalANull(input.whatsappUrl),
      contactoEmail: textoOpcionalANull(input.contactoEmail),
    },
    select: { id: true },
  });

  return { guardada: true };
}
