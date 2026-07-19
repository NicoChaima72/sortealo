import { describe, expect, it } from "vitest";

import { devTiendaAplica } from "~/config";

/**
 * Guard PURO del override de subdominio de dev (F09d). Lo crítico: el mecanismo es INERTE fuera de
 * development. Aunque el switch `enabled` quede en `true` (el usuario lo deja prendido para usarlo), en
 * PRODUCCIÓN el apex pelado JAMÁS se convierte en una Tienda ⇒ manda el ruteo por subdominio real
 * (ADR-0007). Esta es la garantía de que el override no puede filtrarse a prod aunque quede prendido.
 */
describe("config/devTiendaAplica (guard del override de subdominio dev)", () => {
  // dev.tienda.001 — camino feliz de dev: prendido + development ⇒ aplica (apex pelado = Tienda)
  it("enabled + development ⇒ true (override activo)", () => {
    expect(devTiendaAplica({ enabled: true, nodeEnv: "development" })).toBe(true);
  });

  // dev.tienda.002 — LA garantía: prendido en PRODUCCIÓN ⇒ NO aplica (apex sigue siendo plataforma)
  it("enabled + production ⇒ false (inerte en prod ⇒ ruteo real por subdominio)", () => {
    expect(devTiendaAplica({ enabled: true, nodeEnv: "production" })).toBe(false);
  });

  // dev.tienda.003 — prendido en test ⇒ tampoco aplica (solo development)
  it("enabled + test ⇒ false (solo development lo activa)", () => {
    expect(devTiendaAplica({ enabled: true, nodeEnv: "test" })).toBe(false);
  });

  // dev.tienda.004 — apagado ⇒ nunca aplica, ni siquiera en development
  it("disabled ⇒ false en cualquier entorno", () => {
    expect(devTiendaAplica({ enabled: false, nodeEnv: "development" })).toBe(false);
    expect(devTiendaAplica({ enabled: false, nodeEnv: "production" })).toBe(false);
    expect(devTiendaAplica({ enabled: false, nodeEnv: undefined })).toBe(false);
  });
});
