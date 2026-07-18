import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";

import { type GanadoresProps } from "~/lib/pagebuilder/widgets";

/**
 * `ganadores` (sección, F11): vitrina de ganadores previos (prueba social). TEXTO PLANO con límites
 * (I3). El consentimiento de publicar nombres/fotos es del Organizador (§3). Layout grid o carrusel.
 */
export function Ganadores({ props }: { props: GanadoresProps }) {
  return (
    <Box
      component="section"
      py={{ base: "xl", md: 48 }}
      style={{
        borderTop: "1px solid var(--mantine-color-default-border)",
        borderBottom: "1px solid var(--mantine-color-default-border)",
        background: "var(--mantine-color-default-hover)",
      }}
    >
      <Container size="lg" px={{ base: "md", lg: "xl" }}>
        <Stack gap="lg">
          <Group gap="xs">
            <ThemeIcon variant="light" size="lg" radius="md">
              <IconTrophy className="size-5" stroke={1.75} />
            </ThemeIcon>
            <Title order={2} fz={{ base: 24, sm: 30 }} fw={700}>
              {props.titulo ?? "Nuestros ganadores"}
            </Title>
          </Group>
          {props.layout === "carrusel" ? (
            <ScrollArea offsetScrollbars scrollbarSize={8}>
              <Group gap="lg" wrap="nowrap" align="stretch">
                {props.items.map((item, i) => (
                  <Box key={`${item.nombre}-${i}`} miw={240} maw={280}>
                    <Tarjeta item={item} />
                  </Box>
                ))}
              </Group>
            </ScrollArea>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {props.items.map((item, i) => (
                <Tarjeta key={`${item.nombre}-${i}`} item={item} />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function Tarjeta({ item }: { item: GanadoresProps["items"][number] }) {
  return (
    <Card withBorder radius="md" padding="lg" h="100%">
      <Stack gap="xs">
        <Text fw={700}>{item.nombre}</Text>
        <Badge variant="light" styles={{ label: { textTransform: "none" } }}>
          {item.premio}
        </Badge>
        {item.fecha && (
          <Text size="xs" c="dimmed">
            {item.fecha}
          </Text>
        )}
        {item.handle && (
          <Text size="xs" c="dimmed">
            {item.handle}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
