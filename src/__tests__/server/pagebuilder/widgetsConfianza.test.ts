import { describe, expect, it } from "vitest";

import { construirEmbedSrc } from "~/lib/pagebuilder/embeds";
import { SeccionNodeSchema } from "~/lib/pagebuilder/schema";
import {
  embedSocialProps,
  faqProps,
  ganadoresProps,
  testimoniosProps,
  videoProps,
} from "~/lib/pagebuilder/widgets";

/**
 * Tests de los widgets PRO de confianza (F11, ADR-0016/0018): límites/longitud + texto plano de los
 * widgets de texto (testimonios/ganadores/faq), y que `video`/`embed_social` construyen su `src` SOLO
 * vía `construirEmbedSrc` (contrato F07/ADR-0018) — nunca HTML/iframeSrc crudo.
 */

describe("pagebuilder/widgets confianza (F11) — texto plano + límites", () => {
  // page.conf.001 — testimonios: 1–12 items, texto ≤280, estrellas 1–5; rechaza HTML/campo extra
  it("testimonios valida cantidad/longitud/estrellas y rechaza campos extra (sin HTML)", () => {
    expect(testimoniosProps.safeParse({ items: [{ nombre: "A", texto: "ok" }] }).success).toBe(true);
    expect(testimoniosProps.safeParse({ items: [] }).success).toBe(false); // min 1
    expect(
      testimoniosProps.safeParse({ items: Array(13).fill({ nombre: "A", texto: "ok" }) }).success,
    ).toBe(false); // max 12
    expect(testimoniosProps.safeParse({ items: [{ nombre: "A", texto: "x".repeat(281) }] }).success).toBe(false);
    expect(testimoniosProps.safeParse({ items: [{ nombre: "A", texto: "ok", estrellas: 6 }] }).success).toBe(false);
    expect(testimoniosProps.safeParse({ items: [{ nombre: "A", texto: "ok", html: "<b>x</b>" }] }).success).toBe(false);
  });

  // page.conf.002 — ganadores: 1–20 items, premio ≤80
  it("ganadores valida cantidad y longitud del premio", () => {
    expect(ganadoresProps.safeParse({ items: [{ nombre: "N", premio: "Premio" }] }).success).toBe(true);
    expect(ganadoresProps.safeParse({ items: [{ nombre: "N", premio: "x".repeat(81) }] }).success).toBe(false);
    expect(ganadoresProps.safeParse({ items: Array(21).fill({ nombre: "N", premio: "P" }) }).success).toBe(false);
  });

  // page.conf.003 — faq: 1–20 items, pregunta ≤160, respuesta ≤600
  it("faq valida cantidad y longitud de pregunta/respuesta", () => {
    expect(faqProps.safeParse({ items: [{ pregunta: "¿?", respuesta: "R" }] }).success).toBe(true);
    expect(faqProps.safeParse({ items: [{ pregunta: "x".repeat(161), respuesta: "R" }] }).success).toBe(false);
    expect(faqProps.safeParse({ items: [{ pregunta: "¿?", respuesta: "x".repeat(601) }] }).success).toBe(false);
  });
});

describe("pagebuilder/widgets confianza (F11) — embeds solo por construirEmbedSrc (contrato F07)", () => {
  // page.conf.004 — video: la plataforma+videoId construyen la src del embed (sandbox de EmbedFrame)
  it("video construye la src SOLO vía construirEmbedSrc (id válido ⇒ src; basura ⇒ null)", () => {
    const props = videoProps.parse({ plataforma: "youtube", videoId: "dQw4w9WgXcQ" });
    expect(construirEmbedSrc(props.plataforma, props.videoId)).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    // un videoId basura no produce src (el EmbedFrame no renderiza).
    const basura = videoProps.parse({ plataforma: "youtube", videoId: "no-es-id" });
    expect(construirEmbedSrc(basura.plataforma, basura.videoId)).toBeNull();
    // no existe una prop de HTML/iframeSrc crudo (.strict).
    expect(videoProps.safeParse({ plataforma: "youtube", videoId: "dQw4w9WgXcQ", iframeSrc: "https://evil" }).success).toBe(false);
  });

  // page.conf.005 — embed_social: red (tiktok|instagram) + ref construyen la src
  it("embed_social construye la src vía construirEmbedSrc para tiktok/instagram", () => {
    const tt = embedSocialProps.parse({ red: "tiktok", tipo: "post", ref: "7231338487075343622" });
    expect(construirEmbedSrc(tt.red, tt.ref)).toBe("https://www.tiktok.com/player/v1/7231338487075343622");
    const ig = embedSocialProps.parse({ red: "instagram", tipo: "post", ref: "CabcDEF_123" });
    expect(construirEmbedSrc(ig.red, ig.ref)).toBe("https://www.instagram.com/p/CabcDEF_123/embed/");
    // youtube NO es una red válida de embed_social (solo tiktok/instagram).
    expect(embedSocialProps.safeParse({ red: "youtube", tipo: "post", ref: "x" }).success).toBe(false);
  });

  // page.conf.006 — un nodo de sección video/embed_social parsea entero contra la union
  it("un nodo video y uno embed_social parsean contra la union de secciones", () => {
    expect(
      SeccionNodeSchema.safeParse({ id: "v", tipo: "video", v: 1, props: { plataforma: "youtube", videoId: "dQw4w9WgXcQ" } }).success,
    ).toBe(true);
    expect(
      SeccionNodeSchema.safeParse({ id: "e", tipo: "embed_social", v: 1, props: { red: "tiktok", ref: "7231338487075343622" } }).success,
    ).toBe(true);
  });
});
