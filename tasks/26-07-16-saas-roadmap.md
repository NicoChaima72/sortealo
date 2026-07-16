---
slug: saas-roadmap
status: planning              # planning | implementing | testing | done
owner: nicolas
created: 2026-07-16
related_adrs: [ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0007, ADR-0008]
related_context: [Plataforma, Tienda, Organizador, Operador de plataforma, Autora, Subdominio, Plantilla, CredencialFlow, Términos de Servicio, Disclaimer del sorteo, Producto, Catálogo, Carrito, Orden, ÍtemDeOrden, Pago, Entitlement, Sorteo, Participación, Bases del sorteo, Comprador, Hermes]

features:
  - id: F01
    behavior: "Fundación multi-tenant + circuito de pago BYO-Flow: modelo Tenant + scoping por tenantId, resolución por subdominio (middleware), CredencialFlow cifrada, checkout y webhook ruteados al tenant correcto, verificado con 2 tenants sandbox"
    state: not_started
  - id: F02
    behavior: "Efectos post-pago per-tenant: DownloadGrant + Raffle/RaffleEntry scopeados, creados idempotentemente en la transacción del webhook"
    state: not_started
  - id: F03
    behavior: "Storage privado + entrega de PDF: bucket privado con paths per-tenant, URL firmada con expiración autorizada por Entitlement"
    state: not_started
  - id: F04
    behavior: "Correo transaccional: envío del enlace de descarga firmado al confirmar el pago, con remitente/branding coherente per tenant"
    state: not_started
  - id: F05
    behavior: "Auth de Organizadores + panel de tienda: Google OAuth, membresía User↔Tenant, guard por tenant, CRUD de productos (+PDF), ventas, gestión y ejecución auditable del sorteo, carga de bases y CredencialFlow"
    state: not_started
  - id: F06
    behavior: "Plantilla configurable + storefront del comprador: catálogo/carrito/checkout mobile-first tematizado (logo/colores/textos del tenant) + disclaimer del sorteo"
    state: not_started
  - id: F07
    behavior: "HITO — tienda de la autora (tenant piloto) operativa: hosting con wildcard subdomains, dominio, Flow producción de la autora, correo real, contenido y bases cargados, primera venta real"
    state: not_started
  - id: F08
    behavior: "Self-service de tenants: registro de Organizadores, alta y wizard de configuración de Tienda, aceptación de ToS registrada, publicación; panel del Operador (alta/suspensión/supervisión)"
    state: not_started
  - id: F09
    behavior: "Hermes por tenant: generación de copy con contexto de la tienda (LLM-agnóstico) en el panel del Organizador"
    state: not_started
  - id: F10
    behavior: "Go-live de la plataforma pública: ToS/disclaimer validados por abogado, migraciones versionadas, hardening, backups/monitoreo, primeros tenants externos"
    state: not_started
---

# Roadmap paraguas — pivote a SaaS multi-tenant de tiendas con sorteo

## Contexto

**El proyecto pivotea** (decisión del usuario, 2026-07-16): de tienda single-tenant de e-books para
la autora a **SaaS multi-tenant** donde Organizadores crean su cuenta, configuran su Tienda sobre una
plantilla (logo/colores/textos — NO builder visual) y venden productos digitales con sorteo
promocional, cada tienda en su **subdominio**. La autora pasa a ser el **tenant #1 / piloto**, y su
tienda operativa sigue siendo un **hito con fecha propia** (F07) — no se difiere indefinidamente por
construir plataforma. Decisiones de arquitectura del pivote: ADR-0005 (multi-tenant por `tenantId` en
DB compartida), ADR-0006 (BYO-Flow: credenciales por tenant cifradas, la plataforma nunca mueve plata
de terceros), ADR-0007 (resolución por subdominio), ADR-0008 (responsabilidad legal del sorteo = del
Organizador).

Momento del pivote: el más barato posible. El commit base (4eb69d7) tiene scaffold T3 + maquetas mock
+ docs; el trabajo parcial single-tenant de F01/F05 (sin commitear) es **adaptable**: el service Flow
ya recibe config inyectada (basta instanciarlo con la `CredencialFlow` del tenant), el núcleo del
webhook ya es testeable con deps inyectables (se le agrega el ruteo por tenant), la política de auth
pura (`authPolicy.ts`) sirve de base para la membresía, y el patrón núcleo+wrapper / layering /
convenciones quedan intactos. Lo que muere: el supuesto mono-tienda (allowlist mono-usuario como
autorización del panel, seeds single-tenant, uniques globales).

Este documento reemplaza (**supersede**) a `tasks/26-07-08-mvp-roadmap.md`,
`tasks/26-07-08-auth-admin-google.md` y `tasks/26-07-08-efectos-post-pago.md`. Solo la **Fase 1
(F01)** se detalla a nivel ejecutable; F02–F10 quedan coarse y cada una parirá su propio task file al
ejecutarse. Restricciones que NO cambian: T3 stack actual, dinero `Decimal` + `$transaction`,
ADR-0001/0002/0003/0004 (re-scopeados por tenant, ver ADR-0005). Las 6 decisiones abiertas siguen
abiertas; el pivote endurece el criterio de #4/#5 (wildcard subdomains — anotado en
`docs/decisiones-abiertas.md`, sin cerrarlas).

## Decisiones

- **D1 — Fase 1 = fundación multi-tenant + circuito de pago.** No se escribe ni se rescata código de
  dominio sin que exista `Tenant` + scoping + resolución por subdominio + BYO-Flow. Razón: el scoping
  por `tenantId` atraviesa TODO modelo y query (ADR-0005); meterlo después = migración dolorosa. Se
  incluye el circuito de pago en la misma fase porque (a) es el trabajo adaptable ya hecho (F01
  viejo), (b) el ruteo del webhook por tenant es EL mecanismo nuevo más riesgoso del pivote y hay que
  probarlo primero, (c) "dos tenants cobrando con credenciales distintas en sandbox" es la prueba de
  fuego de toda la fundación.
- **D2 — Término canónico: Tienda (`Tenant`).** El modelo se llama `Tenant`; en prosa del dominio,
  "Tienda". La persona es el **Organizador** (tiene cuenta); el freelancer es el **Operador de
  plataforma**. Definidos en `CONTEXT.md`.
- **D3 — Rename `Book` → `Product` (Producto) ahora.** La plataforma vende productos digitales
  genéricos (MVP: PDF); el pivote llega antes del código de dominio comprometido, es el único momento
  en que el rename es gratis. `CONTEXT.md` marca `Libro`/`Book` como _Avoid_.
- **D4 — El hito del piloto (F07) va ANTES del self-service (F08).** La tienda de la autora se
  configura por el Operador/seeds + panel de Organizador (F05), sin necesitar registro self-service.
  Razón: compromiso de fecha con el tenant piloto; el onboarding self-service solo se justifica
  cuando hay un producto probado en producción real.
- **D5 — Hermes (F09) sale del camino crítico del piloto.** La tienda piloto puede operar (vender,
  entregar, sortear) sin generador de copy; Hermes se vuelve feature por-tenant post-piloto. Puede
  adelantarse en paralelo tras F05 si hay holgura.
- **D6 — El panel (Organizador y Operador) vive en el apex; el subdominio es solo storefront del
  Comprador** (ADR-0007, supuesto revisable). Razón: una sola cookie de sesión NextAuth, sin auth
  cross-subdominio.
- **D7 — Sin grill extenso** (instrucción explícita del usuario): las decisiones de implementación de
  F01 se resuelven por criterio y quedan como **Supuestos revisables**; las de F02–F10 se resuelven
  en el planning de cada fase. Ninguna pregunta resultó estructuralmente imposible de asumir.

## Plan

Fases ordenadas por dependencia. Cada fase (salvo F01) es coarse y detona su propio task file.

1. **F01 — Fundación multi-tenant + circuito de pago BYO-Flow** (DETALLADA abajo).
2. **F02 — Efectos post-pago per-tenant**. Depende de F01. Adapta el plan superseded
   `26-07-08-efectos-post-pago.md` (contrato del hook post-pago sigue válido) agregando `tenantId`.
3. **F03 — Storage privado + entrega de PDF**. Depende de F02. Proveedor RESUELTO: **Cloudflare R2**
   (ADR-0009, 2026-07-16). Queda abierta solo #6 (marca de agua, se decide en su planning). Paths
   per-tenant.
4. **F04 — Correo transaccional**. Depende de F02/F03. Proveedor RESUELTO: **Resend** (ADR-0010,
   2026-07-16; la plataforma envía en nombre del tenant, reply-to del Organizador).
5. **F05 — Auth de Organizadores + panel de tienda**. Depende de F01 (tenants y datos reales que
   administrar); rescata Google OAuth + guard del superseded `26-07-08-auth-admin-google.md`,
   reemplazando allowlist mono-usuario por **membresía User↔Tenant** (+ rol Operador). Incluye CRUD
   de Productos (+subida PDF vía F03), ventas, sorteo (gestión/ejecución auditable), carga de bases y
   de CredencialFlow.
6. **F06 — Plantilla configurable + storefront del comprador**. Depende de F01 (resolución de
   tenant) y gana entrega real con F03/F04. Bloqueada por la identidad visual de la PLATAFORMA + el
   diseño de la plantilla base (sesión `frontend-design`; `docs/design.md` sigue PENDIENTE — ahora la
   marca es de la plataforma y el theming es per-tenant). Incluye el disclaimer del sorteo (ADR-0008).
7. **F07 — HITO: tienda de la autora (tenant piloto) operativa**. Depende de F01–F06. Bloqueada por
   decisiones abiertas #1/#2/#4/#5 y externas de la autora (SII, cuenta Flow producción, bases del
   sorteo). **Este es el hito con fecha propia del roadmap.**
8. **F08 — Self-service de tenants + panel del Operador**. Depende de F05/F06/F07 (producto probado).
   Registro, wizard de alta (credenciales Flow, productos, sorteo, plantilla), aceptación de ToS
   registrada, publicación; suspensión/supervisión por el Operador.
9. **F09 — Hermes por tenant**. Depende de F05. Bloqueada por decisión abierta #3 (LLM). Puede
   correr en paralelo a F06–F08.
10. **F10 — Go-live de la plataforma pública**. Depende de todo. Bloqueada por la validación legal
    de ToS/disclaimer por abogado (ADR-0008, dependencia externa) + hardening (migraciones
    versionadas reemplazan `db push` antes de tener datos de terceros, backups, monitoreo).

### Detalle de fases (para el HTML del roadmap)

**F01 — Fundación multi-tenant + circuito de pago BYO-Flow** _(detallada)_
- Objetivo: que exista la mecánica esencial del SaaS — tenant, subdominio, scoping, credenciales
  cifradas, ruteo de webhook — probada de punta a punta con 2 tenants en Flow sandbox.
- Dependencias: ninguna (fundación). Rescata service Flow / núcleo webhook / use cases del F01 viejo.
- Decisiones abiertas que bloquean: ninguna (dev usa `*.localhost`).
- Criterio de hecho: dos tenants seed con credenciales sandbox distintas; comprar en
  `a.localhost` y `b.localhost` crea órdenes scoped al tenant correcto, el webhook rutea y confirma
  server-side con las credenciales del tenant dueño de la orden, idempotente; cero fuga cross-tenant.

**F02 — Efectos post-pago per-tenant** _(coarse)_
- Objetivo: al confirmar el pago, crear `DownloadGrant` + `RaffleEntry` (scopeados) en la misma
  transacción, idempotente.
- Dependencias: F01. | Bloqueos: ninguno duro.
- Criterio de hecho: pago confirmado ⇒ N grants + 1 entry del sorteo ACTIVO **de esa Tienda**, una
  sola vez; sin sorteo activo, la venta no se compromete.

**F03 — Storage privado + entrega de PDF** _(coarse)_
- Objetivo: bucket privado **Cloudflare R2** (ADR-0009) con paths per-tenant; descarga por URL
  prefirmada con expiración autorizada por Entitlement (ADR-0002).
- Dependencias: F02. | Bloqueos: solo #6 (marca de agua — se decide en su planning).
- Criterio de hecho: con Entitlement vigente hay URL firmada que expira; sin él, no; el path nunca se
  expone; un tenant jamás sirve archivos de otro.

**F04 — Correo transaccional** _(coarse)_
- Objetivo: enviar el enlace de descarga firmado al confirmar el pago (vía **Resend**, ADR-0010:
  la plataforma envía en nombre del tenant, reply-to del Organizador); reenvío si expira.
- Dependencias: F02, F03. | Bloqueos: ninguno duro en dev (la verificación del dominio remitente
  espera la decisión #4; en dev, remitente de prueba de Resend).
- Criterio de hecho: pago confirmado ⇒ correo al comprador con enlace válido; reenvío disponible.

**F05 — Auth de Organizadores + panel de tienda** _(coarse)_
- Objetivo: cuentas de Organizador (Google OAuth), membresía User↔Tenant + rol Operador, y el panel
  para operar la tienda: productos (+PDF), ventas, sorteo auditable, bases, CredencialFlow, config de
  plantilla.
- Dependencias: F01 (F03 para subir PDFs). Rescata OAuth/guard/authPolicy del plan superseded.
- Bloqueos: ninguno duro en dev (#4 dominio solo para `NEXTAUTH_URL` prod).
- Criterio de hecho: un Organizador solo ve y opera SU(s) tienda(s); el Operador ve todas; cero
  acceso cross-tenant.

**F06 — Plantilla configurable + storefront del comprador** _(coarse)_
- Objetivo: storefront mobile-first tematizado por tenant (logo/colores/textos sobre plantilla
  única), catálogo/carrito/checkout, disclaimer del sorteo (ADR-0008).
- Dependencias: F01 (F03/F04 para el flujo completo). | Bloqueos: identidad visual de la plataforma +
  diseño de la plantilla base (sesión `frontend-design`; `docs/design.md` PENDIENTE).
- Criterio de hecho: un comprador en el subdominio ve la tienda con SU marca, compra y llega a Flow;
  el disclaimer del sorteo es visible.

**F07 — HITO: tienda de la autora (tenant piloto) operativa** _(coarse — hito con fecha propia)_
- Objetivo: dogfooding real — la tienda de la autora vendiendo en producción.
- Dependencias: F01–F06. | Bloqueos: decisiones abiertas #1/#2/#4/#5 (storage, correo, dominio con
  wildcard, hosting con wildcard) + externas de la autora (SII, Flow producción, bases ante notario).
- Criterio de hecho: `<slug-autora>.<dominio>` en producción, primera venta real pagada, PDF
  entregado, participación del sorteo registrada.

**F08 — Self-service de tenants + panel del Operador** _(coarse)_
- Objetivo: que un tercero cree su tienda sin el Operador: registro, wizard (Flow, productos,
  sorteo, plantilla), aceptación de ToS registrada, publicación; panel del Operador
  (alta/suspensión/supervisión).
- Dependencias: F05, F06, F07 (producto probado). | Bloqueos: redacción de ToS (borrador operativo;
  validación legal formal puede correr en paralelo hasta F10).
- Criterio de hecho: un Organizador nuevo llega a tienda publicada sin intervención manual; sin ToS
  aceptados o sin bases no hay publicación con sorteo.

**F09 — Hermes por tenant** _(coarse)_
- Objetivo: generación de copy con el contexto de la tienda (productos/precios/sorteo del tenant),
  LLM-agnóstico (ADR-0003), en el panel del Organizador.
- Dependencias: F05. | Bloqueos: decisión abierta #3 (modelo LLM; + quién absorbe el costo por tenant).
- Criterio de hecho: el Organizador ingresa objetivo/plataforma/tono y recibe variaciones + hashtags.

**F10 — Go-live de la plataforma pública** _(coarse)_
- Objetivo: abrir la plataforma a tenants externos con respaldo legal y operativo.
- Dependencias: todas. | Bloqueos: validación por abogado de ToS/disclaimer (ADR-0008, externa);
  migraciones versionadas en lugar de `db push` antes de custodiar datos de terceros; backups y
  monitoreo.
- Criterio de hecho: plataforma pública con ≥1 tenant externo operando, legal validado, operación
  respaldada.

## Detalle ejecutable de la Fase 1 (F01)

Pasos en orden (todos F01):

1. **Schema multi-tenant** — invocar `schema-guardian` antes de tocar `prisma/schema.prisma`:
   modelo `Tenant` (slug único, nombre, estado del ciclo de vida — enum `alta/configuración/
   publicada/suspendida` —, timestamps), `FlowCredential` (1–1 con Tenant; apiKey y secretKey
   **cifradas**, flag sandbox/prod), y `Product`/`Order`/`OrderItem`/`Payment` (adaptados del F01
   viejo, renombrando `Book`→`Product`) todos con `tenantId` + `@@index([tenantId])` + uniques
   compuestos. `onDelete` explícito per prisma-conventions.
2. **Service de cifrado** (`src/server/services/`): encrypt/decrypt de credenciales (S2: AES-256-GCM,
   key en env via Zod). Núcleo puro testeable; la key jamás se loguea.
3. **Resolución de tenant por subdominio**: parser puro host→slug (apex/www ⇒ zona plataforma;
   `*.localhost` en dev) + middleware Next.js / helper SSR que resuelve slug→Tienda **publicada** y
   establece el contexto; contexto tRPC del storefront lleva el tenant resuelto server-side.
4. **Adaptar el service Flow rescatado**: factory instanciada con la `CredencialFlow` **descifrada**
   del tenant (la firma HMAC y `crearPago`/`getStatus` ya existen y no cambian).
5. **Adaptar `iniciarCheckout`**: scoped al tenant del contexto (solo productos de ESA tienda;
   snapshot de precio igual que antes); crea `Order`/`Payment` con `tenantId`.
6. **Webhook multi-tenant**: el núcleo rescatado gana el paso de **ruteo** — token/`commerceOrder` ⇒
   `Payment` ⇒ tenant ⇒ `getStatus` con las credenciales de ESE tenant ⇒ transición
   `pendiente→pagado|fallido` en `$transaction`, idempotente, hook post-pago intacto (contrato F02).
7. **Seeds** (`scripts/`): tenant piloto (autora) + tenant de prueba, cada uno con credenciales
   sandbox propias + 1 producto; idempotentes.
8. **Página dev throwaway tenant-aware** (sin marca): en el subdominio dev, elegir producto + email ⇒
   redirect a Flow sandbox.
9. Cierre: `backend-reviewer` + `change-set-reviewer` con la lista de archivos de la sesión.

## Validaciones

Solo F01 (fase detallada). F02–F10 definen las suyas en su propio task file.

### F01 — Fundación multi-tenant + circuito de pago BYO-Flow

**Vitest** (integration):
- [ ] El parser de host resuelve `a.dominio` → slug `a`; apex y `www` → zona plataforma (sin tenant); host inválido/anidado no resuelve tenant.
- [ ] La resolución completa: slug existente y **publicada** ⇒ tenant en contexto; slug inexistente, en configuración o suspendida ⇒ sin storefront (respuesta neutral).
- [ ] Cifrado: roundtrip encrypt/decrypt recupera el secreto; el ciphertext no contiene el plaintext; descifrar con key incorrecta falla.
- [ ] `iniciarCheckout` crea `Order` `pendiente` + `OrderItem`(s) con snapshot de precio, `total` = suma, correo persistido y `tenantId` del tenant del contexto.
- [ ] Aislamiento: `iniciarCheckout` en la tienda A con un producto de la tienda B ⇒ `NOT_FOUND`; los listados solo devuelven productos del tenant del contexto.
- [ ] El service Flow se instancia con las credenciales del tenant y `crearPago` firma con la secretKey de ESE tenant (dos tenants ⇒ firmas distintas para el mismo payload).
- [ ] El webhook rutea: dado un token/commerceOrder, deriva la orden y su tenant, y consulta `getStatus` con las credenciales de ese tenant (nunca las de otro, nunca globales).
- [ ] El webhook confirma server-side y avanza `pendiente→pagado` una sola vez, en `$transaction`; replay ⇒ ack sin re-efectos; resultado fallido ⇒ `pendiente→fallido`; método ≠ POST ⇒ 405 sin efectos.
- [ ] Los seeds son idempotentes y dejan 2 tenants con credenciales y producto propios.
- [ ] Secretos (keys de Flow, key de cifrado) jamás aparecen en logs ni respuestas.

**E2E** (manual en sandbox — el checkout corre en el dominio de Flow):
- [ ] En `a.localhost` y `b.localhost`: elegir producto + email ⇒ pagar con tarjeta de prueba ⇒ cada `Order` queda `pagado` bajo SU tenant, confirmada con las credenciales de SU cuenta Flow sandbox, webhook procesado una sola vez (verificable en Prisma Studio).

### F02–F10
- [ ] (se definen en el task file de cada fase al planificarla)

## Invariantes

- **I1 — Tenancy**: todo modelo del dominio comercial lleva `tenantId`; toda query de dominio se
  filtra por el tenant resuelto **server-side** (subdominio o sesión), nunca por input del cliente;
  uniques compuestos con `tenantId` (ADR-0005).
- **I2**: Confirmación de pago SIEMPRE server-side contra `payment/getStatus` **con las credenciales
  del tenant dueño de la orden**; el redirect del navegador nunca es prueba de pago (ADR-0001/0006).
- **I3**: Webhook idempotente; transición `pendiente→pagado|fallido` una sola vez, en
  `prisma.$transaction`; el hook post-pago conserva el contrato `({tx, orderId}) => Promise<void>`.
- **I4**: Dinero `Decimal @db.Decimal(15,2)`, nunca `Float`; precio congelado en `OrderItem`.
- **I5**: `FlowCredential` cifrada at-rest; secretos y key de cifrado nunca en texto plano en DB,
  logs ni respuestas (ADR-0006).
- **I6**: La Plataforma nunca recibe ni mueve fondos de terceros ni hace split (ADR-0006).
- **I7**: Endpoints con patrón núcleo testeable + wrapper Next; env vía `src/env.js` (Zod) +
  `.env.example`; layering router fino → `domain/` → `services/`.
- **I8**: Antes de tocar el schema: `schema-guardian`. `onDelete` explícito, `@@index` en FKs
  queriables; `db push` sin migraciones versionadas **hasta F10** (revisar antes de datos de terceros).
- **I9**: PDFs jamás por enlace público; entrega solo vía Entitlement + URL firmada (ADR-0002) —
  rige desde F03 pero ninguna fase anterior puede violarlo "provisoriamente".

## Out of scope

- Cerrar decisiones abiertas #1–#6 (se resuelven con el usuario en la fase que las necesita).
- Builder/editor visual de tiendas (solo plantilla configurable — decisión cerrada del pivote).
- Split de pagos, custodia de fondos, comisión retenida en la pasarela (ADR-0006); el modelo de
  cobro de la Plataforma a los tenants es decisión de negocio abierta.
- Dominios custom por tenant (ADR-0007 — post-MVP).
- Cuentas de Comprador (ADR-0004), auto-posteo de Hermes, Mercado Pago directo, boletas SII
  automáticas.
- En F01: efectos post-pago, entrega, correo, UI con marca, panel, onboarding (fases posteriores).

## Supuestos (resueltos por criterio, revisables)

- **S1**: Dev multi-tenant vía `*.localhost` (`a.localhost:3000`) — browsers modernos lo resuelven
  sin DNS.
- **S2**: Cifrado de credenciales = AES-256-GCM app-level con key única en env
  (`CREDENTIALS_ENCRYPTION_KEY`); sin KMS por costo. Rotación = re-cifrado batch.
- **S3**: `Tenant.slug` = subdominio, único a nivel plataforma, inmutable tras publicación.
- **S4**: Apex reservado a la Plataforma; panel de Organizador/Operador en el apex (D6); el
  subdominio solo sirve storefront.
- **S5**: Rename `Book`→`Product` se ejecuta en F01 al adaptar el trabajo rescatado (D3).
- **S6**: Membresía mínima en el MVP: un Organizador dueño por Tienda (sin equipos/roles finos);
  el rol Operador es un flag/rol de plataforma. Se refina en el planning de F05.
- **S7**: `db push` sigue hasta F10; **antes del go-live público se migra a migraciones versionadas**
  (datos de terceros exigen evolución de schema no destructiva).
- **S8**: El trabajo parcial pausado de F01/F05 single-tenant se evalúa y rescata **dentro de F01/F05
  nuevos** (no se commitea tal cual): se conservan service Flow, núcleo webhook, DomainError/seams,
  authPolicy pura y tests puros; se adaptan schema, seeds, checkout y cableados al scoping.
- **S9**: El estado del ciclo de vida de la Tienda es un enum simple en el modelo `Tenant` (sin
  historial de transiciones en MVP).

## Especialistas a consultar

Para F01 (los demás en el planning de cada fase):

- `schema-guardian` — modelo `Tenant`/`FlowCredential` + re-scoping de `Product`/`Order`/`OrderItem`/
  `Payment` (uniques compuestos, `onDelete`, índices por `tenantId`).
- `backend-reviewer` — middleware/resolución de tenant, service de cifrado, ruteo del webhook,
  layering y env vars.
- `troubleshooter` — si el trabajo rescatado del F01 viejo pelea con el scoping.
- `feature-tester` — Vitest + E2E manual asistido con 2 tenants en sandbox.
- `change-set-reviewer` — diff completo de la fase antes de commit.

## Bitácora

- [2026-07-16 00:00] [planner-grill] (domain-planner) Pivote a SaaS multi-tenant registrado. Por
  instrucción explícita del usuario NO hubo grill: decisiones vinculantes ya cerradas por él
  (BYO-Flow, responsabilidad legal del organizador, plantilla configurable sin builder, subdominios,
  autora = tenant piloto); el resto resuelto por criterio y marcado como Supuestos S1–S9. Ninguna
  pregunta resultó estructural imposible de asumir.
- [2026-07-16 00:00] [planner-grill] Docs de dominio actualizados en la misma sesión: `CONTEXT.md`
  reescrito para el SaaS (Tienda/`Tenant`, Organizador, Operador de plataforma, Plataforma,
  Subdominio, Plantilla, CredencialFlow, ToS, Disclaimer, ciclo de vida; `Book`→`Product`; Autora →
  tenant piloto; regla transversal de scoping). ADRs nuevos: **ADR-0005** (multi-tenant `tenantId` DB
  compartida), **ADR-0006** (BYO-Flow + ruteo webhook), **ADR-0007** (subdominios), **ADR-0008**
  (responsabilidad legal del sorteo). Nivel 2 los cuatro (afectan modelo de datos, dinero y
  arquitectura; restringen features futuras). `docs/decisiones-abiertas.md` anotado (wildcard en
  #4/#5, correo multi-tenant en #2, costo LLM por tenant en #3) sin cerrar ninguna.
- [2026-07-16 00:00] [planner-grill] Superseded: `26-07-08-mvp-roadmap.md` (status testing→superseded),
  `26-07-08-auth-admin-google.md` (testing→superseded), `26-07-08-efectos-post-pago.md`
  (planning→superseded) — nota en cada Bitácora apuntando acá. Trabajo parcial F01/F05 pausado en
  terminales paralelas: NO se descarta; S8 define qué se rescata. INDEX actualizado.
- [2026-07-16 00:00] [planner-grill] Roadmap escrito: 10 fases, F01 detallada (fundación multi-tenant
  + circuito de pago BYO-Flow con 2 tenants sandbox como prueba de fuego), hito del piloto = F07,
  self-service = F08 (post-piloto, D4), Hermes = F09 (fuera del camino crítico, D5), go-live
  plataforma = F10 (gate legal + migraciones versionadas). **AWAITING USER APPROVAL** — la
  implementación de F01 no arranca sin visto bueno explícito del usuario.
- [2026-07-16 00:00] [orquestador] Usuario dio **visto bueno al roadmap SaaS** y cerró dos decisiones
  abiertas: #1 storage → **Cloudflare R2** (ADR-0009), #2 correo transaccional → **Resend**
  (ADR-0010). Referencia estudiada: `datawalt-app` (multi-tenant por subdominio en producción) —
  lecciones incorporadas: tenant SIEMPRE resuelto server-side en el context (su bug H1 de IDOR
  cross-tenant nació de pasar `domain` como input por procedure), membresía User↔Tenant con unique
  compuesto, un solo nombre de columna (`tenantId`) desde el día 1, fail-closed. F03/F04 quedan sin
  bloqueo de proveedor. F01 pasa a implementing.
