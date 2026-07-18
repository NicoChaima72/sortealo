import { Box, Button, Container, Group, Stack, Text } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";

import {
  formatoCompacto,
  useCountdown,
} from "~/components/storefront/use-countdown";
import { useSorteoActivo } from "~/components/storefront/use-sorteo-activo";
import { type UrgenciaCountdownProps } from "~/lib/pagebuilder/widgets";

/**
 * `urgencia_countdown` (F10): cuenta regresiva al cierre del sorteo ACTIVO. Auto-oculto sin sorteo o
 * si ya venció (§3). El componente interno aísla `useCountdown` para no llamar un hook condicional.
 */
export function UrgenciaCountdown({ props }: { props: UrgenciaCountdownProps }) {
  const sorteo = useSorteoActivo();
  if (sorteo.isError || !sorteo.data) return null; // auto-oculto sin sorteo
  return <UrgenciaInner fechaFin={sorteo.data.fechaFin} props={props} />;
}

function UrgenciaInner({
  fechaFin,
  props,
}: {
  fechaFin: Date;
  props: UrgenciaCountdownProps;
}) {
  const t = useCountdown(fechaFin);
  if (t.terminado) return null; // auto-oculto al vencer

  const fuerte = props.intensidad === "fuerte";
  const ctaHref = props.ctaAncla === "sorteo" ? "#sorteo" : "#catalogo";

  return (
    <Box
      component="section"
      py={{ base: "lg", md: "xl" }}
      style={
        fuerte
          ? {
              background: "var(--mantine-color-default-hover)",
              borderTop: "1px solid var(--mantine-color-default-border)",
              borderBottom: "1px solid var(--mantine-color-default-border)",
            }
          : undefined
      }
    >
      <Container size="lg" px={{ base: "md", lg: "xl" }}>
        <Stack gap="md" align="center">
          <Group gap="xs">
            <IconClock
              className="size-5"
              stroke={1.75}
              color="var(--mantine-primary-color-filled)"
            />
            <Text fw={600}>{props.mensaje ?? "El sorteo cierra pronto"}</Text>
          </Group>
          <Text fz={{ base: 32, sm: 44 }} fw={800} className="tabular-nums">
            {formatoCompacto(t)}
          </Text>
          {props.ctaTexto && (
            <Button component="a" href={ctaHref} size="md" radius="md">
              {props.ctaTexto}
            </Button>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
