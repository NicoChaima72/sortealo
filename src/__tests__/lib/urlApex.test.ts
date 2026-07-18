import { describe, expect, it } from "vitest";

import { apexDesdeHost, construirUrlApex } from "~/lib/urlApex";

/**
 * Tests de los helpers de URL al apex (F09b, ADR-0019/D6): derivar el apex del host de un subdominio y
 * construir la URL absoluta al login/panel del apex con `callbackUrl` encodeado.
 */
describe("lib/urlApex — apexDesdeHost", () => {
  // page.apex.001 — quita el label del slug del host
  it("deriva el apex quitando el label del slug", () => {
    expect(apexDesdeHost("autora.sorteatelo.cl", "autora")).toBe("sorteatelo.cl");
    expect(apexDesdeHost("autora.lvh.me", "autora")).toBe("lvh.me");
    expect(apexDesdeHost("autora.localhost", "autora")).toBe("localhost");
  });

  // page.apex.002 — host que no empieza con el slug ⇒ devuelve el host tal cual (defensivo)
  it("si el host no empieza con el slug, devuelve el host tal cual", () => {
    expect(apexDesdeHost("sorteatelo.cl", "autora")).toBe("sorteatelo.cl");
  });
});

describe("lib/urlApex — construirUrlApex", () => {
  // page.apex.003 — arma la URL con puerto y callbackUrl encodeado
  it("arma la URL del login con puerto y callbackUrl encodeado", () => {
    expect(
      construirUrlApex({
        protocol: "http:",
        apex: "lvh.me",
        puerto: "3001",
        path: "/login",
        callbackUrl: "http://autora.lvh.me:3001/producto/123",
      }),
    ).toBe(
      "http://lvh.me:3001/login?callbackUrl=http%3A%2F%2Fautora.lvh.me%3A3001%2Fproducto%2F123",
    );
  });

  // page.apex.004 — sin puerto ni callbackUrl (prod, panel)
  it("arma la URL del panel sin puerto ni callbackUrl (prod)", () => {
    expect(
      construirUrlApex({ protocol: "https:", apex: "sorteatelo.cl", path: "/admin" }),
    ).toBe("https://sorteatelo.cl/admin");
  });
});
