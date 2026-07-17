import {
  Box,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconDownload,
  IconShoppingBag,
  IconTicket,
} from "@tabler/icons-react";

/**
 * Sección "Cómo funciona" (plantilla-rica F04, design.md §5.1 pto 5): 3 pasos con copy FIJO de
 * plataforma (comprar → recibir el PDF → entrar al sorteo). No depende de datos del tenant ⇒
 * SIEMPRE presente (buena para conversión). Tematizada por el color de marca vía tokens del theme.
 */

const PASOS = [
  {
    icon: IconShoppingBag,
    titulo: "Compra tu producto",
    desc: "Elige lo que quieres, paga de forma segura con tu tarjeta. No necesitas crear una cuenta.",
  },
  {
    icon: IconDownload,
    titulo: "Recibe tu descarga",
    desc: "Te llega al correo el enlace para descargar tu producto al instante, apenas se confirma el pago.",
  },
  {
    icon: IconTicket,
    titulo: "Entra al sorteo",
    desc: "Si el producto participa, tu compra suma tickets al sorteo de la tienda automáticamente.",
  },
] as const;

export function ComoFunciona() {
  return (
    <Box component="section" id="como-funciona" py={{ base: "xl", md: 48 }}>
      <Container size="lg" px={{ base: "md", lg: "xl" }}>
        <Stack gap="lg">
          <Title order={2} fz={{ base: 24, sm: 30 }} fw={700}>
            Cómo funciona
          </Title>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {PASOS.map(({ icon: Icon, titulo, desc }, i) => (
              <Card key={titulo} withBorder radius="md" padding="lg">
                <Stack gap="sm">
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon variant="light" size="xl" radius="md">
                      <Icon className="size-6" stroke={1.75} />
                    </ThemeIcon>
                    <Text fz={28} fw={800} c="dimmed" className="tabular-nums">
                      {i + 1}
                    </Text>
                  </Group>
                  <Text fw={600}>{titulo}</Text>
                  <Text size="sm" c="dimmed">
                    {desc}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
