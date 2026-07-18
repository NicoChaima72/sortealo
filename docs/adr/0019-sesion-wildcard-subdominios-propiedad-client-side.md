# Sesión de plataforma al wildcard de subdominios; propiedad resuelta client-side

> **Estado: aceptado** (2026-07-17, visto bueno del usuario). Plan: `tasks/26-07-17-page-builder.md` (carril A). Origen: síntesis D11. **Addendum a ADR-0007** (resolución de tenant por subdominio).

**Decisión:** la cookie de sesión de NextAuth (`sessionToken`, ya de DB, token opaco) se emite con `Domain=.sorteatelo.cl` → el navegador la manda a cualquier subdominio y `getServerAuthSession` la resuelve en el storefront del tenant. Habilita el banner "Editar mi tienda" para la Organizadora logueada que visita su propia tienda. Reglas:

- **La cookie es identidad, no autorización**: el poder de editar sale SIEMPRE de `TenantMembership` consultada server-side. `puedoEditar()` es un procedure que **no recibe tenantId del cliente**: lee el `x-tenant-slug` saneado por el middleware → resuelve tenant → sesión → membresía.
- **La propiedad se resuelve client-side tras hidratar** (nunca en `getServerSideProps` del storefront): el HTML anónimo es idéntico para todos ⇒ CDN-cacheable. El banner monta post-hidratación y viste chrome de plataforma (neutro), nunca el color del tenant.
- El prefijo `__Secure-` admite `Domain`; la cookie CSRF `__Host-` no lo admite **y no lo necesita** (el OAuth dance vive en el apex con `NEXTAUTH_URL` fijo y un único redirect URI en Google).
- **`callbackUrl` validada contra `*.sorteatelo.cl`** (reusando `esSlugValido`/`parsearHost`) para no convertirse en open-redirect.
- **Dev**: `*.localhost` no comparte cookies entre subdominios ⇒ se usa `lvh.me` (apunta a 127.0.0.1) con `Domain=.lvh.me`, más un `CredentialsProvider` gateado por `NODE_ENV !== 'production'` ("Entrar como dueño de <slug>") que prueba el 100% del flujo cross-subdominio sin Google/certs. El flujo Google real se sigue probando con túnel cloudflared al apex.

Razón: es un cambio de una variable sobre la infraestructura existente, y la alternativa de resolver la sesión en SSR del storefront forzaría `Cache-Control: private`, matando el cache CDN compartido por un banner que ve una sola persona.

## Consideradas y descartadas

- **Propiedad en `getServerSideProps`** → envenena el cache público (riesgo R5).
- **Fetch al apex con CORS + credentials** → innecesario con cookie domain-wide (same-origin) y superficie de ataque extra.

## Consecuencias

- El blast radius de un XSS en cualquier subdominio pasa a ser la sesión de TODA la plataforma → ADR-0018 (sin HTML libre + embeds sandbox + CSP) deja de ser opcional: es el par inseparable de esta decisión.
- Cookie `httpOnly + Secure + SameSite=Lax` sin cambios.
- El dominio de la cookie sale de env/config (apex por entorno: `.sorteatelo.cl` prod, `.lvh.me` dev), no hardcodeado.
