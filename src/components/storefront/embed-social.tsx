import { Box, Center, Container, Stack, Text } from "@mantine/core";

import { EmbedFacade } from "~/components/storefront/embed-facade";
import { type EmbedSocialProps } from "~/lib/pagebuilder/widgets";

/**
 * `embed_social` (sección, F11): post social embebido iframe-only sobre F07 (`<EmbedFacade>` →
 * `<EmbedFrame>`). La `src` la arma `construirEmbedSrc(red, ref)` desde un id/handle validado por
 * regex — NUNCA el `blockquote`+`<script>` de la plataforma ni HTML crudo (I3/I4). Ratio vertical
 * (9:16) por defecto para el formato de post social. Ref inválida ⇒ no renderiza.
 */
export function EmbedSocial({ props }: { props: EmbedSocialProps }) {
  return (
    <Box component="section" py={{ base: "xl", md: 48 }}>
      <Container size="sm" px={{ base: "md", lg: "xl" }}>
        <Stack gap="md" align="center">
          <Center>
            <EmbedFacade
              red={props.red}
              referencia={props.ref}
              titulo={props.leyenda ?? "Publicación"}
              ratio="9:16"
            />
          </Center>
          {props.leyenda && (
            <Text size="sm" c="dimmed" ta="center" maw={360}>
              {props.leyenda}
            </Text>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
