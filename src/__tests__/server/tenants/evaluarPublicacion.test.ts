import { describe, expect, it } from "vitest";

import {
  type DatosGate,
  evaluarPublicacion,
  mensajeRequisitoFaltante,
} from "~/server/domain/tenants/_publicacion";

/**
 * Tests del núcleo PURO del gate de publicación (F08/F03, D4/D5). `evaluarPublicacion` es la
 * ÚNICA fuente de verdad del checklist Y del gate: computa cada requisito (ToS + Flow + ≥1
 * producto publicable + bases si hay sorteo activo, ADR-0008) y `puedePublicar`. Se testea
 * puro (sin DB) para cubrir la matriz completa; getEstadoPublicacion y publicarTienda lo reusan.
 */

const base: DatosGate = {
  estado: "CONFIGURACION",
  tosVersion: "2026-07-17",
  tosVersionVigente: "2026-07-17",
  flowConfigurada: true,
  tieneProductoPublicable: true,
  hayRaffleActivo: false,
  basesSorteo: null,
};

describe("domain/tenants/evaluarPublicacion (núcleo puro del gate)", () => {
  // tenants.publicacion.eval.001 — todos los requisitos presentes ⇒ puedePublicar
  it("con todos los requisitos cumplidos, puedePublicar = true", () => {
    const r = evaluarPublicacion(base);
    expect(r.requisitos.tos.cumplido).toBe(true);
    expect(r.requisitos.flow.cumplido).toBe(true);
    expect(r.requisitos.producto.cumplido).toBe(true);
    expect(r.requisitos.bases.aplica).toBe(false); // sin sorteo activo, no aplica
    expect(r.requisitos.bases.cumplido).toBe(true); // no aplica ⇒ no bloquea
    expect(r.puedePublicar).toBe(true);
  });

  // tenants.publicacion.eval.002 — ToS: pendiente si null o versión distinta; cumplido si coincide
  it("el requisito ToS solo se cumple con la versión vigente exacta", () => {
    expect(evaluarPublicacion({ ...base, tosVersion: null }).requisitos.tos.cumplido).toBe(false);
    expect(
      evaluarPublicacion({ ...base, tosVersion: "2020-01-01" }).requisitos.tos.cumplido,
    ).toBe(false);
    expect(evaluarPublicacion(base).requisitos.tos.cumplido).toBe(true);
    // ToS pendiente ⇒ no puede publicar
    expect(evaluarPublicacion({ ...base, tosVersion: null }).puedePublicar).toBe(false);
  });

  // tenants.publicacion.eval.003 — Flow no configurada ⇒ no cumple ⇒ no puede publicar
  it("sin FlowCredential configurada no puede publicar", () => {
    const r = evaluarPublicacion({ ...base, flowConfigurada: false });
    expect(r.requisitos.flow.cumplido).toBe(false);
    expect(r.puedePublicar).toBe(false);
  });

  // tenants.publicacion.eval.004 — sin producto publicable (activo + pdf) ⇒ no puede publicar
  it("sin ≥1 producto publicable no puede publicar", () => {
    const r = evaluarPublicacion({ ...base, tieneProductoPublicable: false });
    expect(r.requisitos.producto.cumplido).toBe(false);
    expect(r.puedePublicar).toBe(false);
  });

  // tenants.publicacion.eval.005 — bases: aplica SOLO con sorteo activo; vacías ⇒ bloquea (ADR-0008)
  it("con sorteo activo, las bases vacías bloquean; con bases cargadas, publica", () => {
    const conSorteoSinBases = evaluarPublicacion({
      ...base,
      hayRaffleActivo: true,
      basesSorteo: "   ", // solo espacios ⇒ vacío
    });
    expect(conSorteoSinBases.requisitos.bases.aplica).toBe(true);
    expect(conSorteoSinBases.requisitos.bases.cumplido).toBe(false);
    expect(conSorteoSinBases.puedePublicar).toBe(false);

    const conSorteoConBases = evaluarPublicacion({
      ...base,
      hayRaffleActivo: true,
      basesSorteo: "Bases del sorteo: participan las compras pagadas.",
    });
    expect(conSorteoConBases.requisitos.bases.cumplido).toBe(true);
    expect(conSorteoConBases.puedePublicar).toBe(true);
  });

  // tenants.publicacion.eval.006 — mensaje del requisito faltante nombra el PRIMER incumplido
  it("mensajeRequisitoFaltante describe el primer requisito no cumplido", () => {
    const sinTos = evaluarPublicacion({ ...base, tosVersion: null });
    expect(mensajeRequisitoFaltante(sinTos.requisitos)).toMatch(/Términos/i);
    const sinFlow = evaluarPublicacion({ ...base, flowConfigurada: false });
    expect(mensajeRequisitoFaltante(sinFlow.requisitos)).toMatch(/Flow|pago/i);
    // todo cumplido ⇒ null (no hay faltante)
    expect(mensajeRequisitoFaltante(evaluarPublicacion(base).requisitos)).toBeNull();
  });
});
