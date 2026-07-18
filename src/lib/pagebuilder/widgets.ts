import { z } from "zod";

/**
 * Registro de widgets de la Página de tienda (ADR-0016, F02). **Fuente ÚNICA de verdad** del
 * shape de cada widget: por cada `tipo` guarda su `propsSchema` (Zod), `defaultProps` (para
 * sembrar / "agregar sección"), la versión `v` del nodo y la `categoria` (sección vs overlay).
 *
 * Este módulo es PURO (solo Zod) y client+server safe: lo importan el schema del documento
 * (`./schema`), la factory (`./factory`), los use cases del dominio (`~/server/domain/pagebuilder`),
 * el MCP (F06) y el render del storefront (F05). PROHIBIDO importar `~/server` o React acá — corre
 * también en el cliente (mismo criterio que `~/styles/tenantTheme.ts`).
 *
 * Invariantes que este registro materializa:
 * - **Sin HTML libre** (ADR-0018/I3): no existe `propsSchema` con HTML/CSS/JS crudo; todo texto es
 *   string plano con límite; toda imagen/embed es una URL/ref validada. `.strict()` en cada objeto
 *   rechaza campos extra ⇒ un `html`/`embedCode`/`iframeSrc` inyectado no parsea.
 * - **Referencias, no copias** (ADR-0017/I2): el catálogo guarda `productoIds` (referencias), jamás
 *   precios ni títulos; la vitrina del sorteo no guarda datos del `Raffle` (se resuelven server-side).
 * - **Enums cerrados**: íconos/anclas/estilos son `z.enum`, nunca string libre.
 */

// ── Validadores compartidos ──────────────────────────────────────────────────
/** URL de imagen del bucket público (ADR-0013). Exportado para reuso (factory, F03). */
export const urlPublica = z.string().url().max(2048);

/** Anclas de navegación internas permitidas para los CTA (enum cerrado). */
export const CTA_ANCLAS = ["catalogo", "sorteo"] as const;

/** Íconos permitidos para los pasos de "cómo funciona" (enum cerrado; el render los mapea). */
export const ICONOS_PASO = [
  "compra",
  "descarga",
  "ticket",
  "regalo",
  "escudo",
  "rayo",
  "chispa",
  "reloj",
] as const;

// ── Props de cada widget semilla ─────────────────────────────────────────────

/**
 * `hero` (semilla): titular/subtítulo/imagen del encabezado + CTA. `titulo`/`subtitulo`/`imagenUrl`
 * son OVERRIDES opcionales — sin ellos el render cae al `nombre`/`descripcion`/gradiente del Tenant
 * (degradación elegante, resueltos server-side; NO se copian al documento, I2/I11). El badge "Sorteo
 * abierto" y los badges de confianza los decide el render (dato del sorteo server-side).
 */
export const heroProps = z
  .object({
    titulo: z.string().min(1).max(120).optional(),
    subtitulo: z.string().min(1).max(300).optional(),
    imagenUrl: urlPublica.optional(),
    ctaTexto: z.string().min(1).max(40).optional(),
    ctaAncla: z.enum(CTA_ANCLAS).default("catalogo"),
    mostrarBadgeSorteo: z.boolean().default(true),
  })
  .strict();
export type HeroProps = z.infer<typeof heroProps>;

/**
 * `catalogo` (semilla): grilla de productos. `modo:'todos'` lista todo el catálogo activo del tenant;
 * `modo:'seleccion'` lista solo los `productoIds` (REFERENCIAS validadas server-side contra el tenant,
 * D6/I2 — jamás precios/títulos copiados). `columnas` acota el layout.
 */
export const catalogoProps = z
  .object({
    titulo: z.string().min(1).max(80).default("Catálogo"),
    modo: z.enum(["todos", "seleccion"]).default("todos"),
    productoIds: z.array(z.string().cuid()).max(60).optional(),
    columnas: z.union([z.literal(2), z.literal(3)]).default(3),
  })
  .strict();
export type CatalogoProps = z.infer<typeof catalogoProps>;

/**
 * `sorteo_vitrina` (semilla): vitrina del `Raffle` ACTIVO. NO guarda premio/fechas/conteo — se
 * resuelven server-side al render (I2). Se auto-oculta sin sorteo activo. El Disclaimer del sorteo
 * (ADR-0008/I8) NO es configurable: `mostrarBases` solo controla el texto de bases del Organizador.
 */
export const sorteoVitrinaProps = z
  .object({
    mostrarBases: z.boolean().default(true),
    estiloConteo: z.enum(["badge", "destacado"]).default("badge"),
  })
  .strict();
export type SorteoVitrinaProps = z.infer<typeof sorteoVitrinaProps>;

/**
 * `como_funciona` (semilla): pasos de conversión. Sin `pasos` ⇒ el render usa los 3 pasos FIJOS de
 * plataforma (copy actual). `icono` es un enum cerrado (nunca string libre); textos con límite.
 */
export const comoFuncionaProps = z
  .object({
    titulo: z.string().min(1).max(80).default("Cómo funciona"),
    pasos: z
      .array(
        z
          .object({
            icono: z.enum(ICONOS_PASO),
            titulo: z.string().min(1).max(60),
            desc: z.string().min(1).max(200),
          })
          .strict(),
      )
      .max(4)
      .optional(),
  })
  .strict();
export type ComoFuncionaProps = z.infer<typeof comoFuncionaProps>;

// ── Widgets PRO de conversión (F10) ──────────────────────────────────────────

/**
 * `contador_tickets` (sección, F10): muestra el conteo REAL de tickets del sorteo ACTIVO (server-side,
 * sin PII — ADR-0004). Auto-oculto sin sorteo activo. `metaTickets` habilita una barra de progreso.
 */
export const contadorTicketsProps = z
  .object({
    metaTickets: z.number().int().positive().max(1_000_000).optional(),
    etiqueta: z.string().min(1).max(80).optional(),
    mostrarPorcentaje: z.boolean().default(false),
  })
  .strict();
export type ContadorTicketsProps = z.infer<typeof contadorTicketsProps>;

/**
 * `urgencia_countdown` (sección, F10): cuenta regresiva al cierre del sorteo ACTIVO. Auto-oculto si no
 * hay sorteo o ya venció (§3). `intensidad` modula el énfasis visual.
 */
export const urgenciaCountdownProps = z
  .object({
    mensaje: z.string().min(1).max(120).optional(),
    ctaTexto: z.string().min(1).max(40).optional(),
    ctaAncla: z.enum(CTA_ANCLAS).default("catalogo"),
    intensidad: z.enum(["suave", "fuerte"]).default("suave"),
  })
  .strict();
export type UrgenciaCountdownProps = z.infer<typeof urgenciaCountdownProps>;

// ── Widgets PRO de conversión — OVERLAYS (F10) ───────────────────────────────

/**
 * `whatsapp_flotante` (overlay, F10): botón flotante (FAB) a WhatsApp. Sin `numero` (E.164) ⇒ oculto.
 * El `mensajePredefinido` prellena el chat. `posicion` = abajo-derecha / abajo-izquierda.
 */
export const whatsappFlotanteProps = z
  .object({
    numero: z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/, "Número E.164, ej. +56912345678")
      .optional(),
    mensajePredefinido: z.string().min(1).max(120).optional(),
    posicion: z.enum(["br", "bl"]).default("br"),
  })
  .strict();
export type WhatsappFlotanteProps = z.infer<typeof whatsappFlotanteProps>;

/**
 * `aviso_barra` (overlay, F10): barra de aviso arriba de todo. Migra el `avisoTexto` del chrome (R1).
 * Sin `texto` ⇒ oculto. `descartable` permite cerrarla. Texto plano (nunca HTML, I3).
 */
export const avisoBarraProps = z
  .object({
    texto: z.string().min(1).max(120),
    enlaceUrl: z.string().url().max(2048).optional(),
    enlaceTexto: z.string().min(1).max(40).optional(),
    descartable: z.boolean().default(false),
  })
  .strict();
export type AvisoBarraProps = z.infer<typeof avisoBarraProps>;

// ── Widgets PRO de confianza (F11) ───────────────────────────────────────────

/** `testimonios` (sección, F11): reseñas. Texto plano con límites (nunca HTML, I3). */
export const testimoniosProps = z
  .object({
    titulo: z.string().min(1).max(80).optional(),
    layout: z.enum(["grid", "carrusel"]).default("grid"),
    items: z
      .array(
        z
          .object({
            nombre: z.string().min(1).max(60),
            texto: z.string().min(1).max(280),
            avatarUrl: urlPublica.optional(),
            estrellas: z.number().int().min(1).max(5).optional(),
            handle: z.string().min(1).max(40).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict();
export type TestimoniosProps = z.infer<typeof testimoniosProps>;

/** `ganadores` (sección, F11): vitrina de ganadores previos. El consentimiento es del Organizador (§3). */
export const ganadoresProps = z
  .object({
    titulo: z.string().min(1).max(80).optional(),
    layout: z.enum(["grid", "carrusel"]).default("grid"),
    items: z
      .array(
        z
          .object({
            nombre: z.string().min(1).max(60),
            premio: z.string().min(1).max(80),
            fecha: z.string().min(1).max(40).optional(),
            fotoUrl: urlPublica.optional(),
            handle: z.string().min(1).max(40).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict();
export type GanadoresProps = z.infer<typeof ganadoresProps>;

/** `faq` (sección, F11): preguntas frecuentes. Texto plano pre-wrap con límites (nunca HTML, I3). */
export const faqProps = z
  .object({
    titulo: z.string().min(1).max(80).default("Preguntas frecuentes"),
    items: z
      .array(
        z
          .object({
            pregunta: z.string().min(1).max(160),
            respuesta: z.string().min(1).max(600),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict();
export type FaqProps = z.infer<typeof faqProps>;

/**
 * `video` (sección, F11): video embebido — iframe-only sobre el contrato de F07 (`construirEmbedSrc`).
 * `plataforma` mapea a `RedEmbed`; `videoId` es la ref (validada por la regex de la red en el render).
 * NUNCA HTML/iframeSrc crudo (I3/I4): el documento guarda `{ plataforma, videoId }`, la src la arma
 * `<EmbedFrame>` server/registry-side.
 */
export const videoProps = z
  .object({
    plataforma: z.enum(["youtube", "tiktok", "instagram"]),
    videoId: z.string().min(1).max(100),
    titulo: z.string().min(1).max(80).optional(),
    ratio: z.enum(["16:9", "9:16"]).default("16:9"),
  })
  .strict();
export type VideoProps = z.infer<typeof videoProps>;

/**
 * `embed_social` (sección, F11): post/perfil social embebido — iframe-only sobre F07. `red` mapea a
 * `RedEmbed`; `ref` es el id/handle validado por regex en el render. Corazón del brief fandom.
 */
export const embedSocialProps = z
  .object({
    red: z.enum(["tiktok", "instagram"]),
    tipo: z.enum(["post", "perfil"]).default("post"),
    ref: z.string().min(1).max(100),
    leyenda: z.string().min(1).max(120).optional(),
  })
  .strict();
export type EmbedSocialProps = z.infer<typeof embedSocialProps>;

// ── Registro ─────────────────────────────────────────────────────────────────

/** Categoría de un widget: en el flujo vertical de `secciones[]` o en el slot `overlays[]`. */
export type CategoriaWidget = "seccion" | "overlay";

export interface WidgetDef<P extends z.ZodTypeAny = z.ZodTypeAny> {
  categoria: CategoriaWidget;
  /** Versión del nodo (migrate-on-read por `v`, F05). Los widgets semilla nacen en v1. */
  v: number;
  propsSchema: P;
  /** Props por defecto — parsean contra `propsSchema` (test generativo F02). */
  defaultProps: z.input<P>;
}

/** Helper que ata `defaultProps` al `propsSchema` en compile-time (evita drift default↔schema). */
function definirWidget<P extends z.ZodTypeAny>(d: WidgetDef<P>): WidgetDef<P> {
  return d;
}

/**
 * El registro. Cada entrada es la definición completa de un `tipo`. `as const` en las claves para
 * derivar `WidgetTipo`. Agregar un widget = agregar una entrada acá + su rama en la union de
 * `./schema` (la exhaustividad se testea, F02).
 */
export const WIDGET_REGISTRY = {
  hero: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: heroProps,
    defaultProps: { ctaAncla: "catalogo", mostrarBadgeSorteo: true },
  }),
  catalogo: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: catalogoProps,
    defaultProps: { titulo: "Catálogo", modo: "todos", columnas: 3 },
  }),
  sorteo_vitrina: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: sorteoVitrinaProps,
    defaultProps: { mostrarBases: true, estiloConteo: "badge" },
  }),
  como_funciona: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: comoFuncionaProps,
    defaultProps: { titulo: "Cómo funciona" },
  }),
  // ── PRO de conversión (F10) ──
  contador_tickets: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: contadorTicketsProps,
    defaultProps: { mostrarPorcentaje: false },
  }),
  urgencia_countdown: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: urgenciaCountdownProps,
    defaultProps: { ctaAncla: "catalogo", intensidad: "suave" },
  }),
  // ── Overlays PRO (F10) ──
  whatsapp_flotante: definirWidget({
    categoria: "overlay",
    v: 1,
    propsSchema: whatsappFlotanteProps,
    defaultProps: { posicion: "br" },
  }),
  aviso_barra: definirWidget({
    categoria: "overlay",
    v: 1,
    propsSchema: avisoBarraProps,
    defaultProps: { texto: "Novedad", descartable: false },
  }),
  // ── PRO de confianza (F11) ──
  testimonios: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: testimoniosProps,
    defaultProps: {
      layout: "grid",
      items: [{ nombre: "Cliente feliz", texto: "Excelente experiencia de compra." }],
    },
  }),
  ganadores: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: ganadoresProps,
    defaultProps: {
      layout: "grid",
      items: [{ nombre: "Ganador", premio: "Premio del sorteo" }],
    },
  }),
  faq: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: faqProps,
    defaultProps: {
      titulo: "Preguntas frecuentes",
      items: [
        {
          pregunta: "¿Cómo recibo mi compra?",
          respuesta: "Te llega al correo el enlace de descarga apenas se confirma el pago.",
        },
      ],
    },
  }),
  video: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: videoProps,
    defaultProps: { plataforma: "youtube", videoId: "dQw4w9WgXcQ", ratio: "16:9" },
  }),
  embed_social: definirWidget({
    categoria: "seccion",
    v: 1,
    propsSchema: embedSocialProps,
    defaultProps: { red: "tiktok", tipo: "post", ref: "7231338487075343622" },
  }),
} as const;

export type WidgetTipo = keyof typeof WIDGET_REGISTRY;

/** Todos los tipos de sección del registro (categoria === 'seccion'). */
export const TIPOS_SECCION = (
  Object.keys(WIDGET_REGISTRY) as WidgetTipo[]
).filter((t) => WIDGET_REGISTRY[t].categoria === "seccion");

/** Todos los tipos de overlay del registro (categoria === 'overlay'). Vacío hasta F10. */
export const TIPOS_OVERLAY = (
  Object.keys(WIDGET_REGISTRY) as WidgetTipo[]
).filter((t) => WIDGET_REGISTRY[t].categoria === "overlay");
