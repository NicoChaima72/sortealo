import { Box, Center, Container, Stack, Title } from "@mantine/core";

import { EmbedFacade } from "~/components/storefront/embed-facade";
import { type VideoProps } from "~/lib/pagebuilder/widgets";

/**
 * `video` (sección, F11): video embebido iframe-only sobre el contrato de F07 (`<EmbedFacade>` →
 * `<EmbedFrame>`, sandbox de ADR-0018). La `src` la construye `construirEmbedSrc(plataforma, videoId)`
 * — NUNCA HTML crudo (I3/I4). Facade lazy: el iframe carga al click. Ref inválida ⇒ no renderiza.
 */
export function Video({ props }: { props: VideoProps }) {
  return (
    <Box component="section" py={{ base: "xl", md: 48 }}>
      <Container size="sm" px={{ base: "md", lg: "xl" }}>
        <Stack gap="lg">
          {props.titulo && (
            <Title order={2} fz={{ base: 24, sm: 30 }} fw={700} ta="center">
              {props.titulo}
            </Title>
          )}
          <Center>
            <EmbedFacade
              red={props.plataforma}
              referencia={props.videoId}
              titulo={props.titulo ?? "Video"}
              ratio={props.ratio}
            />
          </Center>
        </Stack>
      </Container>
    </Box>
  );
}
