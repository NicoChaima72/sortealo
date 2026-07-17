import { describe, expect, it } from "vitest";

import {
  SLUGS_RESERVADOS,
  esSlugDisponible,
  esSlugReservado,
} from "~/server/tenancy/slugTienda";

/**
 * Tests del helper de disponibilidad de slug del alta self-service (F08/D7). Compone
 * `esSlugValido` (reusado de parsearHost — la MISMA definición del subdominio, ADR-0007)
 * con una lista de reservados (`www`, `api`, `admin`…) que vive junto a él para no
 * desincronizarse. La unicidad la resuelve la DB (`@unique`), no este helper.
 */

describe("server/tenancy/slugTienda (reservados + disponibilidad, F08)", () => {
  // tenants.slug.001 — reservados de plataforma se marcan como reservados (case-insensitive)
  it("marca los slugs reservados de plataforma como reservados", () => {
    for (const reservado of ["www", "api", "admin", "app", "operador", "panel"]) {
      expect(esSlugReservado(reservado)).toBe(true);
    }
    // normaliza mayúsculas/espacios antes de comparar
    expect(esSlugReservado("ADMIN")).toBe(true);
    expect(esSlugReservado("  www ")).toBe(true);
    // un slug normal NO es reservado
    expect(esSlugReservado("autora")).toBe(false);
  });

  // tenants.slug.002 — disponible = válido (esSlugValido) Y no reservado
  it("un slug está disponible sii es un label DNS válido y no reservado", () => {
    expect(esSlugDisponible("autora")).toBe(true);
    expect(esSlugDisponible("mi-tienda-2026")).toBe(true);
    // inválido como label DNS ⇒ no disponible (guion al borde, mayúsculas, vacío, símbolos)
    expect(esSlugDisponible("-mala")).toBe(false);
    expect(esSlugDisponible("Mala")).toBe(false);
    expect(esSlugDisponible("")).toBe(false);
    expect(esSlugDisponible("con espacio")).toBe(false);
    // válido pero reservado ⇒ no disponible
    expect(esSlugDisponible("admin")).toBe(false);
    expect(esSlugDisponible("api")).toBe(false);
  });

  // tenants.slug.003 — la lista incluye al menos los reservados críticos de la plataforma
  it("la lista de reservados cubre los subdominios de plataforma", () => {
    for (const critico of ["www", "api", "admin", "operador"]) {
      expect(SLUGS_RESERVADOS.has(critico)).toBe(true);
    }
  });
});
