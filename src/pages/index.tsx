import { Alert, Anchor, Box, Container, Stack, Text, Title } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { type GetServerSideProps, type InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";

import { CatalogoStorefront } from "~/components/storefront/catalogo";
import { ComoFunciona } from "~/components/storefront/como-funciona";
import { StorefrontHero } from "~/components/storefront/storefront-hero";
import { SorteoStorefront } from "~/components/storefront/sorteo";
import { StorefrontLayout } from "~/components/storefront/storefront-layout";
import {
  getPropsHome,
  type PropsHome,
} from "~/server/storefront/getStorefrontProps";
import { type TenantBranding } from "~/styles/tenantTheme";

/**
 * Home agnóstica al host (D1). El mismo archivo despacha por ZONA resuelta server-side en
 * `getServerSideProps`:
 * - subdominio con Tienda PUBLICADA ⇒ home del storefront (tematizada, con la marca del tenant);
 * - apex/`www` ⇒ placeholder neutral de plataforma (D9 — la marca de la plataforma sigue PENDIENTE);
 * - host sin Tienda publicada ⇒ `notFound` neutral (I2/ADR-0007), no llega acá.
 */
export const getServerSideProps: GetServerSideProps<PropsHome> = async (ctx) =>
  getPropsHome(ctx);

export default function HomePage({
  tenantBranding,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (!tenantBranding) return <PlaceholderPlataforma />;
  return <StorefrontHome branding={tenantBranding} />;
}

/**
 * Home del storefront: las 7 secciones de la plantilla rica (design.md §5.1) — header + footer los
 * pone el layout; acá van aviso (opcional), hero, catálogo, vitrina del sorteo y cómo funciona. Todo
 * tematizado per-tenant y con degradación elegante (§5.2): sin aviso/hero-img/portada/premio/sorteo
 * la sección degrada limpio (fallback de texto o gradiente temático), nunca un hueco.
 */
function StorefrontHome({ branding }: { branding: TenantBranding }) {
  return (
    <StorefrontLayout branding={branding}>
      {branding.avisoTexto && (
        <Box
          py="xs"
          style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
        >
          <Container size="lg" px={{ base: "md", lg: "xl" }}>
            <Alert
              variant="light"
              icon={<IconInfoCircle className="size-[18px]" />}
              styles={{ message: { whiteSpace: "pre-wrap" } }}
            >
              {branding.avisoTexto}
            </Alert>
          </Container>
        </Box>
      )}

      <StorefrontHero branding={branding} />
      <CatalogoStorefront colorPrimario={branding.colorPrimario} />
      <SorteoStorefront colorPrimario={branding.colorPrimario} />
      <ComoFunciona />
    </StorefrontLayout>
  );
}

/**
 * Placeholder del apex (D9/I9). La identidad de la PLATAFORMA (nombre/paleta/tipografía) está
 * PENDIENTE (`docs/design.md`, decisiones abiertas #4): acá NO se inventa marca — mensaje neutral
 * sobre el theme base, con un acceso discreto al panel de Organizadores (que vive en el apex, D6).
 */
function PlaceholderPlataforma() {
  return (
    <>
      <Head>
        <title>Plataforma de tiendas</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Stack align="center" gap="md" maw={440}>
          <Title order={1} fz="xl">
            Plataforma de tiendas con sorteo
          </Title>
          <Text c="dimmed">
            Cada tienda vive en su propio subdominio. Si llegaste hasta acá
            buscando una tienda, revisa el enlace que te compartieron.
          </Text>
          <Anchor component={Link} href="/login" size="sm">
            ¿Eres organizador? Entra a tu panel
          </Anchor>
        </Stack>
      </main>
    </>
  );
}
