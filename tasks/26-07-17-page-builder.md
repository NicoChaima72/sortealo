---
slug: page-builder
status: implementing              # planning | implementing | testing | done
owner: nicolas
created: 2026-07-17
related_adrs: [ADR-0016, ADR-0017, ADR-0018, ADR-0019, ADR-0005, ADR-0007, ADR-0008, ADR-0012, ADR-0013]
related_context: [Página de tienda, Documento de página, Sección, Widget, Overlay, Borrador, Publicar, Registro de widgets, Editor MCP, Plantilla, Tienda, Producto, Sorteo, Organizador, Operador de plataforma]

features:
  - id: F01
    behavior: "Modelo StorefrontPage en Prisma: draftJson/publishedJson (jsonb), version (lock optimista), @@unique([tenantId, slug]), tenantId columna real con FK e índice"
    state: not_started

  - id: F02
    behavior: "PageDocumentSchema Zod: discriminated union con registro de widgets semilla (hero, catalogo, sorteo_vitrina, como_funciona) + root/tema + overlays[], enums cerrados y límites"
    state: not_started

  - id: F03
    behavior: "Factory pura documentoInicial(branding) que reproduce la plantilla actual desde columnas de Tenant + backfill idempotente de tenants existentes (draft y published)"
    state: not_started

  - id: F04
    behavior: "Use cases src/server/domain/pagebuilder/: getPagina, aplicarMutacionPagina (add/move/remove/update_props/set_theme/apply), publicarPagina — tenancy server-side, referencias validadas, lock optimista"
    state: not_started

  - id: F05
    behavior: "Storefront público renderiza desde publishedJson (switch exhaustivo, tipo desconocido no crashea) + preview del Borrador solo con token"
    state: not_started

  - id: F06
    behavior: "MCP /api/mcp (Streamable HTTP stateless, Bearer MCP_OPERADOR_TOKEN): tools de lectura, mutación direccionada por id y publish, direccionadas por storeSlug"
    state: not_started

  - id: F07
    behavior: "CSP estricta en middleware (Report-Only → enforcing) + contrato de embeds iframe sandbox (helper único construirEmbedSrc)"
    state: not_started

  - id: F08
    behavior: "Sesión al wildcard (Domain=.<apex> por env) + validación de callbackUrl + dev cross-subdominio con lvh.me y CredentialsProvider dev-only"
    state: not_started

  - id: F09
    behavior: "Banner 'Editar mi tienda' client-side post-hidratación vía puedoEditar() (TenantMembership server-side), sin matar el cache público"
    state: not_started

  - id: F10
    behavior: "Widgets pro de conversión: contador_tickets, urgencia_countdown, whatsapp_flotante, aviso_barra (overlays incluidos; migra el avisoTexto actual)"
    state: not_started

  - id: F11
    behavior: "Widgets pro de confianza: testimonios, ganadores, faq, video, embed_social — iframe-only sobre el contrato de F07"
    state: not_started

  - id: F12
    behavior: "Snapshots StorefrontPageVersion append-only al publicar + rollback (copiar versión vieja al draft)"
    state: not_started
---

# Page builder por secciones/widgets (carril A)

## Contexto

El storefront actual (F06 + plantilla-rica, ADR-0013) es una plantilla fija de 7 secciones tematizada
per-tenant con columnas de `Tenant`. Este plan lo pivotea a una **[[Página de tienda]] por tenant
definida por un [[Documento de página]] JSON** (secciones ordenadas + widgets tipados + overlays),
validado por un **[[Registro de widgets]]** Zod, editable primero por un **[[Editor MCP]]** que usa el
Operador y renderizado públicamente SOLO desde lo **publicado**. El pivote es **ADITIVO**: los
componentes actuales se vuelven los widgets semilla, una factory reproduce la plantilla vigente para
todos los tenants existentes, y nada de lo publicado se rompe.

Insumo de descubrimiento: `.scratch/page-builder/investigacion-builder-profesional.md` (investigación
multi-agente, decisiones D1–D13, catálogo de widgets, riesgos R1–R5). **El usuario dio go a
planificar, NO ha aprobado esas decisiones**: acá se presentan como propuestas para su visto bueno.
El carril B (rediseño admin + identidad de marca) lo planifica otro agente — único punto de contacto:
el seam de theming (D13), que este carril respeta pero no documenta.

## Decisiones

### Propuestas (de la síntesis — se aceptan con el visto bueno de este plan)

- **PD1 — Documento JSON de dos niveles + registro Zod + jsonb draft/published + lock optimista + migrate-on-read** (D1–D5). Razón: modelo validado por el mercado (Shopify secciones/bloques); un solo borde Zod da validación, tipos, defaults y render sin duplicar shapes. → [ADR-0016](../docs/adr/0016-pagina-de-tienda-documento-json-registro-zod.md) `propuesto`.
- **PD2 — Referencias, no copias** (D6): el documento guarda `productoIds`/modo, JAMÁS precios ni datos copiados; resolución server-side scoped al tenant, `NOT_FOUND` indistinguible. Razón: precio autoritativo = `Product.precio` Decimal; tenancy (clase H1). → [ADR-0017](../docs/adr/0017-documento-de-pagina-referencias-no-copias.md) `propuesto`.
- **PD3 — Sin HTML libre + embeds iframe sandbox con src propia + CSP estricta** (D7/D8/D9). Razón: con cookie wildcard, un XSS en un subdominio cabalga la sesión de toda la plataforma; la clase de ataque se elimina por schema, no por sanitización. → [ADR-0018](../docs/adr/0018-contenido-tenant-sin-html-libre-embeds-sandbox-csp.md) `propuesto`.
- **PD4 — Sesión al wildcard + propiedad client-side post-hidratación** (D11, addendum a ADR-0007). Razón: 1 variable habilita el banner "Editar mi tienda" sin matar el cache CDN; autorización SIEMPRE por `TenantMembership` server-side. → [ADR-0019](../docs/adr/0019-sesion-wildcard-subdominios-propiedad-client-side.md) `propuesto`.
- **PD5 — MCP en `/api/mcp`, misma app, mutaciones direccionadas por id de nodo** (D10 — decisión técnica, task propia = F06, sin ADR). Auth MVP: Bearer `MCP_OPERADOR_TOKEN` (Operador god-mode que elige `storeSlug`); OAuth per-tenant queda Pro. El MCP escribe Borrador; **Publicar es humano**.
- **PD6 — Edit-mode como overlay de navegación, NO edición in-place** (D12) — diferido a fase Pro; en este plan solo entra el banner (F09).
- **Vocabulario nuevo en `CONTEXT.md`** (sección "Página de la tienda", marcada propuesta): [[Página de tienda]], [[Documento de página]], [[Sección]], [[Widget]], [[Overlay]], [[Borrador]], [[Publicar]], [[Registro de widgets]], [[Editor MCP]] + evolución de [[Plantilla]] → semilla.

### Tomadas por el planner — REVISABLES

- **R1 — Mapeo de los archivos actuales de `src/components/storefront/` al registro**: widgets semilla = `storefront-hero` → `hero`, `catalogo` → `catalogo`, `sorteo` → `sorteo_vitrina`, `como-funciona` → `como_funciona`. `storefront-layout` (header+countdown+footer+aviso), `carrito*`, `stepper-cantidad`, `countdown-chip` y los hooks quedan como **chrome fijo** del layout (no editables en v1). El `avisoTexto` actual sigue en el chrome hasta que el widget `aviso_barra` llegue en F10 y lo migre a [[Overlay]]. Razón: son las 4 secciones que el Organizador querría reordenar/configurar; header/footer/carrito son plataforma.
- **R2 — Sin screenshot del draft en el MCP v1**: la síntesis propone screenshot renderizado en `get_page`; requiere headless browser en serverless (caro/frágil). Sustituto: `get_page` devuelve JSON + outline numerado, y la **preview tokenizada del Borrador se adelanta de Fase 2 a F05** para que el humano vea el draft antes de publicar. Screenshot queda Pro.
- **R3 — Dev cross-subdominio = `lvh.me`** (`Domain=.lvh.me`) + `CredentialsProvider` gateado por `NODE_ENV !== 'production'` ("Entrar como dueño de <slug>"). Adoptada de la síntesis; el flujo Google real se sigue probando con cloudflared al apex.
- **R4 — Primera ruta App Router del repo**: `/api/mcp` vive en `src/app/api/mcp/[transport]/route.ts` (`vercel/mcp-handler`, `runtime="nodejs"`) conviviendo con `pages/` (Next 14 lo permite). Solo esa ruta; el resto del repo sigue en pages router.
- **R5 — Los tenants nuevos nacen con Página**: `crearTienda` pasa a crear la `StorefrontPage` (draft = published = `documentoInicial`) en la misma `$transaction`. El backfill cubre los existentes; render con fallback on-the-fly si faltara la fila (defensa, no camino feliz).
- **R6 — Gate entre fases**: Fase 2 (F08–F09) y Fase 3 (F10–F12) NO arrancan sin visto bueno del usuario tras validar Fase 0+1. El plan las deja especificadas para no re-planificar.
- **R7 — Numeración ADR 0016–0019** (mayor existente: 0015), repo single-context sin subcarpetas.

## Plan

**Fase 0 — Fundaciones (aditivo puro, el storefront actual sigue intacto):**

1. Schema `StorefrontPage` (jsonb gemelas, `version`, `@@unique([tenantId, slug])`, slug `'home'`) — pasa por `schema-guardian`. (F01)
2. `PageDocumentSchema` + `WIDGET_SCHEMAS` (registro Zod: `tipo → propsSchema + defaultProps + v`), tipos de nodo `{ id, tipo, v, props }`, `root.props` = tema, `overlays[]`. Reglas de contrato: imagen faltante ⇒ gradiente temático; dato del dominio faltante ⇒ widget auto-oculto; enums cerrados. (F02)
3. Factory pura `documentoInicial(branding)` (emite las secciones actuales desde columnas de `Tenant`) + script de backfill idempotente (draft Y published para todo tenant sin fila; jamás pisa un draft existente) + `crearTienda` crea la Página (R5). Las columnas de branding de `Tenant` SE MANTIENEN como seed/fallback. (F03)

**Fase 1 — MVP editable + seguridad:**

4. Use cases `src/server/domain/pagebuilder/`: `getPagina`, `aplicarMutacionPagina` (add_section/move_section/remove_section/update_section_props/set_theme/apply_page — cada una revalida el doc COMPLETO + referencias tenant-scoped + `expectedVersion`), `publicarPagina` (copia atómica draft→published). Errores `DomainError` estructurados. (F04)
5. Render del storefront desde `publishedJson`: switch exhaustivo sobre `tipo` → componente; adaptación de los 4 componentes semilla a props tipadas (fallbacks intactos); tipo desconocido ⇒ no renderiza; migrate-on-read por `v`. Ruta de preview del Borrador gated por token (env/generado), `robots` la bloquea. (F05)
6. MCP `/api/mcp`: `get_page`, `list_widget_types`, `list_products`, mutaciones direccionadas por id, `apply_page`, `publish_page`. Bearer `MCP_OPERADOR_TOKEN`; toda tool recibe `storeSlug` y resuelve tenant server-side; cada tool llama a los use cases de F04 (cero lógica propia). (F06)
7. CSP en `src/middleware.ts` (nonce + `frame-src` allowlist + `frame-ancestors 'none'` + `object-src 'none'` + `connect-src 'self'`), arranque `Report-Only` → enforcing; helper único `construirEmbedSrc(red, ref)` + componente `<EmbedFrame>` con el sandbox de ADR-0018 (aún sin widgets que lo usen — contrato listo). (F07)

**Fase 2 — Sesión wildcard + banner (gate R6):**

8. Cookie `sessionToken` con `Domain` por env (`.sorteatelo.cl` / `.lvh.me`), validación de `callbackUrl` contra `*.<apex>`, `CredentialsProvider` dev-only, doc de dev en README/conventions. (F08)
9. `puedoEditar()` (procedure sin tenantId del cliente: `x-tenant-slug` → tenant → sesión → `TenantMembership`) + banner client-side post-hidratación con chrome neutro de plataforma. (F09)

**Fase 3 — Widgets pro (gate R6):**

10. `contador_tickets` (conteo server-side, sin PII, ADR-0004/0012), `urgencia_countdown` (auto-oculto al vencer), `whatsapp_flotante` y `aviso_barra` como overlays (+ migración del `avisoTexto`). (F10)
11. `testimonios`, `ganadores`, `faq` (texto plano con límites), `video` y `embed_social` sobre `<EmbedFrame>` + facade lazy (póster, iframe al click/viewport). (F11)
12. `StorefrontPageVersion` append-only al publicar + tool/rollback (schema-guardian de nuevo). (F12)

## Validaciones

### F01 — Modelo StorefrontPage

**Vitest** (integration):
- [ ] Se persiste 1 fila por `(tenantId, slug)`; el duplicado es rechazado por el unique compuesto
- [ ] `tenantId` referencia a Tenant con FK e índice; el documento round-tripea jsonb sin pérdida

**E2E**:
- [ ] (no aplica — backend-only)

### F02 — PageDocumentSchema + registro

**Vitest**:
- [ ] El documento semilla completo parsea OK (golden doc)
- [ ] Se rechazan: `tipo` desconocido, props fuera de límite, campos extra, y cualquier intento de widget `html`/`embedCode`/`iframeSrc` (no existen en la union)
- [ ] `defaultProps` de CADA widget del registro parsea contra su propio `propsSchema` (test generativo sobre el registro)
- [ ] `overlays[]` solo admite tipos de overlay; `secciones[]` solo tipos de sección

**E2E**:
- [ ] (no aplica — backend-only)

### F03 — Factory + backfill

**Vitest**:
- [ ] `documentoInicial(branding)` es pura y reproduce las secciones actuales (con branding completo y con branding vacío ⇒ degradación elegante)
- [ ] Backfill idempotente: 2ª corrida no duplica ni pisa un draft ya editado
- [ ] Tras backfill, todo tenant tiene draft y published que parsean contra `PageDocumentSchema`

**E2E**:
- [ ] (no aplica — backend-only; la equivalencia visual se valida en F05)

### F04 — Use cases pagebuilder

**Vitest**:
- [ ] `aplicarMutacionPagina` rechaza `productoId` de OTRO tenant con `NOT_FOUND` indistinguible del inexistente (R1/H1)
- [ ] `expectedVersion` desactualizada ⇒ error estructurado SIN escribir; con la correcta ⇒ escribe e incrementa `version`
- [ ] Cada mutación (add/move/remove/update_props/set_theme/apply) deja un documento que parsea; una mutación inválida no muta nada
- [ ] `publicarPagina` copia draft→published atómico; el published previo queda reemplazado solo al publicar (guardar borrador NO toca published)

**E2E**:
- [ ] (no aplica — backend-only)

### F05 — Render desde published + preview

**Vitest**:
- [ ] El resolver de render descarta productos inactivos/ajenos y computa datos derivados server-side
- [ ] Documento con `tipo` desconocido renderiza el resto sin crash
- [ ] Migrate-on-read: nodo `v` viejo se migra puro al leer sin escribir a DB

**E2E** (browser):
- [ ] La tienda seed renderiza desde `publishedJson` visualmente equivalente al storefront actual (autora y prueba, aislamiento entre tenants intacto)
- [ ] La preview del Borrador solo abre con token; sin token ⇒ 404 neutral

### F06 — MCP /api/mcp

**Vitest**:
- [ ] Sin/mal Bearer ⇒ 401 y ninguna tool ejecuta
- [ ] Las tools direccionan por `storeSlug` (jamás `tenantId` crudo) y reusan los use cases de F04
- [ ] Mutación inválida ⇒ `DomainError` estructurado en la respuesta MCP y el draft no cambia

**E2E** (asistido):
- [ ] Sesión MCP real (cliente MCP) contra el tenant seed: leer outline, agregar/mover/editar una sección, publicar, y ver el cambio en el subdominio

### F07 — CSP + contrato de embeds

**Vitest**:
- [ ] `construirEmbedSrc` acepta solo IDs/handles válidos por regex y hosts de la allowlist exacta; input basura ⇒ rechazo
- [ ] El header CSP emitido contiene `frame-ancestors 'none'`, `object-src 'none'` y la allowlist de `frame-src`

**E2E**:
- [ ] Storefront y panel navegan sin violaciones CSP en consola (fase Report-Only) antes de pasar a enforcing

### F08 — Sesión wildcard + dev

**Vitest**:
- [ ] `callbackUrl` fuera de `*.<apex>` es rechazada (no open-redirect); dentro del wildcard pasa
- [ ] El dominio de cookie sale de env; en producción exige `.sorteatelo.cl`

**E2E** (dev, lvh.me):
- [ ] Login en el apex `lvh.me` ⇒ la sesión se ve en `autora.lvh.me` (cookie compartida); `CredentialsProvider` NO existe con build de producción

### F09 — Banner "Editar mi tienda"

**Vitest**:
- [ ] `puedoEditar()` ignora todo tenant hint del cliente: resuelve por host saneado + sesión + `TenantMembership`
- [ ] El HTML SSR anónimo del storefront es idéntico con y sin cookie (cacheable)

**E2E**:
- [ ] La dueña logueada ve el banner en SU tienda; no lo ve en una tienda ajena; el visitante anónimo nunca lo ve

### F10 — Widgets pro de conversión

**Vitest**:
- [ ] `contador_tickets`: conteo server-side del sorteo ACTIVO, sin sorteo ⇒ oculto, jamás expone correos (ADR-0004)
- [ ] `urgencia_countdown` vencido ⇒ auto-oculto; `whatsapp_flotante`/`aviso_barra` sin dato ⇒ ocultos
- [ ] Migración de `avisoTexto` → overlay `aviso_barra` idempotente

**E2E**:
- [ ] Widget agregado vía MCP visible en el subdominio tras publicar (y NO antes)

### F11 — Widgets pro de confianza

**Vitest**:
- [ ] `embed_social`/`video`: solo iframe con sandbox exacto de ADR-0018 (sin `allow-forms`/`allow-top-navigation`), `src` construida por `construirEmbedSrc`
- [ ] `testimonios`/`ganadores`/`faq`: límites de items/longitud; el texto se renderiza plano (nunca HTML interpretado)

**E2E**:
- [ ] Un embed de YouTube/TikTok renderiza en iframe sandbox sin violaciones CSP; facade carga el iframe recién al interactuar

### F12 — Snapshots + rollback

**Vitest**:
- [ ] Publicar appendea `StorefrontPageVersion` (nunca update/delete); rollback copia una versión al draft y exige re-publicar

**E2E**:
- [ ] (no aplica — backend-only; el efecto se observa vía F05)

## Invariantes

- I1: `tenantId` de `StorefrontPage` es **columna real** (FK + índice) y toda query/mutación filtra por el tenant resuelto **server-side** (subdominio/`storeSlug`/sesión) — jamás input del cliente ni dentro del JSON (ADR-0005).
- I2: el documento guarda **referencias, no copias** (ADR-0017): ni un precio, título o dato del dominio persistido en el jsonb. Precio autoritativo = `Product.precio` `Decimal`.
- I3: **no existe** widget de HTML/CSS/JS libre; TODA escritura (MCP, tRPC, backfill) pasa por `PageDocumentSchema.parse()` server-side (ADR-0018). Nunca `dangerouslySetInnerHTML`.
- I4: embeds SOLO `<EmbedFrame>` con `src` construida server/registry-side desde ID validado (regex + host exacto) y el sandbox de ADR-0018 — sin `allow-forms` ni `allow-top-navigation`.
- I5: el storefront público lee **solo** `publishedJson`; el Borrador solo por preview tokenizada/authz. El HTML anónimo no varía por sesión (R5 del riesgo de cache).
- I6: **Publicar es acción explícita humana** (MVP: el Operador); ninguna tool/flujo publica implícitamente.
- I7: la cookie wildcard es **identidad, no autorización**: todo poder de edición sale de `TenantMembership` consultada server-side (ADR-0019).
- I8: el Disclaimer del sorteo (ADR-0008) NO es configurable ni removible vía documento: con sorteo activo se muestra siempre.
- I9: migraciones de documento **lazy on-read** y puras; el render tolera `tipo` desconocido sin crash; prohibido el rewrite masivo de jsonb.
- I10: `publicarPagina`, backfill y snapshots corren en `prisma.$transaction`; toda mutación de draft usa lock optimista (`expectedVersion`).
- I11: pivote **aditivo**: las columnas de branding/textos de `Tenant` se mantienen como seed/fallback; ningún tenant publicado cambia visualmente sin publicar.
- I12: el MCP no expone tools con efectos fuera del documento de página (nada de correos, `FlowCredential`, precios, órdenes).

## Out of scope

- **Carril B completo**: rediseño del admin, identidad de marca de plataforma, paleta, `APP_CONFIG`, seam de theming D13 (lo documenta el carril B). Este plan NO cierra la decisión abierta #6 ni nada de marca.
- Drag-drop / edición in-place / canvas libre (D12 diferido; canvas descartado para siempre).
- Chat IA in-app y OAuth 2.1 per-tenant del MCP (Fase 3+ de la síntesis, reusan este dominio).
- Ruteo multi-página (el modelo lo permite vía `slug`; no se construye).
- Mover la fuente de verdad del tema de columnas `Tenant` al documento (transición posterior).
- Widgets `html_libre` (NUNCA), `formulario_captura`/`newsletter` (ADR-0004 + Ley 19.628; reevaluar post-F10 con abogado), `separador`, `contador_stock`, `spotify`/`mapa`, `draw_reveal`.
- "Profesionalismo invisible" (OG dinámica, SEO per-tenant, favicon, analytics) — candidato a task propia, no entra acá.
- oEmbed server-side para thumbnails del editor (Pro).

## Especialistas a consultar

- `schema-guardian` — F01 (`StorefrontPage`) y F12 (`StorefrontPageVersion`): jsonb, uniques compuestos, FK/`onDelete`, índices.
- `backend-reviewer` — F04 (use cases + tenancy + lock), F06 (ruta MCP + auth Bearer + env), F07 (CSP middleware), F08 (cookies NextAuth + callbackUrl).
- `frontend-reviewer` — F05 (render + adaptación de componentes semilla), F09 (banner post-hidratación), F10/F11 (widgets Mantine + facade de embeds).
- `change-set-reviewer` — cierre de cada fase antes de commit.
- `troubleshooter` — debugging mid-implementación (CSP/Mantine, cookies en dev).
- `feature-tester` — Vitest completo + E2E asistido (browser-verify) por fase.

## Bitácora

- [2026-07-17 00:00] [planner-grill] Arranque (domain-planner, carril A). Reconstrucción: leídos INDEX, CONTEXT.md, `_template`, síntesis `.scratch/page-builder/investigacion-builder-profesional.md`, ADRs 0001–0015 (índice), `prisma/schema.prisma` (Tenant/branding), `src/components/storefront/*` (11 archivos), `src/server/domain/*` (estructura de use cases). Skill `grill-with-docs` bloqueada para invocación por modelo ⇒ se usó `domain-modeling` (su componente de docs) para CONTEXT/ADRs.
- [2026-07-17 00:00] [planner-grill] Grill delegado: la investigación multi-agente hace las veces de ronda de grill (7 dimensiones, D1–D13, R1–R5). Por regla "panorama antes que detalle" NO se grilló al usuario pregunta por pregunta; las decisiones de la síntesis quedan como PROPUESTAS (PD1–PD6) y las del planner como REVISABLES (R1–R7).
- [2026-07-17 00:00] [planner-grill] Side-effects de dominio creados EN estado propuesto: ADR-0016 (documento+registro Zod, nivel 2: fija el modelo de datos del storefront), ADR-0017 (referencias-no-copias, nivel 2: invariante de dinero+tenancy), ADR-0018 (sin HTML libre/embeds/CSP, nivel 2: seguridad estructural ligada a 0019), ADR-0019 (sesión wildcard, nivel 2: addendum a ADR-0007, afecta auth de toda la plataforma). CONTEXT.md: sección nueva "Página de la tienda" (9 términos) + evolución de [[Plantilla]] → semilla — marcada propuesta.
- [2026-07-17 00:00] [planner-grill] Desvíos deliberados respecto de la síntesis: screenshot del draft en MCP diferido (R2, sustituido por preview tokenizada adelantada a F05); mapeo semillas = 4 secciones + chrome fijo (R1); gate explícito entre fases (R6). Todo REVISABLE.
- [2026-07-17 00:00] [planner-grill] Q1 (única pregunta estructural, al usuario): ¿el switch de render a `publishedJson` (Fase 0+1) entra ANTES del go-live del piloto F07, o se congela el storefront actual para el piloto y el builder corre detrás? Recomendación del planner: entrar antes — el backfill produce un published equivalente 1:1 y el switch se valida con la equivalencia visual de F05; congelar duplicaría el camino de render. **AWAITING USER APPROVAL** (plan completo + Q1 + ADRs/vocabulario propuestos).
- [2026-07-17 19:20] [orquestador] **VISTO BUENO del usuario al plan completo** ("hagamos lo que tú recomiendes"): ADRs 0016–0019 pasan a `aceptado`, vocabulario CONTEXT.md aceptado, PD1–PD6 y R1–R7 aprobados. **Q1 resuelta: switch de render ANTES del piloto F07** (recomendación aceptada). Contrato nocturno: el usuario delega la ejecución overnight — los gates R6 entre fases se ejercen con feature-tester + reviewers en verde en lugar de esperar al usuario despierto; decisiones nuevas no cubiertas → REVISABLE en Bitácora. status → implementing.
