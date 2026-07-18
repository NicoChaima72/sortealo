import {
  OverlayNodeSchema,
  PageDocumentSchema,
  SeccionNodeSchema,
  type OverlayNode,
  type PageDocument,
  type SeccionNode,
} from "~/lib/pagebuilder/schema";

/**
 * Migrate-on-read del Documento de Página (ADR-0016/I9, F04/F05). Transforma un documento CRUDO de
 * versiones viejas a la actual de forma PURA (nunca escribe a DB) ANTES de parsear. Hoy solo existe
 * `v1` ⇒ identidad; F05+ agrega pasos por nodo (vN→vN+1). Puro, client+server safe.
 *
 * Punto de extensión: cuando un widget suba su `v`, agregar acá un paso `migrarNodo(tipo, vViejo)`
 * que remapee sus props ⇒ el documento se migra al LEER, sin `jsonb_set` masivo que rompa páginas
 * publicadas (I9).
 */
export function migrarDocumento(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const doc = raw as Record<string, unknown>;
  if (!Array.isArray(doc.secciones)) return raw;
  const secciones = doc.secciones as unknown[];

  // Único paso hoy: un nodo legacy SIN `v` se normaliza a `v:1` (migrate-on-read PURO — spread, no
  // muta la entrada, no escribe a DB). Cuando un widget suba a v2, su paso vN→vN+1 se agrega acá.
  const migradas = secciones.map((s): unknown => {
    if (s && typeof s === "object" && (s as Record<string, unknown>).v === undefined) {
      return { ...(s as Record<string, unknown>), v: 1 };
    }
    return s;
  });
  return { ...doc, secciones: migradas };
}

/**
 * Parseo canónico ESTRICTO: migra + valida contra `PageDocumentSchema`. Úsalo para EDITAR (getPagina
 * del borrador, F04): el borrador siempre debe ser válido (cada mutación lo revalidó). Lanza si no.
 */
export function parsearDocumento(raw: unknown): PageDocument {
  return PageDocumentSchema.parse(migrarDocumento(raw));
}

/**
 * Lectura TOLERANTE para el RENDER público (F05, I9): migra el documento y descarta en silencio las
 * secciones cuyo `tipo` es desconocido o cuyas props no parsean — un documento publicado NUNCA
 * crashea la página entera. Devuelve un `PageDocument` válido con solo las secciones sanas.
 *
 * Distinto de `parsearDocumento` (estricto, para editar): acá la robustez del render manda sobre la
 * exactitud. Si el continente (root/overlays/schemaVersion) está corrupto, cae a un documento vacío
 * renderizable en vez de tirar.
 */
export function leerDocumentoParaRender(raw: unknown): PageDocument {
  const migrado = migrarDocumento(raw);

  const obj = migrado && typeof migrado === "object" ? (migrado as Record<string, unknown>) : {};

  // Rescatar las secciones sanas una por una (una podrida no tumba al resto).
  const secciones: SeccionNode[] = [];
  for (const cruda of Array.isArray(obj.secciones) ? obj.secciones : []) {
    const res = SeccionNodeSchema.safeParse(cruda);
    if (res.success) secciones.push(res.data); // tipo desconocido / props inválidas ⇒ se omite (I9)
  }

  // Ídem para los overlays (F10): un overlay podrido se omite, no tumba el resto.
  const overlays: OverlayNode[] = [];
  for (const cruda of Array.isArray(obj.overlays) ? obj.overlays : []) {
    const res = OverlayNodeSchema.safeParse(cruda);
    if (res.success) overlays.push(res.data);
  }

  // El resto del continente se valida entero; si algo del root está mal, documento vacío.
  const doc = PageDocumentSchema.safeParse({
    schemaVersion: 1,
    root: { props: {} },
    secciones,
    overlays,
  });
  return doc.success
    ? doc.data
    : { schemaVersion: 1, root: { props: {} }, secciones: [], overlays: [] };
}
