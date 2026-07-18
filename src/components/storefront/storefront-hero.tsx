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
import { type HeroProps } from "~/lib/pagebuilder/widgets";
import { gradienteTematico, type TenantBranding } from "~/styles/tenantTheme";

/**
 * Hero del page builder (widget `hero`, F05/ADR-0016; plantilla-rica F04, design.md §5.1 pto 2). Las
 * props vienen del Documento de Página (`props`); el `branding` del Tenant aporta los FALLBACKS
 * (nombre/descripcion/color) resueltos server-side — NO se copian al documento (I2/I11). Izquierda:
 * eyebrow ("Sorteo abierto" si hay sorteo y `mostrarBadgeSorteo`), titular (`props.titulo` con
 * fallback a `nombre`, §5.2), subtítulo (`props.subtitulo` con fallback a `descripcion`), CTA
 * configurable (ancla + texto), 3 badges de confianza (copy FIJO). Derecha: `props.imagenUrl`; sin
 * ella, gradiente temático (degradación elegante §5.2, cero hex inline §9).
 */

/** Badges de confianza — copy FIJO de plataforma (design.md §5.1 pto 2). */
const BADGES_CONFIANZA = [
  { icon: IconShieldCheck, texto: "Compra segura" },
  { icon: IconBolt, texto: "Entrega al instante" },
  { icon: IconTicket, texto: "Tu ticket al toque" },
] as const;

export function StorefrontHero({
  props,
  branding,
}: {
  props: HeroProps;
  branding: TenantBranding;
}) {
  const sorteo = useSorteoActivo();
  const titulo = props.titulo ?? branding.nombre;
  const subtitulo = props.subtitulo ?? branding.descripcion;
  const ctaHref = props.ctaAncla === "sorteo" ? "#sorteo" : "#catalogo";
  const ctaTexto = props.ctaTexto ?? "Ver el catálogo";

  return (
    <Box component="section" py={{ base: "xl", md: 48 }}>
      <Container size="lg" px={{ base: "md", lg: "xl" }}>
        <SimpleGrid
          cols={{ base: 1, md: 2 }}
          spacing={{ base: "xl", md: 48 }}
          style={{ alignItems: "center" }}
        >
          <Stack gap="lg">
            {sorteo.data && props.mostrarBadgeSorteo && (
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
              <Button component="a" href={ctaHref} size="md" radius="md">
                {ctaTexto}
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

          <HeroVisual
            imagenUrl={props.imagenUrl ?? null}
            alt={branding.nombre}
            colorPrimario={branding.colorPrimario}
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
}

/** Imagen de hero del documento, o un gradiente temático si no hay (degradación elegante §5.2). */
function HeroVisual({
  imagenUrl,
  alt,
  colorPrimario,
}: {
  imagenUrl: string | null;
  alt: string;
  colorPrimario: string | null;
}) {
  if (imagenUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imagenUrl}
        alt={alt}
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
        background: gradienteTematico(colorPrimario),
      }}
    />
  );
}
