<!-- Investigación multi-agente (workflow Opus 6 dimensiones + síntesis), 2026-07-24. Matriz de capacidades de editores top vs nuestro builder + roadmap por tandas. -->

# Mapa del potencial del page builder — de Sortéatelo a "casi como Wix"

## 1. Veredicto

Estamos **más avanzados de lo que el gap del mockup sugiere, pero en el eje equivocado**. En *arquitectura de theming y contenido* llevamos ~70% del camino de un builder serio: nuestro modelo de esquemas de fondo emparejados (fondo+texto legible por construcción), tokens del tenant sin hex inline, tema global + override por sección acotado a enums, dark mode real, pares tipográficos curados, animación on-scroll SSR-visible con reduced-motion duro, embeds sandbox y el doc JSON validado por Zod editable-por-LLM — es esencialmente **la arquitectura de Shopify Online Store 2.0**, que es el mejor modelo del mercado para nuestro caso, y en varios puntos (legibilidad garantizada, curaduría anti-snowflake, editabilidad por LLM) es *superior* a Wix/Webflow, que compran su potencia al precio de páginas rotas e inconsistentes. Donde estamos **atrasados es en tres frentes concretos**: (a) la *amplitud de la paleta curada* (un solo color de marca, pocos esquemas/gradientes, cero estilo por-palabra) — barato de cerrar; (b) tres *capacidades de arquitectura* que el modelo actual no contempla (texto rico estructurado con runs, responsive override por nodo, chrome/header/footer editable + multi-página); y (c) sobre todo, **la UX del editor**, que hoy se siente como "formulario de admin" porque el canvas es un iframe pasivo que se recarga entero tras cada cambio. La conclusión estratégica: **no necesitamos volvernos Wix — necesitamos curar los mejores resultados de Wix como presets acotados y hacer que el editor se sienta vivo.** El terreno que falta es conocido, acotado y en su mayoría aditivo (migraciones no-op); casi nada exige romper invariantes, y lo que sí los rompería (CSS/HTML libre, posicionamiento absoluto, timelines libres) es justamente lo que debemos declinar por escrito.

---

## 2. Matriz de capacidades

Deduplicada entre las 6 dimensiones. Estado: **[tenemos]** · **[gap-facil]** (calza en enum/Zod actual, aditivo) · **[gap-arq]** (exige evolucionar el modelo) · **[nunca]** (viola invariantes / foot-gun probado).

### Layout y composición

| Capacidad | Cómo lo hacen ellos | Estado | Diseño en nuestro modelo |
|---|---|---|---|
| Flujo vertical de secciones | Shopify: section→blocks tipados | **[tenemos]** | `secciones[]` + `overlays[]`, orden = posición |
| Ancho full-bleed vs contenido | Webflow/Shopify: sección full-width + container interno | **[tenemos]** | `ancho` enum (contenido/ancho/completo) + `anchoContenido` en Tema |
| Columnas acotadas por widget | Shopify: `columns_desktop:1–5` por sección | **[tenemos]** parcial | enum `columnas` en catálogo/beneficios/galería; ampliar a más widgets = fácil |
| Fondo full-bleed + contenido centrado | Universal (sección ancha, container angosto) | **[gap-facil]** | separar `anchoFondo` de `anchoContenido` (2 enums) → habilita bicolor a todo el ancho |
| Alturas de sección (100vh hero, min-height) | Fluid Engine "Fill Screen"; Framer min-height vh | **[gap-facil]** | `altoMin` enum (auto/media/pantalla con `svh`) + `alinearVertical` enum |
| Espaciado por escala | Shopify range-steps; resto px libre | **[tenemos]** | `padY` enum de 5; ampliar a `padTop`/`padBottom` + `gap` enum = fácil |
| Fila/columnas con slots tipados | Framer Stacks / Webflow flex / Elementor containers | **[gap-arq]** | widget `fila` con `columnas: Nodo[][]` (slots), reparto enum (50/50, 66/33…), whitelist de tipos por slot, **profundidad máx 2** |
| Sticky por sección arbitraria | position:sticky en cualquier elemento | **[gap-arq]** bajo ROI | preferir overlays dedicados; no exponer `sticky:bool` genérico |
| Duplicar / copiar-pegar secciones | Universal (Ctrl+D, cross-page) | **[gap-facil]** | mutación `duplicate_section` (clona nodo, id nuevo); pegar re-valida contra schema, referencias re-resueltas por tenant destino |
| Anidamiento recursivo N-niveles | Webflow/Elementor box model | **[nunca]** | viola "2 niveles, sin CSS libre"; el widget `fila` cubre el 80% real |
| Grid posicional con solape / coordenadas x/y | Fluid Engine 24-col, Wix docking, position:absolute | **[nunca]** | geometría arbitraria, no degradable ni razonable por LLM |

### Estilo y theming

| Capacidad | Cómo lo hacen ellos | Estado | Diseño en nuestro modelo |
|---|---|---|---|
| Esquemas de color emparejados | Shopify Dawn: N schemes bg+text+button | **[tenemos]** | `ESQUEMAS_FONDO` (7), legibles por construcción vía `esquemaACss` |
| **Segundo color de marca / acento** | Wix paleta 5 colores; todos tienen acento | **[gap-arq]** ⭐ | `colorAcento` en `Tenant` + escala derivada + CSS var — **la llave maestra**, desbloquea bicolor/botón acento/multi-color |
| Fondo bicolor / split | Preset split o gradiente 2 stops | **[gap-facil]** (con acento) | rama `tipo:"bicolor"` en `FondoSeccion`: colorA/colorB (tokens), direccion enum, mezcla (duro/suave) |
| Gradientes preset | Shopify scheme gradient | **[tenemos]** | 4 presets; ampliar catálogo + `angulo` enum sobre tokens |
| Gradiente libre / mesh / stops arbitrarios | Wix/Framer editor de gradiente | **[nunca]** | solo presets + `angulo` enum; mesh como asset SVG pre-generado |
| Pares tipográficos curados | Squarespace font packs; Shopify 2 pickers sueltos | **[tenemos]** ⭐ | 8 `PARES_TIPOGRAFICOS`; superior a la media (no permite combos feos) |
| Escala tipográfica global | Shopify heading/body scale % | **[gap-facil]** | `escalaTipografica` enum (compacta/normal/amplia) con `clamp()` |
| Sombra / borde por escala | Shopify escalas globales | **[gap-facil]** | `sombra` y `borde` enum en Tema, orquestados por `VIBE` (ya reservado) |
| Radio global | Shopify corner-radius | **[tenemos]** | `RADIO_GLOBAL` (5 pasos) |
| Modo oscuro | Framer/Webflow variables; Shopify simula | **[tenemos]** ⭐ | `modo` enum claro/oscuro real; opcional `auto` (prefers-color-scheme) = fácil |
| Efectos de imagen (parallax-fixed, overlay) | Universal | **[tenemos]** parcial | `fijo` + overlay opacidad; ampliar a `efecto` enum + `blur` escala = fácil |
| Video de fondo | Squarespace/Wix/Framer con poster | **[gap-arq]** | rama `tipo:"video"` + poster obligatorio (SSR/reduced-motion fallback) + pipeline subida; post-MVP |
| mix-blend-mode / opacidad libre por elemento | Webflow/Framer | **[nunca]** | foot-gun ilegible, inmanejable por LLM |
| Hex libre / nombre de fuente string / CSS crudo | Wix override local | **[nunca]** | ADR-0018; override local siempre resuelve a token/preset global |

### Texto y media

| Capacidad | Cómo lo hacen ellos | Estado | Diseño en nuestro modelo |
|---|---|---|---|
| **Formato inline (negrita/itálica) + runs** | Portable Text / Lexical / Quill | **[gap-arq]** ⭐ | subset propio de Portable Text: `children: Run[]` con `marks` enum cerrado; sanciona ADR-0018 |
| **Palabra acentuada / highlight** (mockup) | Wix/Framer color picker por selección | **[gap-arq]** ⭐ | marca `acento`/`resaltado` del sistema de runs → token de la sección (NO hex); highlight = background del propio span |
| Jerarquía de texto por bloque | Squarespace H1/H2/caption | **[gap-facil]** | más `tipo` de bloque en la union (titulo/bajada/nota), tamaño fijo curado |
| Tamaño por palabra (precio destacado) | Wix size libre | **[gap-arq]** | marca `escala` enum (sm/lg/xl) en runs, nunca px |
| Links inline | Portable Text markDefs | **[gap-arq]** | anotación destino discriminada (ancla/página/producto/url validada) |
| Listas, citas, divisores | Editor de texto | **[tenemos]** | `texto_rico` bloques; checklist/callout/1-nivel-anidado = fácil |
| Imagen: alt, lazy, fallback, ratio | Nivel top | **[tenemos]** ⭐ | `ImagenConFallback` + `RATIOS_IMAGEN` |
| Focal point | Sanity/Shopify punto de interés | **[gap-facil]** | `focal:{x,y}` enteros step-clamp (patrón `opacidadOverlay`) |
| Crop no destructivo | Sanity fracciones | **[gap-facil]** | `crop:{top,right,bottom,left}` 0–100 aplicado con object-position |
| Máscaras de forma (círculo/blob/arco) | Framer/Wix clip-path | **[gap-facil]** | `FORMA_IMAGEN` enum → clip-path curado (blob/arco/ticket reusa `perforacion`) |
| Galería (grid/masonry/carrusel/lightbox) | Nivel top | **[tenemos]** | 3 layouts + lightbox; autoplay/flechas/loop = props enum fáciles |
| Video embed | YouTube/Vimeo/TikTok iframe | **[tenemos]** | `video` iframe-only; +Vimeo, +poster/facade = fácil |
| Audio embed (Spotify/SoundCloud) | Wix Music | **[gap-facil]** | widget `audio` reusa `construirEmbedSrc` (ADR-0018 ya deja el hueco) |
| Iconos curados | Wix librería enorme | **[tenemos]** | `ICONOS_BENEFICIO` Tabler enum; ampliar set = fácil |
| Adornos/stickers curados | Wix/Canva biblioteca | **[gap-facil]** | enum `ADORNO` (estrella/chispa/blob) dibujado como SVG nuestro, slots acotados |
| Variantes de imagen por breakpoint (srcset) | Webflow art direction | **[gap-arq]** | promover `urlPublica` string → objeto asset {base, mobile, focal}; el srcset automático vale más que art-direction manual |
| Upload de video/audio propio | Wix Video / Mux | **[gap-arq]** bajo ROI | contra "simple y barato"; mantener embed-only |
| Upload de SVG / iconos libres | Wix upload SVG | **[nunca]** | SVG = documento activo (XSS); con cookie wildcard ADR-0019 es crítico |
| Float real (texto envolviendo imagen) | Webflow | **[nunca]** | CLS/mobile impredecible; sustituir por 2 columnas |

### Interacción y animación

| Capacidad | Cómo lo hacen ellos | Estado | Diseño en nuestro modelo |
|---|---|---|---|
| Entrada on-scroll por preset | Framer/Wix enum | **[tenemos]** ⭐ | `PRESETS_ENTRADA`, SSR-visible, reduced-motion, CLS=0 |
| Microinteracciones (hover-lift, tilt, marquee) | Wix "Grow/Glow" | **[tenemos]** parcial | ampliar enum hover (crecer/brillo/borde/revelar) = fácil |
| **Confetti de compra/ganador** | canvas-confetti en conversión | **[gap-facil]** ⭐ | one-shot en páginas nuestras (pago-ok, revelar-ganador); enum tema; **máximo ROI para un producto de sorteos** |
| **Text reveal por palabra/letra** | Framer Text Effect stagger | **[gap-facil]** ⭐ | `AnimarItem` sobre spans de palabras; `revelarTexto` enum; cierra gap mockup |
| Gradiente de texto animado | background-clip:text | **[gap-facil]** | reusa keyframe holo existente |
| Ken burns / reveal mask | Shopify premium toggle | **[gap-facil]** | ken burns = CSS scale infinito; reveal = clip-path (agregar a whitelist CLS I-C) |
| Parallax por elemento | Framer useScroll/useTransform | **[gap-arq]** | `scrollEfecto` enum + `AnimarScroll`; rangos fijos; solo transform |
| Escenas sticky prefabricadas | GSAP pin / Framer sticky | **[gap-arq]** | 2-3 escenas curadas como widgets; desactivar en mobile |
| Typewriter | Framer/plugins | **[gap-facil]** baja prio | enum con alto/ancho reservado; se ve datado |
| Hover states ampliados | Webflow/Framer arbitrarios | **[gap-facil]** | set curado CSS transform/opacity |
| Cursor custom | Framer follower/magnetic | **[nunca]** | rompe a11y/mobile; grita "portfolio" |
| Timelines/triggers libres | Webflow Interactions 2.0 | **[nunca]** | incodificable como enum; LLM no razona keyframes |
| Lottie / Rive del tenant | Wix/Shopify upload JSON | **[nunca]** | markup/programa arbitrario + peso; matiz: 1-2 Lotties *nuestros* opcional |

### Estructura y navegación

| Capacidad | Cómo lo hacen ellos | Estado | Diseño en nuestro modelo |
|---|---|---|---|
| Announcement bar / cinta sobre nav | Shopify announcement multi-slide | **[tenemos]** base | `aviso_barra` overlay; +esquema, +posicion, +rotación, +countdown = fácil |
| FAB flotante | Botón configurable | **[tenemos]** WhatsApp | generalizar a `boton_flotante` con destino discriminado + scroll-to-top |
| Nav auto-derivado de secciones | Wix/Squarespace auto-populate | **[gap-facil]** | mapa `tipo→etiqueta` + `incluirEnNav` por sección; mata anclas hardcodeadas |
| **Header configurable** (mockup) | Shopify header section-group | **[gap-arq]** ⭐ | nodo `header` fuera de `secciones[]`: layout enum, sticky enum, transparenciaSobreHero, esquema; carrito+sesión = slots pinned no-borrables |
| **Menú como entidad** | Shopify menu por handle | **[gap-arq]** | `menuItem` discriminated union: ancla/página/url-allowlist (nunca `javascript:`), 2 niveles |
| Footer editable | Shopify footer section-group | **[gap-arq]** | nodo `footer`: columnas enum + links; atribución+bases = slots pinned |
| **Multi-página** (sobre-mí/FAQ/legal) | Shopify pages + templates | **[gap-arq]** ⭐ | DB **ya lista** (`StorefrontPage @@unique[tenantId,slug]`); falta `[slug].tsx` + panel Páginas + `enNav` flag |
| Chrome global compartido | Shopify section-groups | **[gap-arq]** | `chromeJson` a nivel Tenant (Opción A, candidata a ADR); overlays globales migran aquí |
| 404 temática | Universal | **[gap-facil]** | 404 con chrome del tenant, no editable en MVP |
| Modal bienvenida simple | Wix/Shopify popups | **[gap-facil]** | overlay con `delaySegundos` enum, 1×/sesión, descartable, focus-trap de plataforma |
| Newsletter que captura emails | Shopify signup | **[nunca]** en forma cruda | PII sin consentimiento/backend; alternativa: link al servicio del organizador |
| Motor de popups con triggers (exit-intent/scroll) | Wix/apps | **[nunca]** recomendado | peor UX/a11y; exit-intent no existe en mobile |
| Password-gate con captura de email | Shopify password page | **[nunca]** captura | mismo problema PII |

### UX del editor

| Capacidad | Cómo lo hacen ellos | Estado | Diseño en nuestro modelo |
|---|---|---|---|
| **Patch en vivo del preview** | Webflow/Framer store compartido | **[gap-arq]** ⭐ | matar `previewKey++`; `postMessage({patch, documento})` same-origin, runtime re-valida con Zod antes de pintar |
| Selección click-en-canvas + toolbar | Webflow action bar | **[gap-facil]** | overlay sobre `#node.id` (ya renderizado) + `postMessage({click,id})`; selección bidireccional |
| Edición inline de texto | Wix/Framer contentEditable | **[gap-arq]** | contrato `data-campo` en ~30 componentes; blur→`update_section_props`; plaintext-only; MVP solo campos planos de 1er nivel |
| Drag & drop de reorden | Universal | **[gap-facil]** | dnd-kit en lista lateral → un `move_section`; sin backbone |
| Chat AI dentro del editor | Wix ADI / Framer AI / v0 | **[gap-facil]** ⭐ | **MCP de 12 tools YA existe**; solo montar `DockKey:"asistente"` como cliente; con backbone se ve en vivo |
| Auto-save on-change | Wix/Notion sin botón guardar | **[gap-facil]** | quitar "Guardar X", mutación on-change debounce 500ms; Publicar sigue humano |
| Breakpoints preview (desktop/tablet/mobile) | Framer toggle | **[gap-facil]** | agregar `tablet` 768px al enum viewport (solo preview) |
| Undo/redo | Ctrl+Z stack de comandos | **[gap-arq]** | snapshot-stack cliente (fácil, 95%) → mutaciones inversas (correcto) |
| Atajos de teclado | Ctrl+Z/D/S, Del | **[gap-facil]** | capa keydown → mutaciones existentes |
| Templates al crear | Wix/Framer selección inicial | **[gap-facil]** | 3-5 docs `PageDocument` semilla → `apply_page` (ya existe) |
| Preview compartible | Framer share link | **[tenemos]** casi | `previewToken` ya alimenta el iframe; exponer link copiable + expiración |
| Zoom del canvas | Framer/Webflow | **[gap-facil]** baja prio | `transform:scale`; poco valor en landing única |
| Multiplayer real-time (cursores) | Figma/Framer | **[nunca]** | 1 dueña/tienda; lock optimista ya cubre dueña+operador |
| Overrides de valor por breakpoint en editor | Framer edición por-bp | **[gap-arq]** no deseado | preview en 3 anchos sí; editar valores distintos rompe simplicidad LLM |

---

## 3. Las 3 evoluciones de arquitectura que más desbloquean

Hay **cuatro** candidatas fuertes; resuelvo el conflicto priorizando por *cuántos gaps del mockup cierra cada una × ratio desbloqueo/costo*. El **patch en vivo del editor** es la #1 real pero pertenece a la sección 4 (UX); aquí van las tres del *modelo de datos*.

### A. Segundo color de marca (`colorAcento`) — la llave maestra, costo mínimo

**Qué es.** Hoy `Tenant` tiene un solo `colorPrimario` del que `generarEscalaColor` deriva los 10 tonos; todo el sitio es un solo hue. Añadir `colorAcento: string | null` con el mismo tratamiento (hex validado → escala derivada → CSS var `--acento-*` → token/`primaryShade`).

**Qué desbloquea.** De un golpe: el esquema `marca_acento`, botones de acento, el **fondo bicolor púrpura+dorado del mockup**, y cualquier tienda multi-color estilo Wix. Sin esto, "casi como Wix" es imposible porque Wix es multi-color por diseño.

**Costo/riesgo.** **Bajo.** Es duplicar una vez la maquinaria de `overrideDesdeBranding` en `tenantTheme.ts`. Una columna nueva nullable (migración no-op), un CSS var, y los enums que la consumen. Riesgo casi nulo: todo lo demás depende de esto pero esto no depende de nada. **Debe ir primero.**

### B. Texto rico estructurado (runs con marcas enum) — cierra el gap #1 del mockup

**Qué es.** Reemplazar `texto: z.string()` en los bloques por `children: Run[]` donde `Run = { t: string(max), m?: MARCA[] }` y `MARCA = enum(["fuerte","enfasis","subrayado","acento","resaltado","escala_lg",...])`, más `markDefs` para links tipados. Es un **subset propio inspirado en Portable Text** (no la librería) — ya estamos a mitad de camino porque `bloques[]` es la mitad de PT. Lo sanciona textualmente ADR-0018 ("Tiptap JSON con allowlist de nodos").

**Qué desbloquea.** Un solo cambio resuelve *toda* la fila de texto del mockup: **palabra acentuada en el título** (marca `acento` → token, no hex), **highlight/destacador** (background del propio span, ya en la memoria del proyecto), **precio destacado** (marca `escala`), **negrita/itálica inline**, y **links dentro de párrafos** (destino discriminado, nunca `<a href>` libre). Y es *más* seguro que HTML: el LLM no puede inventar una etiqueta inválida porque Zod la rechaza.

**Costo/riesgo.** **Medio-alto** — es el trabajo más grande de contenido. Exige (a) migrate-on-read `string → [{t}]` (trivial pero real), (b) un editor de texto de verdad en el panel (contenteditable con toolbar que serializa a runs) que hoy no existe, y (c) tocar los renders de texto. Pero el ROI es el mayor de la dimensión: un motor, cuatro gaps cerrados. Marcas siempre enum → legible por construcción, editable por LLM.

### C. Chrome editable + multi-página — cierra el gap estructural "casi como Wix"

**Qué es.** Dos piezas acopladas: (1) **multi-página** — la DB ya está lista (`StorefrontPage @@unique([tenantId, slug])`, historial por slug), falta el ruteo `src/pages/[slug].tsx` (SSR anónimo cacheable, mismo pipeline que `index.tsx`) + panel "Páginas" en el editor + flag `enNav`; (2) **header/footer como nodos globales** en un `chromeJson` a nivel Tenant (Opción A, candidata a ADR), con props enum (layout, sticky, transparenciaSobreHero, columnas footer) y **slots pinned no-borrables** (carrito/checkout, acción de sesión, atribución neutral + enlace a Bases del sorteo por ADR-0008). El nav pasa a ser un `menuItem` discriminated union (ancla/página/url-allowlist).

**Qué desbloquea.** "Sobre-mí / FAQ / términos" (directiva del dueño), **nav configurable + cinta sobre el nav** del mockup, header transparente sobre hero, consistencia de chrome entre páginas (editás una vez), 404 temática y páginas legales. Introduce dos conceptos de dominio nuevos (candidatos a `domain-planner`/ADR): *chrome global* y *nodo pinned*.

**Costo/riesgo.** **Medio.** Multi-página es sorprendentemente barato (DB lista, `RenderPagina` ya es agnóstico). El chrome exige sacar el header de `storefront-layout.tsx` hardcodeado a nodo renderizado desde el doc + `documentoInicial` que emita el default + concepto de nodo pinned en el editor. Riesgo controlado: todo aditivo, invariantes intactos (tenancy por slug, links = referencias acotadas, checkout intocable).

> **Descartada del podio pero recomendada como 4ª:** *responsive override por nodo* (`{movil: Partial<...>}` + `visibleEn` enum). Es la carencia más notoria vs todos los editores y es aditiva/LLM-safe (reusa los mismos enums). No entra al top-3 porque el mockup no la exige y su ROI percibido es menor que A/B/C — pero es la siguiente en la fila de arquitectura.

---

## 4. Las 5 mejoras de UX del editor (el 80% del "se siente como Wix")

El diagnóstico honesto: el modelo de datos y las mutaciones ya son de calidad; lo que se siente a "formulario de admin" es la **capa de interacción sobre el canvas**. Estas cinco, en orden de construcción:

1. **Patch en vivo del preview (matar el reload).** *El backbone.* Hoy cada mutación hace `previewKey++` y el iframe se recarga entero (flash blanco, scroll perdido, ~300-800ms). Cambio: tras la mutación exitosa server-side, `iframe.contentWindow.postMessage({tipo:"patch", documento})`; el runtime en modo `?preview=token` escucha, **re-valida el doc con el mismo Zod** (nunca confía en el mensaje) y re-renderiza. El doc completo ya viaja en la respuesta de `mutar`. **Es prerequisito de 2 y 3** y por sí solo hace que todo lo existente se sienta 3× mejor. **[gap-arq]**

2. **Selección click-en-canvas + toolbar flotante.** Ya renderizamos `id={node.id}` en el DOM y el iframe es same-origin. Overlay absoluto que calca el `getBoundingClientRect()` del nodo + toolbar (mover/duplicar/borrar/editar = mutaciones que ya existen o existirán); el iframe emite `postMessage({click,id})`. Selección bidireccional gratis con la lista lateral. Nuestra jerarquía plana (2 niveles) hace innecesario el breadcrumb de Webflow — es una ventaja. **[gap-facil]** sobre el backbone

3. **Chat AI lateral cableado al MCP que YA existe.** *El mayor leverage.* El trabajo duro está hecho: **12 tools MCP** (`src/server/mcp/tools.ts`), resolución de tenant server-side, revalidación, outline direccionable. Falta solo la superficie: un `DockKey:"asistente"` (el dock ya es genérico) que corra un loop de chat con esas tools; cada tool-call es una mutación que, gracias al backbone, aparece en el canvas en vivo. Sincronizar la `seleccion` como contexto ("edita ESTA sección"). Seguro por construcción: el LLM solo emite mutaciones acotadas, nunca HTML/CSS libre — el mismo motivo por el que el doc es LLM-editable. La dueña dice *"fondo bicolor púrpura y dorado, destacá 'sorteo' en el título"* y lo ve pasar. **[gap-facil]** en modelo

4. **Auto-save on-change (quitar los botones "Guardar X").** Cada mutación ya persiste al borrador al instante (auto-save de facto), pero los forms tienen botones "Guardar contenido/estilo" por pestaña — eso es lo que se siente a formulario. Aplicar la mutación on-change con debounce ~500ms + indicador "Guardando…/Guardado" (ya esbozado con el `<Loader>`). Publicar sigue siendo la acción humana explícita (I6 intacto). **[gap-facil]**

5. **Drag & drop de reorden.** Reemplaza los botones ↑↓ (5 clicks + 5 reloads para mover 5 posiciones). dnd-kit en la lista lateral → un solo `move_section` con la posición final; ni siquiera necesita el backbone. En el canvas, con placeholder entre secciones (requiere backbone). El modelo lo soporta 1:1. **[gap-facil]**

*Segunda ola (alto valor, no del top-5):* edición inline de texto sobre el canvas (**[gap-arq]**, contrato `data-campo`), undo/redo (snapshot-stack cliente primero), duplicar sección, breakpoint tablet en preview, templates al crear, atajos de teclado, preview compartible. *Explícitamente no prioritarios:* zoom, multiplayer, overrides-por-breakpoint en el editor.

---

## 5. Roadmap propuesto en tandas

### Tanda 1 — Fidelidad inmediata: el paquete del mockup + los quick-wins de mayor ROI
*Esfuerzo grueso: ~2-3 semanas. Objetivo: que el mockup real sea 100% replicable y el editor deje de sentirse a formulario.*

- **`colorAcento` en Tenant** (evolución arq. A — barata, desbloquea todo lo demás visual). *[gap-arq pequeño]*
- **Fondo bicolor** (`FondoSeccion tipo:"bicolor"`, colorA/colorB tokens + direccion + mezcla). *[gap-facil]*
- **Separar `anchoFondo` de `anchoContenido`** (bicolor full-bleed con contenido centrado). *[gap-facil]*
- **`tituloAcento` / palabra destacada** — versión mínima estructurada (`{texto, palabra, estilo enum}`) como puente antes del sistema de runs completo. *[gap-facil]*
- **Cinta sobre el nav + announcement bar mejorada** (esquema, posicion, rotación, countdown por referencia). *[gap-facil]*
- **Nav auto-derivado de secciones** (`incluirEnNav` + mapa tipo→etiqueta) — mata las anclas hardcodeadas. *[gap-facil]*
- **Alturas de sección** (`altoMin` enum + `alinearVertical`) — heroes 100vh. *[gap-facil]*
- **`estadisticas` simple** + más presets nombrados por widget (la galería muestra variantes reales). *[gap-facil]*
- **Confetti de compra/ganador** — máximo ROI emocional para un producto de sorteos. *[gap-facil]*
- **Text reveal por palabra + gradiente de texto animado** — cierra el "wow" del título. *[gap-facil]*
- **Máscaras de forma + adornos/stickers curados + focal point** — sabor fandom. *[gap-facil]*
- **UX: patch en vivo del preview + auto-save on-change + drag&drop lateral.** *[el backbone + 2 fáciles]*

**Desbloquea:** el mockup púrpura+dorado completo (fondo bicolor, palabra acentuada, precio/stat destacado, cinta sobre nav, nav configurable, hero a pantalla), la celebración post-pago, y un editor que ya se siente "en vivo".

### Tanda 2 — Poder real de contenido y navegación
*Esfuerzo grueso: ~3-4 semanas. Objetivo: cerrar los gaps de arquitectura de mayor palanca.*

- **Texto rico estructurado (runs con marcas enum)** — evolución arq. B; absorbe `tituloAcento`, highlight, precio, negrita/itálica, links inline. Incluye el editor contenteditable en el panel. *[gap-arq]*
- **Multi-página** (`[slug].tsx` + panel Páginas + `enNav`) — evolución arq. C parte 1; desbloquea sobre-mí/FAQ/legal. *[gap-arq]*
- **Header/footer editables como chrome global** + `menuItem` discriminated union — evolución arq. C parte 2; requiere ADR (chrome global + nodo pinned). *[gap-arq]*
- **Chat AI dentro del editor** (montar el MCP como panel del dock). *[gap-facil, alto leverage]*
- **Selección click-en-canvas + toolbar flotante.** *[gap-facil sobre backbone]*
- **FAB generalizado + scroll-to-top + modal de bienvenida simple + 404 temática.** *[gap-facil]*
- **Opciones de carrusel/video/audio-embed** (autoplay, Vimeo, Spotify, poster/facade). *[gap-facil]*
- **Escala tipográfica + sombra/borde por VIBE + más gradientes.** *[gap-facil]*

**Desbloquea:** cualquier landing rica en texto formateado, tiendas de varias páginas con nav configurable estilo Wix/Shopify, edición conversacional en vivo, y el header transparente sobre hero.

### Tanda 3 — Refinamiento y composición avanzada
*Esfuerzo grueso: ~3-5 semanas. Objetivo: los últimos peldaños hacia "casi como Wix" en composición y pulido.*

- **Widget `fila`/`columnas` con slots tipados** (profundidad máx 2, reparto enum) — el único cambio estructural grande de layout; columnas reales sin box model. *[gap-arq]*
- **Responsive override por nodo** (`{movil: Partial}` + `visibleEn`) — la 4ª evolución arq.; cierra la carencia más notoria vs todos. *[gap-arq]*
- **Edición inline de texto sobre el canvas** (contrato `data-campo`). *[gap-arq]*
- **Objeto-asset con srcset responsivo** (evaluar costo; el srcset automático > art-direction manual). *[gap-arq]*
- **Parallax por elemento + ken burns + reveal mask + escenas sticky prefabricadas.** *[gap-arq/facil]*
- **Undo/redo (snapshot-stack), duplicar sección, breakpoint tablet, templates al crear, atajos, preview compartible.** *[gap-facil]*
- **Video de fondo con poster** (post-MVP, evaluar presupuesto LCP). *[gap-arq]*

**Desbloquea:** layouts de dos columnas con anchos distintos, control fino de mobile, edición directa sobre el lienzo, y el catálogo de efectos scroll-linked que dan el "wow" de landing premium.

---

## 6. Lo que NUNCA (para no re-litigar)

Escrito para que quede cerrado. Cada uno viola un invariante duro o es un foot-gun probado en los editores top.

- **CSS/HTML/JS libre del tenant** (hex sueltos en `estiloSeccion`, `style=`, clases, `<script>`). Es el invariante fundacional (ADR-0018): rompe la editabilidad-por-LLM, la legibilidad-por-construcción y el SSR cacheable. *Todo* control resuelve a enum/token curado.
- **Posicionamiento absoluto / coordenadas x-y / z-index libre / grid posicional con solape** (Fluid Engine, Wix docking, position:absolute). Geometría arbitraria: imposible de degradar, de razonar por un LLM, y rompe reduced-motion/SSR. El widget `fila` cubre el 80% real del uso.
- **Anidamiento recursivo N-niveles** (box model de Webflow/Elementor). Nuestra regla es "sección → fila → widget, nunca 3". Shopify demuestra que basta para tiendas reales.
- **Gradiente libre / mesh con stops arbitrarios, mix-blend-mode, opacidad libre por elemento, letter-spacing/line-height/font-size por palabra.** Snowflake styling: en Wix/Webflow son la razón por la que los sitios "se ven inconsistentes". Solo presets + escala global + `angulo` enum.
- **Upload de SVG / iconos / Lottie / Rive del tenant.** Un SVG o Lottie es un documento/programa activo (script, foreignObject, on\*, use href externo) → vector XSS de primera clase, agravado por la cookie de sesión wildcard (ADR-0019). Iconos = enum Tabler curado; animaciones especiales = presets nuestros.
- **Timelines/triggers libres estilo Webflow Interactions 2.0.** Incodificable como enum acotado; el LLM no puede razonar keyframes sin romper CLS/reduced-motion; y en Webflow mismo es la parte que menos usuarios dominan. Nuestra respuesta es un catálogo *creciente* de presets que encapsulan esos resultados.
- **Cursor custom / partículas de fondo persistentes.** El cursor rompe a11y y no existe en mobile; las partículas son coste rAF continuo por poco valor. El confetti one-shot da más wow por menos.
- **Upload de video/audio propio pesado, background-video en mobile.** Contra "simple y barato" (ADR-0006) y presupuesto LCP. Embed-only; si acaso, `<video>` desde R2 para clips cortos con límite de peso duro.
- **Newsletter/password-gate que capture emails, motor de popups con triggers (exit-intent/scroll-depth).** PII sin base legal/consentimiento + backend fuera de alcance; los triggers agresivos son la peor UX/a11y y exit-intent no existe en mobile. Alternativa: link al servicio propio del organizador; modal de bienvenida con delay simple.
- **Float real (texto envolviendo imagen), sticky por sección arbitraria, multiplayer real-time, overrides de valor por breakpoint editables uno a uno.** CLS impredecible / bajo ROI / viola "simple y barato" (una dueña por tienda). El lock optimista ya cubre dueña+operador.
- **Override local que resuelva a un valor absoluto en vez de a un token/preset global.** La regla de oro transversal: *global por defecto, local solo por enum que apunta a global.* Es lo que nos mantiene del lado correcto del snowflake — nuestra mayor ventaja arquitectónica sobre Wix.