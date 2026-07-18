import { describe, expect, it } from "vitest";

import { validarCallbackUrl } from "~/server/sesion/callbackUrl";
import { resolverDominioCookieSesion } from "~/server/sesion/dominioCookie";

/**
 * Tests de la sesión al wildcard (F08/D11, ADR-0019): el dominio de cookie sale del apex, y el
 * `callbackUrl` se valida contra `*.<apex>` (anti open-redirect). Puros, sin DB ni NextAuth.
 */

const apex = (dominioRaiz: string) => ({ dominioRaiz });

describe("sesion/resolverDominioCookieSesion", () => {
  // page.wildcard.cookie.001 — apex real ⇒ `.<apex>`; localhost ⇒ undefined (host-only)
  it("mapea el apex real a `.<apex>` y localhost a undefined", () => {
    expect(resolverDominioCookieSesion(apex("sorteatelo.cl"))).toBe(".sorteatelo.cl");
    expect(resolverDominioCookieSesion(apex("lvh.me"))).toBe(".lvh.me");
    expect(resolverDominioCookieSesion(apex("localhost"))).toBeUndefined();
  });
});

describe("sesion/validarCallbackUrl (anti open-redirect)", () => {
  const config = apex("sorteatelo.cl");
  const baseUrl = "https://sorteatelo.cl";

  // page.wildcard.cb.001 — relativa ⇒ se ancla al baseUrl
  it("una callbackUrl relativa se ancla al baseUrl", () => {
    expect(validarCallbackUrl({ url: "/admin", baseUrl, config })).toBe("https://sorteatelo.cl/admin");
  });

  // page.wildcard.cb.002 — apex o subdominio de la plataforma ⇒ se permite
  it("permite el apex y los subdominios de la plataforma", () => {
    expect(validarCallbackUrl({ url: "https://sorteatelo.cl/x", baseUrl, config })).toBe("https://sorteatelo.cl/x");
    expect(validarCallbackUrl({ url: "https://autora.sorteatelo.cl/", baseUrl, config })).toBe("https://autora.sorteatelo.cl/");
    expect(validarCallbackUrl({ url: "https://www.sorteatelo.cl/", baseUrl, config })).toBe("https://www.sorteatelo.cl/");
  });

  // page.wildcard.cb.003 — host ajeno / protocol-relative / basura ⇒ cae al baseUrl (fail-closed)
  it("rechaza host ajeno, protocol-relative y URLs corruptas (cae al baseUrl)", () => {
    expect(validarCallbackUrl({ url: "https://evil.example/phish", baseUrl, config })).toBe(baseUrl);
    expect(validarCallbackUrl({ url: "https://sorteatelo.cl.evil.com/", baseUrl, config })).toBe(baseUrl);
    expect(validarCallbackUrl({ url: "//evil.example", baseUrl, config })).toBe(baseUrl);
    expect(validarCallbackUrl({ url: "not a url", baseUrl, config })).toBe(baseUrl);
    // un subdominio anidado no es un slug válido (parsearHost lo rechaza)
    expect(validarCallbackUrl({ url: "https://a.b.sorteatelo.cl/", baseUrl, config })).toBe(baseUrl);
  });
});
