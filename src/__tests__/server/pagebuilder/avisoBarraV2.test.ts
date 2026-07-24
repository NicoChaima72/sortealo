import { describe, expect, it } from "vitest";

import {
  leerDocumentoParaRender,
  migrarDocumento,
  parsearDocumento,
} from "~/lib/pagebuilder/migrate";
import { avisoBarraProps, MODOS_AVISO_BARRA } from "~/lib/pagebuilder/widgets";

/**
 * Tests de la cinta `aviso_barra` v2 (builder-tanda-1 F04/D7): v-bump v1→v2 con migrate-on-read
 * `texto → mensajes:[texto]` LOSSLESS (I-T3), schema estricto (mensajes 1–5 / modo / esquema enum),
 * y defaults que reproducen el look v1. La migración de OVERLAYS (antes migrarDocumento solo tocaba
 * secciones) queda cubierta acá.
 */

const docConAvisoV1 = (props: Record<string, unknown>) => ({
  schemaVersion: 1,
  root: { props: {} },
  secciones: [],
  overlays: [{ id: "overlay-aviso", tipo: "aviso_barra", v: 1, props }],
});

describe("aviso_barra v2 — migrate-on-read v1→v2 (I-T3, lossless)", () => {
  // aviso.migrate.001 — un overlay v1 {texto} se migra a v2 {mensajes:[texto]} y parsea estricto.
  it("migra texto→mensajes:[texto] y el doc parsea estricto conservando el mensaje", () => {
    const raw = docConAvisoV1({ texto: "Envío gratis hoy", descartable: true });
    const migrado = migrarDocumento(raw) as typeof raw;
    const ov = migrado.overlays[0]!;
    expect(ov.v).toBe(2);
    expect((ov.props as Record<string, unknown>).mensajes).toEqual(["Envío gratis hoy"]);
    expect("texto" in (ov.props as Record<string, unknown>)).toBe(false);
    // parsea estricto (para editar) y los defaults reproducen el look v1
    const doc = parsearDocumento(raw);
    const aviso = doc.overlays[0]!;
    if (aviso.tipo === "aviso_barra") {
      expect(aviso.props.mensajes).toEqual(["Envío gratis hoy"]);
      expect(aviso.props.modo).toBe("estatico"); // = look v1
      expect(aviso.props.esquema).toBe("tema"); // transparente = look v1
      expect(aviso.props.mostrarCountdown).toBe(false);
      expect(aviso.props.descartable).toBe(true); // se conserva
    }
  });

  // aviso.migrate.002 — la migración es PURA (no muta la entrada) e idempotente sobre un doc ya v2.
  it("no muta la entrada y es idempotente sobre un overlay ya v2", () => {
    const raw = docConAvisoV1({ texto: "Hola" });
    const copia = structuredClone(raw);
    migrarDocumento(raw);
    expect(raw).toEqual(copia); // puro
    // ya v2 ⇒ intacto
    const yaV2 = {
      ...raw,
      overlays: [{ id: "o", tipo: "aviso_barra", v: 2, props: { mensajes: ["Hola"] } }],
    };
    const out = migrarDocumento(yaV2) as typeof yaV2;
    expect(out.overlays[0]!.v).toBe(2);
    expect((out.overlays[0]!.props as Record<string, unknown>).mensajes).toEqual(["Hola"]);
  });

  // aviso.migrate.003 — leerDocumentoParaRender (tolerante) NO descarta un overlay v1: lo migra antes
  // de parsear (regresión: migrarDocumento antes ignoraba overlays ⇒ el v1 caía al parse crudo y se
  // descartaba en silencio, la barra desaparecía del render público tras el deploy).
  it("el render tolerante migra el overlay v1 en vez de descartarlo", () => {
    const raw = docConAvisoV1({ texto: "Recibes el PDF por correo" });
    const doc = leerDocumentoParaRender(raw);
    expect(doc.overlays.map((o) => o.tipo)).toEqual(["aviso_barra"]);
    const aviso = doc.overlays[0]!;
    if (aviso.tipo === "aviso_barra") expect(aviso.props.mensajes).toEqual(["Recibes el PDF por correo"]);
  });
});

describe("aviso_barra v2 — schema estricto (F04)", () => {
  // aviso.schema.001 — mensajes 1–5 con límite de chars; modo/esquema de enum cerrado; defaults look v1.
  it("mensajes 1–5 y enums cerrados; defaults = estatico/tema/false", () => {
    expect(avisoBarraProps.safeParse({ mensajes: ["uno"] }).success).toBe(true);
    expect(avisoBarraProps.safeParse({ mensajes: [] }).success).toBe(false); // min 1
    expect(avisoBarraProps.safeParse({ mensajes: ["a", "b", "c", "d", "e", "f"] }).success).toBe(false); // max 5
    // modo/esquema fuera del enum ⇒ rechazo
    expect(avisoBarraProps.safeParse({ mensajes: ["x"], modo: "girar" }).success).toBe(false);
    expect(avisoBarraProps.safeParse({ mensajes: ["x"], esquema: "neon" }).success).toBe(false);
    // defaults que conservan el look v1
    const p = avisoBarraProps.parse({ mensajes: ["Novedad"] });
    expect(p.modo).toBe("estatico");
    expect(p.esquema).toBe("tema");
    expect(p.mostrarCountdown).toBe(false);
    expect(p.descartable).toBe(false);
    // el set de modos es el declarado
    expect([...MODOS_AVISO_BARRA]).toEqual(["estatico", "rotacion", "marquee"]);
  });

  // aviso.schema.002 — campo extra / HTML / shape v1 ⇒ rechazo .strict (nunca HTML del tenant, I3).
  it("rechaza campos extra, HTML y el shape v1 (texto) por .strict", () => {
    expect(avisoBarraProps.safeParse({ mensajes: ["x"], html: "<b>x</b>" }).success).toBe(false);
    expect(avisoBarraProps.safeParse({ mensajes: ["x"], extra: 1 }).success).toBe(false);
    expect(avisoBarraProps.safeParse({ texto: "x" }).success).toBe(false);
    // acento como esquema es válido (degrada a marca sin acento, I-T2)
    expect(avisoBarraProps.safeParse({ mensajes: ["x"], esquema: "acento" }).success).toBe(true);
    // marquee + countdown + enlace conservado
    expect(
      avisoBarraProps.safeParse({
        mensajes: ["Sorteo pronto", "Compra segura"],
        modo: "marquee",
        mostrarCountdown: true,
        enlaceUrl: "https://ejemplo.cl",
        enlaceTexto: "Ver bases",
      }).success,
    ).toBe(true);
  });
});
