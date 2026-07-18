import { Box } from "@mantine/core";

import { construirEmbedSrc, type RedEmbed } from "~/lib/pagebuilder/embeds";

/**
 * `<EmbedFrame>` — el ÚNICO componente que renderiza un embed de terceros (F07/D8, ADR-0018). La
 * `src` la construye `construirEmbedSrc` desde `{ red, referencia }` validados (NUNCA HTML/`iframeSrc`
 * crudo, I3/I4). El sandbox es EXACTAMENTE el de ADR-0018: `allow-scripts allow-same-origin
 * allow-popups allow-popups-to-escape-sandbox` — **sin** `allow-forms` ni `allow-top-navigation`
 * (anti-phishing / anti-fake-checkout). `allow` solo `encrypted-media; picture-in-picture; fullscreen`
 * (jamás cámara/micrófono/geolocalización). `referrerpolicy` estricta, `loading="lazy"`, altura
 * reservada (anti-clickjacking-inverso). Ref inválida ⇒ no renderiza nada.
 *
 * Lo consumen (vía `<EmbedFacade>` lazy) los widgets `video` y `embed_social` (F11). El contrato de
 * seguridad se fijó en F07 junto con la CSP; F11 lo cablea.
 */
export function EmbedFrame({
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
  const src = construirEmbedSrc(red, referencia);
  if (!src) return null; // red/ref inválida ⇒ no se renderiza nada (degradación elegante)

  const aspectRatio = ratio === "9:16" ? "9 / 16" : "16 / 9";

  return (
    <Box
      style={{
        aspectRatio,
        width: "100%",
        maxWidth: ratio === "9:16" ? 360 : undefined,
        borderRadius: "var(--mantine-radius-md)",
        overflow: "hidden",
      }}
    >
      <iframe
        src={src}
        title={titulo}
        // Sandbox EXACTO de ADR-0018: sin allow-forms ni allow-top-navigation.
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        allow="encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
      />
    </Box>
  );
}
