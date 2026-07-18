import { describe, expect, it } from "vitest";

import { construirEmbedSrc, ORIGENES_EMBED } from "~/lib/pagebuilder/embeds";

/**
 * Tests del contrato de embeds (F07/D8, ADR-0018). `construirEmbedSrc` acepta SOLO redes de la
 * allowlist + IDs/handles válidos por regex, apuntando a hosts EXACTOS; input basura ⇒ `null`.
 */
describe("pagebuilder/embeds — construirEmbedSrc", () => {
  // page.embed.001 — YouTube: id de 11 chars válido ⇒ src nocookie; basura ⇒ null
  it("YouTube acepta un id de 11 chars y construye la src nocookie; rechaza basura", () => {
    expect(construirEmbedSrc("youtube", "dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(construirEmbedSrc("youtube", "corto")).toBeNull();
    expect(construirEmbedSrc("youtube", "conespacios y basura")).toBeNull();
    expect(construirEmbedSrc("youtube", "<script>alert(1)</script>")).toBeNull();
  });

  // page.embed.002 — TikTok: id numérico ⇒ player v1; no numérico ⇒ null
  it("TikTok acepta un id numérico y construye el player v1; rechaza no-numérico", () => {
    expect(construirEmbedSrc("tiktok", "7231338487075343622")).toBe(
      "https://www.tiktok.com/player/v1/7231338487075343622",
    );
    expect(construirEmbedSrc("tiktok", "abc123")).toBeNull();
    expect(construirEmbedSrc("tiktok", "1")).toBeNull(); // muy corto
  });

  // page.embed.003 — Instagram: shortcode ⇒ /p/<code>/embed/
  it("Instagram acepta un shortcode y construye /p/<code>/embed/", () => {
    expect(construirEmbedSrc("instagram", "CabcDEF_123")).toBe(
      "https://www.instagram.com/p/CabcDEF_123/embed/",
    );
    expect(construirEmbedSrc("instagram", "no válido!")).toBeNull();
  });

  // page.embed.004 — red fuera de la allowlist ⇒ null (nunca un host arbitrario)
  it("una red fuera de la allowlist ⇒ null (no se construye ninguna src)", () => {
    expect(construirEmbedSrc("evil", "loquesea")).toBeNull();
    expect(construirEmbedSrc("iframe", "https://evil.example")).toBeNull();
    expect(construirEmbedSrc("spotify", "algo")).toBeNull(); // aún no soportado (widget "después")
  });

  // page.embed.005 — la allowlist de orígenes es la de ADR-0018 (hosts exactos, con esquema)
  it("ORIGENES_EMBED expone los hosts exactos de la allowlist (para el CSP)", () => {
    expect(ORIGENES_EMBED).toEqual([
      "https://www.youtube-nocookie.com",
      "https://www.tiktok.com",
      "https://www.instagram.com",
    ]);
  });
});
