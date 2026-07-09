# libros-iselk

Tienda de e-books con sorteo, para una autora del fandom K-pop / ARMY (Chile). La autora vende sus libros en PDF; la gente los compra y descarga; sobre la venta se monta un sorteo promocional (entradas a un recital de BTS). Es un encargo de desarrollo para un cliente externo (la autora); lo desarrolla y mantiene un freelancer.

T3 stack: Next.js 14 (pages router) + tRPC 11 + NextAuth 4 (provider OAuth para el panel admin) + Prisma 5 + PostgreSQL + shadcn/ui + Tailwind.

## Propósito y alcance

- **Qué es**: catálogo + carrito + checkout con pago Flow + entrega segura de PDFs + sistema de sorteo + Hermes (generador de copy con IA) + panel admin.
- **Principio rector**: bajo volumen (~10 ventas/mes a $3.000 CLP) y bajo ingreso del cliente → la solución debe ser **simple y barata** de construir y mantener. No sobre-ingenierizar; priorizar un MVP funcional sobre features avanzadas.
- **Decisiones cerradas**: ver `docs/adr/` (Flow + confirmación server-side, entrega vía storage privado + URL firmada, Hermes LLM-agnóstico, sin cuentas de comprador).
- **Decisiones abiertas**: ver `docs/decisiones-abiertas.md` (storage de PDFs, correo, modelo LLM, nombre de dominio, hosting, marca de agua). **No las cierres sin consultar al usuario.**
- **Vocabulario del dominio**: `CONTEXT.md`.
- **Fuera de alcance (MVP)**: auto-posteo de Hermes a redes, SEO/Ads pagadas, integración directa de Mercado Pago, boletas SII automáticas, cuentas/login de compradores.
- **Legal/tributario**: obligaciones del cliente (Inicio de Actividades SII, boleta electrónica, IVA 19%, bases del sorteo). El sistema no las automatiza en el MVP.

## Regla de oro del dominio

**Dinero: `Decimal`, NUNCA `Float`** ni aritmética con `number`. Aplica a precios, IVA (19%), comisiones de Flow (~3,44%) y el neto al vendedor. Operaciones que mueven plata van en `prisma.$transaction`. Montos en UI con `Intl.NumberFormat` (CLP).

Dos invariantes críticos del dominio:
- **Pagos**: la confirmación es **server-side contra la API de Flow**, nunca el redirect del navegador; el webhook es idempotente (ADR-0001).
- **PDFs**: nunca enlace público; **storage privado + URL firmada con expiración**, autorizada por el `Entitlement` de una orden pagada (ADR-0002).

## Harness de subagentes

El trabajo no trivial fluye por el **tridente**: `planner` (o `domain-planner` si el vocabulario importa) → `feature-implementer` → `feature-tester`. Satélites: `schema-guardian`, `backend-reviewer`, `frontend-reviewer`, `change-set-reviewer`, `troubleshooter`.

Reglas del orquestador (sesión principal):

- Pedido vago de feature/fix/refactor sin plan escrito → invocar `planner`. Si introduce conceptos nuevos del dominio → `domain-planner`.
- **Implementación solo tras visto bueno explícito del usuario al plan.** Nunca saltar del grill a escribir código.
- Relevar los mensajes de los subagentes al usuario tal cual (especialmente los `AWAITING ANSWER` / `AWAITING USER APPROVAL`) y re-invocarlos con las respuestas.
- Al invocar `change-set-reviewer`, pasarle la **lista explícita de archivos de la sesión** + el plan asociado.
- Bug o código que no se entiende → `troubleshooter`.

### Gestión de tareas

- Los planes del tridente viven en `tasks/` con naming `YY-MM-DD-<modulo>-<slug>.md`, formato en `tasks/_template.md`.
- `tasks/INDEX.md` es el índice autoritativo de qué está activo — lo mantienen los agentes.
- La **Bitácora** de cada task file es append-only: es la memoria compartida entre agentes y sesiones.
- Estados: `planning → implementing → testing → done`. Solo el `feature-tester` marca checkboxes `[x]`; los cambios de `state`/`status` finales los decide el usuario.
- PRDs e issues (skills `to-prd`, `to-issues`, `triage`) viven en `.scratch/<feature>/` — son sistemas separados: `.scratch/` para descubrimiento/triage, `tasks/` para ejecución del tridente.

### Gates

- `npm run check` = `check:types` (tsc) + `check:lint` (next lint) + `check:test` (vitest run). Lo corre el `change-set-reviewer` al cierre; el implementer NO lo corre (solo vitest filtrado durante TDD).
- Convenciones por capa en `docs/agents/*-conventions.md` (backend, frontend, prisma, commits, data-fetching) + rúbrica compartida en `docs/agents/evaluator-rubric.md`. Son seeds: crecen con cada decisión aprobada.

## Agent skills

### Issue tracker

Issues y PRDs viven como markdown local en `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Vocabulario por defecto: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: un `CONTEXT.md` + `docs/adr/` en la raíz. See `docs/agents/domain.md`.

## Diseño

- UI con shadcn/ui (new-york, CSS variables, lucide). Convenciones en `docs/agents/frontend-conventions.md`.
- **Línea gráfica completa en `docs/design.md`** — fuente de verdad de todo artefacto visual. Leerlo antes de generar cualquier cosa visual.
- **La paleta de marca y el nombre están PENDIENTES** (decisiones abiertas + identidad fandom/ARMY a definir). Resolver en una sesión de `frontend-design` / `domain-planner` antes de construir UI de marca — no inventar dirección visual propia.
