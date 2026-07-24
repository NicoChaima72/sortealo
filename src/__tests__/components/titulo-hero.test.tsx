import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  TituloHero,
  partirEnPalabras,
  partirTituloAcento,
} from "~/components/storefront/titulo-hero";
import { heroProps } from "~/lib/pagebuilder/widgets";

/**
 * Tests del hero puente (builder-tanda-1 F03/D5/D6): `tituloAcento` con match seguro sin HTML del
 * tenant (I3/I-A), efectos de título SSR-visibles (I-D), `resaltado` como background del PROPIO span
 * (lección en memoria del proyecto), y defaults del schema que conservan el look v2 (I-H, sin v-bump).
 * Todo con `renderToStaticMarkup` (env node): `TituloHero` devuelve spans puros sin provider Mantine.
 */

/** `true` sii el string contiene un hex de color — PROHIBIDO en el documento (I-A). */
function tieneHex(s: string): boolean {
  return /#[0-9a-fA-F]{3,8}\b/.test(s);
}

const render = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("hero.schema — campos puente parsean con defaults que conservan el look v2 (sin v-bump)", () => {
  // hero.schema.001 — un hero v2 SIN los campos nuevos parsea; los defaults reproducen el look actual.
  it("hero mínimo parsea y los campos puente caen a sus defaults", () => {
    const p = heroProps.parse({});
    expect(p.ctaSecundarioEstilo).toBe("boton");
    expect(p.mostrarConfianza).toBe(true);
    expect(p.efectoTitulo).toBe("ninguno");
    expect(p.tituloAcento).toBeUndefined();
    expect(p.destacado).toBeUndefined();
    // mostrarBadgeSorteo YA existía (NO se duplica con mostrarConfianza): son booleanos distintos.
    expect(p.mostrarBadgeSorteo).toBe(true);
    expect("mostrarConfianza" in p && "mostrarBadgeSorteo" in p).toBe(true);
  });

  // hero.schema.002 — tituloAcento/destacado son objetos .strict(): campo extra o tipos malos ⇒ rechazo.
  it("tituloAcento y destacado son estrictos y de enum cerrado", () => {
    expect(heroProps.safeParse({ tituloAcento: { palabra: "X", estilo: "acento" } }).success).toBe(true);
    // estilo fuera del enum ⇒ rechazo
    expect(heroProps.safeParse({ tituloAcento: { palabra: "X", estilo: "neon" } }).success).toBe(false);
    // campo extra en el objeto anidado ⇒ rechazo (.strict)
    expect(
      heroProps.safeParse({ tituloAcento: { palabra: "X", estilo: "acento", extra: 1 } }).success,
    ).toBe(false);
    // efectoTitulo fuera del enum ⇒ rechazo
    expect(heroProps.safeParse({ efectoTitulo: "explotar" }).success).toBe(false);
    // destacado.texto > 24 ⇒ rechazo (límite de texto plano)
    expect(heroProps.safeParse({ destacado: { texto: "x".repeat(25) } }).success).toBe(false);
    expect(heroProps.safeParse({ destacado: { texto: "$3.000", nota: "por ticket" } }).success).toBe(true);
  });
});

describe("hero.acento — match seguro por SUBSTRING, sin HTML del tenant", () => {
  // hero.acento.001 — partirTituloAcento matchea la PRIMERA ocurrencia case-insensitive, conserva casing.
  it("parte por la primera ocurrencia case-insensitive conservando el casing original", () => {
    expect(partirTituloAcento("Vas a ENRIQUECER tu vida", "enriquecer")).toEqual({
      antes: "Vas a ",
      match: "ENRIQUECER",
      despues: " tu vida",
    });
    // sin match ⇒ null
    expect(partirTituloAcento("Hola mundo", "chao")).toBeNull();
    // palabra vacía ⇒ null (nunca envuelve todo)
    expect(partirTituloAcento("Hola", "")).toBeNull();
  });

  // hero.acento.001b — el render envuelve la primera ocurrencia en un span con color de la escala acento.
  it("TituloHero envuelve la palabra en un span con token de acento (cero hex)", () => {
    const html = render(
      createElement(TituloHero, {
        titulo: "Vas a ENRIQUECER tu vida",
        acento: { palabra: "enriquecer", estilo: "acento" },
        efecto: "ninguno",
      }),
    );
    expect(html).toContain("ENRIQUECER"); // casing original conservado
    expect(html).toContain("Vas a ");
    expect(html).toContain("tu vida");
    expect(html).toContain("--mantine-color-acento-filled"); // token de la escala acento
    expect(html).toContain("--mantine-primary-color-filled"); // fallback a marca (I-T2)
    expect(tieneHex(html)).toBe(false);
  });

  // hero.acento.002 — `resaltado` = destacador como BACKGROUND del propio span (nunca capa aparte).
  it("resaltado pinta el destacador como background del propio span con box-decoration-break clone", () => {
    const html = render(
      createElement(TituloHero, {
        titulo: "El libro que te ENRIQUECE",
        acento: { palabra: "ENRIQUECE", estilo: "resaltado" },
        efecto: "ninguno",
      }),
    );
    // el resaltado es un linear-gradient en background-image DEL span (no un elemento aparte con z-index)
    expect(html).toMatch(/background-image:\s*linear-gradient/i);
    expect(html.toLowerCase()).toContain("box-decoration-break:clone");
    expect(html).not.toContain("z-index");
    expect(tieneHex(html)).toBe(false);
  });

  // hero.acento.003 — `gradiente` = texto con background-clip:text (tokens marca/acento).
  it("gradiente recorta el texto con background-clip y color transparente", () => {
    const html = render(
      createElement(TituloHero, {
        titulo: "ENRIQUECER",
        acento: { palabra: "ENRIQUECER", estilo: "gradiente" },
        efecto: "ninguno",
      }),
    );
    expect(html.toLowerCase()).toContain("background-clip:text");
    expect(html.toLowerCase()).toContain("color:transparent");
    expect(tieneHex(html)).toBe(false);
  });

  // hero.acento.004 — palabra sin match ⇒ título INTACTO, sin span de estilo, sin error.
  it("palabra sin match ⇒ título intacto sin envolver nada", () => {
    const html = render(
      createElement(TituloHero, {
        titulo: "Un título cualquiera",
        acento: { palabra: "inexistente", estilo: "acento" },
        efecto: "ninguno",
      }),
    );
    expect(html).toContain("Un título cualquiera");
    expect(html).not.toContain("--mantine-color-acento-filled");
  });
});

describe("hero.reveal — efectos de título SSR-visibles (I-D) y reduced-motion-safe", () => {
  // hero.reveal.001 — revelar_palabras: el HTML SSR contiene el título COMPLETO y VISIBLE (nunca opacity:0).
  it("revelar_palabras deja el título completo VISIBLE en SSR (opacity:0 solo en el keyframe CSS)", () => {
    const html = render(
      createElement(TituloHero, {
        titulo: "Vas a ENRIQUECER tu vida hoy",
        acento: { palabra: "ENRIQUECER", estilo: "acento" },
        efecto: "revelar_palabras",
      }),
    );
    // todas las palabras presentes en el markup
    for (const palabra of ["Vas", "ENRIQUECER", "tu", "vida", "hoy"]) {
      expect(html).toContain(palabra);
    }
    // SSR-visible: JAMÁS opacity:0 inline (vive en el keyframe gateado de globals.css)
    expect(html.toLowerCase()).not.toContain("opacity:0");
    expect(html.toLowerCase()).not.toContain("opacity: 0");
    // la clase de reveal (gateada por reduced-motion en CSS) y el delay escalonado inline
    expect(html).toContain("animar-revelar-palabra");
    expect(html.toLowerCase()).toContain("animation-delay");
    // la palabra del acento conserva su token dentro del reveal
    expect(html).toContain("--mantine-color-acento-filled");
  });

  // hero.reveal.002 — gradiente_animado: gradiente VISIBLE (reduced-motion-safe) + clase de posición.
  it("gradiente_animado deja el título visible con la clase animar-holo (solo la posición anima)", () => {
    const html = render(
      createElement(TituloHero, {
        titulo: "ENRIQUECER",
        efecto: "gradiente_animado",
      }),
    );
    expect(html).toContain("ENRIQUECER");
    expect(html).toContain("animar-holo");
    expect(html.toLowerCase()).toContain("background-clip:text");
    expect(html.toLowerCase()).not.toContain("opacity:0");
    expect(tieneHex(html)).toBe(false);
  });

  // hero.reveal.003 — partirEnPalabras conserva los espacios como tokens (no colapsa el whitespace).
  it("partirEnPalabras conserva los espacios intercalados", () => {
    expect(partirEnPalabras("a  b c")).toEqual(["a", "  ", "b", " ", "c"]);
  });
});
