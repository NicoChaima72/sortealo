import { z } from "zod";

import {
  avisoBarraProps,
  catalogoProps,
  comoFuncionaProps,
  contadorTicketsProps,
  embedSocialProps,
  faqProps,
  ganadoresProps,
  heroProps,
  sorteoVitrinaProps,
  testimoniosProps,
  urgenciaCountdownProps,
  videoProps,
  whatsappFlotanteProps,
} from "~/lib/pagebuilder/widgets";

/**
 * Schema del Documento de Página (ADR-0016, F02). Es el **borde de validación** por el que pasa
 * TODA escritura del documento (MCP, use cases, backfill) server-side (I3): tipos/props desconocidos,
 * campos extra o límites excedidos ⇒ rechazo. Puro (solo Zod), client+server safe.
 *
 * Estructura de DOS niveles, sin recursión (ADR-0016):
 *   PageDocument = { schemaVersion, root:{props: tema}, secciones:[Nodo], overlays:[Nodo] }
 *   Nodo = { id (estable), tipo, v, props }   — el `id` direcciona las mutaciones del MCP (F04/F06).
 *
 * Las secciones se ordenan por POSICIÓN en el array (no hay campo `orden`). La union es discriminada
 * por `tipo` ⇒ el render tiene el `props` narrowed por rama (switch exhaustivo, F05). Los tipos de
 * widget peligrosos (`html`/`embedCode`/`iframeSrc`) simplemente NO existen en la union (ADR-0018).
 */

/** Versión del CONTINENTE (el documento). Distinta de la `v` por nodo (migrate-on-read, F05). */
export const SCHEMA_VERSION = 1;

/** Tope de secciones por página (cordura anti-abuso; el LLM del MCP no infla el jsonb). */
const MAX_SECCIONES = 50;
/** Tope de overlays por página. */
const MAX_OVERLAYS = 10;

/**
 * Construye el schema de un nodo tipado: `{ id, tipo: literal, v, props }`, estricto (rechaza campos
 * extra, ADR-0018). El `id` es un string estable (dirección del nodo); `v` acepta cualquier entero
 * positivo (un nodo con `v` viejo se migra ANTES de parsear, F05).
 */
function nodo<T extends string, P extends z.ZodTypeAny>(tipo: T, props: P) {
  return z
    .object({
      id: z.string().min(1).max(64),
      tipo: z.literal(tipo),
      v: z.number().int().positive(),
      props,
    })
    .strict();
}

/**
 * Union discriminada de SECCIONES (widgets del flujo vertical). Enumerada explícitamente con
 * literales para que `z.infer` narrowe `props` por `tipo` (tipos precisos en el render). Debe
 * cubrir EXACTAMENTE los `TIPOS_SECCION` del registro — la exhaustividad se testea (F02).
 */
export const SeccionNodeSchema = z.discriminatedUnion("tipo", [
  nodo("hero", heroProps),
  nodo("catalogo", catalogoProps),
  nodo("sorteo_vitrina", sorteoVitrinaProps),
  nodo("como_funciona", comoFuncionaProps),
  nodo("contador_tickets", contadorTicketsProps), // F10
  nodo("urgencia_countdown", urgenciaCountdownProps), // F10
  nodo("testimonios", testimoniosProps), // F11
  nodo("ganadores", ganadoresProps), // F11
  nodo("faq", faqProps), // F11
  nodo("video", videoProps), // F11
  nodo("embed_social", embedSocialProps), // F11
]);
export type SeccionNode = z.infer<typeof SeccionNodeSchema>;

/**
 * Union de OVERLAYS (widgets fuera del flujo vertical: barra de aviso arriba, botón flotante FAB).
 * F10 la pobló con `aviso_barra` + `whatsapp_flotante`. El array `overlays[]` solo admite estos tipos;
 * un tipo de sección metido como overlay ⇒ rechazo.
 */
export const OverlayNodeSchema = z.discriminatedUnion("tipo", [
  nodo("aviso_barra", avisoBarraProps),
  nodo("whatsapp_flotante", whatsappFlotanteProps),
]);
export type OverlayNode = z.infer<typeof OverlayNodeSchema>;

/**
 * Tema del documento (`root.props`). MÍNIMO en esta fase: la fuente de verdad del theme sigue en las
 * columnas de `Tenant` (colorPrimario) — moverla al documento es out-of-scope (transición posterior).
 * Objeto estricto vacío por ahora; F10+ lo extiende con `v`-bump.
 */
export const TemaSchema = z.object({}).strict();
export type Tema = z.infer<typeof TemaSchema>;

/** El Documento de Página completo. `.strict()` en cada nivel (sin campos extra, ADR-0018). */
export const PageDocumentSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    root: z.object({ props: TemaSchema }).strict(),
    secciones: z.array(SeccionNodeSchema).max(MAX_SECCIONES),
    overlays: z.array(OverlayNodeSchema).max(MAX_OVERLAYS).default([]),
  })
  .strict();
export type PageDocument = z.infer<typeof PageDocumentSchema>;
