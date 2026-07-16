# Pivote a SaaS multi-tenant, con aislamiento por `tenantId` en DB compartida

El proyecto pivotea (2026-07-16, decisión del usuario) de tienda single-tenant de e-books para una autora a **SaaS multi-tenant de tiendas de productos digitales con sorteo**: Organizadores crean su cuenta, configuran su Tienda sobre una plantilla y venden, cada uno en su propio subdominio (ADR-0007). El aislamiento se implementa como **una sola base PostgreSQL con schema compartido y columna `tenantId` en todo modelo del dominio comercial** — NO schema-per-tenant ni database-per-tenant.

Razón: el pivote llega **antes** de que exista código de dominio comprometido (el momento más barato). Una DB compartida con scoping por columna es la opción más simple y barata de construir y operar con un solo deploy y bajo volumen inicial, acorde al principio rector del proyecto; schemas o DBs por tenant multiplican costo operativo (migraciones ×N, conexiones, backups) sin necesidad a esta escala. La autora original pasa a ser el **tenant #1 / piloto** (dogfooding real, con hito propio en el roadmap).

## Consecuencias

- Todo modelo del dominio comercial (`Product`, `Order`, `OrderItem`, `Payment`, `DownloadGrant`, `Raffle`, `RaffleEntry`, credenciales, config de tienda) lleva `tenantId` con FK a `Tenant`, `@@index([tenantId])`, y los uniques de dominio son **compuestos con `tenantId`** (ej. slug de producto único por tienda, no global).
- **Toda query de dominio se filtra por tenant**, resuelto **server-side** (subdominio → tenant para el storefront; sesión → membresía para el panel). El `tenantId` **nunca** viene del input del cliente. El aislamiento cross-tenant es el invariante de seguridad #1.
- Los ADRs previos siguen vigentes, **re-scopeados por tenant**: confirmación server-side + webhook idempotente (ADR-0001, ahora con ruteo por tenant — ADR-0006), entrega por Entitlement + URL firmada (ADR-0002, paths de storage per-tenant), Hermes LLM-agnóstico (ADR-0003, feature por-tenant), sin cuentas de comprador (ADR-0004 — quienes SÍ tienen cuenta son los Organizadores).
- La UI del comprador se sirve desde una **plantilla configurable** (logo/colores/textos por tenant); un builder visual queda fuera del MVP.
- Los planes single-tenant (`tasks/26-07-08-*`) quedan **superseded** por `tasks/26-07-16-saas-roadmap.md`; el código parcial de F01/F05 (service Flow, núcleo del webhook, política de auth) se rescata adaptándolo al scoping.
