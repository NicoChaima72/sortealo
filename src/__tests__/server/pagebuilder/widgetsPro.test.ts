import { describe, expect, it } from "vitest";

import { documentoInicial, conAvisoBarra } from "~/lib/pagebuilder/factory";
import { OverlayNodeSchema, PageDocumentSchema } from "~/lib/pagebuilder/schema";
import {
  avisoBarraProps,
  contadorTicketsProps,
  urgenciaCountdownProps,
  whatsappFlotanteProps,
} from "~/lib/pagebuilder/widgets";

/**
 * Tests de los widgets PRO de conversión (F10, ADR-0016/0018): schemas de los 4 nuevos widgets
 * (2 secciones + 2 overlays) + la migración idempotente del `avisoTexto` a overlay `aviso_barra`.
 */

describe("pagebuilder/widgets pro (F10) — schemas", () => {
  // page.pro.001 — contador_tickets: metaTickets entero positivo; mostrarPorcentaje default false
  it("contador_tickets valida metaTickets (entero positivo) y default de mostrarPorcentaje", () => {
    expect(contadorTicketsProps.parse({}).mostrarPorcentaje).toBe(false);
    expect(contadorTicketsProps.safeParse({ metaTickets: 500 }).success).toBe(true);
    expect(contadorTicketsProps.safeParse({ metaTickets: -1 }).success).toBe(false);
    expect(contadorTicketsProps.safeParse({ metaTickets: 1.5 }).success).toBe(false);
  });

  // page.pro.002 — urgencia_countdown: intensidad enum cerrado
  it("urgencia_countdown valida intensidad (suave|fuerte) y default", () => {
    expect(urgenciaCountdownProps.parse({}).intensidad).toBe("suave");
    expect(urgenciaCountdownProps.safeParse({ intensidad: "fuerte" }).success).toBe(true);
    expect(urgenciaCountdownProps.safeParse({ intensidad: "brutal" }).success).toBe(false);
  });

  // page.pro.003 — whatsapp_flotante: numero E.164 por regex; posicion enum
  it("whatsapp_flotante valida el numero E.164 y la posicion", () => {
    expect(whatsappFlotanteProps.safeParse({ numero: "+56912345678" }).success).toBe(true);
    expect(whatsappFlotanteProps.safeParse({ numero: "12345" }).success).toBe(false); // sin +
    expect(whatsappFlotanteProps.safeParse({ numero: "+abc" }).success).toBe(false);
    expect(whatsappFlotanteProps.parse({}).posicion).toBe("br");
    expect(whatsappFlotanteProps.safeParse({ posicion: "arriba" }).success).toBe(false);
  });

  // page.pro.004 — aviso_barra: texto REQUERIDO + max 120; texto plano (no HTML — .strict lo garantiza)
  it("aviso_barra exige texto (≤120) y rechaza campos extra (sin HTML)", () => {
    expect(avisoBarraProps.safeParse({}).success).toBe(false); // texto requerido
    expect(avisoBarraProps.safeParse({ texto: "Envío gratis hoy" }).success).toBe(true);
    expect(avisoBarraProps.safeParse({ texto: "x".repeat(121) }).success).toBe(false);
    expect(avisoBarraProps.safeParse({ texto: "ok", html: "<b>x</b>" }).success).toBe(false);
  });

  // page.pro.005 — overlays[] acepta aviso_barra y whatsapp_flotante; rechaza secciones
  it("la union de overlays acepta los overlays y rechaza secciones", () => {
    expect(OverlayNodeSchema.safeParse({ id: "o1", tipo: "aviso_barra", v: 1, props: { texto: "hola" } }).success).toBe(true);
    expect(OverlayNodeSchema.safeParse({ id: "o2", tipo: "whatsapp_flotante", v: 1, props: { numero: "+56912345678" } }).success).toBe(true);
    expect(OverlayNodeSchema.safeParse({ id: "o3", tipo: "hero", v: 1, props: {} }).success).toBe(false);
  });
});

describe("pagebuilder/conAvisoBarra + factory (migración de avisoTexto)", () => {
  const semilla = { heroTitulo: null, heroSubtitulo: null, heroImageUrl: null };

  // page.pro.006 — la factory emite aviso_barra si hay avisoTexto; no lo emite si no hay
  it("documentoInicial emite overlay aviso_barra desde avisoTexto (y ninguno sin él)", () => {
    const conAviso = documentoInicial({ ...semilla, avisoTexto: "Recibes el PDF por correo" });
    expect(conAviso.overlays.map((o) => o.tipo)).toEqual(["aviso_barra"]);
    const aviso = conAviso.overlays[0]!;
    if (aviso.tipo === "aviso_barra") expect(aviso.props.texto).toBe("Recibes el PDF por correo");

    const sinAviso = documentoInicial({ ...semilla, avisoTexto: null });
    expect(sinAviso.overlays).toEqual([]);
  });

  // page.pro.007 — conAvisoBarra es IDEMPOTENTE (no duplica) y no-op sin texto
  it("conAvisoBarra es idempotente (no duplica) y no-op sin texto", () => {
    const base = documentoInicial({ ...semilla, avisoTexto: null });
    const unaVez = conAvisoBarra(base, "Aviso");
    expect(unaVez.overlays).toHaveLength(1);
    const dosVeces = conAvisoBarra(unaVez, "Aviso"); // 2ª aplicación
    expect(dosVeces.overlays).toHaveLength(1); // NO duplica
    // Sin texto ⇒ documento intacto.
    expect(conAvisoBarra(base, null).overlays).toEqual([]);
    // La salida siempre parsea.
    expect(PageDocumentSchema.safeParse(dosVeces).success).toBe(true);
  });
});
