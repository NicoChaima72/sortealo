---
slug: mvp-roadmap
status: superseded            # superseded por tasks/26-07-16-saas-roadmap.md (pivote SaaS multi-tenant, ADR-0005)
owner: nicolas
created: 2026-07-08
related_adrs: [ADR-0001, ADR-0002, ADR-0003, ADR-0004]
related_context: [Libro, Catálogo, Carrito, Orden, ÍtemDeOrden, Pago, Entitlement, Sorteo, Participación, Comprador, Autora, Hermes]

features:
  - id: F01
    behavior: "Camino a Flow sandbox: schema inicial (db push) + modelos Book/Order/OrderItem/Payment + iniciarCheckout + service Flow + webhook que confirma server-side y marca pendiente→pagado idempotente"
    state: active
  - id: F02
    behavior: "Efectos post-pago: modelos DownloadGrant/Raffle/RaffleEntry + el webhook genera Entitlement + RaffleEntry dentro de la transacción al confirmar el pago"
    state: not_started
  - id: F03
    behavior: "Storage privado + entrega de PDF: service de storage abstracto + subida + endpoint de descarga que valida Entitlement y sirve URL firmada con expiración"
    state: not_started
  - id: F04
    behavior: "Correo transaccional: service de correo + envío del enlace de descarga firmado al confirmar el pago"
    state: not_started
  - id: F05
    behavior: "Auth admin real: reemplazar DiscordProvider del scaffold por Google OAuth + allowlist mono-usuario + guard server-side de páginas admin"
    state: not_started
  - id: F06
    behavior: "Panel admin real: reemplazar mock-data.ts por datos reales — CRUD de libros (+subir PDF), ventas/órdenes reales, gestión y ejecución auditable del sorteo"
    state: not_started
  - id: F07
    behavior: "Catálogo + carrito + checkout con marca (UI comprador mobile-first) que reemplaza la página dev throwaway"
    state: not_started
  - id: F08
    behavior: "Hermes: service LLM agnóstico + use case de generación de copy + UI en el panel admin"
    state: not_started
  - id: F09
    behavior: "Hosting / deploy / go-live: hosting elegido, env prod, Flow producción, dominio, buzones, bases del sorteo"
    state: not_started
---

# Plan maestro / roadmap del MVP — libros-iselk

## Contexto

El proyecto arranca de cero real: sin commits, `schema.prisma` es el starter T3 puro (cero modelos del dominio), el backend solo tiene el router `post` de ejemplo, el auth usa el `DiscordProvider` del scaffold, y el frontend es un selector de 3 landings mock (la clienta aún no elige) + un panel admin maquetado 100% sobre `mock-data.ts`. No existe carrito, checkout, integración Flow, storage, correo, Hermes ni el schema del dominio aplicado.

Este documento es un **roadmap paraguas** (decisión Q1): el listado ordenado de fases de construcción del MVP, de "lo que hay hoy" a "app operativa". Solo la **Fase 1 (camino a Flow sandbox)** se detalla a nivel ejecutable con Validaciones reales; las fases F02–F09 quedan **coarse** y cada una parirá su propio task file vía `planner` cuando toque ejecutarla (con su propio grill de implementación). La prioridad explícita del usuario es Flow en **sandbox** primero; la cuenta de producción depende de trámites SII de la clienta y no bloquea el desarrollo.

Las restricciones duras del dominio ya están fijadas en los ADRs: confirmación de pago **server-side** contra la API de Flow y webhook **idempotente** (ADR-0001), entrega de PDF por **storage privado + URL firmada** autorizada por `Entitlement` (ADR-0002), Hermes **LLM-agnóstico** (ADR-0003), **sin cuentas de comprador** — la identidad es el correo (ADR-0004). Regla de oro transversal: dinero en `Decimal`, nunca `Float`; operaciones de plata en `prisma.$transaction`.

## Decisiones

- **D1** (Q1): El documento es un roadmap paraguas, no un plan monolítico. Razón: el modelo del tridente es "un task file = una feature de una sesión"; un MVP entero no cabe, y detallar fases bloqueadas por decisiones abiertas hoy es especular.
- **D2** (Q2): La Fase 1 corta en "orden pagada". Termina cuando: Orden `pendiente` (≥1 `OrderItem` + correo) → redirect a Flow sandbox → pago con tarjeta de prueba → webhook confirma server-side (`payment/getStatus`) y marca `Order`/`Payment` `pendiente→pagado` idempotente. Sin `Entitlement`/`RaffleEntry`/entrega. Razón: entrega y sorteo dependen de decisiones abiertas (storage, correo); cortar en "pagado" prueba el invariante crítico del ADR-0001 sin tocar nada bloqueado. El webhook deja marcado el **punto de extensión "efectos post-pago"** que F02+ rellenan.
- **D3** (Q3): La Fase 1 es **solo backend** + una página dev throwaway lo más simple posible (formulario pelado: libro seed + email → "pagar" → redirect a Flow), sin marca ni pulido visual. Razón: la landing/paleta/nombre están sin decidir (docs/design.md marca "marca y nombre PENDIENTES"); construir UI de comprador con identidad hoy violaría CLAUDE.md. El E2E de la Fase 1 es **manual en sandbox** (el checkout corre en el dominio de Flow, no automatizable).
- **D4** (Q4): `Book.precio` = precio final al público **IVA incluido** (sin desglose de IVA ni boleta — fuera del MVP). Todos los montos `Decimal @db.Decimal(15,2)`. `Order.total` = suma de precios de ítems. `Payment` persiste el monto + la comisión/fee que Flow devuelve en `getStatus` (crudo, sin computar neto/IVA en Fase 1). Transiciones de estado en `prisma.$transaction`.
- **D5** (supuesto, sin preguntar por pedido del usuario): el **primer `Book` se siembra vía script** (`scripts/`, patrón núcleo+wrapper si amerita), no vía admin CRUD — el CRUD de libros llega en F06. Título del primer libro: *"Cómo enriquecer a tu idol favorito"*. Reconsiderable en el planning de F01.
- **D6** (supuesto): las Validaciones y decisiones de implementación de F02–F09 se resuelven en el grill de planning de cada fase, no acá. Las dudas de alcance de fases coarse quedan como **Supuestos** más abajo, no como preguntas.

## Plan

Fases ordenadas por dependencia. Cada fase (salvo F01) es coarse y detona su propio task file al ejecutarse.

1. **F01 — Camino a Flow sandbox** (DETALLADA). Sin dependencias previas de código; es la fundación de datos + el circuito de pago.
2. **F02 — Efectos post-pago (Entitlement + Sorteo)**. Depende de F01 (rellena el punto de extensión del webhook).
3. **F03 — Storage privado + entrega de PDF**. Depende de F02 (el Entitlement autoriza la descarga). Bloqueada por decisión abierta #1 (storage) y #6 (marca de agua).
4. **F04 — Correo transaccional**. Depende de F02 (se dispara en los efectos post-pago) y F03 (envía el enlace de descarga). Bloqueada por decisión abierta #2 (correo).
5. **F05 — Auth admin real (Google OAuth + allowlist)**. Baja dependencia de código (independiente); en dev no bloquea nada. En prod depende de decisión abierta #4 (dominio, para `NEXTAUTH_URL`). Gate de F06.
6. **F06 — Panel admin real (conectar a datos)**. Depende de F05 (auth), F01 (órdenes), F02 (sorteo), F03 (subir PDF).
7. **F07 — Catálogo + carrito + checkout con marca**. Depende de F01 (checkout backend). Bloqueada por decisiones de diseño: la clienta debe elegir landing + paleta + nombre (decisión abierta #4 + docs/design.md). Requiere sesión previa de `frontend-design` / `domain-planner`.
8. **F08 — Hermes**. Depende de F05/F06 (panel admin). Bloqueada por decisión abierta #3 (modelo LLM).
9. **F09 — Hosting / deploy / go-live**. Depende de todo lo anterior. Bloqueada por decisiones abiertas #4 (dominio), #5 (hosting) + dependencias externas de la clienta (Inicio de Actividades SII, cuenta Flow producción, buzones de correo, bases del sorteo protocolizadas ante notario / SERNAC).

### Detalle de fases (para el HTML del roadmap)

**F01 — Camino a Flow sandbox** _(detallada)_
- Objetivo: probar el circuito de pago de punta a punta contra Flow sandbox, respetando ADR-0001.
- Dependencias: ninguna (fundación).
- Decisiones abiertas que bloquean: ninguna.
- Criterio de hecho: crear Orden pendiente (ítems + correo) → redirect a Flow sandbox → pago con tarjeta de prueba → webhook confirma server-side y marca `pendiente→pagado` idempotente. Vitest verde sobre firma/webhook/idempotencia; verificación manual en sandbox OK.

**F02 — Efectos post-pago (Entitlement + Sorteo)** _(coarse)_
- Objetivo: al confirmar el pago, generar `Entitlement` (DownloadGrant) + `RaffleEntry` dentro de la transacción del webhook.
- Dependencias: F01.
- Decisiones abiertas que bloquean: ninguna dura (crear el registro de Entitlement no requiere storage; la entrega física es F03).
- Criterio de hecho: un pago confirmado crea el Entitlement y la RaffleEntry idempotentemente; la transición y la creación son una sola transacción.

**F03 — Storage privado + entrega de PDF** _(coarse)_
- Objetivo: subir PDFs a bucket privado y servir la descarga por URL firmada con expiración, autorizada por Entitlement (ADR-0002).
- Dependencias: F02.
- Decisiones abiertas que bloquean: **#1 (proveedor de storage: S3 / R2 / Supabase)**, **#6 (marca de agua sí/no en MVP)**.
- Criterio de hecho: con un Entitlement vigente se obtiene una URL firmada que expira; sin Entitlement no hay descarga; el path del bucket nunca se expone.

**F04 — Correo transaccional** _(coarse)_
- Objetivo: enviar el enlace de descarga firmado por correo al confirmar el pago.
- Dependencias: F02, F03.
- Decisiones abiertas que bloquean: **#2 (proveedor de correo)**.
- Criterio de hecho: un pago confirmado dispara un correo al comprador con el enlace de descarga; reenvío/regeneración disponible si expira.

**F05 — Auth admin real (Google OAuth + allowlist)** _(coarse)_
- Objetivo: reemplazar el `DiscordProvider` del scaffold por Google OAuth con allowlist mono-usuario (la autora) + guard server-side de páginas admin.
- Dependencias: baja (independiente en dev).
- Decisiones abiertas que bloquean: **#4 (dominio)** solo para `NEXTAUTH_URL` en producción; en dev no bloquea.
- Criterio de hecho: solo emails de la allowlist entran al panel; las páginas admin redirigen a login sin sesión.

**F06 — Panel admin real (conectar a datos)** _(coarse)_
- Objetivo: reemplazar `mock-data.ts` por datos reales — CRUD de libros (+ subir PDF vía F03), ventas/órdenes reales, gestión y ejecución auditable del sorteo.
- Dependencias: F05, F01, F02, F03.
- Decisiones abiertas que bloquean: ninguna dura (hereda las de F03 para subir PDF).
- Criterio de hecho: la autora crea/edita/activa libros, ve ventas reales y ejecuta el sorteo de forma auditable (ganador, fecha, criterio).

**F07 — Catálogo + carrito + checkout con marca** _(coarse)_
- Objetivo: UI de comprador mobile-first (catálogo, detalle, carrito, checkout) con la identidad de marca, reemplazando la página dev throwaway.
- Dependencias: F01.
- Decisiones abiertas que bloquean: **#4 (nombre/dominio)** + elección de landing variant + paleta (docs/design.md, marca/nombre PENDIENTES). Requiere sesión previa de `frontend-design` / `domain-planner`.
- Criterio de hecho: un comprador ve el catálogo, arma carrito, ingresa correo y llega a Flow — todo con la marca definitiva.

**F08 — Hermes** _(coarse)_
- Objetivo: generador de copy de marketing con IA (LLM agnóstico) en el panel admin (ADR-0003).
- Dependencias: F05, F06.
- Decisiones abiertas que bloquean: **#3 (modelo LLM por defecto)**.
- Criterio de hecho: la autora ingresa objetivo/plataforma/tono y recibe variaciones de copy + hashtags; "genera y copia" (sin auto-posteo).

**F09 — Hosting / deploy / go-live** _(coarse)_
- Objetivo: publicar la app operativa.
- Dependencias: todas.
- Decisiones abiertas que bloquean: **#4 (dominio)**, **#5 (hosting)** + externas de la clienta (SII, cuenta Flow producción, buzones, bases del sorteo).
- Criterio de hecho: app desplegada en dominio real, Flow en producción, correo operativo, bases del sorteo vigentes.

## Validaciones

Solo F01 lleva Validaciones reales (fase detallada). Para F02–F09 las Validaciones se definen en el task file propio de cada fase al planificarla.

### F01 — Camino a Flow sandbox

**Vitest** (integration):
- [ ] La firma HMAC-SHA256 ordena los parámetros por clave y produce la firma esperada para un vector de prueba conocido. — `src/__tests__/server/services/flow.test.ts::flow.firma.001` (+`.002`) — PURO, verde ✓
- [ ] `crearPago` (service Flow) arma el payload correcto (commerceOrder, subject, amount, email, urlConfirmation, urlReturn, apiKey) con la firma adjunta y devuelve la URL de redirect de Flow. — `src/__tests__/server/services/flow.test.ts::flow.crearPago.001` (+`.002` fail-fast, +`flow.getStatus.001`) — PURO, verde ✓
- [ ] `iniciarCheckout` crea una `Order` `pendiente` con sus `OrderItem`(s), copiando el precio del `Book` al momento de la compra (snapshot), con `total` = suma y el correo del comprador persistido. — `src/__tests__/server/checkout/iniciarCheckout.test.ts::checkout.iniciar.001` (+`.002` snapshot) — DB-backed, BLOQUEADO por DB caída
- [ ] `iniciarCheckout` rechaza libros inactivos o inexistentes (DomainError `INACTIVE` / `NOT_FOUND`). — `src/__tests__/server/checkout/iniciarCheckout.test.ts::checkout.iniciar.003` (NOT_FOUND) + `.004` (INACTIVE) — DB-backed, BLOQUEADO por DB caída
- [ ] El núcleo del webhook confirma server-side contra `getStatus` (mockeado = pagado) y avanza `Order`/`Payment` `pendiente→pagado` una sola vez, dentro de una transacción. — política: `src/__tests__/server/pago/webhookFlow.test.ts::webhook.confirmacion.pagado` (PURO, verde ✓); transacción DB: `src/__tests__/server/pago/confirmarPagoDeOrden.test.ts::confirmar.001` (DB-backed, BLOQUEADO)
- [ ] Idempotencia: una segunda llegada del webhook con el pago ya confirmado responde OK sin re-ejecutar efectos (no duplica la transición ni el punto de extensión post-pago). — política: `webhookFlow.test.ts::webhook.idempotencia` (PURO, verde ✓); DB: `confirmarPagoDeOrden.test.ts::confirmar.002` (hook 1 sola vez — DB-backed, BLOQUEADO)
- [ ] Una confirmación server-side con resultado fallido marca `Order`/`Payment` `pendiente→fallido`. — política: `webhookFlow.test.ts::webhook.confirmacion.fallido` (PURO, verde ✓); DB: `confirmarPagoDeOrden.test.ts::confirmar.003` (DB-backed, BLOQUEADO)
- [ ] Un request al webhook con método distinto de POST responde 405 sin ningún efecto. — `src/__tests__/server/pago/webhookFlow.test.ts::webhook.gate.405` — PURO, verde ✓
- [ ] El núcleo del webhook nunca trata el body como prueba de pago: siempre consulta `getStatus` antes de cualquier efecto (gate antes de efectos). — `src/__tests__/server/pago/webhookFlow.test.ts::webhook.gate.getStatus-first` (+`webhook.gate.missing-token`, +`webhook.pendiente`, +`webhook.token.form-urlencoded`) — PURO, verde ✓
- [ ] (extra, atomicidad I1) El hook post-pago vive en la MISMA transacción: si lanza, la transición se revierte. — `src/__tests__/server/pago/confirmarPagoDeOrden.test.ts::confirmar.004` — DB-backed, BLOQUEADO por DB caída
- [ ] (extra, seed D5) `sembrarPrimerLibro` crea el libro seed y es idempotente. — `src/__tests__/scripts/seed-book.test.ts::seed.book.001`/`.002` — DB-backed, BLOQUEADO por DB caída

**E2E** (browser): verificación **manual** en sandbox (no automatizable — el checkout corre en el dominio de Flow):
- [ ] Página dev → elegir libro seed + email → redirect a Flow sandbox → pagar con tarjeta de prueba → volver → `Order` queda `pagado` en DB (verificable en Prisma Studio) y el webhook quedó procesado una sola vez.

### F02–F09
- [ ] (se definen en el task file de cada fase al planificarla)

## Invariantes

Reglas duras para F01 (y para el resto donde apliquen). Si el implementer encuentra ambigüedad fuera de esto y de las Decisiones, para y pregunta.

- **I1**: La confirmación del pago es SIEMPRE server-side contra `payment/getStatus` de Flow; el redirect del navegador NUNCA es prueba de pago (ADR-0001).
- **I2**: El webhook es idempotente: procesa los efectos una sola vez por pago; el estado avanza `pendiente → pagado | fallido` una sola vez.
- **I3**: Todos los montos son `Decimal @db.Decimal(15,2)`, nunca `Float` ni aritmética con `number`. Las mutaciones de estado de pago van en `prisma.$transaction`.
- **I4**: El precio se **congela** en el `OrderItem` al momento de la compra (snapshot); no se referencia el precio vivo del `Book`.
- **I5**: El webhook sigue el patrón **núcleo testeable + wrapper Next**: núcleo puro exportado (recibe req acotado + deps inyectables, devuelve `{status, body}`, no toca env/res); wrapper `default export` lee env, cablea adapters reales y escribe la respuesta.
- **I6**: Env vars de Flow declaradas en `src/env.js` (Zod) + `.env.example`; nunca `process.env.X` directo salvo el wrapper del endpoint. La factory de services recibe la config como argumento explícito con fail-fast si falta.
- **I7**: Secretos (secretKey/apiKey de Flow) NUNCA se loguean.
- **I8**: Layering backend: router fino → use case en `domain/` → service Flow en `services/`. Cero lógica de negocio en el router, cero `ctx.db` en el router, cero instancia de adapter externo dentro de `domain/`.
- **I9**: Antes de tocar el schema: invocar `schema-guardian`. `onDelete` explícito en cada relación, `@@index` en cada FK queriable, schema aplicado con `db push` (`npm run db:push`) — **sin migraciones versionadas** (decisión del usuario: proyecto simple, un solo entorno).

## Out of scope

Del roadmap y/o de la Fase 1 explícitamente:

- Cerrar cualquier decisión abierta (#1 storage, #2 correo, #3 LLM, #4 dominio, #5 hosting, #6 marca de agua) — se resuelven con el usuario/clienta en la fase que las necesita.
- Detallar Validaciones/implementación de F02–F09 en este documento.
- En Fase 1: `Entitlement`, `RaffleEntry`, entrega de PDF, correo, UI con marca, admin CRUD, IVA/boleta/neto-al-vendedor, cuenta Flow de producción.
- Cuentas/login de comprador (ADR-0004), auto-posteo de Hermes, integración directa de Mercado Pago, boletas SII automáticas (fuera del MVP entero).

## Supuestos (fases coarse — resueltos por criterio, no preguntados)

- **S1**: El primer `Book` (y un `Raffle` activo para F02) se siembran vía script en `scripts/`; el admin CRUD real llega en F06.
- **S2**: F05 (auth admin) puede adelantarse o hacerse en paralelo — no depende de F01–F04. Se ubicó antes de F06 porque lo gatea.
- **S3**: La marca de agua (decisión #6) se **difiere** por defecto salvo que la clienta la pida; se decide en el planning de F03.
- **S4**: Los efectos post-pago (F02+) se enganchan en el punto de extensión que F01 deja marcado en el webhook, no reescriben el webhook.
- **S5**: F09 (go-live) tiene dependencias externas de la clienta (SII, Flow producción, dominio, bases del sorteo) que están fuera del control del dev; el roadmap las lista pero no las agenda.

## Especialistas a consultar

Para la Fase 1 (los demás se definen en el planning de cada fase):

- `schema-guardian` — antes de crear los modelos `Book`/`Order`/`OrderItem`/`Payment` y el schema inicial (naming, `onDelete`, índices, `Decimal`).
- `backend-reviewer` — router `checkout`/`pago`, use cases en `domain/`, service Flow, endpoint webhook, env vars, factory de adapters.
- `feature-tester` — Vitest (firma/webhook/idempotencia) + verificación manual asistida del pago en sandbox.
- `change-set-reviewer` — review del diff completo de la Fase 1 antes de commit.

## Bitácora

- [2026-07-08 00:00] [planner-grill] Arranco grill del plan maestro del MVP. Estado actual (fresco de sesión): cero commits, schema = starter T3 puro (sin modelos de dominio), backend solo router `post` de ejemplo, auth con DiscordProvider del scaffold, frontend = selector de 3 landings mock + panel admin maquetado sobre mock-data. No existe carrito/checkout/Flow/storage/correo/Hermes/migración inicial. Prioridad explícita del usuario: Flow en SANDBOX primero (sandbox.flow.cl, HMAC-SHA256, API https://sandbox.flow.cl/api). Decisiones abiertas (storage, correo, LLM, dominio, hosting, marca de agua) NO se cierran acá.
- [2026-07-08 00:00] [planner-grill] Q1: ¿Framing del documento? Recomendada: este archivo es un ROADMAP (enumera fases F01..FN ordenadas por dependencia); solo la Fase 1 (camino a Flow sandbox) se detalla a nivel ejecutable, las fases posteriores quedan como placeholders coarse que luego generan su propio task file del tridente.
- [2026-07-08 00:00] [planner-grill] Q1 answered: (A) roadmap paraguas. Es el listado ordenado de fases/tareas del MVP (orden de construcción); solo Fase 1 (Flow sandbox) detallada con Validaciones reales, resto coarse, cada fase parirá su propio task file. Nota: orquestador generará HTML visual → estructurar cada fase con id/nombre/objetivo/dependencias/decisiones-abiertas-que-bloquean/criterio-de-hecho.
- [2026-07-08 00:00] [planner-grill] Q2: ¿Dónde corta la línea de "hecho" de la Fase 1 (Flow sandbox)? Recomendada: la Fase 1 termina cuando puedo crear una Orden pendiente (con ≥1 ÍtemDeOrden + correo del comprador), redirigir a Flow sandbox, pagar con tarjeta de prueba, y el webhook confirma server-side contra la API de Flow marcando Order/Payment pendiente→pagado de forma idempotente. NO incluye entrega (Entitlement/PDF/correo) ni Sorteo (RaffleEntry) — esas quedan a fases sucesoras porque dependen de decisiones abiertas (storage, correo).
- [2026-07-08 00:00] [planner-grill] Q2 answered: (A) corte en "orden pagada". Webhook solo hace transición de estado + deja marcado el punto de extensión "efectos post-pago". Sin Entitlement/RaffleEntry/entrega en Fase 1.
- [2026-07-08 00:00] [planner-grill] Q3: ¿La Fase 1 incluye UI de comprador con marca (catálogo/carrito/checkout) o solo backend + trigger mínimo sin marca? Recomendada: solo backend (use cases + service Flow + webhook) verificado por Vitest, disparado por una página dev throwaway sin marca / seed; la UI con identidad de marca (catálogo, carrito, checkout) se difiere a una fase posterior porque la landing y la paleta están sin decidir (la clienta no eligió variante).
- [2026-07-08 00:00] [planner-grill] Q3 answered: (A) solo backend + página dev throwaway lo más simple posible, cero pulido visual, prioriza funcionalidad. E2E manual en sandbox confirmado.
- [2026-07-08 00:00] [planner-grill] Q4: ¿Semántica y precisión del dinero en Fase 1? Recomendada: `Book.precio` = precio final al público IVA-incluido (sin desglose de IVA/boleta, que está fuera del MVP); todos los montos `Decimal @db.Decimal(15,2)` per convención; `Order.total` = suma de precios de ítems; `Payment` guarda monto + la comisión/fee que Flow devuelve en `getStatus` (sin computar neto/IVA en Fase 1, solo persistir crudo). Operaciones de estado de pago dentro de `prisma.$transaction`.
- [2026-07-08 00:00] [planner-grill] Q4 answered: confirmado tal cual. Feedback del usuario: cerrar el grill, no más preguntas de implementación (esas van al planning por fase); quiere el panorama completo del MVP con Fase 1 detallada y el resto coarse. Dudas de alcance de fases coarse → resueltas por criterio y marcadas como Supuestos (S1–S5) en el doc.
- [2026-07-08 00:00] [planner-grill] Grill cerrado. Roadmap escrito: 9 fases (F01 detallada = Flow sandbox; F02–F09 coarse). Decisiones D1–D6, Invariantes I1–I9, Supuestos S1–S5. Esperando visto bueno del usuario para arrancar F01.
- [2026-07-08 00:00] [planner-grill] **F05 (Auth admin real) pasó a `planning`** con task file propio: `tasks/26-07-08-auth-admin-google.md` (slug `auth-admin-google`). Se ejecuta EN PARALELO con F01 (otra terminal). Zona de contacto anotada: ambas tocan `src/env.js` y `.env.example` (F01 agrega vars de Flow; F05 agrega `GOOGLE_CLIENT_ID/SECRET` + `ADMIN_ALLOWLIST` y remueve las de Discord). F05 NO toca `prisma/schema.prisma` (la migración inicial es de F01). Sin grill extenso por pedido del usuario; decisiones de implementación como Supuestos revisables.
- [2026-07-08 00:00] [planner-grill] **F02 (Efectos post-pago: Entitlement + Sorteo) pasó a `planning`** con task file propio: `tasks/26-07-08-efectos-post-pago.md` (slug `efectos-post-pago`). Define el CONTRATO del punto de extensión post-pago que F01 dejará en el webhook: `aplicarEfectosPostPago({ tx, orderId }) => Promise<void>`, invocado una sola vez, dentro de la MISMA `$transaction` que la transición pendiente→pagado, y solo en esa transición. Alcance: crea `DownloadGrant` (uno por OrderItem) + `RaffleEntry` (una por orden en el Raffle ACTIVO) idempotentemente; sin entrega física (F03), sin correo (F04), sin UI. Raffle activo sembrado vía script (S1). Implementación de F02 **BLOQUEADA hasta cerrar F01** (en ejecución paralela); detalles finos del hook se ajustan cuando F01 exista. Sin grill extenso por pedido del usuario. F01 sigue esperando visto bueno.
- [2026-07-08 10:00] [feature-implementer] Arranca implementación de **F01** (visto bueno del usuario dado; orquesta la sesión principal). `status: planning → implementing`, F01 `state: active`. Features pendientes del roadmap: F02..F09 (coarse, no en esta sesión). Read pass completo: roadmap §F01, `_template.md`, `CLAUDE.md`, `CONTEXT.md`, ADR-0001, backend-conventions, prisma-conventions, y `efectos-post-pago.md` §D1 (contrato del hook post-pago). Estado del código confirmado: schema = starter T3 puro (sin migraciones), backend solo router `post` de ejemplo, sin capa `domain/`/`services/`/`runDomain`. **Coordinación**: F05 corre en paralelo (toca `src/env.js`/`.env.example`/`auth.ts`/login/admin — NO los toco salvo agregar SOLO vars de Flow a env, releyendo justo antes). Próximo paso: proponer schema a `schema-guardian` (I9).
- [2026-07-08 10:20] [feature-implementer] `schema-guardian` APROBÓ el schema de F01 con 2 refinamientos (bakeados): (1) `Payment→Order` = `onDelete: Restrict` (defensa en profundidad sobre el registro de plata, coherente con F02); (2) `@@unique([orderId, bookId])` en `OrderItem` + se elimina el `@@index([orderId])` redundante (el prefijo del unique lo cubre). Confirmé la asunción de dominio detrás del unique (un e-book no se compra dos veces en la misma orden): está cubierta por F02-D2 (un `DownloadGrant` por libro por orden) y por ser bien digital sin campo `cantidad`. Migración clasificada **ADITIVA** (4 modelos + 2 enums nuevos, cero cambios a NextAuth/Post). Sugerencia de doc (drift) del guardian: sembrar en `prisma-conventions.md` el patrón "`Restrict` hacia padres auditables (Order/Book); `Cascade` solo para composición intrínseca (OrderItem→Order)" — la propongo al cierre (Step 4.5).
- [2026-07-08 12:30] [feature-implementer] **F01 implementada (código + tests).** TDD por slices verticales. Archivos CREADOS: `prisma/schema.prisma` (models Book/Order/OrderItem/Payment + enums OrderStatus/PaymentStatus, aprobados por schema-guardian); `src/server/services/flow.ts` (service Flow: `firmarParams` HMAC-SHA256, `crearFlowService` factory con config inyectada + fail-fast, `crearPago`/`getStatus`, httpPost/httpGet inyectables); `src/server/domain/errors.ts` (DomainError); `src/server/api/runDomain.ts` (seam DomainError→TRPCError); `src/server/domain/pago/efectosPostPago.ts` (**contrato F02**: type `EfectosPostPago` + `noopEfectosPostPago`); `src/server/domain/pago/confirmarPagoDeOrden.ts` (transición pendiente→pagado|fallido en `$transaction`, idempotente, invoca el hook post-pago 1 vez dentro de la tx solo en PAGADO); `src/server/pago/webhookFlow.ts` (núcleo testeable: gate método/token, confirmación server-side vía getStatus, mapeo estado Flow); `src/pages/api/webhooks/flow.ts` (wrapper Next: lee env, cablea Flow real + db + hook no-op, escribe res — ÚNICO punto que F02 edita para cablear su hook); `src/server/domain/checkout/{schemas,iniciarCheckout,listarLibros}.ts`; `src/server/api/routers/checkout.ts`; `scripts/seed-book.ts` (núcleo `sembrarPrimerLibro` idempotente + wrapper main con `process.loadEnvFile`); `src/pages/dev/checkout.tsx` + `src/pages/dev/checkout/retorno.tsx` (throwaway, sin marca, D3); tests `src/__tests__/server/services/flow.test.ts`, `.../server/pago/webhookFlow.test.ts`, `.../server/pago/confirmarPagoDeOrden.test.ts`, `.../server/checkout/iniciarCheckout.test.ts`, `.../scripts/seed-book.test.ts`. Archivos MODIFICADOS: `src/server/api/root.ts` (compone checkoutRouter); `src/server/api/trpc.ts` (agrega `flow` al contexto — inyección del service); `src/env.js` + `.env.example` (SOLO vars de Flow, todas opcionales — F05 ya había puesto Google/allowlist, no toqué nada suyo); `package.json` (script `seed:book`). Decisiones tácticas (cubiertas por plan/convenciones): (a) `iniciarCheckout` recibe `flow` inyectado y orquesta orden→Flow→token (el router queda fino, layering I8; la instancia se crea en el borde/contexto, no en domain); (b) service Flow inyectado vía `ctx.flow` (DI idiomática tRPC, construcción barata, fail-fast al usar); (c) `listarLibros` devuelve `precio` como `number` display-only (CLP entero para `Intl.NumberFormat`) — el monto autoritativo Decimal vive en `Book.precio` y lo congela `iniciarCheckout`; (d) `subject` de Flow = títulos de los libros. **tsc --noEmit: verde (exit 0).** Vitest PURO (sin DB): **13/13 verde** (flow 5 + webhookFlow 8) → cubre Validaciones #1,#2,#8,#9 y la política de #5,#6,#7. Vitest DB-backed (iniciarCheckout, confirmarPagoDeOrden, seed): escritos, **fallan SOLO por `PrismaClientInitializationError` (DB caída)** — confirmado que no hay error de código.
- [2026-07-08 10:35] [feature-implementer] **BLOQUEO EXTERNO (infra, fuera del scope de código de F01): la DB no responde.** Tanto `prisma migrate status` (motor de migración, vía DIRECT_URL) como una conexión de runtime del `PrismaClient` (vía DATABASE_URL/pooler) fallan con `FATAL: (ENOTFOUND) tenant/user postgres.ssdnivmwvwowulztftfe not found`. Ambas URLs (`DATABASE_URL` :6543 pgbouncer, `DIRECT_URL` :5432) apuntan al **pooler** de Supabase (`aws-1-us-east-1.pooler.supabase.com`), no a una conexión directa. "tenant not found" del pooler = proyecto Supabase **pausado** (free-tier auto-pausa) o prefijo de región del pooler stale / proyecto borrado. **Requiere acción del usuario** (reanudar el proyecto en el dashboard de Supabase, o corregir el connection string) — no es fixeable en código. Impacto acotado: bloquea SOLO (a) aplicar la migración y (b) correr los tests DB-backed. NO bloquea escribir schema/código/tests ni correr los tests puros (mockeados). Decisión: implemento todo el código + tests, corro los tests puros, y dejo migración + tests DB-backed pendientes de que vuelva la DB (reportado al orquestador). F01 sigue `active` (no `blocked`) porque avanzo ~todo el código; el gate DB queda como pendiente explícito.
- [2026-07-08 12:45] [feature-implementer] `backend-reviewer` **APPROVE** (rúbrica: Corrección A, Compliance B, Naming A, Tests A). Confirmó: layering I8 OK (`iniciarCheckout` con `flow` inyectado + router fino + `ctx.flow` como seam válido), ADR-0001/I1-I2 bien ubicados (gate server-side en el núcleo, idempotencia en confirmarPagoDeOrden), I3 (plata en `$transaction`, Flow fuera de la tx), I5 (núcleo limpio de env/res, wrapper único borde), contrato F02 exacto (hook inyectable, 1 vez, en tx, solo PAGADO, F02 cambia 1 línea), I6/I7 (env opcional, fail-fast, cero log de secretos), naming/tipos/`select`. Findings NIT accionados YA: **F1** — idempotencia hecha ATÓMICA con `updateMany({ where: estado PENDIENTE })` + `count===0`⇒replay (antes era check-then-act, no atómico ante webhooks concurrentes; importa para F02 con side-effects reales) en `confirmarPagoDeOrden.ts`; **F2** — `missing_token` ahora responde 200 ack+ignorar (antes 400) para no gatillar reintentos, per backend-conventions § semántica de reintento (test actualizado). Post-fix: tsc verde + 13/13 puro verde. NITs NO accionados (a criterio del user): **F3** (drift doc: documentar el patrón "service inyectado en `ctx` tRPC" en `backend-conventions.md`) y la sugerencia de `schema-guardian` (patrón onDelete en `prisma-conventions.md`) → los propongo como DRIFT al cierre (Step 4.5). **F4** (orden huérfana PENDIENTE sin token si `crearPago` falla) = tradeoff aceptado para F01 (nadie paga esa orden; el webhook no la toca sin token); nota para un futuro job de barrido.
- [2026-07-08 12:50] [feature-implementer] **Plan de migración (pendiente de DB, para el feature-tester/usuario).** Como el repo NO tiene carpeta de migraciones y las tablas NextAuth/`Post` ya existen en la DB (scaffold vía `db push`), un `prisma migrate dev` directo detectaría drift y querría RESETEAR la DB (destructivo; además F05 comparte la DB). Workflow NO destructivo recomendado (baselining), a correr **cuando la DB vuelva**: (1) `mkdir -p prisma/migrations/0_init && npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql` (baseline con TODO el schema actual, incluidas las tablas existentes); (2) `npx prisma migrate resolve --applied 0_init` (marca el baseline como aplicado SIN correr SQL — las tablas ya existen); (3) verificar que `0_init` incluye los 4 modelos nuevos + 2 enums (los agregué al schema ANTES del baseline, así que sí los incluye) → si la DB ya tenía SOLO NextAuth/Post, el baseline traería los modelos nuevos como parte del `0_init` pero la DB no los tiene ⇒ (3-alt) mejor: baseline SOLO de lo preexistente y luego `migrate dev` del delta. **OJO**: como el schema.prisma YA tiene los modelos de dominio escritos, el baseline `--from-empty --to-schema-datamodel` incluiría TODO; para separar correctamente conviene, con la DB arriba, evaluar si es más simple `prisma migrate dev --name init_domain` aceptando que Prisma cree la migración inicial completa y baselinee/resetee según drift real. Dejo la decisión fina al momento de tener la DB (el feature-tester o el usuario la ejecuta); lo importante es NO resetear a ciegas la DB compartida. `npx prisma generate` (offline) YA corrió: el client tiene los tipos nuevos.
- [2026-07-08 12:55] [feature-implementer] **Cierre de implementación F01.** `status: implementing → testing`. Backend completo y revisado (APPROVE). Validaciones anotadas con sus test artifacts. Vitest PURO 13/13 verde; DB-backed + seed escritos, bloqueados por DB caída. **Pendientes explícitos para la sesión principal / feature-tester / usuario**: (1) **reanudar Supabase** (o corregir connection string) → luego aplicar migración (ver entrada previa) + correr Vitest completo (los DB-backed deberían pasar); (2) cargar `FLOW_API_KEY`/`FLOW_SECRET_KEY` (+ `FLOW_URL_CONFIRMATION` con túnel público) para la **verificación manual E2E en Flow sandbox** (no automatizable, D3); (3) correr `npm run seed:book` (con DB arriba) antes del E2E; (4) decidir los 2 DRIFTs de doc propuestos (F3 backend-conventions + patrón onDelete prisma-conventions). NO invoqué `feature-tester` ni `change-set-reviewer` (los orquesta la sesión principal, restricción #6).
- [2026-07-16 00:00] [planner-grill] (domain-planner) **SUPERSEDED por el pivote a SaaS multi-tenant** (decisión del usuario; ADR-0005/0006/0007/0008). Este roadmap single-tenant queda reemplazado por `tasks/26-07-16-saas-roadmap.md`. El trabajo parcial de F01 (schema, service Flow, webhook, checkout, seeds, tests) NO se descarta: se evalúa y rescata en la Fase 1 del roadmap nuevo (service Flow con config inyectada, núcleo del webhook y contrato post-pago se adaptan al scoping por tenant; ver S8 del roadmap nuevo). No completar el gate DB/E2E pendiente de este plan — el circuito se re-verifica multi-tenant.
- [2026-07-09 09:00] [orquestador] Decisiones del usuario sobre los 2 drifts de doc. **Drift A (patrón `onDelete`) → APLICADO** en `docs/agents/prisma-conventions.md` (sub-bullet bajo "`onDelete` explícito en cada relación"): `Restrict` a padres auditables/append-only (`Order`/`Book`/`Payment`), `Cascade` solo para composición intrínseca del agregado (`OrderItem → Order`), `SetNull` para FKs opcionales. Sin choque con F05 (F01 es el único que toca ese archivo). **Drift B (patrón "service inyectado vía `ctx` tRPC" en `backend-conventions.md`) → DIFERIDO** hasta que F05 cierre (F05 edita ese mismo archivo en paralelo; aplicarlo ahora chocaría). El código ya usa el patrón vía `ctx.flow`; solo falta documentarlo — retomar post-F05. Verificación del change set F01 vía `git status`: F01 NO tocó `auth.ts`/`login.tsx`/`admin/*` (esas mods son de F05) y `src/env.js` recibió SOLO las 5 vars de Flow opcionales, sin alterar lo de F05. F01 sigue `status: testing`, bloqueado en el gate DB (Supabase pausada) para migración + tests DB-backed + E2E manual.
