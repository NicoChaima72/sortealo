import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconBolt,
  IconShieldCheck,
  IconSparkles,
  IconTicket,
} from "@tabler/icons-react";

import { useSorteoActivo } from "~/components/storefront/use-sorteo-activo";
import { gradienteTematico, type TenantBranding } from "~/styles/tenantTheme";

/**
 * Hero de la plantilla rica (plantilla-rica F04, design.md §5.1 pto 2). Dos columnas en desktop /
 * apilado en móvil. Izquierda: eyebrow ("Sorteo abierto" solo si hay sorteo), titular grande
 * (`heroTitulo` con fallback a `nombre`, §5.2), subtítulo (`heroSubtitulo` con fallback a
 * `descripcion`), CTA que baja al catálogo, y 3 badges de confianza (copy FIJO de plataforma).
 * Derecha: imagen de hero del tenant; sin ella, un **gradiente temático** derivado del color de
 * marca (degradación elegante §5.2, cero hex inline §9) — nunca un hueco ni un `<img>` roto.
 */

/** Badges de confianza — copy FIJO de plataforma (design.md §5.1 pto 2). */
const BADGES_CONFIANZA = [
  { icon: IconShieldCheck, texto: "Compra segura" },
  { icon: IconBolt, texto: "Entrega al instante" },
  { icon: IconTicket, texto: "Tu ticket al toque" },
] as const;

export function StorefrontHero({ branding }: { branding: TenantBranding }) {
  const sorteo = useSorteoActivo();
  const titulo = branding.heroTitulo ?? branding.nombre;
  const subtitulo = branding.heroSubtitulo ?? branding.descripcion;

  return (
    <Box component="section" py={{ base: "xl", md: 48 }}>
      <Container size="lg" px={{ base: "md", lg: "xl" }}>
        <SimpleGrid
          cols={{ base: 1, md: 2 }}
          spacing={{ base: "xl", md: 48 }}
          style={{ alignItems: "center" }}
        >
          <Stack gap="lg">
            {sorteo.data && (
              <Badge
                variant="light"
                size="lg"
                radius="sm"
                leftSection={<IconSparkles className="size-3.5" stroke={2} />}
                styles={{ root: { width: "fit-content" }, label: { textTransform: "none" } }}
              >
                Sorteo abierto
              </Badge>
            )}

            <Title order={1} fz={{ base: 32, sm: 44 }} lh={1.1} fw={800}>
              {titulo}
            </Title>

            {subtitulo && (
              <Text size="lg" c="dimmed" maw={520}>
                {subtitulo}
              </Text>
            )}

            <Group gap="sm">
              <Button
                component="a"
                href="#catalogo"
                size="md"
                radius="md"
              >
                Ver el catálogo
              </Button>
            </Group>

            <Group gap="lg" mt="xs" wrap="wrap">
              {BADGES_CONFIANZA.map(({ icon: Icon, texto }) => (
                <Group key={texto} gap={6} wrap="nowrap">
                  <Icon className="size-4" stroke={1.75} color="var(--mantine-primary-color-filled)" />
                  <Text size="sm" c="dimmed">
                    {texto}
                  </Text>
                </Group>
              ))}
            </Group>
          </Stack>

          <HeroVisual branding={branding} />
        </SimpleGrid>
      </Container>
    </Box>
  );
}

/** Imagen de hero del tenant, o un gradiente temático si no hay (degradación elegante §5.2). */
function HeroVisual({ branding }: { branding: TenantBranding }) {
  if (branding.heroImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={branding.heroImageUrl}
        alt={branding.nombre}
        style={{
          width: "100%",
          aspectRatio: "4 / 3",
          objectFit: "cover",
          borderRadius: "var(--mantine-radius-lg)",
          display: "block",
        }}
      />
    );
  }
  return (
    <Box
      aria-hidden
      style={{
        width: "100%",
        aspectRatio: "4 / 3",
        borderRadius: "var(--mantine-radius-lg)",
        background: gradienteTematico(branding.colorPrimario),
      }}
    />
  );
}
