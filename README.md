# sorteatelo

> Plataforma **Sortéatelo** — dominio `sorteatelo.cl` (decisión #4 cerrada, [ADR-0014](docs/adr/0014-dominio-plataforma-sorteatelo-cl.md)). Codename histórico del repo: `libros-iselk` (sigue siendo el nombre de la carpeta local); la estilización de marca (logo, paleta, tipografía) está pendiente de la sesión de marca.

**SaaS multi-tenant de tiendas con sorteo.** Organizadores crean su cuenta, configuran su Tienda sobre una plantilla (logo, colores, textos), suben productos digitales (MVP: PDF), montan un sorteo promocional y venden — cada tienda en su propio **subdominio**, cobrando con **su propia cuenta de Flow.cl** (BYO-Flow: la plataforma nunca mueve dinero de terceros).

Nació como el encargo de una tienda de e-books para una autora del fandom ARMY (Chile) y pivoteó a plataforma el 2026-07-16 ([ADR-0005](docs/adr/0005-pivote-saas-multi-tenant-tenantid-db-compartida.md)). La autora es el **tenant #1 / piloto**.

## Stack

T3: **Next.js 14** (pages router) · **tRPC 11** · **NextAuth 4** (Google OAuth para Organizadores) · **Prisma 5** + **PostgreSQL** · **shadcn/ui** + **Tailwind**. Storage de PDFs: **Cloudflare R2** ([ADR-0009](docs/adr/0009-storage-pdfs-cloudflare-r2.md)). Correo transaccional: **Resend** ([ADR-0010](docs/adr/0010-correo-transaccional-resend.md)).

### Arquitectura por capas

```
routers tRPC (adapters finos, 3-5 líneas)        src/server/api/routers/
  └─ runDomain() seam (DomainError → TRPCError)  src/server/api/runDomain.ts
       └─ use cases (la lógica de negocio)       src/server/domain/<modulo>/
            └─ services (adapters externos:      src/server/services/
               Flow, R2, Resend, LLM — factory
               con config explícita, sin env adentro)
```

Los endpoints Next clásicos (p. ej. el webhook de Flow) siguen el patrón **núcleo testeable + wrapper**: el núcleo puro recibe deps inyectadas; el wrapper lee env y cabla adapters. Detalle en [`docs/agents/backend-conventions.md`](docs/agents/backend-conventions.md).

### Invariantes innegociables

- **Tenancy**: todo dato del dominio comercial lleva `tenantId`; toda query se filtra por el tenant resuelto **server-side** (subdominio o sesión), nunca por input del cliente. Uniques compuestos con `tenantId`.
- **Dinero**: `Decimal`, nunca `Float`; operaciones que mueven plata en `prisma.$transaction`; formato UI con `Intl.NumberFormat` (CLP).
- **Pagos**: confirmación server-side contra la API de Flow con las credenciales del tenant dueño de la orden; webhook idempotente ([ADR-0001](docs/adr/0001-pasarela-flow-confirmacion-server-side.md)/[0006](docs/adr/0006-byo-flow-credenciales-por-tenant-ruteo-webhook.md)).
- **PDFs**: jamás enlace público — bucket privado con paths per-tenant + URL prefirmada con expiración, autorizada por el `Entitlement` de una orden pagada ([ADR-0002](docs/adr/0002-entrega-pdf-storage-privado-url-firmada.md)).
- **Secretos de tenant** (`FlowCredential`): cifrados at-rest; nunca en claro en DB, logs ni respuestas.

## Desarrollo

```bash
npm install
cp .env.example .env        # completar DATABASE_URL, keys — ver comentarios
npm run db:push             # sincroniza el schema (sin migraciones versionadas hasta F10)
npm run dev                 # ⚠️ UNA sola instancia — dos next dev corrompen .next
```

- Apex `http://localhost:3000` → zona plataforma / panel.
- Storefronts en `http://<slug>.localhost:3000` (los browsers resuelven `*.localhost` sin DNS); los slugs de prueba los crean los seeds de `scripts/`.
- Gates: `npm run check` = types + lint + vitest.

## Mapa de documentación

| Qué | Dónde |
|---|---|
| Instrucciones para agentes / reglas de oro | [`CLAUDE.md`](CLAUDE.md) |
| Vocabulario del dominio (Tienda/`Tenant`, Organizador, `Product`…) | [`CONTEXT.md`](CONTEXT.md) |
| Decisiones de arquitectura (ADR 0001–0015) | [`docs/adr/`](docs/adr/) |
| Decisiones aún abiertas (#6) | [`docs/decisiones-abiertas.md`](docs/decisiones-abiertas.md) |
| Roadmap vigente (10 fases; hito piloto = F07) | [`tasks/26-07-16-saas-roadmap.md`](tasks/26-07-16-saas-roadmap.md) |
| Índice de tareas activas | [`tasks/INDEX.md`](tasks/INDEX.md) |
| Convenciones por capa | [`docs/agents/`](docs/agents/) |
| Línea gráfica (estilización de marca pendiente; theming per-tenant) | [`docs/design.md`](docs/design.md) |

El trabajo no trivial fluye por el harness de subagentes (`planner`/`domain-planner` → `feature-implementer` → `feature-tester`, con satélites `schema-guardian`, `backend-reviewer`, `frontend-reviewer`, `change-set-reviewer`) — ver `CLAUDE.md` § Harness.

## Legal

Cada Organizador responde por su propia operación: Inicio de Actividades SII, boleta, IVA y las **bases legales de su sorteo**. La plataforma exige aceptación de ToS, exige bases antes de publicar un sorteo y muestra un disclaimer al comprador ([ADR-0008](docs/adr/0008-responsabilidad-legal-del-sorteo-del-organizador.md)). Validación por abogado pendiente antes del go-live público (F10).
