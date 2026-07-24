import { describe, expect, it } from "vitest";

import {
  TIPO_PATCH,
  validarMensajePatch,
} from "~/components/storefront/use-preview-patch";
import { PageDocumentSchema } from "~/lib/pagebuilder/schema";

/**
 * Tests del patch en vivo del preview (builder-tanda-1 F09/D13). El listener NUNCA confía en el mensaje:
 * verifica `origin` + `tipo` + RE-VALIDA con el MISMO Zod. Un mensaje de otro origin, de otro tipo o con
 * un documento inválido ⇒ `null` (el preview lo IGNORA y conserva el render actual — no pinta basura ni
 * lo blanquea, sin throw). I-T5.
 */

const ORIGEN = "https://prueba.localhost:3001";

/** Un documento válido mínimo (Zod rellena los defaults del tema). */
const docValido = () =>
  PageDocumentSchema.parse({ schemaVersion: 1, root: { props: {} }, secciones: [], overlays: [] });

const mensajePatch = (documento: unknown) => ({ tipo: TIPO_PATCH, documento });

describe("use-preview-patch — validarMensajePatch (F09/D13, I-T5)", () => {
  // patch.001 — mensaje bien formado (origin correcto + tipo + doc válido) ⇒ devuelve el documento.
  it("acepta un mensaje del origin esperado con un documento válido", () => {
    const doc = docValido();
    const res = validarMensajePatch({ origin: ORIGEN, data: mensajePatch(doc) }, ORIGEN);
    expect(res).not.toBeNull();
    expect(res?.schemaVersion).toBe(1);
    expect(res?.secciones).toEqual([]);
  });

  // patch.002 — origin distinto ⇒ null (no pinta; defensa cross-origin, I-T5).
  it("descarta un mensaje de otro origin", () => {
    const res = validarMensajePatch(
      { origin: "https://malicioso.example", data: mensajePatch(docValido()) },
      ORIGEN,
    );
    expect(res).toBeNull();
  });

  // patch.003 — tipo equivocado / data no-objeto ⇒ null (no confunde con otros postMessage).
  it("descarta mensajes de otro tipo o data basura", () => {
    expect(validarMensajePatch({ origin: ORIGEN, data: { tipo: "otro", documento: docValido() } }, ORIGEN)).toBeNull();
    expect(validarMensajePatch({ origin: ORIGEN, data: "hola" }, ORIGEN)).toBeNull();
    expect(validarMensajePatch({ origin: ORIGEN, data: null }, ORIGEN)).toBeNull();
    expect(validarMensajePatch({ origin: ORIGEN, data: undefined }, ORIGEN)).toBeNull();
  });

  // patch.004 — documento que NO pasa el Zod ⇒ null (ignora, no blanquea el preview ni lanza).
  it("descarta un documento que no pasa el Zod estricto", () => {
    // schemaVersion mala + secciones no-array ⇒ el parse estricto falla.
    expect(validarMensajePatch({ origin: ORIGEN, data: mensajePatch({ basura: true }) }, ORIGEN)).toBeNull();
    expect(
      validarMensajePatch({ origin: ORIGEN, data: mensajePatch({ schemaVersion: 99, root: {}, secciones: "x" }) }, ORIGEN),
    ).toBeNull();
    // un tipo de sección desconocido tampoco cuela por el parse estricto del continente.
    expect(
      validarMensajePatch(
        {
          origin: ORIGEN,
          data: mensajePatch({
            schemaVersion: 1,
            root: { props: {} },
            secciones: [{ id: "x", tipo: "widget_del_futuro", v: 1, props: {} }],
            overlays: [],
          }),
        },
        ORIGEN,
      ),
    ).toBeNull();
  });
});
