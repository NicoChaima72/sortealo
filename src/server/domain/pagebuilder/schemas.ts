import { z } from "zod";

/**
 * Inputs Zod de los use cases del page builder (F04, ADR-0016). El shape FINO de las props de cada
 * widget NO se valida acá (depende del `tipo`): la mutación se aplica y el documento COMPLETO se
 * revalida contra `PageDocumentSchema` server-side (el borde de seguridad, I3) — props inválidas ⇒
 * el documento no parsea ⇒ `INVALID`, sin escribir. Por eso `props` acá es un record laxo.
 */

/** Props laxas de entrada (el shape real lo impone la revalidación del documento completo). */
const propsLaxas = z.record(z.string(), z.unknown());

/**
 * Mutación direccionada del borrador (D10). Union discriminada por `accion`; el MCP (F06) mapea una
 * tool por acción. El lock optimista (`expectedVersion`, I10) NO viaja dentro de esta union: es un
 * parámetro HERMANO en `aplicarMutacionPagina({ mutacion, expectedVersion })` — cada tool del MCP lo
 * recibe aparte y lo pasa al use case, no lo embebe en el input de la mutación.
 */
export const mutacionPaginaSchema = z.discriminatedUnion("accion", [
  // Agregar una sección de `tipo` (validado contra el registro en el transform) con sus defaultProps
  // + overrides; `posicion` la inserta (clamp), ausente ⇒ al final.
  z.object({
    accion: z.literal("add_section"),
    tipo: z.string().min(1),
    posicion: z.number().int().min(0).optional(),
    props: propsLaxas.optional(),
  }),
  // Mover una sección (por `id`) a otra posición del array (clamp).
  z.object({
    accion: z.literal("move_section"),
    id: z.string().min(1),
    aPosicion: z.number().int().min(0),
  }),
  // Quitar una sección por `id`.
  z.object({
    accion: z.literal("remove_section"),
    id: z.string().min(1),
  }),
  // Actualizar (merge shallow) las props de una sección por `id`.
  z.object({
    accion: z.literal("update_section_props"),
    id: z.string().min(1),
    props: propsLaxas,
  }),
  // Setear el tema (root.props). Hoy el tema es vacío; props no-vacías ⇒ el documento no parsea.
  z.object({
    accion: z.literal("set_theme"),
    props: propsLaxas,
  }),
  // Reemplazo TOTAL del borrador desde un documento crudo (primer volcado desde foto). Se parsea
  // entero contra PageDocumentSchema.
  z.object({
    accion: z.literal("apply_page"),
    documento: z.unknown(),
  }),
]);
export type MutacionPagina = z.infer<typeof mutacionPaginaSchema>;

/** Cuál de los dos documentos leer: el Borrador (editar) o el Publicado (render). */
export const cualDocumento = z.enum(["draft", "published"]);
export type CualDocumento = z.infer<typeof cualDocumento>;
