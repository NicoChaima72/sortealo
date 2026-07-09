# Backend conventions

Convenciones del backend de libros-iselk: Next.js 14 (pages router) + tRPC 11 + NextAuth 4 (provider OAuth con allowlist para el admin) + Prisma 5 + PostgreSQL.

**Estado**: seed mínimo de un proyecto joven (aún sin features implementadas). Este doc captura las reglas genéricas de arquitectura del stack T3 que ya valen, y crece con cada decisión aprobada en features reales. No inventar reglas que el proyecto no decidió ni consolidaciones que no ocurrieron.

## Auth

- NextAuth 4 con un **provider OAuth** para el panel admin (`src/server/auth.ts`). El panel es **mono-usuario** (la autora); no hay cuentas de comprador en el MVP (la identidad del comprador es su correo — ver `docs/adr/0004-...`).
- **Allowlist del admin**: solo los emails permitidos entran al panel (restricción en el callback `signIn`, idealmente reforzada a nivel del proveedor OAuth). Todo lo que cuelga detrás de auth es la operación de la autora.
- La sesión se obtiene server-side con `getServerAuthSession` (wrapper sobre `getServerSession` que ya evita importar `authOptions` en cada archivo). Nunca reimplementar `getServerSession` en otro lado.

### Guard de páginas server-side (pages router)

Para proteger una página del panel admin se usa su propio `getServerSideProps`, que llama a `getServerAuthSession` y redirige a `/login` (o equivalente) cuando no hay sesión. Cuando aparezca el primer flujo real con varias páginas protegidas, vale extraer un helper `requireSession(ctx)` **sobre** `getServerAuthSession` (sin reimplementar `getServerSession` ni duplicar la allowlist) que devuelva un resultado discriminado tipo `{ session, redirect }`, consumido con early-return del `redirect` para que TS estreche `session` a no-null. Patrón **imperativo, no HOC**: cada página escribe su `getServerSideProps` y llama al helper adentro, conservando control para lógica extra. Páginas públicas (catálogo, checkout, `/login`) simplemente no exportan guard.

> Mientras no exista ese helper no lo cites como si estuviera: es el patrón a seguir cuando se necesite, no código presente hoy.

## Layering: routers → domain → services

El backend se organiza en tres capas con dependencias en una sola dirección. Es la arquitectura objetivo; el código se migra a este patrón **incrementalmente, a medida que se toca** — no se reescribe todo de golpe, y el scaffold inicial (router `post` de ejemplo) no la sigue todavía.

- **Routers** (`src/server/api/routers/`) — adapters finos del transporte. Cada procedure son 3-5 líneas: valida el input con Zod y delega a un use case vía un seam `runDomain()`. **Cero lógica de negocio**, **cero `ctx.db` directo** acá.
- **Domain** (`src/server/domain/<modulo>/`) — los use cases SON la lógica de negocio. Firma uniforme `{ db, session, input }`; importan Prisma directo (cero hexagonal). Errores de negocio = `DomainError` con un set acotado de códigos (p. ej. `NOT_FOUND` | `FORBIDDEN` | `INVALID` | `CONFLICT` | `INACTIVE`) en `src/server/domain/errors.ts`. Un `Error()` genérico cae a `INTERNAL_SERVER_ERROR`.
- **Services** (`src/server/services/`) — adapters a sistemas externos. En este proyecto: la **pasarela de pago Flow**, el **storage privado de PDFs**, el **proveedor LLM de Hermes** y el **correo transaccional**. No conocen sesión ni reglas de negocio; exponen una interfaz estable para poder cambiar el proveedor concreto con fricción mínima (storage y modelo LLM son decisiones abiertas — ver `docs/decisiones-abiertas.md`).

`runDomain()` (`src/server/api/runDomain.ts`) es el seam: ejecuta el use case y mapea `DomainError` → `TRPCError` por código; deja pasar cualquier otro `Error`. Patrón típico de un procedure:

```ts
.input(zod).mutation(({ ctx, input }) =>
  runDomain(() => crearOrden({ db: ctx.db, session: ctx.session, input })))
```

- El dominio es **agnóstico al transporte**: un use case no importa nada de tRPC.
- **Sin barrels** (`index.ts` re-exportadores): se importa el módulo concreto por su ruta.
- Un módulo de dominio nuevo nace como `domain/<modulo>/` (use cases + `schemas.ts` Zod + `_internal.ts` si aplica) con su router espejo `routers/<modulo>.ts`.

## Procedures tRPC

Definidos en `src/server/api/trpc.ts`. Hoy hay **2 procedures**:

| Procedure | Qué valida / inyecta |
|---|---|
| `publicProcedure` | Sin auth. Para el borde de cara al comprador (catálogo, inicio de checkout — no hay sesión de comprador en el MVP). |
| `protectedProcedure` | `session.user` presente (NextAuth + provider OAuth + allowlist del admin). Default para todo lo que opere el panel de la autora. |

Si una feature futura necesita un guard distinto, se agrega como middleware nuevo en `trpc.ts` y se compone explícitamente — no autoencadenar middlewares dentro de handlers.

## Routers

- Viven en `src/server/api/routers/`, se componen en `src/server/api/root.ts`.
- **Naming de procedures**: el dominio de libros-iselk está escrito en **español** y el router **espeja el nombre del use case** que llama (trazabilidad router→dominio). El principio rector es **espejar el use case en español**; los prefijos son consecuencia de eso:
  - Queries que devuelven **una entidad o un agregado**: prefijo `get*` (p. ej. `getLibro`, `getOrden`).
  - Queries que **listan una colección**: prefijo `listar*`, espejando el use case (p. ej. `listarLibros`, `listarOrdenes`).
  - Mutations: español espejando el use case (p. ej. `crearLibro`, `actualizarLibro`, `iniciarCheckout`, `confirmarPago`).
- **Inputs siempre validados con Zod**. Nunca `z.any()`.
- Todo procedure del panel filtra/autoriza contra `ctx.session` — nunca confiar en un identificador (userId, email del comprador) que venga del input sin validarlo contra el estado del servidor.

## Endpoints `pages/api` (borde no-tRPC)

Algunos disparadores no son la UI con sesión NextAuth: una pasarela de pago que notifica por webhook, un servicio externo. Esos entran por un endpoint Next clásico en `src/pages/api/`. El layering sigue rigiendo — el endpoint es **borde** (transporte): toca `env`, resuelve el contexto y compone los adapters; la lógica de negocio vive en `domain/`, inyectada.

El caso clave de este proyecto es el **webhook de Flow** (ver `docs/adr/0001-...`): Flow notifica el resultado del pago a un endpoint del backend, que **confirma server-side contra la API de Flow** antes de mutar estado (nunca confía en el redirect del navegador) y debe ser **idempotente** (el webhook puede llegar más de una vez). Al confirmar el pago se generan los `Entitlement`(s), se crea la `RaffleEntry` y se dispara el correo con el enlace firmado — idealmente dentro de una transacción.

### Forma del archivo: núcleo testeable + wrapper Next

- **Núcleo puro y exportado** (p. ej. `manejarWebhookFlow`): recibe un `req` acotado (`Pick<NextApiRequest, "method" | "headers" | "body">`) y un objeto de **dependencias inyectables** (el verificador del pago contra Flow, los repositorios/use cases del dominio). Devuelve `{ status, body }` — **no escribe la respuesta ni toca `env`**. Así se testea toda la política (gate, idempotencia, confirmación) sin credenciales reales ni DB real cuando se mockean las deps.
- **Wrapper `default export handler`**: lee `env`, cablea las dependencias REALES (cliente Flow real, use cases contra `db`) y escribe `res.status(...).json(...)`. Es la única parte que toca `env` y `res`, y no se testea unitariamente (es el borde de cableado).

### Composición de adapters en el borde (factory)

- El endpoint **compone los adapters concretos** (cliente Flow, storage, correo) vía una factory de `services/`. La factory recibe la config como **argumento explícito** (no importa `~/env` adentro) para quedar testeable; el caller le pasa los valores leídos de `env`. Nunca se instancia un adapter externo dentro del `domain/`.
- **Fail-fast de credenciales**: las env vars de un feature pueden ser opcionales en `src/env.js` (la app arranca sin ellas), pero la factory **lanza un error claro en runtime** si faltan al ejecutar — mejor un 500 explícito que un efecto silenciosamente roto.

### Gate antes de cualquier efecto

La autenticación/validación del borde se hace **antes** de decodificar el body, mutar estado o llamar a nada con efectos — si el gate falla, se responde el rechazo SIN ningún efecto. Para el webhook de Flow:

- Verificar la **autenticidad** de la notificación contra Flow (la confirmación es server-side contra su API; el payload del request por sí solo no es prueba de pago).
- Solo el método esperado dispara el efecto (un `GET` accidental → 405).
- **Idempotencia**: si el pago ya fue confirmado y procesado, responder OK sin re-ejecutar los efectos (no duplicar `Entitlement`/`RaffleEntry`/correo). La confirmación avanza el estado del `Payment`/`Order` `pendiente → pagado | fallido` una sola vez.
- **Semántica de reintento**: si Flow reintenta ante 4xx, distinguir lo irreintentable (notificación malformada o ajena) de un fallo transitorio. Para lo irreintentable conviene **ack + ignorar** en vez de un 4xx que provoque reintentos infinitos; el rechazo de auth/método sí usa el código correspondiente.

## Prisma en el server

- Cliente único en `src/server/db.ts`. NUNCA instanciar `new PrismaClient()` en otro lado (excepción: scripts CLI con tsx — ver abajo).
- Preferir `select` explícito sobre `include` cuando solo se necesitan algunos campos.

### Paginación por cursor (lecturas de listas largas)

Patrón canónico para selectores que listan colecciones paginables (p. ej. el listado de órdenes o participaciones del sorteo en el panel):

- **Orden total estable**: `orderBy` compuesto donde el último campo es único (ej. `[{ createdAt: "desc" }, { id: "desc" }]`). Ordenar solo por un campo no-único (fecha) rompe el cursor en los empates (saltea/repite filas en el borde); el `id` (cuid) desempata.
- **Cursor opaco = `id` de la última fila** de la página. El selector recibe `cursor: string | null` (Zod `z.string().cuid().nullish()`; `null` = primera página) y devuelve `{ items, nextCursor: string | null }`.
- **Detectar "hay más" sin un segundo `count`**: pedir `take: PAGE_SIZE + 1` y, cuando viene la fila extra, recortarla y usar su antecesora como `nextCursor`; si volvieron `≤ PAGE_SIZE`, `nextCursor = null`. En las páginas siguientes, `cursor: { id: <cursor> }` + `skip: 1` (excluye la fila-cursor ya vista).
- **Forward-only**: el cursor opaco no soporta saltar a página N — la UI lo consume con "Cargar más" (ver `frontend-conventions.md` § Data fetching). Estable bajo append.

## Dominio con dinero (precios, IVA, comisiones) — reglas de oro

- **Montos y balances: `Decimal` de Prisma, NUNCA `Float`** ni aritmética con `number` para dinero. En TypeScript, operar con `Prisma.Decimal`. Aplica a precios de los libros, total de la orden, IVA (19%), comisión de Flow (~3,44%) y el neto al vendedor.
- Las operaciones que mueven plata o cambian estado de pago/entrega (confirmar un `Payment`, crear `Entitlement` + `RaffleEntry`) van dentro de `prisma.$transaction`.
- Formato de montos en UI con `Intl.NumberFormat` (CLP) — ver `frontend-conventions.md`.

## Aritmética de fechas

- Sin librería de fechas (`date-fns`/`dayjs`/`luxon` NO son dependencias). La aritmética se hace con `Date.UTC` nativo sobre fechas UTC a medianoche. Agregar una lib de fechas es decisión bloqueante (parar y preguntar).
- Para sumar meses, clampar SIEMPRE al último día del mes destino (sumar un mes al 31 cae al 28/30 en meses cortos). Encapsular en un helper `sumarMesesUTC` cuando haga falta — p. ej. ventanas/fechas del sorteo o la expiración de las URLs firmadas de descarga.

## Scripts CLI (tsx, fuera del runtime Next)

- Los scripts de `scripts/` corren con `tsx` fuera de Next: **excepción aceptada al singleton de `src/server/db.ts`** — instancian su propio `PrismaClient` y lo desconectan al salir; cargan `.env` a mano y leen `process.env` directo (mismo razonamiento que los tests con `SKIP_ENV_VALIDATION`).
- Las env vars que consume un CLI igualmente se documentan en `.env.example` (la regla de "declarar en `src/env.js`" aplica solo a vars que el runtime de la app valida).
- Un CLI jamás loguea secretos (claves del storage, tokens de Flow, API keys del LLM) — solo configuración inocua y resúmenes.
- **Script con lógica testeable → núcleo + wrapper**: un script one-off cuya lógica amerita tests Vitest se parte en (1) un **núcleo exportado** que recibe `db: PrismaClient` inyectado y devuelve un resultado estructurado (sin tocar `env`, sin instanciar Prisma, sin `process.exit`) — es lo que testean los specs DB-backed; y (2) un **wrapper `main()`** que carga `.env`, instancia su propio `PrismaClient`, lo desconecta en `finally`, formatea la salida CLI y se ejecuta solo cuando el archivo es el script invocado (`if (process.argv[1]?.includes("<nombre-del-script>"))`, para que importar el núcleo desde un test NO dispare el script). Es el patrón "núcleo testeable + wrapper" de la sección *Endpoints pages/api*, llevado a los scripts. Los scripts monolíticos sin lógica testeable (siembra, backfill puro) no necesitan partirse.

## Tipos

- Cero `any`. Derivar tipos del router con `inferRouterOutputs<AppRouter>`.
- `import type` para imports que solo son tipos.
- Types inline preferido. Solo separados si se comparten en 3+ archivos.

## Env vars

- Toda env var nueva se declara en `src/env.js` (schema Zod) Y en `.env.example`. Nunca `process.env.X` directo (excepción: scripts CLI con tsx).
