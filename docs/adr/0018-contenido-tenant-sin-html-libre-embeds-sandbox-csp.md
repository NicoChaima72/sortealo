# Contenido de tenant: jamás HTML libre; embeds solo iframe sandbox con URL propia; CSP estricta

> **Estado: aceptado** (2026-07-17, visto bueno del usuario). Plan: `tasks/26-07-17-page-builder.md` (carril A). Origen: síntesis D7/D8/D9. Par de ADR-0019: con cookie de sesión al wildcard, esto es control de aislamiento de sesión, no solo anti-XSS.

**Decisión (tres capas, todas obligatorias):**

1. **Sin HTML libre, a nivel de schema.** No existe (ni existirá) widget `html`/`embedCode`/`customCss`/`iframeSrc` — prohibido en el registro Zod (ADR-0016) y en review. Toda escritura (MCP, chat IA, drag-drop futuro) pasa por el mismo `PageDocumentSchema.parse()` server-side; tipos/props desconocidos o límites excedidos ⇒ rechazo. Texto rico = markdown-subset sanitizado o Tiptap JSON con allowlist de nodos, **nunca HTML persistido** ni `dangerouslySetInnerHTML`.
2. **Embeds iframe-only con `src` construida por nosotros** desde un ID/handle validado (regex + allowlist de host **exacto**, ej. `www.tiktok.com`, no `*.tiktok.com`). Nunca el `blockquote`+`<script>` de la plataforma, nunca oEmbed `html`. Fuentes v1: YouTube (`youtube-nocookie.com/embed/{id}`), TikTok (`tiktok.com/player/v1/{id}`), Instagram (`instagram.com/p/{shortcode}/embed/`), Spotify (`open.spotify.com/embed/{tipo}/{id}`). Todo iframe: `sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"` (**sin** `allow-top-navigation` ni `allow-forms` → anti-phishing/anti-fake-checkout), `allow="encrypted-media; picture-in-picture; fullscreen"` (jamás camera/micrófono/geolocalización), `referrerpolicy="strict-origin-when-cross-origin"`, `loading="lazy"`, altura reservada.
3. **CSP estricta en `src/middleware.ts`** (hoy no hay ninguna): `frame-src` = allowlist real de embeds; `frame-ancestors 'none'` (el storefront/checkout no se deja iframear); `connect-src 'self'` (anti-exfiltración); `object-src 'none'`. Arranque en `Report-Only` unos días (estilos inline de Mantine), luego enforcing.

Razón: los subdominios de tenant comparten el registrable domain y — con ADR-0019 — la cookie de sesión wildcard. **Un script inyectado en cualquier `<slug>.sorteatelo.cl` cabalgaría la sesión domain-wide de cualquier visitante logueada.** La seguridad no puede depender de sanitización posterior ni del buen comportamiento de un LLM editor (prompt injection vía fotos/referencias del tenant): la clase de ataque se elimina por construcción — el tipo de widget peligroso no existe en el schema.

## Consecuencias

- El MCP/chat nunca acepta ni emite HTML; solo operaciones tipadas sobre el schema. Sin tools con efectos fuera del documento (nada de correos, `FlowCredential`, precios).
- Publicar es checkpoint humano explícito (MVP: el Operador) — última línea contra páginas envenenadas.
- oEmbed server-side queda solo como opción futura para thumbnails del editor (descartando el campo `html`).
- Costo aceptado: los embeds se ven como los sirve el player oficial de cada plataforma (sin estilos custom del blockquote nativo).
