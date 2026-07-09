import { describe, expect, it } from "vitest";

// Smoke test: confirma que la suite de Vitest corre (el gate `check:test` necesita
// al menos un test, y `vitest run` falla con "no test files" si la suite está vacía).
// Se reemplaza/acompaña con tests de integración reales cuando arranque el primer feature.
describe("smoke", () => {
  it("el harness de tests corre", () => {
    expect(1 + 1).toBe(2);
  });
});
