---
slug: auth-admin-google
status: superseded            # superseded por tasks/26-07-16-saas-roadmap.md (pivote SaaS multi-tenant, ADR-0005)
owner: nicolas
created: 2026-07-08
related_adrs: [ADR-0004]
related_context: [Autora, Comprador]

features:
  - id: F01
    behavior: "Google OAuth reemplaza al DiscordProvider del scaffold + allowlist mono-usuario (la autora): solo emails de la allowlist obtienen sesión; el resto es rechazado"
    state: active

  - id: F02
    behavior: "Guard server-side de las 5 páginas admin vía requireSession sobre getServerAuthSession: sin sesión válida redirige a /login"
    state: active
---

# Fase F05 — Auth admin real: Google OAuth + allowlist + guard server-side

## Contexto

Es la **Fase F05** del roadmap del MVP (`tasks/26-07-08-mvp-roadmap.md`). Hoy el auth es el scaffold T3 puro: `src/server/auth.ts` usa `DiscordProvider` con `DISCORD_CLIENT_ID/SECRET`, y las **5 páginas del panel** (`src/pages/admin/{index,libros,ventas,sorteo,configuracion}.tsx`) renderizan `mock-data.ts` **sin ningún guard** — cualquiera que conozca la URL entra. No existe página `/login`.

Esta fase hace tres cosas acopladas: (1) reemplazar Discord por **Google OAuth**; (2) restringir el acceso a una **allowlist mono-usuario** (la autora) — solo sus emails obtienen sesión, todo el panel es su operación (ADR-0004: no hay cuentas de comprador, la identidad del comprador es su correo); (3) poner un **guard server-side** en todas las páginas admin que redirige a `/login` sin sesión. El criterio de hecho del roadmap: solo emails de la allowlist entran al panel; las páginas admin redirigen a login sin sesión.

Alcance deliberadamente chico y sin marca: el `/login` es una página dev throwaway (un botón "Entrar con Google"), consistente con que la identidad visual está PENDIENTE (`docs/design.md`). El pulido visual del login llega con F07/F06.

### Zona de contacto con F01 (se ejecutan en paralelo)

F05 y F01 (Flow sandbox) corren en terminales distintas y **ambas tocan `src/env.js` y `.env.example`**:
- **F01** agrega vars de Flow.
- **F05** agrega `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `ADMIN_ALLOWLIST` y **elimina** `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`.

Los cambios de F05 en esos dos archivos son **aditivos salvo la remoción de las dos vars de Discord** (que solo consume `auth.ts`, reemplazado en esta fase). Ambos implementers deben coordinar el merge de `env.js` (bloque `server`, `runtimeEnv`) y `.env.example`; los sets de vars son disjuntos, así que el merge es mecánico. Ver **Invariante I5**.

### Dependencia del schema inicial (owned by F01)

El login OAuth con `PrismaAdapter` necesita las tablas `User/Account/Session/VerificationToken` (ya presentes en `schema.prisma` como modelos del scaffold, pero **sin el schema aplicado en la DB** — la aplicación del schema con `db push` la hace F01). Por eso:
- Las **Validaciones Vitest** de esta fase son lógica pura (allowlist + decisión del guard) y **no tocan DB**, así que corren sin el schema aplicado.
- El **E2E manual** (login real con Google) requiere las tablas aplicadas. Si F05 se verifica antes de que F01 haya aplicado el schema, el implementer lo aplica con `prisma db push` (sin migraciones versionadas — decisión del proyecto). Ver **Out of scope**.

## Decisiones

- **D1**: Provider = **Google OAuth** (`next-auth/providers/google`), reemplazando `DiscordProvider`. Se conserva el `PrismaAdapter` y la estrategia de sesión del scaffold (database sessions) — **no se toca `prisma/schema.prisma`** (los modelos NextAuth ya existen; el schema lo aplica F01 con `db push`). Razón: el criterio del roadmap pide Google; el adapter y las tablas ya están, cambiar de provider es swap de `providers[]` + env vars.
- **D2** (Supuesto revisable): la allowlist vive en una **env var `ADMIN_ALLOWLIST`** = string de emails separados por coma. Mono-usuario hoy (el email de la autora), pero el formato admite N por flexibilidad. Razón: `backend-conventions.md` dice "restricción en el callback `signIn`"; una env var es lo más simple y barato (principio rector del proyecto), sin modelo de roles en DB. Reconsiderable si se quiere gestionar la allowlist desde el panel (no en MVP).
- **D3**: el chequeo de allowlist se hace en el **callback `signIn`** de `authOptions`: si el email autenticado no está en la lista, el callback devuelve `false` (o redirige a `/login?error=AccessDenied`) y **no se crea sesión**. Fail-closed: allowlist vacía ⇒ nadie entra. Razón: es el gate único de autorización del panel; debe bloquear antes de cualquier capacidad admin.
- **D4** (Supuesto revisable): la **lógica pura de la allowlist** (`parsearAllowlist(raw): string[]` + `emailEnLista(email, lista): boolean`) vive en un módulo sin dependencias de `env`/`db` (propuesta: `src/server/authPolicy.ts`), para ser testeable en Vitest sin `SKIP_ENV_VALIDATION` ni DB. `auth.ts` importa esos helpers y les inyecta `env.ADMIN_ALLOWLIST`. Normalización: **lowercase + trim** en ambos lados (emails Google case-insensitive). Razón: separar política pura del cableado (mismo espíritu que núcleo+wrapper de los endpoints).
- **D5** (Supuesto revisable): el **guard** se implementa con un helper `requireSession(ctx)` sobre `getServerAuthSession` (patrón imperativo que `backend-conventions.md` § "Guard de páginas server-side" describe para el caso multi-página — y acá hay 5 páginas). Devuelve un resultado discriminado; su **decisión pura** (`resolverGuard(session): { redirect } | { session }`) se extrae para testear sin NextAuth. Cada una de las 5 páginas admin exporta su propio `getServerSideProps` que llama `requireSession` y hace early-return del `redirect`. Ubicación propuesta del helper: junto a `getServerAuthSession` (en `src/server/auth.ts`) reutilizando la decisión pura de `authPolicy.ts`. Razón: convención explícita; el helper evita duplicar el guard en 5 archivos.
- **D6** (Supuesto revisable): se crea `src/pages/login.tsx` **throwaway sin marca**: un botón que dispara `signIn("google")` y, si llega `?error=`, muestra un mensaje mínimo ("Ese correo no tiene acceso"). Se setea `pages.signIn = "/login"` en `authOptions` para que el guard y NextAuth apunten al mismo lugar. Razón: la convención referencia `/login`; NextAuth por defecto usa `/api/auth/signin`, hay que declararla.
- **D7**: en dev, `NEXTAUTH_URL=http://localhost:3000` (ya en `.env.example`) y el redirect URI de Google es `http://localhost:3000/api/auth/callback/google`. El dominio de producción (decisión abierta #4) solo afecta `NEXTAUTH_URL` y el redirect URI **en prod** → **fuera de alcance** de esta fase.

## Plan

1. **Env vars** (F01, F02) — zona de contacto con la fase F01 del roadmap:
   - En `src/env.js`: agregar al bloque `server` `GOOGLE_CLIENT_ID: z.string()`, `GOOGLE_CLIENT_SECRET: z.string()`, `ADMIN_ALLOWLIST: z.string()`; **remover** `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`. Reflejar los tres en `runtimeEnv` y quitar los dos de Discord.
   - En `.env.example`: reemplazar el bloque "Next Auth Discord Provider" por "Google Provider" (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) + `ADMIN_ALLOWLIST="autora@gmail.com"`.
2. **Política pura de allowlist** (F01): crear `src/server/authPolicy.ts` con `parsearAllowlist(raw)` (split por coma, trim, lowercase, descartar vacíos) y `emailEnLista(email, lista)` (normaliza y compara; email vacío/undefined ⇒ `false`).
3. **auth.ts** (F01): reemplazar `DiscordProvider` por `GoogleProvider({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET })`; agregar callback `signIn` que aplica `emailEnLista(user.email, parsearAllowlist(env.ADMIN_ALLOWLIST))` y devuelve `false` (o redirige a `/login?error=AccessDenied`) si no pasa; setear `pages.signIn = "/login"`. Conservar `PrismaAdapter` y el callback `session` existente.
4. **Guard** (F02): agregar en `src/server/auth.ts` (junto a `getServerAuthSession`) el helper `requireSession(ctx)` que llama `getServerAuthSession` y aplica `resolverGuard(session)` (decisión pura, extraída — vive en `authPolicy.ts`): sin sesión ⇒ `{ redirect: { destination: "/login", permanent: false } }`; con sesión ⇒ `{ session }`.
5. **Proteger las 5 páginas admin** (F02): agregar `getServerSideProps` a `index.tsx`, `libros.tsx`, `ventas.tsx`, `sorteo.tsx`, `configuracion.tsx`, cada una llamando `requireSession(ctx)` y devolviendo su `redirect` con early-return.
6. **Login page** (F01): crear `src/pages/login.tsx` throwaway (botón `signIn("google")` + mensaje de error mínimo desde `?error`). Sin marca.

## Validaciones

### F01 — Google OAuth + allowlist mono-usuario

**Vitest** (integration — lógica pura de política, sin DB ni env real):
- [ ] `parsearAllowlist` convierte `"A@Gmail.com, b@x.cl"` en `["a@gmail.com", "b@x.cl"]` (trim + lowercase, descarta entradas vacías y espacios sobrantes). — `src/__tests__/server/authPolicy.test.ts::authPolicy.parsearAllowlist › normaliza a lowercase + trim y descarta entradas vacías`
- [ ] `parsearAllowlist("")` (y string de solo espacios/comas) devuelve lista vacía. — `src/__tests__/server/authPolicy.test.ts::authPolicy.parsearAllowlist › devuelve lista vacía para string vacío, solo-espacios o solo-comas`
- [ ] `emailEnLista` devuelve `true` para un email presente en la lista, ignorando mayúsculas/minúsculas y espacios. — `src/__tests__/server/authPolicy.test.ts::authPolicy.emailEnLista › devuelve true para un email presente, ignorando mayúsculas y espacios`
- [ ] `emailEnLista` devuelve `false` para un email ausente de la lista. — `src/__tests__/server/authPolicy.test.ts::authPolicy.emailEnLista › devuelve false para un email ausente de la lista`
- [ ] `emailEnLista` devuelve `false` para email `undefined`/`null`/vacío (fail-closed: nunca autoriza sin email). — `src/__tests__/server/authPolicy.test.ts::authPolicy.emailEnLista › devuelve false para email undefined/null/vacío (fail-closed)`
- [ ] Con allowlist vacía, `emailEnLista` devuelve `false` para cualquier email (fail-closed). — `src/__tests__/server/authPolicy.test.ts::authPolicy.emailEnLista › con allowlist vacía devuelve false para cualquier email (fail-closed)`

**E2E** (browser — **manual**, OAuth con Google no es automatizable; requiere OAuth client registrado en Google Cloud Console + tablas NextAuth aplicadas):
- [ ] Login con una cuenta Google **en** la allowlist ⇒ obtiene sesión y aterriza en `/admin`.
- [ ] Login con una cuenta Google **fuera** de la allowlist ⇒ es rechazada, no obtiene sesión y no entra a `/admin` (vuelve a `/login` con el mensaje de acceso denegado).

### F02 — Guard server-side de páginas admin

**Vitest** (integration — decisión pura del guard, sesión inyectada):
- [ ] `resolverGuard(null)` devuelve un resultado de redirect a `/login` (`permanent: false`). — `src/__tests__/server/authPolicy.test.ts::authPolicy.resolverGuard › sin sesión devuelve redirect a /login (permanent: false)`
- [ ] `resolverGuard(session)` con una sesión válida devuelve el resultado que expone la sesión (rama de props, sin redirect). — `src/__tests__/server/authPolicy.test.ts::authPolicy.resolverGuard › con sesión válida expone la sesión (rama de props, sin redirect)`

**E2E** (browser — **manual**):
- [ ] Visitar cada una de las 5 rutas admin (`/admin`, `/admin/libros`, `/admin/ventas`, `/admin/sorteo`, `/admin/configuracion`) **sin sesión** ⇒ redirige a `/login`.
- [ ] Con sesión de la autora ⇒ las 5 páginas renderizan normalmente.

## Invariantes

- **I1**: **No tocar `prisma/schema.prisma`**. Los modelos NextAuth ya existen; el schema inicial lo aplica F01 (`db push`). Si el implementer cree que necesita un cambio de schema, para y pregunta.
- **I2**: La autorización del panel es **fail-closed**: sin email o con email fuera de la allowlist NO hay sesión ni acceso. Allowlist vacía ⇒ nadie entra. El gate vive en el callback `signIn`, no en la UI.
- **I3**: La lógica de allowlist y la decisión del guard son **puras y testeables sin `env`/`db`/NextAuth** (`src/server/authPolicy.ts`). `auth.ts` solo cablea `env` a esos helpers.
- **I4**: Se usa `getServerAuthSession` (wrapper existente) — **nunca** reimplementar `getServerSession` ni duplicar la allowlist en otro archivo (`backend-conventions.md` § Auth).
- **I5**: Env vars nuevas declaradas en `src/env.js` (Zod) **y** en `.env.example`; nunca `process.env.X` directo. Coordinar el merge de `env.js`/`.env.example` con F01 (zona de contacto): los sets de vars son disjuntos; F05 remueve solo las dos vars de Discord.
- **I6**: Secretos (`GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`) **nunca** se loguean.
- **I7**: Guard imperativo por página (cada `getServerSideProps` llama `requireSession`), **no** un HOC ni un wrapper global; páginas públicas no exportan guard.

## Out of scope

- **`NEXTAUTH_URL` y redirect URI de producción** (dependen del dominio — decisión abierta #4). Esta fase solo cubre dev (`localhost:3000`).
- **Aplicar el schema inicial** de las tablas NextAuth a la DB (lo hace F01 con `prisma db push`).
- **Roles/permisos multi-usuario, gestión de la allowlist desde el panel**: mono-usuario por env var.
- **Pulido visual / marca del `/login`**: página throwaway (marca PENDIENTE, `docs/design.md`).
- **Conectar el panel a datos reales** (`mock-data.ts` → datos reales): es F06.
- **Cuentas/login de comprador** (ADR-0004): no existen.

## Especialistas a consultar

- `backend-reviewer` — cambios en `auth.ts` (provider Google, callback `signIn`, `pages.signIn`), helper `requireSession`, env vars y el módulo `authPolicy.ts`. Verificar en particular que el rechazo de allowlist con `PrismaAdapter` (database sessions) **no** deje un `User`/`Account` que habilite acceso (comportamiento de `signIn` returning `false` con adapter).
- `change-set-reviewer` — review del diff completo antes de commit, con foco en la zona de contacto de `env.js`/`.env.example` compartida con F01.
- `feature-tester` — Vitest (allowlist + guard puro) + verificación **manual asistida** del login Google (dentro/fuera de allowlist) y de los redirects de las 5 páginas.

## Bitácora

- [2026-07-16 00:00] [planner-grill] (domain-planner) **SUPERSEDED por el pivote a SaaS multi-tenant** (`tasks/26-07-16-saas-roadmap.md`, ADR-0005). El auth de admin mono-usuario (allowlist de la autora) deja de ser el modelo: los que tienen cuenta ahora son los **Organizadores** (+ el Operador de plataforma), con membresía User↔Tenant — Fase F05 del roadmap nuevo. Se rescata: Google OAuth como provider, `authPolicy.ts` (política pura testeable), `requireSession`/`resolverGuard` y el patrón de guard por página; muere la allowlist como autorización del panel. No completar el E2E pendiente de este plan.
- [2026-07-08 11:55] [feature-implementer] DRIFT APLICADO (usuario aprobó opción 1). Editado `docs/agents/backend-conventions.md`: § Auth → "provider OAuth" cambiado a "Google OAuth"; documentada la allowlist vía `ADMIN_ALLOWLIST` (CSV) + política pura en `authPolicy.ts` inyectada en el callback `signIn`, fail-closed, con la nota de que el gate corre antes de que el PrismaAdapter persista User/Account/Session y que devuelve `"/login?error=AccessDenied"`. § "Guard de páginas server-side" → removido el caveat "no código presente hoy"; `requireSession`/`resolverGuard` ahora documentados como código PRESENTE en `src/server/auth.ts` + `authPolicy.ts`, consumido con early-return del redirect por las 5 páginas admin. NO se tocó la línea 3 (intro) por estar fuera del diff aprobado. `docs/agents/backend-conventions.md` se agrega a la lista de archivos MODIFICADOS de esta fase. La sugerencia de vocabulario para `CONTEXT.md` ("allowlist del admin" / "gate fail-closed") queda SOLO como nota para el domain-planner — NO aplicada (fuera de scope del implementer). Frontmatter se mantiene en `status: testing`.
- [2026-07-08 11:45] [feature-implementer] Implementación completa. F01 + F02 escritas, ambos reviewers verdes, Vitest 8/8 (política pura + guard puro) con vitest filtrado. `status` → `testing`. E2E manual (login Google dentro/fuera de allowlist + redirect de las 5 rutas admin sin sesión) PENDIENTE: requiere un OAuth client real de Google Cloud + las tablas NextAuth aplicadas (migración inicial de F01, o `prisma db push` local). NO se corrió `npm run check` completo, NO se hizo commit, NO se invocó al feature-tester ni al change-set-reviewer — según instrucción de coordinación con F01-Flow; la revisión final la orquesta la sesión principal. Archivos tocados (lista explícita): NUEVOS → `src/server/authPolicy.ts`, `src/pages/login.tsx`, `src/__tests__/server/authPolicy.test.ts`; MODIFICADOS → `src/server/auth.ts`, `src/env.js`, `.env.example`, `src/pages/admin/index.tsx`, `src/pages/admin/libros.tsx`, `src/pages/admin/ventas.tsx`, `src/pages/admin/sorteo.tsx`, `src/pages/admin/configuracion.tsx`, `tasks/26-07-08-auth-admin-google.md`.
- [2026-07-08 11:45] [feature-implementer] DRIFT de documentación detectado (NO aplicado — espera decisión del usuario). `docs/agents/backend-conventions.md` § Auth y § "Guard de páginas server-side" describen `requireSession`, el gate de allowlist en `signIn` y el provider como patrones futuros/genéricos ("Mientras no exista ese helper no lo cites como si estuviera"; "un provider OAuth"). Tras F05 esos patrones YA son código presente: `requireSession` existe en `src/server/auth.ts`, el gate vive en el callback `signIn`, el provider es Google, la allowlist es la env var `ADMIN_ALLOWLIST` parseada por `src/server/authPolicy.ts`. El caveat quedó stale y engañaría a un lector futuro. Draft de cambio propuesto (surface al usuario con 4 opciones en el mensaje de cierre): (a) § Auth: "provider OAuth" → "Google OAuth"; documentar que la allowlist se define en `ADMIN_ALLOWLIST` (CSV) y la política pura vive en `src/server/authPolicy.ts` (`parsearAllowlist`/`emailEnLista`), inyectada por `auth.ts`; (b) § Guard: cambiar el tono de "patrón a seguir cuando se necesite / no existe todavía" a "helper `requireSession(ctx)` YA implementado en `src/server/auth.ts` sobre `getServerAuthSession`, con decisión pura `resolverGuard` en `authPolicy.ts`; consumido por las 5 páginas admin". NO se toca `CLAUDE.md`, `CONTEXT.md` ni ADRs (fuera de scope del implementer). Nota de vocabulario para el domain-planner (solo sugerencia, no aplicada): "allowlist del admin" y "gate fail-closed" podrían formalizarse en CONTEXT.md si se estima load-bearing. Verificó los 4 puntos pedidos contra código y tipos instalados de `next` (`Redirect`/`GetServerSidePropsResult`): (1) el narrowing por `"redirect" in guard` estrecha bien la unión discriminada `ResultadoGuard`; (2) las 5 páginas admin tienen guard idéntico y las públicas (`index.tsx` catálogo, `login.tsx`) NO — I7 ok; (3) `requireSession` cablea `getServerAuthSession` sin reimplementar `getServerSession` ni duplicar allowlist — I4 ok; (4) `{ destination, permanent: false }` es estructuralmente compatible con `Redirect` y `{ props: {} }` con el `Props` default, sin riesgo de error de tsc. I3 confirmado (authPolicy solo importa `type Session`, se borra en compilación). Único punto no bloqueante: la rama `{ session }` de `ResultadoGuard` aún no se consume en las páginas (esperado — F06 conecta datos reales).
- [2026-07-08 11:20] [feature-implementer] F02 implementada (TDD red→green sobre `resolverGuard`). Archivos: `src/server/authPolicy.ts` (+`resolverGuard(session)` decisión pura + tipo `ResultadoGuard`, re-agregado `import type { Session }`); `src/__tests__/server/authPolicy.test.ts` (+2 tests resolverGuard; 8/8 verdes con vitest filtrado); `src/server/auth.ts` (+helper `requireSession(ctx)` sobre `getServerAuthSession`, cablea `resolverGuard`; I4 respetado, no se reimplementa `getServerSession`); las 5 páginas admin (`src/pages/admin/{index,libros,ventas,sorteo,configuracion}.tsx`) cada una con su propio `export const getServerSideProps` que llama `requireSession(ctx)` y hace early-return del redirect (`if ("redirect" in guard) return { redirect: guard.redirect }`), sin sesión devuelve `{ props: {} }` — guard imperativo por página, no HOC (I7). No se tocó `[...nextauth].ts` (conserva la forma del scaffold). E2E manual (redirect de las 5 rutas sin sesión + render con sesión de la autora) queda PENDIENTE junto al de F01 (requiere OAuth client real + tablas NextAuth aplicadas). No se levantó `next dev`.
- [2026-07-08 10:55] [backend-reviewer] F01 APPROVE (verde, sin blockers). Confirmó contra la fuente instalada de next-auth que el gate `signIn` corre antes del callbackHandler y que un email fuera de allowlist NO deja User/Account/Session (fail-closed a nivel de persistencia, no solo de cookie) — satisface I2. Confirmó además que devolver el string `"/login?error=AccessDenied"` es la opción correcta (con `false` caería a la página de error genérica de NextAuth porque `pages.error` no está seteado). Compliance I1-I6 verificado, naming en español consistente, 6/6 Vitest cubren los checkboxes. Dos NITs no accionables: (1) `ADMIN_ALLOWLIST: z.string()` + `emptyStringAsUndefined` hace que un allowlist vacío tumbe el arranque en vez de "nadie entra" en runtime — es fail-fast más seguro y coincide con el plan (D-step1 pide `z.string()`), se deja como está; (2) reforzar allowlist a nivel del OAuth provider (test users en Google Cloud Console) es config operativa fuera del repo, pendiente operativo no de código.
- [2026-07-08 10:40] [feature-implementer] F01 implementada (TDD red→green sobre la política pura). Archivos: `src/server/authPolicy.ts` (nuevo — `parsearAllowlist`, `emailEnLista`, sin deps de env/db/NextAuth); `src/__tests__/server/authPolicy.test.ts` (nuevo — 6 tests, todos verdes con `npx vitest run` filtrado); `src/server/auth.ts` (DiscordProvider → GoogleProvider, callback `signIn` con gate de allowlist fail-closed devolviendo `true` o `"/login?error=AccessDenied"`, `pages.signIn="/login"`, se conservó PrismaAdapter + callback `session`); `src/pages/login.tsx` (nuevo — throwaway sin marca, botón `signIn("google", { callbackUrl: "/admin" })` + mensaje mínimo desde `?error`); `src/env.js` (server + runtimeEnv: +GOOGLE_CLIENT_ID/+GOOGLE_CLIENT_SECRET/+ADMIN_ALLOWLIST, −DISCORD_CLIENT_ID/−DISCORD_CLIENT_SECRET); `.env.example` (bloque Discord → Google + ADMIN_ALLOWLIST). Decisión táctica: el `signIn` devuelve el string de redirect en vez de `false` (ambos aceptados por D3) porque aterriza determinísticamente al denegado en `/login?error=AccessDenied` (verificado en fuente next-auth: rama `typeof isAllowed === "string"`), sin depender de `pages.error`. Zona de contacto: releí env.js/.env.example justo antes de editar; F01-Flow aún no los había tocado (unchanged), cambios de F05 aplicados aislados; si aparecen FLOW_* después, no colisionan (sets disjuntos). E2E manual de login (dentro/fuera de allowlist) queda PENDIENTE: requiere un OAuth client real de Google + la migración inicial de F01 aplicada (o `prisma db push` local). No se levantó `next dev`. Features pendientes: F01, F02. Read pass completo: task file, CLAUDE.md, backend-conventions.md (§ Auth, § Guard, § Env vars, § Tipos), ADR-0004, _template.md, código actual (auth.ts con DiscordProvider, env.js, .env.example, las 5 páginas admin sin guard, [...nextauth].ts, vitest.config.ts). Verificado en la fuente instalada de next-auth 4.24 (`node_modules/next-auth/core/routes/callback.js` líneas 66-109): el callback `signIn` se ejecuta ANTES del `callbackHandler` (que crea User/Account/Session); devolver falsy o string aborta con redirect y NO persiste nada — satisface I2 (fail-closed) y la preocupación del backend-reviewer sobre PrismaAdapter. El tipo `signIn` admite `Awaitable<string | boolean>` (types.d.ts:267), así que devolver `"/login?error=AccessDenied"` es válido y aterriza al usuario denegado en /login con el mensaje. NO se levantó `next dev` (otro agente puede tenerlo corriendo; mis validaciones son lógica pura). Coordinación con F01-Flow anotada: releeré env.js/.env.example justo antes de editarlos.
- [2026-07-08 00:00] [planner-grill] Task file de la Fase F05 del roadmap creado. Por instrucción explícita del usuario NO se hizo grill extenso: las decisiones de implementación se resolvieron por criterio y quedaron como Supuestos revisables (D2, D4, D5, D6). Contexto observado en código: `auth.ts` usa `DiscordProvider`; `src/env.js` declara `DISCORD_CLIENT_ID/SECRET`; las 5 páginas de `src/pages/admin/` renderizan `mock-data.ts` SIN guard (cero `getServerSideProps`/`useSession`); no existe `/login`; los modelos NextAuth ya están en `schema.prisma` (scaffold) pero sin migración aplicada. Zona de contacto con F01 en `env.js`/`.env.example` anotada (I5). Sin preguntas AWAITING — ninguna decisión resultó estructural e imposible de asumir. Plan escrito, esperando visto bueno del usuario.
