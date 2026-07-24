import { useEffect, useState } from "react";

import { migrarDocumento } from "~/lib/pagebuilder/migrate";
import { PageDocumentSchema, type PageDocument } from "~/lib/pagebuilder/schema";

/**
 * Patch en vivo del preview del editor (builder-tanda-1 F09/D13). El editor, tras una mutación exitosa,
 * hace `postMessage({ tipo, documento })` al iframe; ESTE hook —montado SOLO en modo preview tokenizado
 * (I-T5)— lo escucha, verifica el `origin`, RE-VALIDA el documento con el MISMO Zod (jamás confía en el
 * mensaje) y actualiza el estado ⇒ re-render sin reload ni pérdida de scroll.
 *
 * El storefront PÚBLICO (no preview) NUNCA registra el listener ⇒ su SSR sigue invariante y cacheable.
 */

/** Tipo del mensaje de patch (namespaced para no chocar con otros postMessage). */
export const TIPO_PATCH = "pagebuilder:patch";

/**
 * Valida un mensaje de patch: `origin` esperado + `tipo` correcto + documento que PASA el Zod ESTRICTO
 * (migrate-on-read + PageDocumentSchema). Devuelve el documento validado, o `null` si algo no cuadra (⇒
 * el preview IGNORA el mensaje y conserva el render actual: nunca pinta basura ni lo blanquea). PURO ⇒
 * testeable en node sin DOM.
 */
export function validarMensajePatch(
  mensaje: { origin: string; data: unknown },
  origenEsperado: string,
): PageDocument | null {
  if (mensaje.origin !== origenEsperado) return null; // otro origin ⇒ descarta (I-T5)
  const data = mensaje.data as { tipo?: unknown; documento?: unknown } | null | undefined;
  if (!data || typeof data !== "object" || data.tipo !== TIPO_PATCH) return null;
  const res = PageDocumentSchema.safeParse(migrarDocumento(data.documento));
  return res.success ? res.data : null; // no pasa el Zod ⇒ null (no paint, no throw)
}

/**
 * Estado del documento del preview: arranca del SSR (`inicial`) y, SOLO en preview, se actualiza con los
 * patches del editor. En público (`esPreview=false`) NO hay listener (I-T5) ⇒ devuelve el SSR fijo.
 */
export function usePreviewPatch(inicial: PageDocument, esPreview: boolean): PageDocument {
  const [doc, setDoc] = useState(inicial);

  // Re-sincroniza si el SSR cambia (p.ej. un reload explícito del iframe con nuevo borrador).
  useEffect(() => setDoc(inicial), [inicial]);

  useEffect(() => {
    if (!esPreview || typeof window === "undefined") return; // público ⇒ sin listener (I-T5)
    const origen = window.location.origin;
    function onMessage(e: MessageEvent) {
      const validado = validarMensajePatch({ origin: e.origin, data: e.data }, origen);
      if (validado) setDoc(validado); // scroll intacto: es un setState, no un reload
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [esPreview]);

  return doc;
}
