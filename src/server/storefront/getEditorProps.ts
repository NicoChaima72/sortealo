import { type GetServerSidePropsContext } from "next";

import { env } from "~/env";
import { getServerAuthSession } from "~/server/auth";
import { esOperador, parsearAllowlist } from "~/server/authPolicy";
import { db } from "~/server/db";
import { puedoEditar } from "~/server/domain/pagebuilder/puedoEditar";
import { resolverBrandingSSR } from "~/server/storefront/getStorefrontProps";

/**
 * Gate SSR del editor visual (`/editor`, catálogo-v2 F09/D6). El editor vive en el SUBDOMINIO del
 * tenant: resuelve la Tienda por HOST (I1), exige sesión (cookie wildcard, ADR-0019) y autoriza por
 * `puedoEditar` (membresía o Operador, SERVER-SIDE — la cookie es identidad, no autorización, I7).
 *
 * CUALQUIER fallo ⇒ `notFound` (404 NEUTRAL, D6): no se delata que existe un editor, ni por qué falló
 * (host sin tienda / sin sesión / sin permiso son indistinguibles). Solo tras autorizar se pasa el
 * `previewToken` (env) al cliente — el iframe de preview lo usa para servir el Borrador same-origin (D7).
 */
export interface PropsEditor {
  slug: string;
  /** Token de preview (env) — solo llega al cliente tras autorizar la membresía (D7). `null` ⇒ sin preview. */
  previewToken: string | null;
  /**
   * Branding mínimo del tenant para las PREVIEWS del catálogo de widgets (F11): el `colorPrimario`
   * alimenta la degradación tematizada (`gradienteTematico`) y `nombre`/`descripcion` los fallbacks del
   * hero. NO es sensible (subconjunto público del branding que ya resuelve `getStorefrontProps`).
   */
  branding: {
    colorPrimario: string | null;
    /** Segundo color de marca (builder-tanda-1 F01/D2): lo lee el campo de acento del panel Tema. */
    colorAcento: string | null;
    nombre: string;
    descripcion: string | null;
  };
}

export async function getPropsEditor(
  ctx: GetServerSidePropsContext,
): Promise<{ props: PropsEditor } | { notFound: true }> {
  // 1. La Tienda del host (solo PUBLICADA resuelve; apex/host ajeno ⇒ 404 neutral).
  const branding = await resolverBrandingSSR(ctx);
  if (branding.zona !== "storefront") return { notFound: true };

  // 2. Sesión requerida (cookie de sesión real; en dev con el override de subdominio F09d es la cookie
  //    host-only del login de Google sobre `localhost`). Sin sesión ⇒ 404 neutral (no "login").
  const session = await getServerAuthSession(ctx);
  if (!session?.user) return { notFound: true };

  // 3. Resolver el tenantId por slug (server-side, I1) y autorizar por membresía/Operador.
  const tenant = await db.tenant.findUnique({
    where: { slug: branding.branding.slug },
    select: { id: true },
  });
  if (!tenant) return { notFound: true };

  const esOp = esOperador(session.user.email, parsearAllowlist(env.PLATFORM_OPERATOR_EMAILS));
  const { puedeEditar } = await puedoEditar({
    db,
    tenantId: tenant.id,
    userId: session.user.id,
    esOperador: esOp,
  });
  if (!puedeEditar) return { notFound: true }; // miembro de otra tienda / sin permiso ⇒ 404 neutral

  return {
    props: {
      slug: branding.branding.slug,
      previewToken: env.STOREFRONT_PREVIEW_TOKEN ?? null,
      branding: {
        colorPrimario: branding.branding.colorPrimario,
        colorAcento: branding.branding.colorAcento,
        nombre: branding.branding.nombre,
        descripcion: branding.branding.descripcion,
      },
    },
  };
}
