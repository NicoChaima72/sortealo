---
slug: auth-admin-google
status: planning              # planning | implementing | testing | done
owner: nicolas
created: 2026-07-08
related_adrs: [ADR-0004]
related_context: [Autora, Comprador]

features:
  - id: F01
    behavior: "Google OAuth reemplaza al DiscordProvider del scaffold + allowlist mono-usuario (la autora): solo emails de la allowlist obtienen sesión; el resto es rechazado"
    state: not_started

  - id: F02
    behavior: "Guard server-side de las 5 páginas admin vía requireSession sobre getServerAuthSession: sin sesión válida redirige a /login"
    state: not_started
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

### Dependencia de la migración inicial (owned by F01)

El login OAuth con `PrismaAdapter` necesita las tablas `User/Account/Session/VerificationToken` (ya presentes en `schema.prisma` como modelos del scaffold, pero **sin migración aplicada** — el repo tiene cero commits y la migración inicial la crea F01). Por eso:
- Las **Validaciones Vitest** de esta fase son lógica pura (allowlist + decisión del guard) y **no tocan DB**, así que corren sin la migración.
- El **E2E manual** (login real con Google) requiere las tablas aplicadas. Si F05 se verifica antes de que F01 haya corrido la migración, el implementer aplica el schema localmente con `prisma db push` (NO crea una migración versionada — eso es de F01). Ver **Out of scope**.

## Decisiones

- **D1**: Provider = **Google OAuth** (`next-auth/providers/google`), reemplazando `DiscordProvider`. Se conserva el `PrismaAdapter` y la estrategia de sesión del scaffold (database sessions) — **no se toca `prisma/schema.prisma`** (los modelos NextAuth ya existen; la migración es de F01). Razón: el criterio del roadmap pide Google; el adapter y las tablas ya están, cambiar de provider es swap de `providers[]` + env vars.
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
- [ ] `parsearAllowlist` convierte `"A@Gmail.com, b@x.cl"` en `["a@gmail.com", "b@x.cl"]` (trim + lowercase, descarta entradas vacías y espacios sobrantes).
- [ ] `parsearAllowlist("")` (y string de solo espacios/comas) devuelve lista vacía.
- [ ] `emailEnLista` devuelve `true` para un email presente en la lista, ignorando mayúsculas/minúsculas y espacios.
- [ ] `emailEnLista` devuelve `false` para un email ausente de la lista.
- [ ] `emailEnLista` devuelve `false` para email `undefined`/`null`/vacío (fail-closed: nunca autoriza sin email).
- [ ] Con allowlist vacía, `emailEnLista` devuelve `false` para cualquier email (fail-closed).

**E2E** (browser — **manual**, OAuth con Google no es automatizable; requiere OAuth client registrado en Google Cloud Console + tablas NextAuth aplicadas):
- [ ] Login con una cuenta Google **en** la allowlist ⇒ obtiene sesión y aterriza en `/admin`.
- [ ] Login con una cuenta Google **fuera** de la allowlist ⇒ es rechazada, no obtiene sesión y no entra a `/admin` (vuelve a `/login` con el mensaje de acceso denegado).

### F02 — Guard server-side de páginas admin

**Vitest** (integration — decisión pura del guard, sesión inyectada):
- [ ] `resolverGuard(null)` devuelve un resultado de redirect a `/login` (`permanent: false`).
- [ ] `resolverGuard(session)` con una sesión válida devuelve el resultado que expone la sesión (rama de props, sin redirect).

**E2E** (browser — **manual**):
- [ ] Visitar cada una de las 5 rutas admin (`/admin`, `/admin/libros`, `/admin/ventas`, `/admin/sorteo`, `/admin/configuracion`) **sin sesión** ⇒ redirige a `/login`.
- [ ] Con sesión de la autora ⇒ las 5 páginas renderizan normalmente.

## Invariantes

- **I1**: **No tocar `prisma/schema.prisma`**. Los modelos NextAuth ya existen; la migración inicial es de F01. Si el implementer cree que necesita un cambio de schema, para y pregunta.
- **I2**: La autorización del panel es **fail-closed**: sin email o con email fuera de la allowlist NO hay sesión ni acceso. Allowlist vacía ⇒ nadie entra. El gate vive en el callback `signIn`, no en la UI.
- **I3**: La lógica de allowlist y la decisión del guard son **puras y testeables sin `env`/`db`/NextAuth** (`src/server/authPolicy.ts`). `auth.ts` solo cablea `env` a esos helpers.
- **I4**: Se usa `getServerAuthSession` (wrapper existente) — **nunca** reimplementar `getServerSession` ni duplicar la allowlist en otro archivo (`backend-conventions.md` § Auth).
- **I5**: Env vars nuevas declaradas en `src/env.js` (Zod) **y** en `.env.example`; nunca `process.env.X` directo. Coordinar el merge de `env.js`/`.env.example` con F01 (zona de contacto): los sets de vars son disjuntos; F05 remueve solo las dos vars de Discord.
- **I6**: Secretos (`GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`) **nunca** se loguean.
- **I7**: Guard imperativo por página (cada `getServerSideProps` llama `requireSession`), **no** un HOC ni un wrapper global; páginas públicas no exportan guard.

## Out of scope

- **`NEXTAUTH_URL` y redirect URI de producción** (dependen del dominio — decisión abierta #4). Esta fase solo cubre dev (`localhost:3000`).
- **Crear la migración inicial** de las tablas NextAuth (la hace F01). Si se necesita para el E2E manual local, usar `prisma db push` sin versionar.
- **Roles/permisos multi-usuario, gestión de la allowlist desde el panel**: mono-usuario por env var.
- **Pulido visual / marca del `/login`**: página throwaway (marca PENDIENTE, `docs/design.md`).
- **Conectar el panel a datos reales** (`mock-data.ts` → datos reales): es F06.
- **Cuentas/login de comprador** (ADR-0004): no existen.

## Especialistas a consultar

- `backend-reviewer` — cambios en `auth.ts` (provider Google, callback `signIn`, `pages.signIn`), helper `requireSession`, env vars y el módulo `authPolicy.ts`. Verificar en particular que el rechazo de allowlist con `PrismaAdapter` (database sessions) **no** deje un `User`/`Account` que habilite acceso (comportamiento de `signIn` returning `false` con adapter).
- `change-set-reviewer` — review del diff completo antes de commit, con foco en la zona de contacto de `env.js`/`.env.example` compartida con F01.
- `feature-tester` — Vitest (allowlist + guard puro) + verificación **manual asistida** del login Google (dentro/fuera de allowlist) y de los redirects de las 5 páginas.

## Bitácora

- [2026-07-08 00:00] [planner-grill] Task file de la Fase F05 del roadmap creado. Por instrucción explícita del usuario NO se hizo grill extenso: las decisiones de implementación se resolvieron por criterio y quedaron como Supuestos revisables (D2, D4, D5, D6). Contexto observado en código: `auth.ts` usa `DiscordProvider`; `src/env.js` declara `DISCORD_CLIENT_ID/SECRET`; las 5 páginas de `src/pages/admin/` renderizan `mock-data.ts` SIN guard (cero `getServerSideProps`/`useSession`); no existe `/login`; los modelos NextAuth ya están en `schema.prisma` (scaffold) pero sin migración aplicada. Zona de contacto con F01 en `env.js`/`.env.example` anotada (I5). Sin preguntas AWAITING — ninguna decisión resultó estructural e imposible de asumir. Plan escrito, esperando visto bueno del usuario.
