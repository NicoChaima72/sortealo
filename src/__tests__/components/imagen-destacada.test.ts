import { describe, expect, it } from "vitest";

import { formaImagenCss } from "~/components/storefront/imagen-destacada";
import { FORMAS_IMAGEN, imagenDestacadaProps } from "~/lib/pagebuilder/widgets";

/**
 * Tests de las máscaras de forma de `imagen_destacada` (builder-tanda-1 F07/D11): clip-paths/border-radius
 * CURADOS (nunca valor libre del tenant, I-A), default `ninguna` no-op (I-H), y schema estricto. El
 * helper `formaImagenCss` es PURO ⇒ testeable sin render.
 */

/** `true` sii el string contiene un hex de color — PROHIBIDO (I-A). */
function tieneHex(s: string): boolean {
  return /#[0-9a-fA-F]{3,8}\b/.test(s);
}

describe("imagen_destacada — máscaras de forma (F07/D11)", () => {
  // forma.001 — default `ninguna` ⇒ CSS vacío (no-op); un doc sin `forma` parsea igual (I-H).
  it("forma ninguna ⇒ {} (no-op); el schema default es ninguna", () => {
    expect(formaImagenCss("ninguna")).toEqual({});
    const p = imagenDestacadaProps.parse({ imagenUrl: "https://x.cl/a.jpg", alt: "foto" });
    expect(p.forma).toBe("ninguna");
  });

  // forma.002 — círculo/blob/arco emiten border-radius; ticket emite clip-path (motivo troquel). Ninguna
  // forma emite un hex (I-A). Cada valor del enum tiene render (exhaustivo).
  it("cada forma emite su recorte curado (radius o clip-path), sin hex", () => {
    expect(formaImagenCss("circulo").borderRadius).toBe("50%");
    expect(formaImagenCss("blob").borderRadius).toContain("%"); // 8 valores en %
    expect(formaImagenCss("arco").borderRadius).toBeDefined();
    expect(formaImagenCss("ticket").clipPath).toContain("polygon");
    for (const forma of FORMAS_IMAGEN) {
      const css = formaImagenCss(forma);
      const serial = JSON.stringify(css);
      expect(tieneHex(serial)).toBe(false);
    }
  });

  // forma.003 — enum cerrado: valor fuera del enum ⇒ rechazo (candado, I-A).
  it("forma fuera del enum ⇒ rechazo", () => {
    expect(
      imagenDestacadaProps.safeParse({ imagenUrl: "https://x.cl/a.jpg", alt: "f", forma: "estrella" }).success,
    ).toBe(false);
    expect(
      imagenDestacadaProps.safeParse({ imagenUrl: "https://x.cl/a.jpg", alt: "f", forma: "circulo" }).success,
    ).toBe(true);
  });
});
