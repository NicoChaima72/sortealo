<!-- Investigación multi-agente (workflow Opus 5 dimensiones + síntesis), 2026-07-18. Catálogo v2 de widgets + estiloSeccion + TemaPagina + animación. Insumo del plan catalogo-v2 / builder visual. -->

# Catálogo v2 del Page Builder + Sistema de estilo y animación — Síntesis ejecutiva

> Fusión de 5 investigaciones (contenido/marketing, media/social, sorteo/conversión, estilo/fondos, animación). Material para el dueño del producto y para el planner que armará el plan de construcción. Todo extiende el registro actual (ADR-0016) sin romperlo; respeta los invariantes duros de ADR-0018 (sin HTML/CSS/URL libre), la degradación elegante, y el theming per-tenant.

---

## 1. Veredicto

El builder pasa de **13 widgets** a un catálogo de **~34 tipos** entregado en dos tandas: **~13 nuevos [mvp-v2]** que llevan la tienda a paridad Wix/Squarespace para este vertical de sorteos, y **~11 [pro]** de segunda tanda. Tres piezas transversales sostienen todo y van **primero**: (a) **`estiloSeccion`** — un objeto opcional hermano de `props` en cada nodo de sección que resuelve el pedido "editar el fondo de las secciones y de la página", modelado como **esquemas de color emparejados** (fondo+texto legible por construcción, jamás hex libre) + espaciado + ancho + divisor + animación de entrada, más un **`TemaPagina`** que puebla el `root.props` hoy vacío (fondo global, modo claro/oscuro, radio, par tipográfico curado); (b) un **sistema de animación de un solo módulo** (`animar.tsx` con `LazyMotion`) que levanta de forma controlada la prohibición de `motion` en el storefront, con presets de entrada por enum, microinteracciones CSS-puras incorporadas, y reglas duras de SSR/CLS/reduced-motion; (c) la **ampliación del enum de íconos** (`ICONOS_PASO → ICONOS_BENEFICIO`), dependencia compartida de ~7 widgets. La migración es **no-op** (todo aditivo-opcional, sin bump de `schemaVersion`). Dos prerequisitos de infra condicionan una parte del catálogo: **storage multi-imagen** (hoy solo slots fijos de imagen) para galerías/sliders, y **use cases públicos nuevos** para los widgets de resultado/actividad de sorteo (siempre con PII enmascarada server-side).

---

## 2. Catálogo v2 completo (tabla maestra)

**Prioridades:** `[mvp-v2]` primera tanda · `[pro]` segunda tanda · `[después]` gated por infra/decisión · `[nunca]` descartado. **C/D** = orientado a Conversión o Decorativo/editorial.

### Widgets NUEVOS

| widget (snake_case) | Qué hace | Props clave | Anima | Prioridad | C/D |
|---|---|---|---|---|---|
| `beneficios_grid` | Grid 2–6 de beneficios ícono+título+desc ("descarga inmediata", "pago seguro") | `columnas(2\|3)`, `items[{icono∈ICONOS_BENEFICIO, titulo, desc?}]` | stagger + micro-pop ícono | mvp-v2 | C |
| `estadisticas` | Fila 2–4 de cifras grandes con **count-up** ("+1.200 tickets", "4.9★") | `items[{valor:int, sufijo?, etiqueta, icono?}]` | count-up on-scroll | mvp-v2 | C |
| `banner_cta` | Banda CTA full-bleed sobre fondo de marca/gradiente/imagen | `titulo`, `subtitulo?`, `ctaTexto`, `ctaAncla∈CTA_ANCLAS`, `imagenFondoUrl?`, `overlayOscuridad` | entrada escala + pulso botón | mvp-v2 | C |
| `bloque_ticket_promo` | Explicador "compra = participas" (producto→ticket→sorteo) — corazón del modelo | `titulo`, `descripcion?`, `mostrarMecanica`, `cta*`, `mostrarSorteoActivo` | secuencia de la mecánica | mvp-v2 | C |
| `texto_rico` | Cuerpo editorial estructurado por **discriminated-union de bloques** (subtítulo/párrafo/cita/lista) — NO HTML | `ancho`, `bloques[union por tipo]` | fade-in por bloque | mvp-v2 | D |
| `imagen_destacada` | Una imagen grande con caption y enlace opcionales | `imagenUrl`, `alt`, `caption?`, `ancho`, `ratio`, `enlaceUrl?` | reveal + zoom-hover | mvp-v2 | D |
| `galeria` | Grid/masonry/carrusel 2–24 imágenes con lightbox | `layout(grid\|masonry\|carrusel)`, `columnas`, `lightbox`, `items[{url,alt,leyenda?}]` | stagger + hover-zoom | mvp-v2 | D |
| `separador` | Separador decorativo (perforación de ticket, onda, línea, puntos) | `estilo`, `tamano` | opcional trazo | mvp-v2 | D |
| `espaciador` | Espacio vertical vacío ajustable (estructural) | `alto∈xs..xl` | no | mvp-v2 | D |
| `botones_sociales` | Fila "sígueme" (IG/TikTok/WhatsApp/YT/X/FB) | `titulo?`, `estilo`, `redes[{red, url}]` | hover-lift + stagger | mvp-v2 | C |
| `logos_confianza` | Banda de logos/aliados/medios, marquee o grilla | `titulo?`, `items[{imagenUrl, alt}]`, `animacion(estatica\|cinta)` | marquee CSS | mvp-v2 | D |
| `meta_progreso_sorteo` | Barra/termómetro hacia meta de tickets (goal-gradient) + hitos | `metaTickets`(req), `estilo(barra\|termometro)`, `mostrarRestantes`, `hitos[]` | barra crece + count-up | mvp-v2 | C |
| `garantias_sorteo` | "Cómo elegimos al ganador" — transparencia (post caso Naya Fácil) | `titulo`, `metodo`, `items[{icono,titulo,desc}]?` | stagger reveal | mvp-v2 | C |
| `compartir_sorteo` | Botones de difusión (WhatsApp/copiar/X/Telegram) — motor viral | `mensaje?`, `canales[enum]` | micro "copiado" | mvp-v2 | C |
| `columnas` | Layout 2–3 columnas de **contenido-hoja tipado** (anti-canvas: NO anida widgets) | `distribucion`, `celdas[union: texto\|imagen\|icono_texto\|boton]` (2–3) | reveal on-scroll | pro | D |
| `features_bento` | Grilla asimétrica "bento" de features (con celda destacada) | `items[{icono∈ICONOS_BENEFICIO, titulo, desc, destacado}]` (2–6) | stagger + hover-lift | pro | C |
| `premio_destacado` | Vitrina hero-secundaria del premio (imagen deseable + valor) | `layout`, `nombre?`(fallback Raffle), `descripcion?`, `imagenUrl?`, `valorEstimado?` | parallax leve | pro | C |
| `galeria_premios` | Vitrina de VARIOS premios (1º/2º/3º) — editorial | `items[{nombre, imagenUrl?, detalle?}]` (1–12) | stagger + confetti opc. | pro | D |
| `linea_tiempo` | Timeline de hitos del sorteo (lanzamiento→cierre→sorteo→entrega) | `items[{fecha?, titulo, desc?, icono?, estado}]` (2–8) | línea se dibuja + hitos secuenciales | pro | D |
| `cinta_texto` | Marquee de texto tipo ticker ("SORTEO ABIERTO · ENVÍO INSTANTÁNEO") | `mensajes[]`, `separador`, `velocidad` | marquee CSS | pro | D |
| `producto_spotlight` | Destaca UN producto (referencia por `productoId`, precio server-side) | `productoId:cuid`, `titulo?`, `disposicion` | entrada + hover imagen | pro | C |
| `ticker_actividad` | "Alguien sumó N tickets" — **anonimizado**, feed real server-side | `modo(anonimo)`, `ventanaHoras`, `plantilla?`, `maxItems` | AnimatePresence entrada/salida | pro | C |
| `resultado_sorteo` | Anuncia ganador de raffle CERRADO (ganador **enmascarado** server-side) | `titulo`, `enmascararGanador`, `mostrarPremio` | reveal blur→focus | pro | C |
| `talonario_visual` | Grilla visual de tickets vendidos/libres estilo talonario | `maxCeldas`, `estilo(talonario\|grilla_puntos)` | celdas se llenan stagger | pro | D |
| `stretch_goals_sorteo` | Desbloqueos por umbral ("a 500 tickets, 2º premio") | `niveles[{en, premio, desc?}]` (1–6) | nivel se desbloquea (glow) | pro | C |
| `badge_meta_restante` | Píldora de escasez honesta ("faltan X" / "cierra en") — inline | `metaTickets?`, `formato`, `intensidad` | pulso si "fuerte" | pro | C |
| `slider_hero` / `hero_carrusel` | Slider full-bleed 1–8 slides (imagen+titular+CTA) | `slides[]`, `autoplay`, `intervaloSeg`, `altura`, `efecto` | fade/deslizar/ken_burns | pro | D |
| `spotify` | Reproductor embebido (track/álbum/playlist) vía iframe oficial | `ref("tipo:id")`, `titulo?`, `tema`, `compacto` | facade hover | pro | D |
| `galeria_social` | Grilla CURADA de posts IG/TikTok embebidos (facade por celda) | `posts[{red, ref}]` (máx 9), `columnas` | stagger reveal | pro | D |
| `live_countdown_social` | Countdown a un live anunciado + CTA al perfil (sin detección real) | `fechaHoraISO`, `red`, `perfilUrl`, `ctaTexto`, `mensajePostInicio` | flip dígitos + pulso CTA | pro | C |
| `video_fondo` | Sección full-bleed con video de fondo mudo + poster obligatorio | `videoUrl`, `posterUrl`(req), `overlayOscuridad`, `altura`, texto/CTA | loop mudo / ken-burns poster | después | D |
| `mapa` | Mapa embebido (OSM sin API key) para retiro/evento físico | `lat`, `lng`, `zoom`, `titulo`, `direccionTexto` | no | después | D |
| `audio_player` | Reproductor de un audio subido (jingle/mensaje) | `audioUrl`, `titulo`, `autor` | no | después | D |
| `captura_email` | Bloque de captura de lista (Resend) — **gated por decisión de producto** | `titulo`, `descripcion?`, `ctaTexto` (handler server-side) | — | después | C |
| `oferta_destacada` | Banda de UNA oferta con precio tachado (texto plano, no autoritativo) | `precioAntes?`, `precioAhora`, `cta*`, `imagenUrl?` | — | después | C |
| `sorteo_en_vivo` / `draw_reveal` | Ruleta de reveal del ganador (sobre resultado_sorteo, número anonimizado) | `duracionSegundos`, `autoIniciar` | ruleta/slot | después | C |

### Widgets EXISTENTES (13) — todos ganan `estiloSeccion` + entrada + microinteracciones

| widget | Estado | Props nuevas / cambios |
|---|---|---|
| `hero` | [ya existe] | **+`variante(split\|centrado\|imagen_fondo\|minimal)`**, `overlayOscuridad`, `ctaSecundario*` (2º CTA "Ver bases"), gradiente animado del `HeroVisual` sin imagen [pro] |
| `catalogo` | [ya existe] | stagger de tarjetas + hover-lift + zoom portada (incorporado) |
| `sorteo_vitrina` | [ya existe] | confetti al resolverse [pro]; lee token de fondo de la sección en vez de hardcodear `default-hover` |
| `como_funciona` | [ya existe] | stagger de pasos |
| `contador_tickets` | [ya existe] | count-up del total + barra `Progress` crece 0→pct |
| `urgencia_countdown` | [ya existe] | pulso de segundos si `intensidad:"fuerte"` |
| `testimonios` | [ya existe] | stagger + hover-lift |
| `ganadores` | [ya existe] | **+`fuente(manual\|automatico)`** + `maxAutomaticos` (modo auto lee raffles CERRADOS con ganador enmascarado); stagger |
| `faq` | [ya existe] | stagger (Accordion ya anima) |
| `video` | [ya existe] | solo entrada de sección (nada dentro del iframe) |
| `embed_social` | [ya existe] | solo entrada de sección; altura reservada ya evita CLS |
| `whatsapp_flotante` (overlay) | [ya existe] | entrada scale al montar + micro-bounce ocasional [pro]. **No lleva `estiloSeccion`** (es overlay) |
| `aviso_barra` (overlay) | [ya existe] | slide-down al montar. **No lleva `estiloSeccion`** |

**Dedup resuelto:** `banner_cta`=`cta_band` (unificado a `banner_cta`); `separador`=`divisor`; `logos_confianza`=`logos_prensa`; `texto_rico` (bloques tipados) elegido sobre `bloque_texto` (markdown) por seguridad; `beneficios_grid` (simple, mvp) y `features_bento` (asimétrico, pro) coexisten; `garantias_sorteo` (dominio) absorbe `garantia_confianza` (badges genéricos). `estadisticas` resuelto a **`valor:number + sufijo`** (no string) porque el count-up parsea confiable y evita ambigüedad.

---

## 3. Sistema de estilo por sección y página

### 3.1 `estiloSeccion` — campo hermano opcional del envelope de sección `[mvp-v2]`

Va **junto a `id`/`tipo`/`v`/`props`**, no dentro de `props` (que está discriminado por tipo). Requiere un helper `nodoSeccion()` en `schema.ts`; los **overlays siguen con `nodo()` pelado** (no llevan estilo de sección). Un `<SeccionWrapper>` compartido reemplaza el `<Box component="section" py> + <Container>` que hoy cada widget repite: los widgets **sueltan su chrome de sección** y el render los envuelve uniformemente.

**Decisión de diseño fuerte — esquemas de color emparejados (modelo Shopify color schemes):** fondos sólidos y gradientes se modelan como **esquemas que empaquetan fondo + color de texto legible**, no dos ajustes sueltos. Así el contraste WCAG queda garantizado por construcción y ni el Organizador ni el LLM del MCP pueden crear una sección ilegible. Todo referencia **roles de token del tema del tenant**, resueltos a `var(--mantine-color-marca-N)` (o al primario de plataforma si el tenant no tiene color) por una función pura `estiloSeccionACss()` espejo de `gradienteTematico` — SSR+cliente sin mismatch.

```ts
// widgets.ts (fuente única de enums, client+server safe)
export const ESQUEMAS_FONDO = [
  "tema",           // transparente, hereda fondo de página (DEFAULT)
  "superficie",     // blanco / (dark) tinta — texto tinta
  "superficie_alt", // banda gris (gray-1) — texto tinta
  "marca_suave",    // marca-0/1 — texto tinta
  "marca",          // marca-6 filled — texto claro (autoContrast)
  "marca_profundo", // marca-8 — texto claro
  "tinta",          // gray-9 — texto claro
] as const;
export const GRADIENTES = ["marca_suave","marca_vivo","tinta","papel"] as const; // marca_vivo = gradienteTematico actual
export const OVERLAY_IMAGEN = ["ninguno","tinta","marca","claro"] as const;
export const POSICION_IMAGEN = ["centro","arriba","abajo","izq","der"] as const;
export const PATRONES = ["ninguno","puntos","grilla","diagonales","perforacion"] as const; // perforacion = motivo talonario
export const ESPACIADO_V = ["ninguno","s","m","l","xl"] as const;          // 0/md/xl/48/80px
export const ANCHO_SECCION = ["contenido","ancho","completo"] as const;    // Container lg / xl / full-bleed
export const FORMAS_DIVISOR = ["ninguno","onda","diagonal","curva","triangulo","perforacion"] as const;
export const ALTURA_DIVISOR = ["s","m","l"] as const;

export const FondoSeccionSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("esquema"),   esquema: z.enum(ESQUEMAS_FONDO) }).strict(),
  z.object({ tipo: z.literal("gradiente"), preset: z.enum(GRADIENTES) }).strict(),
  z.object({ tipo: z.literal("imagen"),
    url: urlPublica,
    overlay: z.enum(OVERLAY_IMAGEN).default("tinta"),
    opacidadOverlay: z.number().int().min(0).max(90).default(45), // step-clamp, no CSS
    posicion: z.enum(POSICION_IMAGEN).default("centro"),
    fijo: z.boolean().default(false),                             // parallax-lite (desktop only)
  }).strict(),
  z.object({ tipo: z.literal("patron"),
    patron: z.enum(PATRONES), esquema: z.enum(ESQUEMAS_FONDO).default("superficie"),
  }).strict(),
]);

export const EstiloSeccionSchema = z.object({
  fondo: FondoSeccionSchema.optional(),                    // ausente ⇒ "tema"/transparente
  padY: z.enum(ESPACIADO_V).default("l"),                  // = py actual (xl/48)
  ancho: z.enum(ANCHO_SECCION).default("contenido"),
  entrada: z.enum(PRESETS_ENTRADA).default("heredar"),     // ver §4
  divisorInferior: z.object({
    forma: z.enum(FORMAS_DIVISOR).default("ninguno"),
    altura: z.enum(ALTURA_DIVISOR).default("m"),
    invertir: z.boolean().default(false),
  }).strict().optional(),
}).strict();
```

**Divisores (shape dividers)** — SVG inline generado por NOSOTROS de un registro de paths acotado, nunca markup del tenant. Solo divisor **inferior** (entre dos secciones basta uno). El color del divisor = esquema de la sección siguiente (lee como transición), resuelto por el wrapper. `onda`/`diagonal`/`curva` [mvp-v2]; `triangulo`/`perforacion` [pro]. `divisorSuperior` [después].

**Degradación:** `estilo` ausente ⇒ defaults (transparente, padY L, contenido) = idéntico al render actual, cero regresión. `fondo.tipo:"imagen"` con URL rota ⇒ cae a `gradienteTematico(colorPrimario)` (mismo fallback que el hero hoy). `patron` sin soporte ⇒ solo el esquema base. Fondos `marca_*`/`tinta` voltean la tinta del texto para contraste garantizado.

### 3.2 `TemaPagina` — poblar el `root.props` hoy vacío `[mvp-v2]`

`TemaSchema` es hoy `z.object({}).strict()`. Se extiende **aditivo-opcional** (todo `.default()`) para que docs con `root.props:{}` sigan parseando sin migración ni bump. El `colorPrimario` **NO se duplica** al documento — sigue como columna de `Tenant` (fuente única, I2); el tema solo aporta lo que hoy no existe.

```ts
export const MODO_COLOR = ["claro","oscuro"] as const;                    // dark mode de la TIENDA
export const RADIO_GLOBAL = ["nulo","s","m","l","completo"] as const;
export const VIBE = ["nitido","suave","editorial"] as const;             // dial de radius+sombra

export const TemaSchema = z.object({
  modo: z.enum(MODO_COLOR).default("claro"),                             // aplica vía colorScheme Mantine
  radio: z.enum(RADIO_GLOBAL).default("m"),                             // override defaultRadius storefront
  vibe: z.enum(VIBE).default("suave"),
  tipografia: z.enum(PARES_TIPOGRAFICOS).default("plataforma"),
  anchoContenido: z.enum(["contenido","ancho"]).default("contenido"),   // default heredado por secciones
  fondoPagina: z.enum(ESQUEMAS_FONDO).default("superficie"),            // pinta el <body>/shell
}).strict();
```

### 3.3 Pares tipográficos curados `[mvp-v2]`

Modelo Shopify (heading+body curados, **no fuente libre** — seguridad + perf + licencias). `next/font` es build-time, así que el set se declara COMPLETO en `src/config/fonts.ts`; el render mapea `enum → CSS var`. Set acotado (recortar a 5 si el peso preocupa), `subset:['latin']`, `display:'swap'`, `preload:false` para los no-default.

```ts
export const PARES_TIPOGRAFICOS = [
  "plataforma", // Bricolage Grotesque + Instrument Sans — YA cargado (default)
  "editorial",  // Fraunces + Inter — elegante/boutique
  "energia",    // Space Grotesk + Inter — techy/fandom moderno
  "dulce",      // Poppins + Nunito Sans — redondeado (merch/kpop)
  "impacto",    // Anton + Roboto — poster/urgencia
  "clasica",    // Playfair Display + Source Sans 3 — refinada
  "tecnica",    // IBM Plex Sans + IBM Plex Mono — limpia/mono
] as const;
```

### 3.4 Estrategia de migración (`v` por nodo) — **es no-op** `[mvp-v2]`

- **Nodos sin `estilo`:** campo `.optional()` en el envelope ⇒ parsean tal cual. Cero código en `migrate.ts`.
- **`root.props:{}` viejo:** todos los campos de `TemaSchema` tienen `.default()` ⇒ `{}` parsea y Zod rellena. Cero código.
- **Sin bump de `schemaVersion`** (sigue `literal(1)`): el cambio es aditivo-opcional, no estructural. El `v` por-nodo de cada widget **tampoco sube** (el estilo vive en el envelope, no en `props`). Excepción: `hero` (+`variante`) y `ganadores` (+`fuente`) sí bumpean su `v` con migrate-on-read trivial (default conserva el look actual).
- **Único cambio estructural real:** `nodo()`→`nodoSeccion()` en las 11 ramas de `SeccionNodeSchema`. La exhaustividad ya está testeada (F02) — el test atrapa cualquier rama olvidada.

### 3.5 Prohibido `[nunca]`

Color-picker de hex arbitrario por sección · gradientes con stops libres · `customCss` / `styleAttr` · nombre de fuente libre. Rompen "cero hex" (§9 design.md) y la misma clase que `html`/`iframeSrc` de ADR-0018. "Más colores" = enriquecer la escala del tenant (p.ej. un 2º color de acento como columna validada de `Tenant`), no abrir hex por sección.

---

## 4. Sistema de animación

### 4.1 Decisión de convención (gate previo, requiere OK del dueño)

`motion` está hoy **prohibido en el storefront** (I5 / design.md §7). El pedido "con animaciones" **exige levantar esa regla** — pero de forma controlada: (a) `motion` se importa en **un solo módulo** `src/components/storefront/animar.tsx`, nunca inline en widgets; (b) editar design.md §7 e I5 a "motion en storefront solo vía la primitiva compartida, siempre con `useReducedMotion`". Registrar como decisión/ADR. **El sistema de estilo (§3) NO depende de motion y puede shippear sin tocar esta regla** — si se prefiere, las entradas pueden hacerse CSS-puro (`@keyframes` + IntersectionObserver) como alternativa sin motion.

### 4.2 Wrapper `Animar` lazy — único punto de entrada `[mvp-v2]`

```ts
<Animar preset="subir" stagger={false}>...</Animar>
<AnimarItem index={i}>...</AnimarItem>   // stagger de hijos
```

Internamente: `motion` con `whileInView`, `viewport={{once:true, margin:"-80px"}}`, `useReducedMotion()`, guard SSR, y **`LazyMotion + domAnimation`** para bajar el feature-set a ~4-5kb en vez del bundle completo. Un solo lugar tunea duración/ease (design.md §7: entradas = slow/400ms, `easeOut`).

### 4.3 Presets de entrada por sección (enum EXACTO) `[mvp-v2]`

```ts
export const PRESETS_ENTRADA_BASE = [
  "ninguna",    // sin animación
  "aparecer",   // fade puro
  "subir",      // fade + translateY 24px→0 (= RevelarAlScroll actual)
  "escala",     // fade + scale 0.96→1
  "desenfoque", // fade + blur 8px→0 (el toque "premium" Framer)
] as const;
export const PRESETS_ENTRADA = ["heredar", ...PRESETS_ENTRADA_BASE] as const; // heredar ⇒ tema.entradaPorDefecto
```

Deliberadamente **sin slide horizontal** (riesgo de scroll-x / CLS en mobile). Solo se anima `transform` + `opacity` + `filter:blur`. Duración/ease fijos — el Organizador elige el preset, no los tiempos. **Stagger de hijos** en grids (catálogo, testimonios, ganadores, galería, estadísticas, features): `delay = index*60ms`, cap ~8 hijas, `staggerChildren`, cero layout shift (las celdas ya ocupan su lugar).

### 4.4 Microinteracciones — INCORPORADAS (no configurables) `[mvp-v2]`

La microinteracción es identidad del **tipo** de widget, no un setting (el Organizador no debería poder apagar el count-up de un contador). Todas CSS-puro salvo count-up/confetti:

- **Cards** (catálogo/testimonios/ganadores/galería/features): hover-lift `translateY -4px` + sombra + imagen `scale 1.03` con `overflow:hidden`. CSS puro.
- **`estadisticas` / `contador_tickets`**: **count-up** al entrar al viewport (IntersectionObserver + rAF, sin motion). SSR renderiza el **valor final** (cacheable/accesible); el count-up solo se activa client-side si el nodo no fue visto.
- **`urgencia_countdown`**: pulso de segundos solo si `intensidad:"fuerte"`.
- **CTA principal** (hero, `banner_cta`): pulso/glow sutil del botón (~4s, box-shadow breathing). Uno por vista.
- **`logos_confianza` / `cinta_texto`**: marquee infinito CSS (contenido duplicado seamless), pausa en hover.
- **`aviso_barra`**: slide-down al montar.
- **Confetti [pro]**: `ganadores` al entrar / `sorteo_vitrina` al resolverse — burst corto ~1.5s, **una vez**, `pointer-events:none`, colores derivados de la escala del tenant, lazy `dynamic(import)` fuera del bundle base.

### 4.5 Ambient `[pro]`

Gradiente animado del `HeroVisual` sin imagen (`background-position` loop ~8-12s, CSS puro) · parallax suave de `imagenFondoUrl` (`useScroll`+`useTransform`, factor ~0.1-0.2, **nunca en mobile**).

### 4.6 Reglas duras (obligatorias)

1. **`prefers-reduced-motion` SIEMPRE** ⇒ toda animación colapsa a estado final visible. Test obligatorio.
2. **CLS=0**: animar **solo** `transform`/`opacity`/`filter:blur`. Nunca `height`/`top`/`margin`/`width`. Slots reservan tamaño.
3. **SSR-safe / caché anónima** (ADR-0018/0019): el HTML público es cacheable y **no puede variar por viewer**. El contenido renderiza **VISIBLE en SSR**; el wrapper "rebobina" a invisible→anima solo client-side tras hidratar. **Prohibido** el patrón "SSR con `opacity:0` esperando JS" (a diferencia de la landing — hay que endurecer el `RevelarAlScroll` actual). Count-up SSR = número final.
4. **Bundle**: motion en un solo módulo + `LazyMotion`. Hover/marquee/pulso = CSS. Count-up = IO+rAF. Confetti = lazy dynamic.
5. **Theming determinista**: colores de partículas/gradientes/fondos SIEMPRE de tokens de la escala del tenant, cero hex inline.
6. **Acotamiento**: presets = enums cerrados. Nunca `duration`/`delay`/`easing` libres desde el documento. El LLM del MCP solo elige de la enum.
7. **Una animación por elemento**: no apilar entrada + parallax + pulso en el mismo nodo.

**Test:** unit (schemas parsean defaults/rechazan enums fuera de rango; exhaustividad de presets tipo `never`; reduced-motion mockeado ⇒ markup visible sin wrapper; count-up con `matchMedia reduce` ⇒ valor final inmediato) · SSR (`renderToString` ⇒ contenido sin `opacity:0`) · E2E (`browser-verify`: entradas ocurren, reduce ⇒ todo visible, sin scroll-x, marquee/confetti no rompen layout; Lighthouse CLS≈0).

---

## 5. Lo honesto — qué queda fuera y por qué

**`[nunca]`:**
- **`contador_seguidores` en vivo** — el conteo de IG/TikTok NO es obtenible sin API con app-review + token del tenant; los scrapers son pagos, frágiles y violan ToS. La única versión honesta (número escrito a mano) invita a inflar cifras ⇒ **no construir**.
- **`muro_social` / UGC por hashtag** — requiere API de pago + moderación (Taggbox/Curator). Imposible bajo "simple y barato". El caso real lo cubre `galeria_social` con posts curados a mano.
- **`ticker` con nombres/iniciales reales de compradores** — viola ADR-0004 (identidad = correo, no se expone); derivar nombre del email = exposición de PII sin consentimiento. Solo la versión **anonimizada** (`ticker_actividad`) es construible.
- **`contador_participando_ahora` / presencia en vivo** — no hay infra realtime; la práctica de la industria es **fabricar** el número, el anti-patrón de confianza exacto (caso Naya Fácil) que el producto quiere evitar.
- **`tabla_precios`** (SaaS tiers) y **`antes_despues`** (skincare/fitness) — cero valor para este vertical; ruido en el catálogo. La interacción drag del before/after además es cara de hacer accesible.
- **`html_libre` / `codigo_incrustado` / `css_custom`** — prohibido por construcción (ADR-0018). Descartado explícitamente para cerrar la tentación.
- **oEmbed de IG/TikTok/Twitter** — devuelve `<blockquote>+<script>` (HTML libre, viola I3) y exige `connect-src` a terceros. Todo social viable pasa por iframe con `src` construida vía `construirEmbedSrc`, nunca oEmbed.

**`[después]` (gated por infra o decisión):**
- **`galeria`, `slider_hero`, `video_fondo`, `audio_player`** dependen de **storage multi-imagen/video** — hoy `storagePublico.ts` solo firma PUT de `image/*` con **slots fijos** (`logo`/`hero`/`portada`/`premio`). Falta el namespace `<tenantId>/pagina/<assetId>` + allowlist de content-types + límites de peso + probablemente un modelo `PageAsset`. Es la pieza de infra más grande; diseñarla una vez para los cuatro. (`galeria` se marca mvp-v2 **condicionada** a que esta infra entre en la misma fase.)
- **`video_fondo`** — costo alto (peso móvil, LCP, egress R2, sin adaptive streaming). YouTube-como-fondo desaconsejado (controles/branding, autoplay-mudo-loop inestable bajo el sandbox de ADR-0018). Poster obligatorio.
- **`captura_email`** — choca con "sin cuentas de comprador" (ADR-0004); no es una cuenta pero requiere **decisión de producto** (consentimiento, dónde viven los emails, quién los maneja). No modelar hasta esa decisión.
- **`oferta_destacada`** — riesgo de desincronización precio-mostrado vs. precio-cobrado (el precio real sale del `Product`/`Decimal` server-side). Solo como narrativo no-autoritativo, o derivado de un `Product` referenciado.

**Cambios de dominio, NO widgets** (escalarlos como decisiones, no como superficie del builder):
- **`paquetes_promos` / 3x2** — requiere motor de pricing que no existe (`Order`/`OrderItem` snapshotean precio unitario × cantidad, sin concepto de promo/bundle/descuento). Es un épico de dominio comercial ($transaction, snapshot, UI checkout). Lo construible barato es `packs_tickets` presentacional que enlaza productos reales a su precio real **sin descuento efectivo** — el copy no puede prometer un descuento que el checkout no aplica.
- **`multiples_sorteos` simultáneos** — viola el invariante S5 (un `Raffle` ACTIVO por tenant), horneado en `getSorteoActivoStorefront` y en toda la lógica de tickets. Cambio de arquitectura del dominio, no un widget.

**Nota de honestidad en widgets que SÍ entran:** `spotify` no reproduce en autoplay (bloqueado por navegador+Spotify); `live_countdown_social` no puede saber si el live está realmente activo (solo cuenta a la hora anunciada — el copy debe decir "empieza a las…"); `estadisticas`/`talonario_visual` son cifras **narradas por el Organizador** o volumen visual, NO se conectan a datos server-side que la plataforma garantice como veraces (los números reales del sorteo los da `contador_tickets`/`meta_progreso_sorteo`).

---

## 6. Orden de construcción sugerido

**Fase 0 — Gates de decisión (bloquean todo lo animado y de marca):**
1. OK del dueño para **levantar `motion` al storefront** (vía módulo único) + editar design.md §7 e I5. Registrar ADR.
2. Confirmar que la **paleta/nombre de marca** ya no bloquea (el sistema tematiza per-tenant, no por marca de plataforma — este catálogo es agnóstico de esa decisión abierta).

**Fase 1 — Transversales primero (o el resto es cosmético):**
1. **Ampliar `ICONOS_PASO → ICONOS_BENEFICIO`** (dependencia de ~7 widgets, hacerlo una vez).
2. **`estiloSeccion` + `TemaPagina`**: helper `nodoSeccion()`, enums en `widgets.ts`, `estiloSeccionACss()` en `tenantTheme.ts`, `<SeccionWrapper>` + refactor de las 11 secciones para soltar su chrome, `render-pagina.tsx`, pares tipográficos en `fonts.ts`. Verificar migración no-op. Divisores básicos.
3. **`animar.tsx`** (`LazyMotion`) + presets de entrada + `useCountUp` + microinteracciones CSS incorporadas en los 13 existentes. Endurecer el patrón SSR-visible.
4. **Tools MCP de estilo**: `set_section_style`, `set_page_theme`, `list_style_options` (espejo de `list_widget_types`, con descripción semántica de una línea por enum para que el LLM elija por intención nombrada, no por hex).

**Fase 2 — Widgets [mvp-v2] sin infra nueva** (paridad Wix/Squarespace):
`beneficios_grid`, `estadisticas`, `banner_cta`, `bloque_ticket_promo`, `texto_rico`, `imagen_destacada`, `separador`, `espaciador`, `botones_sociales`, `logos_confianza`, + variantes de `hero`. Widgets de conversión de dominio: `meta_progreso_sorteo`, `garantias_sorteo`, `compartir_sorteo`. (`ganadores` modo automático + `resultado_sorteo` comparten **un use case público** `getSorteoResumenStorefront` que extiende el actual con `{resultado, actividadReciente}` opcionales, todo enmascarado/agregado server-side — buen momento para construirlo aquí.)

**Fase 3 — Infra de storage multi-imagen** + widgets que la consumen:
`galeria` (promoverla a mvp-v2 efectivo aquí), luego `[pro]`: `galeria_premios`, `slider_hero`.

**Fase 4 — Widgets [pro] restantes:**
`columnas` (con guardarraíl anti-canvas), `features_bento`, `premio_destacado`, `linea_tiempo`, `cinta_texto`, `producto_spotlight`, `ticker_actividad`, `talonario_visual`, `stretch_goals_sorteo`, `badge_meta_restante`, `spotify`, `galeria_social`, `live_countdown_social`. Ambient animations + confetti.

**Fase 5 — Superficie visual del builder:**
Aquí encaja la construcción de la UI del panel de edición (el pedido "después de esta investigación se construye la superficie visual"). Se apoya en `list_widget_types` + el nuevo `list_style_options` como catálogo navegable; cada widget necesita su **preview/thumbnail** en el picker, y el panel de estilo por sección consume `EstiloSeccionSchema` (los enums renderizan como selects con muestras visuales — esquemas de fondo como swatches, presets de entrada como mini-demos). El **login desde la tienda** (el Organizador entra a editar su propia store) es un flujo de auth aparte: NextAuth ya resuelve Organizadores por Google OAuth; falta el **entry-point contextual** (botón "Editar mi tienda" en el storefront cuando la sesión del Organizador coincide con el tenant del subdominio) — decisión de UX del panel, no del catálogo. Escalarlo como ítem propio del plan de la superficie visual.

**Fase 6 — [después] gated:**
`video_fondo`, `mapa`, `audio_player`, `captura_email` (tras decisión de producto), `oferta_destacada`, `sorteo_en_vivo`. Cada uno espera su gate (infra de video, decisión de datos personales, o dependencia de `resultado_sorteo` ya construido).

**Checklist invariante por widget nuevo** (sin excepción): `xxxProps = z.object({...}).strict()` + `export type` + entrada en `WIDGET_REGISTRY` con `defaultProps` que parsea + rama en `SeccionNodeSchema` (o `OverlayNodeSchema`) + componente Mantine con degradación por gradiente + branch en `render-pagina.tsx`. Ninguna prop admite HTML/CSS/URL-de-iframe crudo: texto = string plano acotado, formato = discriminated-union de bloques cerrados, estilo = enums→tokens, imágenes = `urlPublica`, embeds = `{red, ref}` vía `construirEmbedSrc` (nueva red = entrada en `DEFS` de `embeds.ts`, que propaga a `frame-src` del CSP por la fuente única). El candado `never` de exhaustividad (F02) obliga a cerrar cada rama.