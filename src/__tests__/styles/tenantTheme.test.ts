import { describe, expect, it } from "vitest";

import {
  generarEscalaColor,
  gradienteTematico,
  overrideDesdeBranding,
  type TenantBranding,
} from "~/styles/tenantTheme";

/**
 * Tests del theming per-tenant (F01/D2, ADR-0011). El override es DATO derivado del branding
 * del `Tenant`, no código: mismo branding ⇒ mismo theme, sin divergencia SSR/cliente (I3).
 * Cubre las Validaciones F01: hex ⇒ tupla de 10 tonos + `primaryColor`; null ⇒ sin override;
 * función pura y determinista.
 */

const branding = (colorPrimario: string | null): TenantBranding => ({
  nombre: "Tienda X",
  slug: "x",
  descripcion: null,
  logoUrl: null,
  colorPrimario,
  heroTitulo: null,
  heroSubtitulo: null,
  heroImageUrl: null,
  avisoTexto: null,
  instagramUrl: null,
  tiktokUrl: null,
  whatsappUrl: null,
  contactoEmail: null,
});

const ES_HEX = /^#[0-9a-f]{6}$/;

describe("styles/tenantTheme — generarEscalaColor", () => {
  // storefront.theming.escala.001 — 10 tonos hex válidos, base en el índice 6
  it("expande un hex a una tupla de 10 tonos hex, con la base en el índice 6", () => {
    const escala = generarEscalaColor("#4f46e5");
    expect(escala).toHaveLength(10);
    for (const tono of escala) expect(tono).toMatch(ES_HEX);
    expect(escala[6]).toBe("#4f46e5"); // el shade por defecto de Mantine (light) apunta a la base
  });

  // storefront.theming.escala.002 — la rampa va de claro (0) a oscuro (9), monótona en luminancia
  it("produce una rampa monótona: los índices bajos más claros que los altos", () => {
    const escala = generarEscalaColor("#4f46e5");
    const luminancia = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255);
    };
    for (let i = 1; i < escala.length; i++) {
      expect(luminancia(escala[i]!)).toBeLessThan(luminancia(escala[i - 1]!));
    }
  });

  // storefront.theming.escala.003 — acepta hex de 3 chars (#abc)
  it("acepta la forma corta de 3 caracteres (#abc)", () => {
    const escala = generarEscalaColor("#abc");
    expect(escala).toHaveLength(10);
    expect(escala[6]).toBe("#aabbcc");
  });
});

describe("styles/tenantTheme — overrideDesdeBranding", () => {
  // storefront.theming.override.001 — hex ⇒ override con primaryColor apuntando a tupla de 10
  it("con colorPrimario hex produce un override con primaryColor sobre una tupla de 10 tonos del hex", () => {
    const override = overrideDesdeBranding(branding("#4f46e5"));
    expect(override.primaryColor).toBe("marca");
    expect(override.colors?.marca).toHaveLength(10);
    expect(override.colors?.marca?.[6]).toBe("#4f46e5");
  });

  // storefront.theming.override.002 — null ⇒ sin override (theme base intacto)
  it("con colorPrimario null no produce override (theme base intacto)", () => {
    const override = overrideDesdeBranding(branding(null));
    expect(override.primaryColor).toBeUndefined();
    expect(override.colors).toBeUndefined();
  });

  // storefront.theming.override.003 — hex inválido ⇒ sin override (no crashea con dato malo)
  it("con colorPrimario inválido degrada a sin override (no rompe el storefront)", () => {
    const override = overrideDesdeBranding(branding("no-es-hex"));
    expect(override.primaryColor).toBeUndefined();
    expect(override.colors).toBeUndefined();
  });

  // storefront.theming.override.004 — puro y determinista (mismo branding ⇒ mismo override)
  it("es puro y determinista: mismo branding ⇒ override deep-equal (sirve SSR + cliente)", () => {
    const a = overrideDesdeBranding(branding("#4f46e5"));
    const b = overrideDesdeBranding(branding("#4f46e5"));
    expect(a).toEqual(b);
  });
});

describe("styles/tenantTheme — gradienteTematico (degradación elegante, design.md §5.2)", () => {
  const ES_GRADIENTE = /^linear-gradient\(/;

  // storefront.gradiente.001 — con color de marca deriva de la escala `marca-N` (cero hex inline)
  it("con colorPrimario hex usa las CSS vars de la escala `marca`, sin ningún hex inline", () => {
    const g = gradienteTematico("#4f46e5");
    expect(g).toMatch(ES_GRADIENTE);
    expect(g).toContain("var(--mantine-color-marca-");
    // Cero hex inline (design.md §9): el gradiente NO incrusta el color del tenant como literal.
    expect(g).not.toContain("#");
  });

  // storefront.gradiente.002 — sin color de marca cae al primario base (siempre válido, sin imagen)
  it("con colorPrimario null degrada al primario base de plataforma (produce salida válida)", () => {
    const g = gradienteTematico(null);
    expect(g).toMatch(ES_GRADIENTE);
    expect(g).toContain("var(--mantine-primary-color-");
    expect(g).not.toContain("#");
  });

  // storefront.gradiente.003 — hex inválido degrada como null (no rompe con dato malo)
  it("con colorPrimario inválido degrada igual que null (no crashea)", () => {
    expect(gradienteTematico("no-es-hex")).toBe(gradienteTematico(null));
  });

  // storefront.gradiente.004 — determinista (mismo input ⇒ mismo string, sirve SSR + cliente)
  it("es determinista: mismo colorPrimario ⇒ mismo string", () => {
    expect(gradienteTematico("#4f46e5")).toBe(gradienteTematico("#4f46e5"));
  });
});
