# Dev: sesión cross-subdominio (page builder F08, ADR-0019)

Cómo probar en dev el flujo de **sesión al wildcard** que habilita el banner "Editar mi tienda"
(F09) — sin Google ni certificados.

## El problema

`*.localhost` NO comparte cookies entre subdominios en los navegadores. Así que para probar que
una sesión abierta en el apex se ve en `autora.<apex>`, dev usa **`lvh.me`** (un dominio público
que resuelve a `127.0.0.1`, con subdominios).

## Setup

1. En `.env`:
   ```
   NEXT_PUBLIC_PLATFORM_DOMAIN="lvh.me"
   ```
   Esto hace que:
   - `parsearHost` trate `lvh.me` como apex y `autora.lvh.me` como subdominio de la Tienda `autora`.
   - la cookie de sesión se emita con `Domain=.lvh.me` (compartida por subdominios) — ver
     `resolverDominioCookieSesion` (`src/server/sesion/dominioCookie.ts`).
2. Reiniciar el dev server (una sola instancia, `:3001`): `npx next dev -p 3001`.
3. Hosts: `lvh.me:3001` (apex), `autora.lvh.me:3001`, `prueba.lvh.me:3001`.

## Login dev (sin Google)

`GET http://lvh.me:3001/api/dev/login?slug=autora`

- Crea una `Session` de DB para el **dueño** de la Tienda `autora` (su `TenantMembership`) y setea
  la cookie `next-auth.session-token` con `Domain=.lvh.me`.
- Luego, al abrir `http://autora.lvh.me:3001/`, `getServerAuthSession` resuelve esa sesión (cookie
  compartida) ⇒ `puedoEditar()` (F09) devuelve `true` y aparece el banner "Editar mi tienda".
- **Dev-only**: el endpoint responde `404` con `NODE_ENV=production` (Vercel siempre corre en prod).
  Solo acepta `GET`.
- Requiere que la Tienda tenga dueño (membresía). Sembrar con: `npm run otorgar:membresia`.

> **Nota de implementación** (REVISABLE, ver Bitácora de `tasks/26-07-17-page-builder.md`): ADR-0019
> propone un `CredentialsProvider` de NextAuth para este dev-login, pero ese provider es incompatible
> con el adapter de DB (NextAuth fuerza JWT para credentials, y este proyecto usa sesiones de DB). El
> endpoint `/api/dev/login` preserva la intención del ADR creando la `Session` de DB directamente.
> **Pendiente**: addendum en ADR-0019 documentando este mecanismo real (lo aprueba el usuario).

## Flujo Google real

Se sigue probando con un túnel **cloudflared** al apex (https) — ver memoria del proyecto
`flow-sandbox-e2e`. Ahí `NEXTAUTH_URL` es https ⇒ la cookie de sesión pasa a `__Secure-` + `secure`
(alineada con la heurística `useSecureCookies` de NextAuth).
