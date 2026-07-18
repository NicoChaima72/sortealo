import {
  Box,
  Container,
  Group,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconTicket } from "@tabler/icons-react";

import { useSorteoActivo } from "~/components/storefront/use-sorteo-activo";
import { num } from "~/lib/formato";
import { type ContadorTicketsProps } from "~/lib/pagebuilder/widgets";

/**
 * `contador_tickets` (F10): conteo REAL de tickets del sorteo ACTIVO (server-side vía `useSorteoActivo`
 * — sin PII, ADR-0004). Auto-oculto sin sorteo activo (§3). Con `metaTickets`, barra de progreso.
 */
export function ContadorTickets({ props }: { props: ContadorTicketsProps }) {
  const sorteo = useSorteoActivo();
  if (sorteo.isError || !sorteo.data) return null; // auto-oculto sin sorteo

  const total = sorteo.data.totalParticipaciones;
  const pct = props.metaTickets
    ? Math.min(100, Math.round((total / props.metaTickets) * 100))
    : null;

  return (
    <Box component="section" py={{ base: "lg", md: "xl" }}>
      <Container size="lg" px={{ base: "md", lg: "xl" }}>
        <Stack gap="sm" align="center">
          <Group gap="xs">
            <ThemeIcon variant="light" size="lg" radius="md">
              <IconTicket className="size-5" stroke={1.75} />
            </ThemeIcon>
            <Text fw={600}>{props.etiqueta ?? "Tickets vendidos"}</Text>
          </Group>
          <Title order={2} fz={{ base: 40, sm: 56 }} fw={800} className="tabular-nums">
            {num(total)}
          </Title>
          {props.metaTickets !== undefined && (
            <Stack gap={4} w="100%" maw={420}>
              <Progress value={pct ?? 0} size="lg" radius="xl" />
              {props.mostrarPorcentaje && (
                <Text size="sm" c="dimmed" ta="center">
                  {pct}% de la meta ({num(props.metaTickets)})
                </Text>
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
