import { type CSSProperties } from "react";
import { describe, expect, it } from "vitest";

import { EstiloSeccionSchema } from "~/lib/pagebuilder/widgets";
import {
  colorFondoSolido,
  colorSolidoDeEsquema,
  estiloSeccionACss,
  fondoSeccionACss,
} from "~/styles/estiloSeccion";

/**
 * Tests de la resolución PURA `estiloSeccion → CSS` (catálogo-v2 F02/D2, síntesis §3). Espejo de
 * `gradienteTematico`: cero hex inline (todo sale de CSS vars de la escala del tenant), esquemas
 * emparejados (fondo + texto legible), y defaults IDÉNTICOS al render actual cuando el estilo falta.
 */

/** Serializa todos los valores string de un objeto CSS (para inspeccionar tokens/ausencia de hex). */
function valoresCss(css: CSSProperties): string {
  return Object.values(css)
    .filter((v): v is string => typeof v === "string")
    .join(" | ");
}

/** `true` sii el string contiene un hex de color (#rgb / #rrggbb) — PROHIBIDO (I-A). */
function tieneHex(s: string): boolean {
  return /#[0-9a-fA-F]{3,8}\b/.test(s);
}

const parse = (raw: unknown) => EstiloSeccionSchema.parse(raw);

describe("estiloSeccion — defaults (estilo ausente = render actual)", () => {
  // esc.001 — estilo undefined ⇒ defaults idénticos al render previo (transparente, py L, lg, sin divisor)
  it("estilo ausente resuelve a los defaults históricos", () => {
    const r = estiloSeccionACss(undefined);
    expect(r.fondo).toEqual({}); // transparente ⇒ hereda el fondo de página
    expect(r.py).toEqual({ base: "xl", md: 48 }); // = py={{ base:"xl", md:48 }} histórico
    expect(r.containerSize).toBe("lg"); // = Container size="lg" histórico
    expect(r.divisor).toBeNull();
    expect(r.entrada).toBe("heredar");
  });

  // esc.002 — ancho "completo" ⇒ full-bleed (sin Container)
  it("ancho completo ⇒ containerSize false (full-bleed)", () => {
    expect(estiloSeccionACss(parse({ ancho: "completo" })).containerSize).toBe(false);
    expect(estiloSeccionACss(parse({ ancho: "ancho" })).containerSize).toBe("xl");
  });
});

describe("estiloSeccion — altura + alineación vertical (builder-tanda-1 F06/D9)", () => {
  // altura.001 — defaults no-op: altoMin ausente (undefined) + justifyVertical flex-start ⇒ el wrapper
  // NO aplica flex ni min-height (render idéntico al actual, I-H).
  it("altoMin default auto ⇒ sin min-height + alineación arriba (no-op)", () => {
    expect(estiloSeccionACss(undefined).altoMin).toBeUndefined();
    expect(estiloSeccionACss(undefined).justifyVertical).toBe("flex-start");
    expect(estiloSeccionACss(parse({})).altoMin).toBeUndefined();
    expect(estiloSeccionACss(parse({})).justifyVertical).toBe("flex-start");
  });

  // altura.002 — altoMin pantalla/media ⇒ min-height en svh (mobile-safe); alinearVertical ⇒ justify.
  it("altoMin pantalla=100svh, media=60svh; alinearVertical mapea a justify-content", () => {
    expect(estiloSeccionACss(parse({ altoMin: "pantalla" })).altoMin).toBe("100svh");
    expect(estiloSeccionACss(parse({ altoMin: "media" })).altoMin).toBe("60svh");
    expect(estiloSeccionACss(parse({ alinearVertical: "centro" })).justifyVertical).toBe("center");
    expect(estiloSeccionACss(parse({ alinearVertical: "abajo" })).justifyVertical).toBe("flex-end");
    // svh (no vh) ⇒ correcto en mobile; sin hex (I-A)
    expect(estiloSeccionACss(parse({ altoMin: "pantalla" })).altoMin).toContain("svh");
  });

  // altura.003 — enums cerrados: valor fuera de rango ⇒ rechazo (candado)
  it("altoMin/alinearVertical rechazan valores fuera del enum", () => {
    expect(EstiloSeccionSchema.safeParse({ altoMin: "gigante" }).success).toBe(false);
    expect(EstiloSeccionSchema.safeParse({ alinearVertical: "medio" }).success).toBe(false);
  });
});

describe("estiloSeccion — esquemas emparejados (cero hex, texto legible)", () => {
  // esc.003 — cada esquema mapea a tokens de la escala (ningún hex inline)
  it("los esquemas sólidos emiten solo CSS vars/color-mix (cero hex)", () => {
    for (const esquema of [
      "tema",
      "superficie",
      "superficie_alt",
      "marca_suave",
      "marca",
      "marca_profundo",
      "tinta",
    ] as const) {
      const css = fondoSeccionACss({ tipo: "esquema", esquema });
      expect(tieneHex(valoresCss(css)), `esquema ${esquema} no debe tener hex`).toBe(false);
    }
  });

  // esc.004 — marca/marca_profundo/tinta emiten color de texto claro/emparejado (contraste por construcción)
  it("marca_profundo y tinta emiten texto blanco; marca usa el color de contraste (autoContrast)", () => {
    expect(fondoSeccionACss({ tipo: "esquema", esquema: "marca_profundo" }).color).toBe(
      "var(--mantine-color-white)",
    );
    expect(fondoSeccionACss({ tipo: "esquema", esquema: "tinta" }).color).toBe(
      "var(--mantine-color-white)",
    );
    // `marca` (filled) usa el contraste de autoContrast: legible para marca clara (amarillo⇒tinta)
    // y oscura (cobalto⇒blanco) — emparejado real, no blanco a ciegas.
    expect(fondoSeccionACss({ tipo: "esquema", esquema: "marca" }).color).toBe(
      "var(--mantine-primary-color-contrast)",
    );
    // el fondo de `marca` es el primario (mismo criterio que gradienteTematico).
    expect(fondoSeccionACss({ tipo: "esquema", esquema: "marca" }).background).toBe(
      "var(--mantine-primary-color-filled)",
    );
  });

  // esc.005 — tema (transparente) no fija fondo ni color (hereda el shell)
  it("esquema tema no fija fondo ni color (transparente/heredado)", () => {
    expect(fondoSeccionACss({ tipo: "esquema", esquema: "tema" })).toEqual({});
  });

  // ── builder-tanda-1 F01/D1: esquemas de acento con degradación a marca ────────────────────────

  // acento.esc.001 — los tres esquemas acento parsean en FondoSeccion y no emiten hex
  it("los esquemas acento_suave/acento/acento_profundo parsean y emiten solo CSS vars (cero hex)", () => {
    for (const esquema of ["acento_suave", "acento", "acento_profundo"] as const) {
      parse({ fondo: { tipo: "esquema", esquema } }); // no lanza ⇒ el enum los acepta
      const css = fondoSeccionACss({ tipo: "esquema", esquema });
      expect(tieneHex(valoresCss(css)), `esquema ${esquema} no debe tener hex`).toBe(false);
    }
  });

  // acento.esc.002 — degradación: cada esquema acento cae por fallback CSS a la escala de marca/primario
  it("cada esquema acento usa la escala `acento` con FALLBACK a la de marca (degradación sin acento, I-T2)", () => {
    const suave = fondoSeccionACss({ tipo: "esquema", esquema: "acento_suave" });
    expect(suave.background).toBe("var(--mantine-color-acento-0, var(--mantine-primary-color-0))");
    expect(suave.color).toBe("var(--mantine-color-text)");

    const filled = fondoSeccionACss({ tipo: "esquema", esquema: "acento" });
    expect(filled.background).toBe(
      "var(--mantine-color-acento-filled, var(--mantine-primary-color-filled))",
    );
    // texto emparejado por autoContrast, con fallback al contraste del primario
    expect(filled.color).toBe(
      "var(--mantine-color-acento-contrast, var(--mantine-primary-color-contrast))",
    );

    const profundo = fondoSeccionACss({ tipo: "esquema", esquema: "acento_profundo" });
    expect(profundo.background).toBe("var(--mantine-color-acento-8, var(--mantine-primary-color-8))");
    expect(profundo.color).toBe("var(--mantine-color-white)");
  });

  // acento.esc.003 — colorSolidoDeEsquema (fill del divisor) también degrada por fallback
  it("colorSolidoDeEsquema de un esquema acento emite el token acento con fallback a marca", () => {
    expect(colorSolidoDeEsquema("acento")).toBe(
      "var(--mantine-color-acento-filled, var(--mantine-primary-color-filled))",
    );
    expect(colorSolidoDeEsquema("acento_profundo")).toBe(
      "var(--mantine-color-acento-8, var(--mantine-primary-color-8))",
    );
  });
});

describe("estiloSeccion — gradientes / imagen / patrón", () => {
  // esc.006 — gradiente marca_vivo ⇒ linear-gradient con vars de la escala (cero hex)
  it("gradiente marca_vivo emite un linear-gradient de la escala (cero hex)", () => {
    const css = fondoSeccionACss({ tipo: "gradiente", preset: "marca_vivo" });
    expect(css.background).toContain("linear-gradient");
    expect(css.background).toContain("--mantine-primary-color-");
    expect(tieneHex(valoresCss(css))).toBe(false);
    expect(css.color).toBe("var(--mantine-color-white)");
  });

  // esc.007 — fondo imagen con URL ⇒ overlay por enum + url; posición mapeada; cero hex
  it("fondo imagen emite overlay por enum + la url + posición", () => {
    const css = fondoSeccionACss({
      tipo: "imagen",
      url: "https://cdn.example.com/foto.jpg",
      overlay: "tinta",
      opacidadOverlay: 45,
      posicion: "arriba",
      fijo: false,
    });
    expect(css.backgroundImage).toContain('url("https://cdn.example.com/foto.jpg")');
    expect(css.backgroundImage).toContain("color-mix"); // overlay por token, no hex
    expect(css.backgroundPosition).toBe("top");
    expect(css.color).toBe("var(--mantine-color-white)"); // overlay tinta oscurece ⇒ texto claro
    expect(tieneHex(valoresCss(css))).toBe(false);
  });

  // esc.008 — overlay "ninguno" ⇒ sin capa de overlay (solo la imagen); texto tinta
  it("fondo imagen con overlay ninguno no agrega overlay y usa texto tinta", () => {
    const css = fondoSeccionACss({
      tipo: "imagen",
      url: "https://cdn.example.com/x.jpg",
      overlay: "ninguno",
      opacidadOverlay: 0,
      posicion: "centro",
      fijo: false,
    });
    expect(css.backgroundImage).toBe('url("https://cdn.example.com/x.jpg")');
    expect(css.color).toBe("var(--mantine-color-text)");
  });

  // esc.009 — patrón ⇒ esquema base + backgroundImage del patrón (cero hex)
  it("patrón emite el esquema base + un backgroundImage de patrón (cero hex)", () => {
    const css = fondoSeccionACss({ tipo: "patron", patron: "puntos", esquema: "superficie" });
    expect(css.background).toBe("var(--mantine-color-body)"); // esquema base
    expect(css.backgroundImage).toContain("radial-gradient");
    expect(tieneHex(valoresCss(css))).toBe(false);
  });
});

describe("estiloSeccion — fondo bicolor (builder-tanda-1 F02/D3)", () => {
  // bicolor.001 — parsea con tonos/dirección/mezcla de enum; defaults de direccion/mezcla aplican
  it("la rama bicolor parsea con TONOS de enum y rellena direccion/mezcla por default", () => {
    const e = parse({ fondo: { tipo: "bicolor", colorA: "marca", colorB: "acento" } });
    expect(e.fondo).toEqual({
      tipo: "bicolor",
      colorA: "marca",
      colorB: "acento",
      direccion: "vertical",
      mezcla: "dura",
    });
  });

  // bicolor.002 — hex crudo, tono fuera de TONOS_FONDO o campo extra ⇒ rechazo (.strict / enum cerrado)
  it("rechaza hex crudo, tono fuera de rango y campos extra", () => {
    expect(() => parse({ fondo: { tipo: "bicolor", colorA: "#fff", colorB: "acento" } })).toThrow();
    // "tema" existe en ESQUEMAS_FONDO pero NO en TONOS_FONDO (curado) ⇒ rechazo
    expect(() => parse({ fondo: { tipo: "bicolor", colorA: "tema", colorB: "marca" } })).toThrow();
    expect(() =>
      parse({ fondo: { tipo: "bicolor", colorA: "marca", colorB: "acento", extra: 1 } }),
    ).toThrow();
  });

  // bicolor.003 — mezcla dura = hard-stop 50%; suave = degradado continuo; dirección mapeada; cero hex
  it("emite los dos tokens + dirección; dura = corte al 50%, suave = degradado", () => {
    const dura = fondoSeccionACss({
      tipo: "bicolor",
      colorA: "marca",
      colorB: "acento",
      direccion: "vertical",
      mezcla: "dura",
    });
    expect(dura.background).toContain("linear-gradient(to bottom");
    expect(dura.background).toContain("var(--mantine-primary-color-filled)"); // colorA = marca
    expect(dura.background).toContain("var(--mantine-color-acento-filled"); // colorB = acento (fallback)
    expect(dura.background).toContain("50%"); // corte duro
    expect(tieneHex(valoresCss(dura))).toBe(false);

    const suave = fondoSeccionACss({
      tipo: "bicolor",
      colorA: "marca",
      colorB: "acento",
      direccion: "diagonal",
      mezcla: "suave",
    });
    expect(suave.background).toContain("linear-gradient(135deg");
    expect(suave.background).not.toContain("50%"); // degradado continuo
  });

  // bicolor.004 — el color de texto se empareja con colorA (tono dominante donde se asienta el contenido)
  it("empareja el color de texto con colorA (legibilidad por construcción)", () => {
    // colorA marca (filled) ⇒ contraste de autoContrast (mismo que esquema `marca`)
    expect(
      fondoSeccionACss({
        tipo: "bicolor",
        colorA: "marca",
        colorB: "tinta",
        direccion: "vertical",
        mezcla: "dura",
      }).color,
    ).toBe("var(--mantine-primary-color-contrast)");
    // colorA tinta (oscuro) ⇒ texto blanco
    expect(
      fondoSeccionACss({
        tipo: "bicolor",
        colorA: "tinta",
        colorB: "marca",
        direccion: "vertical",
        mezcla: "dura",
      }).color,
    ).toBe("var(--mantine-color-white)");
  });
});

describe("estiloSeccion — anchoFondo (builder-tanda-1 F02/D4)", () => {
  // anchofondo.001 — default no-op: estilo ausente / sin anchoFondo ⇒ "completo" (render actual full-bleed)
  it("anchoFondo default es 'completo' (reproduce el full-bleed actual del wrapper)", () => {
    expect(estiloSeccionACss(undefined).anchoFondo).toBe("completo");
    expect(estiloSeccionACss(parse({})).anchoFondo).toBe("completo");
  });

  // anchofondo.002 — "contenido" se propaga al descriptor
  it("anchoFondo 'contenido' se resuelve al descriptor", () => {
    expect(estiloSeccionACss(parse({ anchoFondo: "contenido" })).anchoFondo).toBe("contenido");
  });
});

describe("estiloSeccion — divisor y transición de color", () => {
  // esc.010 — divisorInferior con forma ≠ ninguno ⇒ se resuelve; "ninguno" ⇒ null
  it("resuelve el divisor inferior solo si la forma no es ninguno", () => {
    expect(
      estiloSeccionACss(parse({ divisorInferior: { forma: "onda", altura: "l" } })).divisor,
    ).toEqual({ forma: "onda", altura: "l", invertir: false });
    expect(
      estiloSeccionACss(parse({ divisorInferior: { forma: "ninguno" } })).divisor,
    ).toBeNull();
  });

  // esc.011 — colorFondoSolido: esquema ⇒ su token; gradiente/imagen/ausente ⇒ fondo de página (body)
  it("colorFondoSolido da el token del esquema, o body para gradiente/imagen/ausente", () => {
    expect(colorFondoSolido(undefined)).toBe("var(--mantine-color-body)");
    expect(colorFondoSolido(parse({ fondo: { tipo: "esquema", esquema: "marca" } }))).toBe(
      "var(--mantine-primary-color-filled)",
    );
    expect(
      colorFondoSolido(parse({ fondo: { tipo: "gradiente", preset: "marca_vivo" } })),
    ).toBe("var(--mantine-color-body)");
    expect(colorSolidoDeEsquema("tinta")).toBe("var(--mantine-color-gray-9)");
  });
});
