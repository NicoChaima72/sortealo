import { describe, expect, it } from "vitest";

import {
  formatoCompacto,
  tiempoRestante,
} from "~/components/storefront/use-countdown";

/**
 * Tests del núcleo PURO del countdown del sorteo (plantilla-rica F04/D9). `tiempoRestante` recibe
 * `fechaFin` + `ahora` inyectados ⇒ se ejerce sin timers ni React: calcula el tiempo restante a una
 * fecha futura y se APAGA (`terminado: true`, todo 0) en una fecha pasada. `formatoCompacto` arma la
 * etiqueta del chip del header.
 */

const AHORA = new Date("2026-07-17T00:00:00.000Z");

describe("storefront/use-countdown — tiempoRestante (núcleo puro)", () => {
  // storefront.countdown.001 — fecha futura ⇒ descompone bien días/horas/minutos/segundos
  it("descompone el tiempo restante a una fecha futura", () => {
    const fin = new Date("2026-07-20T04:05:06.000Z"); // +3d 4h 5m 6s
    const t = tiempoRestante(fin, AHORA);
    expect(t).toEqual({
      dias: 3,
      horas: 4,
      minutos: 5,
      segundos: 6,
      terminado: false,
    });
  });

  // storefront.countdown.002 — fecha pasada ⇒ se apaga (terminado, todo 0)
  it("una fecha ya pasada se apaga: terminado true y todo 0", () => {
    const fin = new Date("2026-07-16T23:59:59.000Z"); // antes de AHORA
    const t = tiempoRestante(fin, AHORA);
    expect(t).toEqual({
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
      terminado: true,
    });
  });

  // storefront.countdown.003 — exactamente la fecha de cierre ⇒ terminado (≤ 0)
  it("en el instante exacto de cierre ya está terminado", () => {
    expect(tiempoRestante(AHORA, AHORA).terminado).toBe(true);
  });

  // storefront.countdown.004 — formato compacto según la magnitud restante
  it("formatoCompacto elige la unidad mayor + la siguiente (d/h, h/m, m/s)", () => {
    expect(
      formatoCompacto({ dias: 3, horas: 4, minutos: 5, segundos: 6, terminado: false }),
    ).toBe("3d 04h");
    expect(
      formatoCompacto({ dias: 0, horas: 12, minutos: 30, segundos: 0, terminado: false }),
    ).toBe("12h 30m");
    expect(
      formatoCompacto({ dias: 0, horas: 0, minutos: 45, segundos: 9, terminado: false }),
    ).toBe("45m 09s");
    expect(
      formatoCompacto({ dias: 0, horas: 0, minutos: 0, segundos: 0, terminado: true }),
    ).toBe("Cerrado");
  });
});
