import { type GetServerSidePropsContext } from "next";

import { documentoInicial } from "~/lib/pagebuilder/factory";
import { leerDocumentoParaRender } from "~/lib/pagebuilder/migrate";
import { type PageDocument } from "~/lib/pagebuilder/schema";
import { env } from "~/env";
import { db } from "~/server/db";
import { crearRepoBranding } from "~/server/storefront/repoBranding";
import {
  type ResolucionBranding,
  resolverBrandingDesdeHost,
} from "~/server/storefront/resolverBranding";
import { resolverModoPreview } from "~/server/storefront/previewToken";
import { configPlataformaDesdeEnv } from "~/server/tenancy/configPlataforma";
import { type TenantBranding } from "~/styles/tenantTheme";

/**
 * Borde de `getServerSideProps` del storefront (F01/D1/D3). Resuelve el branding del host
 * ANTES de renderizar (para tematizar en `_app`, ADR-0011) cableando el núcleo puro
 * (`resolverBrandingDesdeHost`) contra la config de plataforma y el repo Prisma. Cada página
 * del storefront exporta un `getServerSideProps` de una línea que delega acá.
 *
 * El `tenantBranding` que devuelve se serializa en `pageProps`: `_app` lo lee para el theme
 * override y las páginas para el chrome. No prefetchea datos (catálogo/producto/sorteo) — esos
 * van por tRPC con el contexto ya scopeado server-side (S6), sin acoplar el render a un pipeline
 * de SSG/prefetch.
 */
export async function resolverBrandingSSR(
  ctx: GetServerSidePropsContext,
): Promise<ResolucionBranding> {
  return resolverBrandingDesdeHost({
    host: ctx.req.headers.host,
    config: configPlataformaDesdeEnv(),
    repo: crearRepoBranding(db),
  });
}

/** Props que reciben las páginas del storefront tematizadas (`tenantBranding` no-null). */
export interface PropsStorefront {
  tenantBranding: TenantBranding;
}

/**
 * Helper para las páginas EXCLUSIVAS del comprador (`/producto/[id]`, `/checkout`,
 * `/checkout/retorno`): solo existen dentro de un storefront. Zona storefront ⇒ props con
 * branding; apex o host sin Tienda publicada ⇒ `notFound` neutral (I2/ADR-0007) — el apex es
 * zona plataforma, no del comprador.
 */
export async function getPropsPaginaComprador(
  ctx: GetServerSidePropsContext,
): Promise<{ props: PropsStorefront } | { notFound: true }> {
  const res = await resolverBrandingSSR(ctx);
  if (res.zona !== "storefront") return { notFound: true };
  return { props: { tenantBranding: res.branding } };
}

/** Props de la home (`/`): tematizada + Documento de Página si es storefront; sin nada si es apex. */
export interface PropsHome {
  tenantBranding: TenantBranding | null;
  /** El Documento de Página a renderizar (publicado, o borrador en preview). `null` solo en apex. */
  pagina: PageDocument | null;
  /** `true` si se está sirviendo el Borrador (preview con token) ⇒ el render marca `robots noindex`. */
  esPreview: boolean;
}

/**
 * Carga el Documento de Página a renderizar (F05, ADR-0016). `publicado` (público) o `borrador`
 * (preview). Lectura TOLERANTE (`leerDocumentoParaRender`, I9): un tipo desconocido no crashea.
 * Fallback ON-THE-FLY (R5, defensa): si falta la fila o el published, reconstruye desde las columnas
 * de branding del Tenant ⇒ el storefront nunca queda sin renderizar por una Página faltante.
 */
async function cargarDocumentoParaRender({
  branding,
  cual,
}: {
  branding: TenantBranding;
  cual: "publicado" | "borrador";
}): Promise<PageDocument> {
  const page = await db.storefrontPage.findFirst({
    where: { slug: "home", tenant: { slug: branding.slug } }, // tenant resuelto server-side (I1)
    select: { draftJson: true, publishedJson: true },
  });
  const raw = cual === "borrador" ? page?.draftJson : page?.publishedJson;
  if (raw == null) {
    return documentoInicial({
      heroTitulo: branding.heroTitulo,
      heroSubtitulo: branding.heroSubtitulo,
      heroImageUrl: branding.heroImageUrl,
      avisoTexto: branding.avisoTexto, // F10: overlay aviso_barra en el fallback on-the-fly
    });
  }
  return leerDocumentoParaRender(raw);
}

/**
 * Helper para la HOME (`/`), que despacha por zona (D1): storefront ⇒ props con branding + Documento
 * de Página (publicado, o borrador si `?preview=<token>` es válido); apex/www ⇒ props sin branding
 * (placeholder de plataforma neutral, D9); host sin Tienda publicada ⇒ `notFound` neutral. Un
 * `?preview` con token inválido/ausente ⇒ `notFound` neutral (I5): no delata que hay un borrador.
 */
export async function getPropsHome(
  ctx: GetServerSidePropsContext,
): Promise<{ props: PropsHome } | { notFound: true }> {
  const res = await resolverBrandingSSR(ctx);
  if (res.zona === "plataforma") {
    return { props: { tenantBranding: null, pagina: null, esPreview: false } };
  }
  if (res.zona !== "storefront") {
    return { notFound: true };
  }

  const modo = resolverModoPreview({
    preview: ctx.query.preview,
    token: env.STOREFRONT_PREVIEW_TOKEN,
  });
  if (modo === "no-encontrado") {
    return { notFound: true }; // preview con token inválido ⇒ 404 neutral
  }

  const pagina = await cargarDocumentoParaRender({
    branding: res.branding,
    cual: modo === "borrador" ? "borrador" : "publicado",
  });
  return {
    props: {
      tenantBranding: res.branding,
      pagina,
      esPreview: modo === "borrador",
    },
  };
}
