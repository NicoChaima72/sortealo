import { describe, expect, it } from "vitest";

import { destinoReordenamiento } from "~/components/editor/panel-secciones";

/**
 * Tests del cálculo de posición del reordenamiento por arrastre (builder-tanda-1 F11/D15). PURO: dado
 * el índice origen (arrastrado) y el índice destino (donde se suelta), devuelve el `aPosicion` del
 * `move_section` — o `null` si es no-op / inválido. `aPosicion = hasta` es correcto en AMBAS direcciones
 * por la semántica quitar-luego-insertar de `move_section` (cubierta en `mutaciones.test.ts`).
 */

describe("panel-secciones — destinoReordenamiento (F11/D15)", () => {
  // dnd.pos.001 — soltar sobre sí mismo ⇒ null (no-op, no emite mutación)
  it("soltar sobre la misma posición ⇒ null (no-op)", () => {
    expect(destinoReordenamiento(2, 2, 5)).toBeNull();
  });

  // dnd.pos.002 — mover hacia abajo (1→4) ⇒ aPosicion 4; hacia arriba (4→1) ⇒ aPosicion 1
  it("devuelve el índice destino en ambas direcciones", () => {
    expect(destinoReordenamiento(1, 4, 5)).toBe(4); // de la posición 1 a la 4 (E2E)
    expect(destinoReordenamiento(4, 1, 5)).toBe(1);
    expect(destinoReordenamiento(0, 2, 5)).toBe(2);
    expect(destinoReordenamiento(3, 0, 5)).toBe(0);
  });

  // dnd.pos.003 — índices fuera de rango ⇒ null (guardia)
  it("índices fuera de rango ⇒ null", () => {
    expect(destinoReordenamiento(-1, 2, 5)).toBeNull();
    expect(destinoReordenamiento(1, 5, 5)).toBeNull(); // hasta === total ⇒ fuera
    expect(destinoReordenamiento(1, -1, 5)).toBeNull();
    expect(destinoReordenamiento(5, 1, 5)).toBeNull();
  });
});
