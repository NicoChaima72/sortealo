import { ActionIcon, Anchor, Box, Container, Group, Text } from "@mantine/core";
import { IconInfoCircle, IconX } from "@tabler/icons-react";
import { useState } from "react";

import { type AvisoBarraProps } from "~/lib/pagebuilder/widgets";

/**
 * `aviso_barra` (overlay, F10): barra de aviso arriba del contenido. Migra el `avisoTexto` del chrome
 * (R1). TEXTO PLANO (nunca HTML, I3). `enlaceUrl` opcional; `descartable` la cierra (client-side).
 */
export function AvisoBarra({ props }: { props: AvisoBarraProps }) {
  const [cerrado, setCerrado] = useState(false);
  if (cerrado) return null;

  return (
    <Box
      py="xs"
      style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
    >
      <Container size="lg" px={{ base: "md", lg: "xl" }}>
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="xs" wrap="nowrap" className="min-w-0">
            <IconInfoCircle className="size-[18px] shrink-0" />
            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
              {props.texto}
              {props.enlaceUrl && (
                <>
                  {" "}
                  <Anchor
                    href={props.enlaceUrl}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                  >
                    {props.enlaceTexto ?? "Ver más"}
                  </Anchor>
                </>
              )}
            </Text>
          </Group>
          {props.descartable && (
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => setCerrado(true)}
              aria-label="Cerrar aviso"
              className="shrink-0"
            >
              <IconX className="size-4" />
            </ActionIcon>
          )}
        </Group>
      </Container>
    </Box>
  );
}
