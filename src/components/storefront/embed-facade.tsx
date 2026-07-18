import { Box, Center, ThemeIcon } from "@mantine/core";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { useState } from "react";

import { EmbedFrame } from "~/components/storefront/embed-frame";
import { construirEmbedSrc, type RedEmbed } from "~/lib/pagebuilder/embeds";

/**
 * Facade LAZY de embeds (F11, §6 performance): muestra un PÓSTER (fondo neutro + botón play) y carga
 * el `<EmbedFrame>` (iframe de terceros) recién al CLICK — los scripts de terceros destruyen el LCP en
 * 4G, así que no se cargan hasta que el visitante interactúa. Reserva el aspect-ratio (anti layout
 * shift). Si la `red`/`ref` es inválida (no construye src), no renderiza nada (degradación elegante).
 */
export function EmbedFacade({
  red,
  referencia,
  titulo,
  ratio = "16:9",
}: {
  red: RedEmbed;
  referencia: string;
  titulo: string;
  ratio?: "16:9" | "9:16";
}) {
  const [activo, setActivo] = useState(false);

  // Si la ref no es válida, ni el póster se muestra (el EmbedFrame también devolvería null).
  if (!construirEmbedSrc(red, referencia)) return null;

  if (activo) {
    return <EmbedFrame red={red} referencia={referencia} titulo={titulo} ratio={ratio} />;
  }

  const aspectRatio = ratio === "9:16" ? "9 / 16" : "16 / 9";

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Reproducir ${titulo}`}
      onClick={() => setActivo(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActivo(true);
        }
      }}
      style={{
        aspectRatio,
        width: "100%",
        maxWidth: ratio === "9:16" ? 360 : undefined,
        position: "relative",
        cursor: "pointer",
        borderRadius: "var(--mantine-radius-md)",
        overflow: "hidden",
        background: "var(--mantine-color-dark-6)",
      }}
    >
      <Center style={{ position: "absolute", inset: 0 }}>
        <ThemeIcon size={64} radius="xl" variant="filled">
          <IconPlayerPlayFilled className="size-7" />
        </ThemeIcon>
      </Center>
    </Box>
  );
}
