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

  // page.pro.004 — aviso_barra v2 (builder-tanda-1 F04; cap 10 en F13): mensajes REQUERIDOS (1–10, ≤120); texto plano
  // (no HTML — .strict lo garantiza); el `texto` de v1 ya NO es campo (v-bump).
  it("aviso_barra exige mensajes (1–10, ≤120) y rechaza campos extra (sin HTML)", () => {
    expect(avisoBarraProps.safeParse({}).success).toBe(false); // mensajes requerido
    expect(avisoBarraProps.safeParse({ mensajes: [] }).success).toBe(false); // min 1
    expect(avisoBarraProps.safeParse({ mensajes: ["Envío gratis hoy"] }).success).toBe(true);
    expect(avisoBarraProps.safeParse({ mensajes: ["a", "b", "c", "d", "e", "f"] }).success).toBe(true); // 6 ⇒ OK (cap subió a 10 en F13)
    expect(avisoBarraProps.safeParse({ mensajes: Array.from({ length: 11 }, (_, i) => `m${i}`) }).success).toBe(false); // max 10
    expect(avisoBarraProps.safeParse({ mensajes: ["x".repeat(121)] }).success).toBe(false);
    expect(avisoBarraProps.safeParse({ mensajes: ["ok"], html: "<b>x</b>" }).success).toBe(false);
    expect(avisoBarraProps.safeParse({ texto: "hola" }).success).toBe(false); // el shape v1 ya no parsea directo
  });

  // page.pro.005 — overlays[] acepta aviso_barra (v2) y whatsapp_flotante; rechaza secciones
  it("la union de overlays acepta los overlays y rechaza secciones", () => {
    expect(OverlayNodeSchema.safeParse({ id: "o1", tipo: "aviso_barra", v: 2, props: { mensajes: ["hola"] } }).success).toBe(true);
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
    if (aviso.tipo === "aviso_barra") expect(aviso.props.mensajes).toEqual(["Recibes el PDF por correo"]);

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
