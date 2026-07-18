import { Accordion, Box, Container, Stack, Text, Title } from "@mantine/core";

import { type FaqProps } from "~/lib/pagebuilder/widgets";

/**
 * `faq` (sección, F11): preguntas frecuentes en acordeón. TEXTO PLANO pre-wrap con límites (I3, nunca
 * HTML interpretado). Reduce fricción de compra (buena para conversión).
 */
export function Faq({ props }: { props: FaqProps }) {
  return (
    <Box component="section" py={{ base: "xl", md: 48 }}>
      <Container size="sm" px={{ base: "md", lg: "xl" }}>
        <Stack gap="lg">
          <Title order={2} fz={{ base: 24, sm: 30 }} fw={700}>
            {props.titulo}
          </Title>
          <Accordion variant="separated" radius="md">
            {props.items.map((item, i) => (
              <Accordion.Item key={`${item.pregunta}-${i}`} value={`faq-${i}`}>
                <Accordion.Control>
                  <Text fw={600} size="sm">
                    {item.pregunta}
                  </Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                    {item.respuesta}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>
      </Container>
    </Box>
  );
}
