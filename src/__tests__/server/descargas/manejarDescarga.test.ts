import { describe, expect, it, vi } from "vitest";

import {
  type BuscarGrantPorToken,
  type GrantParaDescarga,
  manejarDescarga,
  type PresignarDescargaFn,
} from "~/server/descargas/manejarDescarga";

/**
 * Núcleo del endpoint público de descarga por token (F03/D5). El repo de grants y el presigner
 * se inyectan como fakes (sin DB ni R2). Verifican la POLÍTICA: gate de método, 302 con la URL
 * prefirmada, y —CRÍTICO— la respuesta 404 NEUTRAL IDÉNTICA ante token inexistente / expirado /
 * PDF pendiente (I3), la defensa de prefijo I9, y que el núcleo no loguea nada sensible (I4).
 */

const AHORA = new Date("2026-07-17T12:00:00Z");

function grant(over: Partial<GrantParaDescarga> = {}): GrantParaDescarga {
  return {
    tenantId: "tenantA",
    pdfPath: "tenantA/prod1.pdf",
    titulo: "Cómo enriquecer a tu idol",
    expiresAt: new Date("2026-08-01T00:00:00Z"), // futuro respecto de AHORA
    ...over,
  };
}

function reqGet(token?: string): { method: string; query: Record<string, string> } {
  return { method: "GET", query: token === undefined ? {} : { token } };
}

const presignOk: PresignarDescargaFn = vi
  .fn<PresignarDescargaFn>()
  .mockResolvedValue("https://r2.example/signed-get-url");

describe("descargas/manejarDescarga — núcleo del endpoint de descarga", () => {
  // descargas.302 — grant vigente + PDF subido ⇒ 302 a la URL prefirmada
  it("con un grant vigente y PDF subido devuelve 302 con Location = URL prefirmada", async () => {
    const presignarDescarga = vi
      .fn<PresignarDescargaFn>()
      .mockResolvedValue("https://r2.example/firmada-10min");
    const buscarGrant = vi
      .fn<BuscarGrantPorToken>()
      .mockResolvedValue(grant());

    const res = await manejarDescarga({
      req: reqGet("tok-valido"),
      buscarGrant,
      presignarDescarga,
      ahora: AHORA,
    });

    expect(res.status).toBe(302);
    expect(res.headers?.Location).toBe("https://r2.example/firmada-10min");
    expect(res.headers?.["Cache-Control"]).toContain("no-store");
    // presigna la key del grant, con el filename derivado del título (saneado, S8)
    expect(presignarDescarga).toHaveBeenCalledWith({
      key: "tenantA/prod1.pdf",
      nombreArchivo: "Cómo enriquecer a tu idol.pdf",
    });
  });

  // descargas.404.neutral — token inexistente, expirado y PDF pendiente ⇒ MISMA respuesta 404
  it("token inexistente, grant expirado y PDF pendiente devuelven la MISMA respuesta 404 neutral", async () => {
    const inexistente = await manejarDescarga({
      req: reqGet("no-existe"),
      buscarGrant: vi.fn<BuscarGrantPorToken>().mockResolvedValue(null),
      presignarDescarga: presignOk,
      ahora: AHORA,
    });
    const expirado = await manejarDescarga({
      req: reqGet("tok-expirado"),
      buscarGrant: vi
        .fn<BuscarGrantPorToken>()
        .mockResolvedValue(grant({ expiresAt: new Date("2026-07-01T00:00:00Z") })),
      presignarDescarga: presignOk,
      ahora: AHORA,
    });
    const pendiente = await manejarDescarga({
      req: reqGet("tok-sin-pdf"),
      buscarGrant: vi
        .fn<BuscarGrantPorToken>()
        .mockResolvedValue(grant({ pdfPath: null })),
      presignarDescarga: presignOk,
      ahora: AHORA,
    });

    // Los tres son EXACTAMENTE iguales (status + body): indistinguibles (I3).
    expect(inexistente).toEqual({ status: 404, body: "No encontrado." });
    expect(expirado).toEqual(inexistente);
    expect(pendiente).toEqual(inexistente);
  });

  // descargas.405 — método ≠ GET ⇒ 405 sin efecto
  it("responde 405 sin presignar ni buscar el grant si el método no es GET", async () => {
    const buscarGrant = vi.fn<BuscarGrantPorToken>().mockResolvedValue(grant());
    const presignarDescarga = vi
      .fn<PresignarDescargaFn>()
      .mockResolvedValue("no-deberia");

    const res = await manejarDescarga({
      req: { method: "POST", query: { token: "t" } },
      buscarGrant,
      presignarDescarga,
      ahora: AHORA,
    });

    expect(res.status).toBe(405);
    expect(buscarGrant).not.toHaveBeenCalled();
    expect(presignarDescarga).not.toHaveBeenCalled();
  });

  // descargas.i9 — pdfPath fuera del prefijo del tenant ⇒ 404 neutral, jamás presigna
  it("defensa I9: un grant cuyo pdfPath no empieza con `<tenantId>/` ⇒ 404 neutral, sin presignar", async () => {
    const presignarDescarga = vi
      .fn<PresignarDescargaFn>()
      .mockResolvedValue("no-deberia");
    // pdfPath apunta a OTRO tenant: jamás debe presignarse (aunque la FK lo impida).
    const buscarGrant = vi
      .fn<BuscarGrantPorToken>()
      .mockResolvedValue(grant({ tenantId: "tenantA", pdfPath: "tenantB/prod9.pdf" }));

    const res = await manejarDescarga({
      req: reqGet("tok-cruzado"),
      buscarGrant,
      presignarDescarga,
      ahora: AHORA,
    });

    expect(res).toEqual({ status: 404, body: "No encontrado." });
    expect(presignarDescarga).not.toHaveBeenCalled();
  });

  // descargas.no-log — el núcleo no loguea token, path ni email en ningún camino
  it("no loguea nada (ni token ni path) en el camino feliz ni en el 404", async () => {
    const spies = [
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "info").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
      vi.spyOn(console, "error").mockImplementation(() => undefined),
    ];

    await manejarDescarga({
      req: reqGet("tok-secreto-123"),
      buscarGrant: vi.fn<BuscarGrantPorToken>().mockResolvedValue(grant()),
      presignarDescarga: presignOk,
      ahora: AHORA,
    });
    await manejarDescarga({
      req: reqGet("otro-token"),
      buscarGrant: vi.fn<BuscarGrantPorToken>().mockResolvedValue(null),
      presignarDescarga: presignOk,
      ahora: AHORA,
    });

    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });
});
