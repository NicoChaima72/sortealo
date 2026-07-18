/**
 * Contrato de EMBEDS del page builder (F07/D8, ADR-0018). Helper ÚNICO `construirEmbedSrc`: recibe
 * una `red` (enum cerrado) y una `ref` (ID/handle), la valida por REGEX y construye la `src` del
 * iframe apuntando a un HOST EXACTO de la allowlist. NUNCA se persiste ni se acepta HTML/`iframeSrc`
 * crudo (I3/I4): el documento guarda solo `{ red, ref }` y la URL se arma acá server/registry-side.
 * Puro, client+server safe (lo usan el `<EmbedFrame>`, el CSP y —en F11— los widgets `video`/`embed_social`).
 *
 * Fuentes v1 (las que usarán los widgets de F11): YouTube (nocookie), TikTok, Instagram. Spotify y
 * otros entran cuando llegue su widget (catálogo §3, "después"). Host EXACTO, jamás wildcard
 * (`www.tiktok.com`, no `*.tiktok.com`).
 */

export const REDES_EMBED = ["youtube", "tiktok", "instagram"] as const;
export type RedEmbed = (typeof REDES_EMBED)[number];

interface DefEmbed {
  /** Origen EXACTO para la allowlist de `frame-src` del CSP (con esquema, sin path). */
  origen: string;
  /** Valida el ID/handle por regex estricta (ADR-0018). */
  valida: (ref: string) => boolean;
  /** Construye la `src` del iframe desde un ref YA validado. */
  src: (ref: string) => string;
}

const DEFS: Record<RedEmbed, DefEmbed> = {
  youtube: {
    origen: "https://www.youtube-nocookie.com",
    valida: (r) => /^[A-Za-z0-9_-]{11}$/.test(r),
    src: (r) => `https://www.youtube-nocookie.com/embed/${r}`,
  },
  tiktok: {
    origen: "https://www.tiktok.com",
    valida: (r) => /^\d{6,25}$/.test(r),
    src: (r) => `https://www.tiktok.com/player/v1/${r}`,
  },
  instagram: {
    origen: "https://www.instagram.com",
    valida: (r) => /^[A-Za-z0-9_-]{1,30}$/.test(r),
    src: (r) => `https://www.instagram.com/p/${r}/embed/`,
  },
};

/**
 * Construye la `src` del embed, o `null` si la `red` no está en la allowlist o el `ref` no pasa la
 * regex (input basura ⇒ rechazo, F07). El caller (`<EmbedFrame>`) no renderiza nada si es `null`.
 */
export function construirEmbedSrc(red: string, ref: string): string | null {
  if (!Object.prototype.hasOwnProperty.call(DEFS, red)) return null;
  const def = DEFS[red as RedEmbed];
  const limpio = ref.trim();
  if (!def.valida(limpio)) return null;
  return def.src(limpio);
}

/** Orígenes EXACTOS de la allowlist de `frame-src` del CSP (ADR-0018). Fuente única con los embeds. */
export const ORIGENES_EMBED: readonly string[] = REDES_EMBED.map(
  (red) => DEFS[red].origen,
);
