import { describe, expect, it } from "vitest";

import { resolverModoPreview } from "~/server/storefront/previewToken";

/**
 * Tests de `resolverModoPreview` (F05, ADR-0016/I5). El Borrador solo se sirve con token válido;
 * cualquier otra cosa es 404 neutral (no delata que hay un borrador).
 */
describe("storefront/resolverModoPreview", () => {
  // page.preview.001 — sin param preview ⇒ publicado
  it("sin param `preview` ⇒ publicado", () => {
    expect(resolverModoPreview({ preview: undefined, token: "secreto" })).toBe("publicado");
    expect(resolverModoPreview({ preview: undefined, token: undefined })).toBe("publicado");
  });

  // page.preview.002 — token correcto ⇒ borrador
  it("con token correcto ⇒ borrador", () => {
    expect(resolverModoPreview({ preview: "secreto", token: "secreto" })).toBe("borrador");
    // Query param como array (Next puede entregarlo así): toma el primero.
    expect(resolverModoPreview({ preview: ["secreto"], token: "secreto" })).toBe("borrador");
  });

  // page.preview.003 — token incorrecto / ausente / vacío ⇒ no-encontrado (404 neutral)
  it("token incorrecto, sin token configurado o vacío ⇒ no-encontrado", () => {
    expect(resolverModoPreview({ preview: "malo", token: "secreto" })).toBe("no-encontrado");
    expect(resolverModoPreview({ preview: "loquesea", token: undefined })).toBe("no-encontrado");
    expect(resolverModoPreview({ preview: "loquesea", token: "" })).toBe("no-encontrado");
    expect(resolverModoPreview({ preview: "", token: "secreto" })).toBe("no-encontrado");
  });
});
