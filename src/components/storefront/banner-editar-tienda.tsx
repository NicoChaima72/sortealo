import { Anchor, Box, Container, Group, Text } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { env } from "~/env";
import { debeMostrarBanner } from "~/lib/pagebuilder/banner";
import { construirUrlApex } from "~/lib/urlApex";
import { api } from "~/utils/api";

/**
 * Banner "Editar mi tienda" (F09/D11, ADR-0019). Aparece SOLO para la Organizadora (o el Operador)
 * logueada que visita SU tienda, y SOLO **post-hidratación**: monta con `useEffect` y consulta
 * `pagebuilder.puedoEditar` (autorización por `TenantMembership` server-side, I7) recién ahí. En SSR
 * y hasta hidratar no existe ⇒ el HTML anónimo es idéntico para todos ⇒ CDN-cacheable (riesgo R5).
 *
 * Chrome NEUTRO de PLATAFORMA (D13): barra oscura, NUNCA el color de marca del tenant (que sí tiñe el
 * resto del storefront). La marca de plataforma está PENDIENTE ⇒ neutro, sin inventar.
 */
export function BannerEditarTienda() {
  // Orden canónico (frontend-conventions): estado → query → efecto.
  const [montado, setMontado] = useState(false);
  const consulta = api.pagebuilder.puedoEditar.useQuery(undefined, {
    enabled: montado, // solo client-side tras montar: no toca el SSR
    retry: false,
  });
  useEffect(() => setMontado(true), []);

  if (!debeMostrarBanner({ montado, puedeEditar: consulta.data?.puedeEditar ?? false })) {
    return null;
  }

  return (
    <Box bg="dark.7" c="white" py={8}>
      <Container size="lg" px={{ base: "md", lg: "xl" }}>
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="xs" wrap="nowrap" className="min-w-0">
            <IconPencil className="size-4 shrink-0" stroke={1.75} />
            <Text size="sm" fw={500} truncate>
              Estás viendo tu tienda publicada
            </Text>
          </Group>
          <Anchor href={hrefPanel()} c="white" fw={600} size="sm" underline="always" className="shrink-0">
            Ir a mi panel
          </Anchor>
        </Group>
      </Container>
    </Box>
  );
}

/**
 * URL del panel del Organizador, que vive en el APEX (D6): el storefront está en el subdominio, el
 * panel en `<apex>/admin`. Se arma con el apex de env (`NEXT_PUBLIC_PLATFORM_DOMAIN`) + el
 * protocolo/puerto actuales. Sin apex configurado (localhost) ⇒ `/admin` relativo (dev localhost no
 * comparte sesión cross-subdominio de todos modos, así que el banner casi no aparece ahí).
 */
function hrefPanel(): string {
  const apex = env.NEXT_PUBLIC_PLATFORM_DOMAIN;
  if (typeof window === "undefined" || !apex || apex === "localhost") {
    return "/admin";
  }
  // Fuente única con F09b: la URL al apex la arma `construirUrlApex` (no string-building inline).
  return construirUrlApex({
    protocol: window.location.protocol,
    apex,
    puerto: window.location.port,
    path: "/admin",
  });
}
