---
slug: efectos-post-pago
status: planning              # planning | implementing | testing | done
owner: nicolas
created: 2026-07-08
related_adrs: [ADR-0001, ADR-0002]
related_context: [Orden, ÍtemDeOrden, Pago, Entitlement, Sorteo, Participación, Libro, Comprador]

features:
  - id: F01
    behavior: "Modelos de datos del post-pago: DownloadGrant / Raffle / RaffleEntry (+ enum RaffleStatus) con onDelete/índices/unique, migración aditiva, y seed del Raffle ACTIVO vía script"
    state: not_started

  - id: F02
    behavior: "Use case aplicarEfectosPostPago: al confirmar el pago crea el/los DownloadGrant + la RaffleEntry idempotentemente, dentro de la MISMA transacción, cableado en el punto de extensión post-pago que deja el webhook de Flow"
    state: not_started
---

# Efectos post-pago — Entitlement (DownloadGrant) + Participación (RaffleEntry)

> **Fase F02 del roadmap** (`tasks/26-07-08-mvp-roadmap.md`). Implementa el punto de extensión
> "efectos post-pago" que la fase F01 del roadmap (camino a Flow sandbox) deja marcado en el webhook.

## Contexto

El roadmap corta la Fase 1 en "orden pagada": el webhook de Flow confirma el pago **server-side**
contra `payment/getStatus` y avanza `Order`/`Payment` `pendiente → pagado` de forma idempotente,
dentro de una `prisma.$transaction`, y **deja marcado un punto de extensión "efectos post-pago"**
(decisión D2 / supuesto S4 del roadmap). Esta fase (F02 del roadmap) rellena ese punto: cuando un
pago se confirma, hay que materializar los dos efectos de negocio que penden de una venta pagada —
el **Entitlement** (`DownloadGrant`, autoridad de descarga del PDF, ADR-0002) y la **Participación**
(`RaffleEntry`, inscripción en el sorteo activo, CONTEXT). Ambos se crean en la **misma transacción**
que la transición de estado, de forma **idempotente** (el webhook puede llegar más de una vez, I2 del
roadmap).

Alcance estricto (del roadmap): crear los **registros** de `DownloadGrant` y `RaffleEntry`. **NO** hay
entrega física del PDF (URL firmada / storage privado → F03), **NO** hay correo (F04), **NO** hay UI ni
admin (F06/F07). El `Raffle` activo se **siembra vía script** (S1 del roadmap), no vía CRUD.

> **Dependencia dura — bloqueada hasta cerrar F01 (roadmap).** F01 (roadmap) se está ejecutando en
> paralelo y todavía NO está implementada. Esta fase (a) referencia los modelos `Order` / `OrderItem`
> / `Book` que F01 crea (las FKs de los nuevos modelos apuntan a ellos), y (b) se engancha en el punto
> de extensión que F01 expone en el webhook. La implementación de F02 **NO arranca** hasta que F01
> esté hecha y su punto de extensión exista. Este plan **define el contrato esperado** de ese punto
> (ver Decisiones D1); los detalles finos (nombre exacto de la firma, forma del `req`, cómo F01 invoca
> el hook) **se ajustan cuando F01 exista** — quedan como Supuesto revisable S0.

## Decisiones

Por pedido explícito del usuario esta fase se planifica **sin grill extenso**: las decisiones de
implementación se resuelven por criterio y se marcan como **Supuestos revisables** (sección Supuestos).
Las de abajo son las que estructuran el plan.

- **D1 — Contrato del punto de extensión post-pago.** F01 (roadmap) expone, en el núcleo testeable del
  webhook, un hook que F02 implementa. **Contrato esperado**:
  - Se invoca **una sola vez por pago**, **dentro de la misma `prisma.$transaction`** que ejecuta la
    transición `pendiente → pagado`, y **solo en esa transición** (nunca en fallido, nunca en
    idempotent-replay de un pago ya procesado).
  - Firma esperada: `(args: { tx: Prisma.TransactionClient; orderId: string }) => Promise<void>`.
    Recibe el **cliente transaccional** `tx` (para que sus escrituras vivan en la misma transacción) y
    el **`orderId`** de la orden recién confirmada. No recibe ni toca `env`, `res`, ni el cliente Flow.
  - F02 implementa este hook como el use case `aplicarEfectosPostPago` (capa `domain/`, inyectable), y
    F01 lo cablea como dependencia del núcleo del webhook (patrón dep-injection de
    `backend-conventions.md` § Endpoints pages/api).
  - Razón: cumplir I2/I3 del roadmap (idempotencia + operación de plata/estado en una sola transacción)
    sin reescribir el webhook (S4). Si la transacción se revierte, los efectos se revierten con ella.
  - **Ajuste diferido (S0):** el nombre literal del parámetro/hook y la forma exacta del `req` acotado
    los fija F01; F02 se adapta a lo que F01 dejó, respetando la semántica de este contrato.

- **D2 — Granularidad del Entitlement: uno por (Orden, Libro).** Se crea **un `DownloadGrant` por cada
  `OrderItem`** de la orden (una orden con N libros → N grants). Razón: CONTEXT define el Entitlement
  como "liga una Orden pagada a **un libro**" (singular) y la descarga es por-libro (ADR-0002). Idempotencia
  a nivel DB con `@@unique([orderId, bookId])`.

- **D3 — Granularidad de la Participación: una por Orden (compra), no por email.** Se crea **una
  `RaffleEntry` por orden** en el `Raffle` activo. Razón: CONTEXT dice "**cada compra** inscribe al
  comprador como Participación" → más compras = más chances (no se deduplica por correo). Idempotencia a
  nivel DB con `@@unique([raffleId, orderId])`. Se **denormaliza el `email`** del comprador (snapshot
  desde `Order.email`) porque la Participación es "por su correo" y el panel del sorteo (F06) lista
  participantes por correo.

- **D4 — Sin `Raffle` activo → el pago NO se compromete.** Si al confirmar el pago no hay ningún `Raffle`
  con estado `ACTIVO`, se crean igual los `DownloadGrant` y **se omite** la `RaffleEntry` sin lanzar
  error (la venta es lo primario; el sorteo es promocional). Razón: una venta pagada **jamás** debe
  revertirse porque el sorteo no está sembrado. Se registra el skip (log inocuo, sin secretos).

- **D5 — El Entitlement nace con `token` opaco + `expiresAt`.** El `DownloadGrant` se crea con un `token`
  aleatorio inadivinable (`crypto.randomBytes` → base64url) **único**, y un `expiresAt` (ventana de
  validez del derecho). Razón: CONTEXT define el Entitlement con "token firmado y expiración"; el token
  es la **autoridad intrínseca** que el endpoint de descarga (F03) validará. Ojo: este token del grant
  es distinto de la **URL firmada de expiración corta** (~10 min) que genera el proveedor de storage por
  descarga — eso es F03. La **política de expiración del grant** (¿30 días? ¿sin expiración?) queda como
  Supuesto S3, revisable en el planning de F03.

- **D6 — El `Raffle` activo se siembra vía script.** `scripts/seed-raffle.ts` crea/asegura un `Raffle`
  `ACTIVO` (nombre, premio "2 entradas a un recital de BTS", fechas, `basesUrl` opcional). Idempotente
  (correr dos veces no duplica el raffle activo). Patrón script núcleo testeable + wrapper `main()`
  (`backend-conventions.md` § Scripts CLI). Razón: S1 del roadmap (el CRUD del sorteo llega en F06).

## Plan

Dos features. **F01 (modelos + seed)** puede empezar en cuanto los modelos de F01-roadmap
(`Book`/`Order`/`OrderItem`) existan (las FKs los requieren). **F02 (use case + cableado)** requiere
además el punto de extensión del webhook de F01-roadmap.

1. **Invocar `schema-guardian`** con la forma propuesta de abajo antes de tocar `prisma/schema.prisma`
   (onDelete, índices, unique, Decimal si aplica, clasificación aditiva/destructiva). (F01)
2. Agregar al schema los modelos `Raffle`, `RaffleEntry`, `DownloadGrant` y el enum `RaffleStatus`, más
   las back-relations en `Order` / `OrderItem` / `Book` (que crea F01-roadmap). Migración **aditiva**
   versionada (`npm run db:generate`). (F01)
3. Crear `scripts/seed-raffle.ts` (núcleo `sembrarRaffleActivo({ db })` + wrapper `main()`), idempotente.
   Documentar cualquier env que consuma en `.env.example`. (F01)
4. Implementar el use case `aplicarEfectosPostPago({ tx, orderId })` en `src/server/domain/pago/`
   (o el módulo donde F01-roadmap ubique el webhook): carga la orden + sus ítems (con `bookId`) y el
   `email` vía `tx`; crea los `DownloadGrant` (uno por ítem, token + expiresAt, idempotente); busca el
   `Raffle` `ACTIVO` y crea la `RaffleEntry` (idempotente); si no hay raffle activo, omite la entry. (F02)
5. **Cablear** `aplicarEfectosPostPago` como la implementación del punto de extensión post-pago del
   webhook (D1). Ajustar a la firma/forma real que dejó F01-roadmap (S0). (F02)
6. Cerrar con `backend-reviewer` (use case + cableado + layering) y `change-set-reviewer` (diff completo).

### Forma de schema propuesta (borrador — la finaliza `schema-guardian`)

```prisma
enum RaffleStatus {
  ACTIVO
  CERRADO
}

model Raffle {
  id          String       @id @default(cuid())
  nombre      String
  premio      String
  estado      RaffleStatus @default(ACTIVO)
  fechaInicio DateTime
  fechaFin    DateTime
  basesUrl    String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  entries     RaffleEntry[]

  @@index([estado])
}

model RaffleEntry {
  id        String   @id @default(cuid())
  raffleId  String
  orderId   String
  email     String   // snapshot del correo del comprador (Order.email)
  createdAt DateTime @default(now())

  raffle    Raffle   @relation(fields: [raffleId], references: [id], onDelete: Restrict)
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Restrict)

  @@unique([raffleId, orderId])   // idempotencia: una entry por compra por sorteo
  @@index([raffleId])
  @@index([orderId])
}

model DownloadGrant {
  id        String   @id @default(cuid())
  orderId   String
  bookId    String
  token     String   @unique          // opaco, inadivinable; autoridad de descarga (F03 lo valida)
  expiresAt DateTime                   // ventana de validez del grant (política revisable en F03, S3)
  createdAt DateTime @default(now())

  order     Order    @relation(fields: [orderId], references: [id], onDelete: Restrict)
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Restrict)

  @@unique([orderId, bookId])         // idempotencia: un grant por (orden, libro)
  @@index([orderId])
  @@index([bookId])
}
```

> `Order`, `OrderItem`, `Book` los crea F01-roadmap; acá solo se agregan sus **back-relations**
> (`downloadGrants DownloadGrant[]`, `raffleEntries RaffleEntry[]` en `Order`; `downloadGrants
> DownloadGrant[]` en `Book`). `onDelete: Restrict` en todas las FKs porque `Order`/`Book`/`Raffle` son
> modelos auditables/append-only (dinero + sorteo): no se borran teniendo hijos.

## Validaciones

### F01 — Modelos + seed del Raffle activo

**Vitest** (integration, DB-backed — núcleo del script):
- [ ] `sembrarRaffleActivo` crea un `Raffle` con estado `ACTIVO`, nombre, premio y fechas.
- [ ] Correr `sembrarRaffleActivo` dos veces NO duplica el `Raffle` activo (idempotente).

**E2E** (browser):
- [ ] (no aplica — schema/backend-only) Verificación manual: el `Raffle` `ACTIVO` aparece en Prisma Studio tras correr el seed.

### F02 — aplicarEfectosPostPago (Entitlement + Participación idempotentes)

**Vitest** (integration, DB-backed):
- [ ] Dada una orden confirmada con N ítems, `aplicarEfectosPostPago` crea exactamente N `DownloadGrant` — uno por `OrderItem`/libro — cada uno con `token` único y `expiresAt`.
- [ ] Crea exactamente una `RaffleEntry` en el `Raffle` `ACTIVO`, con el `email` copiado desde `Order.email`.
- [ ] Idempotencia: invocar `aplicarEfectosPostPago` dos veces sobre la misma orden deja exactamente N grants + 1 entry (sin duplicados — garantizado por los `@@unique`).
- [ ] Los efectos viven en la MISMA transacción que la transición: si la `$transaction` se revierte, no persiste ningún `DownloadGrant` ni `RaffleEntry` (solo existen cuando la orden queda `pagado`).
- [ ] Sin `Raffle` `ACTIVO`: se crean los `DownloadGrant` igual, NO se crea `RaffleEntry`, y no se lanza error (la orden pagada no se compromete).
- [ ] Un `Raffle` en estado `CERRADO` no recibe `RaffleEntry` (solo el `ACTIVO`).

**E2E** (browser):
- [ ] (no aplica — backend-only) Verificación manual: se engancha en el flujo manual de sandbox de F01-roadmap — tras pagar con tarjeta de prueba, la orden `pagado` tiene sus `DownloadGrant` + `RaffleEntry` en Prisma Studio, y el webhook procesó una sola vez.

## Invariantes

- **I1**: Los efectos post-pago se ejecutan **dentro de la misma `prisma.$transaction`** que la transición
  `pendiente → pagado`, y **una sola vez por pago** (idempotentes por `@@unique`). Si la transacción se
  revierte, los efectos se revierten. (ADR-0001, I2/I3 del roadmap.)
- **I2**: Una orden pagada **nunca** se revierte por un problema del sorteo (D4): sin `Raffle` activo se
  omite la `RaffleEntry`, no se falla.
- **I3**: El `token` del `DownloadGrant` es aleatorio inadivinable (`crypto`), `@@unique`, y **nunca** se
  loguea. El PDF/URL de descarga NO se materializa acá (es F03) — este grant es solo la autoridad.
- **I4**: Todas las FKs nuevas con `onDelete` explícito (`Restrict` sobre modelos auditables) y `@@index`
  en cada FK queriable; migración **aditiva** versionada. Invocar `schema-guardian` antes de tocar el
  schema. (`prisma-conventions.md`, I9 del roadmap.)
- **I5**: Layering: el use case `aplicarEfectosPostPago` vive en `domain/`, recibe `{ tx, orderId }`
  inyectados, no toca `env`/`res`/Flow, y se cablea desde el borde (webhook) — no al revés. Cero lógica
  de negocio en el wrapper del endpoint. (`backend-conventions.md`.)
- **I6**: `RaffleEntry.email` es un **snapshot** de `Order.email` al momento de crear la entry (igual que
  el precio se congela en el `OrderItem`); no se re-referencia en vivo.

## Out of scope

- Entrega física del PDF: URL firmada, storage privado, endpoint de descarga (→ F03 del roadmap).
- Correo con el enlace de descarga (→ F04).
- CRUD/gestión del sorteo, ejecución auditable del sorteo (elegir ganador), panel admin (→ F06).
- UI del comprador (→ F07).
- IVA/boleta/neto-al-vendedor, cómputo de comisiones (fuera del MVP / no en esta fase).
- Reescribir o rediseñar el webhook de Flow: esta fase **se engancha** en su punto de extensión, no lo
  reescribe (S4 del roadmap).
- Marca de agua por-comprador (decisión abierta #6, se decide en F03).

## Especialistas a consultar

- `schema-guardian` — **antes** de agregar `Raffle`/`RaffleEntry`/`DownloadGrant` + enum + back-relations:
  naming, `onDelete`, `@@index`, `@@unique`, clasificación aditiva/destructiva de la migración.
- `backend-reviewer` — use case `aplicarEfectosPostPago` (layering domain/, idempotencia, transacción),
  el cableado en el punto de extensión del webhook, y el script de seed (núcleo + wrapper).
- `feature-tester` — Vitest DB-backed (grants/entry/idempotencia/rollback) + verificación manual
  asistida enganchada al flujo de sandbox de F01-roadmap.
- `change-set-reviewer` — review del diff completo de F02 antes de commit.

## Bitácora

- [2026-07-08 00:00] [planner-grill] F02 del roadmap pasa a planning. Por pedido explícito del usuario NO se hace grill extenso: decisiones de implementación resueltas por criterio y marcadas como Supuestos revisables; sin `AWAITING ANSWER` (no hay pregunta estructural imposible de asumir). Contexto cargado: CLAUDE.md, CONTEXT.md, ADR-0001/0002, roadmap (D2/S4 = punto de extensión post-pago), prisma-conventions, backend-conventions.
- [2026-07-08 00:00] [planner-grill] Plan escrito. Alcance: crear registros `DownloadGrant` (uno por OrderItem) + `RaffleEntry` (una por orden en el Raffle ACTIVO) idempotentemente, en la misma `$transaction` que la transición pendiente→pagado. Definido el CONTRATO del punto de extensión (D1): `(args:{tx,orderId})=>Promise<void>`, invocado una vez, dentro de la transacción, solo en la transición a pagado. Explícito: implementación BLOQUEADA hasta cerrar F01-roadmap (los modelos y el hook no existen aún); detalles finos del hook se ajustan cuando F01 exista (S0).
- [2026-07-08 00:00] [planner-grill] Supuestos revisables asentados: S0 (firma exacta del hook la fija F01), S1 (grant per OrderItem), S2 (entry per orden, no per email; denormaliza email), S3 (expiración del grant se finaliza en F03; default 30 días), S4 (sin raffle activo → omitir entry, no fallar), S5 (a lo sumo un Raffle ACTIVO — invariante de sembrado), S6 (token del grant = crypto random opaco, distinto de la URL firmada de F03). Esperando visto bueno del usuario. Implementación no arranca hasta que F01-roadmap esté hecha.

## Supuestos (resueltos por criterio, revisables)

- **S0**: El nombre literal del parámetro/hook post-pago y la forma exacta del `req` acotado los fija
  **F01-roadmap**; F02 se adapta respetando la semántica del contrato D1 (una invocación, dentro de la
  transacción, solo en la transición a `pagado`, recibe `{ tx, orderId }`).
- **S1**: Un `DownloadGrant` por `OrderItem` (D2).
- **S2**: Una `RaffleEntry` por **orden** (no dedup por email); se denormaliza `email` (D3).
- **S3**: `expiresAt` del grant = ventana de validez del derecho (default tentativo **30 días** desde la
  confirmación, calculado con `Date.UTC` nativo per convención). La política definitiva se decide en el
  planning de F03 (puede ser sin expiración + apoyarse solo en la URL firmada corta). Revisable.
- **S4**: Sin `Raffle` `ACTIVO` al confirmar → se omite la `RaffleEntry`, no se falla el pago (D4).
- **S5**: A lo sumo **un** `Raffle` en estado `ACTIVO` a la vez (invariante de sembrado, no forzado por
  constraint DB). El use case toma el único `ACTIVO`; dos activos serían un error de sembrado.
- **S6**: El `token` del `DownloadGrant` es un valor aleatorio opaco (`crypto`), **distinto** de la URL
  firmada de expiración corta que genera el proveedor de storage en F03.
