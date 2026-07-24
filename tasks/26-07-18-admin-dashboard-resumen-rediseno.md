---
slug: admin-dashboard-resumen-rediseno
status: testing
owner: nicolas
created: 2026-07-18
related_adrs: [ADR-0004, ADR-0005, ADR-0011, ADR-0012, ADR-0013]
related_context: [Tienda, Organizador, Operador, Orden, Pago, Sorteo, Participación]

features:
  - id: F01
    behavior: "design.md §4/§5/§6 reescritos: el chrome del panel SÍ se rediseña (rail tinta colapsable, cards con elevación por sombra difusa, contenido full-width, canvas hundido); registra el prototipo «Oscuro + calmo» como verdad."
    state: active
  - id: F02
    behavior: "AdminLayout con el chrome nuevo — rail lateral tinta colapsable (icon-only ↔ icon+label), topbar sin borde inferior, canvas gray-0 full-width, primitiva PanelCard sin borde — preservando 1:1 acceso/estados/Spotlight/MenuCuenta/chip-tienda/Operador/Ver-mi-tienda/dark-mode."
    state: active
  - id: F03
    behavior: "Resumen reconstruido a la gramática nueva: saludo + badge estado, 4 KPIs (mono + delta + sparkline donde hay serie), gráfico ventas 14d, tabla últimas ventas, card «Tu sorteo» (countdown + tickets). Endpoint nuevo getSerieVentasDiaria + deltas en getResumenTienda."
    state: active
  - id: F04
    behavior: "Ventas re-layout a PanelCard sin borde + full-width; lógica/queries/reenvío por-fila intactos."
    state: active
  - id: F05
    behavior: "Sorteo re-layout a la gramática nueva; ejecución irreversible + AssetUploader del premio + participantes intactos."
    state: active
  - id: F06
    behavior: "Productos re-layout a la gramática nueva; modal de form + subida PDF/portada + toggle sorteo intactos."
    state: active
  - id: F07
    behavior: "Configuración re-layout a la gramática nueva; form hidratado (credencial Flow write-only + marca + redes + bases) intacto."
    state: active
  - id: F08
    behavior: "Operador re-layout a la gramática nueva; suspender/reactivar + gate FORBIDDEN intactos."
    state: active
---

# Rediseño completo del panel del Organizador — chrome «Oscuro + calmo» + re-layout de las 6 páginas

## Contexto

El usuario aprobó, tras 3 rondas de prototipos, un rediseño completo del panel `/admin`: un chrome nuevo (rail lateral tinta **colapsable**, topbar sin borde, canvas gris muy claro, cards **sin borde** con elevación por sombra difusa, contenido **full-width**) y un dashboard "Resumen" mucho más rico (KPIs con número mono + delta + sparkline, gráfico de ventas de 14 días, columna derecha con "Tu sorteo"). El prototipo elegido era la variante «Oscuro + calmo».

Dos decisiones ya vienen **tomadas** por el usuario (no se re-preguntan): (1) `docs/design.md` §4 se **reescribe** — el prototipo es la nueva verdad y el chrome del panel SÍ se rediseña; (2) el alcance es el **re-layout completo de TODO el panel ahora** — chrome global nuevo + reconstrucción del contenido de las 6 páginas a la gramática nueva.

Este plan traslada ese trabajo al `/admin` real. La lógica de negocio y las queries existentes **no cambian** salvo lo estrictamente necesario para el layout nuevo y para los datos nuevos del dashboard que sean viables contra el modelo real.

> **Nota de fuente de verdad (importante para el implementer):** el archivo de prototipo `src/pages/prototipo/panel-v2.tsx` referenciado en el brief **ya no existe** — nunca se commiteó y el directorio `src/pages/prototipo/` fue borrado del working tree (verificado: no está en HEAD, stash ni reflog; el `panel.tsx`/`v2-noche.tsx` que sí están en HEAD son la dirección «El Talonario» clara y la landing «Noche», NO el chrome «Oscuro + calmo»). Por eso **F01 (reescritura de design.md §4/§5/§6) es la referencia visual autoritativa** para todo el trabajo: la spec visual del brief se transcribe ahí con precisión y el resto de las features se implementan contra ese texto, no contra un `.tsx` inexistente.

## Decisiones

- **D1 — design.md §4 se reescribe (ya tomada por el usuario).** El bullet actual "El chrome del panel NO se rediseña… elevación por borde" se reemplaza por la gramática nueva del panel. Razón: el usuario aprobó el prototipo tras 3 rondas; el doc de marca debe reflejarlo antes de tocar UI (§9: no introducir dirección visual fuera del doc).

- **D2 — Alcance = re-layout completo del panel ahora (ya tomada por el usuario).** Chrome global nuevo (F02) + contenido de las 6 páginas reconstruido a la gramática nueva (F03–F08). Razón: consistencia; el chrome es un solo `AdminLayout` compartido, y dejar páginas con la gramática vieja (cards `withBorder`, cap `max-w-6xl`) rompería visualmente al lado del chrome nuevo.

- **D3 — Mecanismo del rail colapsable: `AppShell` con ancho de navbar dinámico (recomendada), fallback a layout propio.** El `AppShell` de Mantine 7 **no** tiene "mini variant" (su `collapsed` OCULTA el navbar, no lo lleva a icon-only). Pero sí acepta `navbar.width` gobernado por estado: **desktop colapsado = width ~76 + labels ocultos; expandido = width 256 + labels**; el `collapsed.mobile` sigue dando el Burger + Drawer **gratis** (lo que hoy funciona y NO queremos reimplementar). La transición de ancho se anima por CSS sobre el elemento del navbar. Razón: preserva el drawer mobile, el slot de header y TODO el wiring de estados actuales con el mínimo de reescritura y el mínimo riesgo de regresión. **Fallback documentado:** si `AppShell` pelea con el ancho dinámico o su animación (verificar en implementación), caer a layout flex propio (`<aside>` sticky + topbar propio + `Drawer` de Mantine con `useDisclosure` para mobile) reponiendo a mano lo que AppShell daba gratis. El estado colapsado/expandido se persiste (localStorage) para que no se resetee entre navegaciones.

- **D4 — Primitiva `PanelCard` compartida en vez de `Card withBorder`.** Se crea `src/components/admin/panel-card.tsx`: `Card` de Mantine con `withBorder={false}`, `radius="lg"` y la sombra difusa del prototipo, tomada de **un token único** (ver I3). Todas las páginas del panel migran sus `<Card withBorder>` a `<PanelCard>`. Razón: centraliza la gramática nueva (sombra + radius + sin borde) en un lugar; hace F04–F08 mecánicas; evita 20+ hex de sombra dispersos (§9). NO se override-ea el `Card` global del theme porque afectaría storefront/landing (que tienen su propia gramática).

- **D5 — La sombra del panel vive como token, no inline.** La sombra `0 1px 2px rgba(25,27,34,0.04), 0 6px 20px rgba(25,27,34,0.06)` se registra como un shadow con nombre en el theme (o CSS var de scope panel) y `PanelCard` la consume por token. Razón: §9 "cero hex inline"; un solo lugar para ajustar la elevación.

- **D6 — Rail tinta con wordmark invertido.** El rail usa fondo tinta (`--mantine-color-black` = `#191b22`, ya token del theme) y el `Wordmark` con `invertido`/color claro (el componente ya soporta `invertido` — pincelazo blanco — y `c`). NavLink activo/hover se re-estilan para fondo oscuro. Razón: el prototipo pide rail tinta con wordmark "Sortéatelo" al expandir; el componente ya existe.

- **D7 — Charts con `@mantine/charts` (a instalar), sobre Recharts (ya instalado).** design.md §6 fija `@mantine/charts` como default (hereda colores del theme; da `Sparkline` + `AreaChart`/`LineChart`). `recharts@^3.9.0` ya es dependencia; falta `@mantine/charts`. Razón: es el default del doc de marca, menor superficie que cablear Recharts a mano, y respeta la restricción §6 (≤5 series, grid sutil, series del theme). El KPI usa `Sparkline`; el gráfico de 14 días usa `AreaChart`/`LineChart` con una sola serie.

- **D8 — KPIs con sparkline/delta SOLO donde hay serie real.** "Ventas pagadas" e "Ingresos" tienen serie diaria (viable, ver Datos) ⇒ sparkline + delta vs período anterior. "Pendientes"/"Productos activos"/"Sorteo cierra en" **no** tienen serie natural ⇒ se muestran sin sparkline (el `StatCard` ya hace `delta`/`hint` opcionales). Razón: no inventar series; el número mono + hint ya comunica.

- **D9 — Números/montos de los KPIs en `var(--font-mono)` + `tabular-nums`.** `StatCard` se ajusta para renderizar el valor en IBM Plex Mono (firma de marca del talonario, §3/§8). Razón: el prototipo pide número mono; hoy `StatCard` usa `tabular-nums` con la fuente de sistema.

- **D10 — Datos NO respaldados del prototipo: fuera de alcance, documentados (no se alucina el campo).** Ver la sección **Datos del dashboard** para el detalle de qué es viable, qué requiere backend nuevo y qué queda fuera. En resumen: el gráfico de 14 días y "Tu sorteo" (countdown + conteo de tickets) son viables; **"De dónde llegan" (ventas por canal) queda FUERA DE ALCANCE** (no hay dato de origen en `Order`); el **mini-talonario con número secuencial global «Nº 312» y la barra de progreso «312/500»** quedan **FUERA DE ALCANCE** (no hay numeración global ni campo de meta/capacidad en `Raffle`). Razón: regla del brief — no inventar campos.

## Datos del dashboard (viabilidad contra el modelo real)

Verificado contra `prisma/schema.prisma` (`Order`, `OrderItem`, `Payment`, `Raffle`, `RaffleEntry`) y los use cases existentes (`getResumenTienda`, `listarVentas`, `getSorteoDelPanel`).

1. **Serie de ventas por día (14 días)** — **VIABLE (backend nuevo pequeño).** `Order` tiene `createdAt`, `estado`, `total` (Decimal). Nuevo use case `getSerieVentasDiaria` agrupa las órdenes `PAGADO` por día (14 días), sumando `total` con Decimal server-side (I4) y contando órdenes. Tenant-scoped por `resolverTenantAutorizado` (I1). Devuelve una serie de `{ dia, ventas, ingresos }`.

2. **Deltas de KPI ("+X% vs período anterior")** — **VIABLE (extiende `getResumenTienda`).** Se computa el total del período actual (14d) vs el período equivalente anterior (14d previos) para ventas e ingresos, server-side con Decimal. Solo para ventas e ingresos (D8).

3. **Sparklines de KPI** — **VIABLE.** Derivan de la misma serie diaria (ventas/día, ingresos/día). Solo en los KPIs con serie (D8).

4. **"Tu sorteo": countdown + conteo de tickets** — **VIABLE (usa `getSorteoDelPanel`, sin cambios).** El countdown se calcula client-side contra `Raffle.fechaFin` (solo si hay sorteo y la fecha es futura). El conteo de participaciones (`totalParticipaciones` = nº de `RaffleEntry`) ya lo devuelve `getSorteoDelPanel`. El motivo visual "mini-talonario" se puede renderizar mostrando ese conteo.

5. **"Tu sorteo": número secuencial global «Nº 312» y barra de progreso «312/500»** — **FUERA DE ALCANCE.** No existe numeración secuencial global de tickets (`RaffleEntry.ordinal` es 0..K-1 **por orden**, no global) ni un campo de **meta/capacidad** en `Raffle` que sirva de denominador del progreso. Implementarlos requeriría un campo nuevo (`Raffle.metaTickets`) y/o un contador secuencial — decisión de producto aparte. Se renderiza el conteo de tickets **sin** barra a-meta y **sin** número secuencial inventado.

6. **"De dónde llegan" (ventas por canal)** — **FUERA DE ALCANCE.** `Order` no tiene ningún campo de origen/canal/UTM. Requiere una feature de tracking aparte (capturar el origen en el checkout + columna nueva). No se implementa ni se inventa el campo.

7. **"Actividad reciente"** — **VIABLE pero DIFERIDA (no se implementa en este plan).** Se podría derivar de órdenes/pagos recientes + ejecución del sorteo, sin modelo nuevo, pero **se solapa fuertemente** con la tabla "Últimas ventas" del mismo dashboard. Para no duplicar ni sobre-ingenierizar, la columna derecha del Resumen ship-ea con "Tu sorteo" como widget principal; "Actividad reciente" queda como posible follow-up. (Si el usuario la quiere sí o sí, es un endpoint chico derivado de datos existentes — no bloqueante.)

**Regla de oro respetada en todo lo anterior:** tenancy resuelta server-side (`resolverTenantAutorizado`, jamás desde input — I1/ADR-0005); dinero en Decimal, sumado en la DB, viaja como string (I4); correos de compradores **enmascarados** en cualquier vista nueva (ADR-0004) — el dashboard NO expone correos completos que hoy no se expongan.

## Plan

1. **Reescribir `docs/design.md`** (F01, docs-only):
   - **§4**: reemplazar el bullet "El chrome del panel NO se rediseña…" por la gramática nueva del panel — **rail lateral tinta colapsable** (icon-only ↔ icon+label), **cards con elevación por sombra difusa** (token único, NO borde), **radius lg**, **contenido full-width** (sin cap `max-w-6xl`), **canvas hundido/gray-0**, **topbar sin borde inferior**. Mantener intacta la gramática suave de superficies de marca (landing/login).
   - **§5** (y §5.1 lista de superficies): actualizar la mención del panel (`AppShell`… → rail tinta colapsable + cards sombra + full-width).
   - **§6 Data-viz**: reafirmar que el panel usa `@mantine/charts` (KPIs con sparkline, gráfico de ventas ≤5 series, series del theme).
   - **§7 Motion**: registrar que la animación del colapso del rail es **CSS puro** (transición de ancho), no la librería `motion` (que sigue prohibida en el panel).

2. **Crear las primitivas de gramática compartidas** (F02):
   - Token de sombra del panel en el theme / CSS var de scope panel (D5).
   - `src/components/admin/panel-card.tsx` (`PanelCard`) — `Card` sin borde, `radius="lg"`, sombra por token (D4).
   - Instalar `@mantine/charts` y registrar su CSS de estilos donde corresponda (`_app`) (D7).

3. **Reconstruir el chrome en `AdminLayout`** (F02): rail tinta colapsable (D3/D6), topbar sin borde inferior, canvas full-width (quitar el wrapper `max-w-6xl`), estado colapsado persistido. **Preservar 1:1**: `getAccesoActual` + estados (loading/error/sin-tienda `CrearTienda`/`SinTiendaOperador`), `PageHeader`, Spotlight ⌘K, `MenuCuenta` (avatar/nombre/email/rol/dark toggle/salir), chip de tienda con `ColorSwatch` (seam per-tenant), NavLink Operador condicional + badge, botón "Ver mi tienda", Burger + Drawer mobile.

4. **Reconstruir el Resumen** (F03):
   - Backend: nuevo use case `getSerieVentasDiaria` + wiring en `panel.ts`; extender `getResumenTienda` con deltas vs período anterior (viables — ver Datos 1/2).
   - Frontend: saludo "Hola, {nombre}" (sesión) + badge de estado (reusa `EstadoTiendaBadge`/estado de publicación); 4 KPIs (`StatCard` ajustado a número mono + delta/sparkline donde hay serie, D8/D9); gráfico de ventas 14d (`@mantine/charts`); tabla "Últimas ventas" (reusa `listarVentas`); card "Tu sorteo" (countdown client-side + conteo de tickets desde `getSorteoDelPanel`). Marcar en el código con comentario los widgets fuera de alcance (De dónde llegan, progreso a-meta, número secuencial).

5. **Re-layout de las 5 páginas restantes** (una feature por página, contenido/lógica intactos, solo gramática): **Ventas** (F04), **Sorteo** (F05), **Productos** (F06), **Configuración** (F07), **Operador** (F08). En cada una: `Card withBorder` → `PanelCard`; heredan el canvas full-width del chrome nuevo; ajustes visuales menores para la gramática (spacing, mono en montos donde aplique). Sin tocar mutations, queries, guards ni flujos.

## Validaciones

> El chrome y el re-layout son mayormente **verificación visual/E2E**; los únicos comportamientos con lógica nueva testeables por Vitest son los endpoints del dashboard (F03).

### F01 — design.md reescrito (docs-only)

**Vitest**: (no aplica — cambio de documentación)

**E2E**: (no aplica — docs)
- [ ] `docs/design.md` §4 ya no dice "El chrome del panel NO se rediseña"; describe rail tinta colapsable, cards por sombra, full-width, canvas hundido (revisión humana).

### F02 — Chrome nuevo en AdminLayout

**Vitest**: (no aplica — layout/UI; sin lógica de dominio nueva)

**E2E** (browser, panel autenticado):
- [ ] El rail lateral se ve tinta con el wordmark "Sortéatelo" al expandir; colapsa a icon-only y expande de nuevo; el estado persiste al navegar entre páginas.
- [ ] La topbar no tiene borde inferior; el canvas es gris muy claro; el contenido ocupa el ancho completo (sin cap centrado).
- [ ] Se preservan: chip de la tienda con su swatch de color, búsqueda ⌘K (Spotlight), "Ver mi tienda", campana/menú de cuenta (nombre/email/rol/dark toggle/salir).
- [ ] En mobile, el Burger abre el Drawer con la navegación; el NavLink Operador aparece solo con rol Operador.
- [ ] Estados preservados: sin-tienda muestra `CrearTienda` (Organizador) o `SinTiendaOperador` (Operador); error de acceso muestra reintentar; dark mode conmuta canvas y cards.

### F03 — Resumen reconstruido

**Vitest** (integration, endpoints nuevos):
- [ ] `getSerieVentasDiaria` devuelve 14 días de serie tenant-scoped, sumando `total` de órdenes `PAGADO` con Decimal (string) y contando órdenes por día; un tenant sin ventas devuelve serie en cero. — `src/__tests__/server/panel/getSerieVentasDiaria.test.ts::panel.serieVentas.001`
- [ ] `getSerieVentasDiaria` está scopeado server-side: no incluye órdenes de otro tenant; sin membresía ⇒ `FORBIDDEN`. — `src/__tests__/server/panel/getSerieVentasDiaria.test.ts::panel.serieVentas.002` (aislamiento tenant + solo PAGADO) + `::panel.serieVentas.003` (FORBIDDEN)
- [ ] `getResumenTienda` devuelve los deltas de ventas e ingresos vs el período anterior (14d), computados con Decimal server-side. — `src/__tests__/server/panel/getResumenTienda.test.ts::panel.resumen.004` (delta up) + `::panel.resumen.005` (delta null sin base) + `::panel.resumen.006` (delta down)
- [ ] Los montos/series viajan como string (nunca `number` en el server); la UI formatea con `~/lib/formato`. — cubierto por `getSerieVentasDiaria.test.ts::panel.serieVentas.001` (asserts `typeof ingresos === "string"`) + `getResumenTienda.test.ts::panel.resumen.004` (ingresos string)

**E2E** (browser, panel autenticado):
- [ ] El Resumen muestra saludo "Hola, {nombre}" + badge de estado, 4 KPIs con número mono (ventas/ingresos con delta + sparkline), gráfico de ventas de 14 días, tabla de últimas ventas y card "Tu sorteo" con countdown + conteo de tickets.
- [ ] La card "Tu sorteo" NO muestra número secuencial inventado ni barra de progreso a-meta; "De dónde llegan" no aparece (fuera de alcance).
- [ ] Los correos de comprador en la tabla siguen enmascarados/como hoy (ADR-0004).

### F04 — Ventas re-layout

**Vitest**: (no aplica — solo gramática; lógica intacta)

**E2E** (browser):
- [ ] La tabla de ventas se ve en `PanelCard` sin borde, full-width; el reenvío del correo por-fila sigue funcionando (órdenes `PAGADO`); "Cargar más" pagina.

### F05 — Sorteo re-layout

**Vitest**: (no aplica — solo gramática; lógica intacta)

**E2E** (browser):
- [ ] La página del sorteo usa la gramática nueva; los stat cards, la card del premio con `AssetUploader`, la tabla de participantes y el modal de ejecución (irreversible) siguen funcionando; el conteo de participaciones es correcto.

### F06 — Productos re-layout

**Vitest**: (no aplica — solo gramática; lógica intacta)

**E2E** (browser):
- [ ] La tabla de productos usa la gramática nueva; el modal de crear/editar con subida de PDF (presigned PUT), subida de portada, y el toggle "Participa en el sorteo" siguen funcionando; los badges de estado (A la venta / Sin PDF / Borrador / Sorteo) se ven correctos.

### F07 — Configuración re-layout

**Vitest**: (no aplica — solo gramática; lógica intacta)

**E2E** (browser):
- [ ] Las cards de configuración usan la gramática nueva; la credencial Flow sigue write-only (nunca precarga secretos, muestra estado); el form de marca (logo/hero/color/textos/redes/bases) hidrata y guarda; el `AssetUploader` sube al instante.

### F08 — Operador re-layout

**Vitest**: (no aplica — solo gramática; lógica intacta)

**E2E** (browser):
- [ ] La tabla del Operador usa la gramática nueva; suspender/reactivar (con confirmación) sigue funcionando; un no-operador ve el estado "No tienes acceso" (gate `FORBIDDEN`).

## Invariantes

- **I1 — Tenancy server-side (ADR-0005).** Todo dato nuevo del dashboard se scopea con `resolverTenantAutorizado` sobre `ctx.acceso`; el `tenantId` JAMÁS sale del input del cliente. Sin membresía ⇒ `FORBIDDEN`.
- **I2 — Dinero en Decimal (regla de oro).** Ingresos, sumas y deltas se agregan con Decimal en la DB (`_sum`/aritmética Decimal) y viajan como string; **nunca** aritmética con `number` en el server.
- **I3 — Privacidad de compradores (ADR-0004).** Ninguna vista nueva expone correos completos que hoy no se expongan; se mantiene el enmascarado/uso actual.
- **I4 — Cero hex inline (design.md §9).** La sombra, los colores del rail y todo color salen de tokens del theme / CSS vars. El **único** color-desde-dato permitido en el panel sigue siendo el swatch del chip de tienda (`ColorSwatch`). La sombra del panel vive como token único (D5).
- **I5 — Seam de theming (ADR-0011/D13).** El panel monta SIEMPRE el theme base de plataforma (cobalto), sin override per-tenant. El color del tenant no entra como theme.
- **I6 — Preservación funcional.** F02 y F04–F08 son cambios de gramática/layout: **no** modifican mutations, queries, guards, flujos de subida, idempotencia ni la ejecución irreversible del sorteo. Cualquier cambio de comportamiento fuera de las Decisiones/Datos exige parar y preguntar.
- **I7 — No inventar campos.** No se crean columnas ni datos para los widgets fuera de alcance (canal, meta del talonario, número secuencial global). Se documentan como fuera de alcance.
- **I8 — Motion del panel.** La librería `motion` sigue prohibida en el panel (design.md §7); la animación del colapso del rail es CSS puro y respeta `prefers-reduced-motion`.
- **I9 — Íconos y componentes.** `@tabler/icons-react` como única librería de íconos; componentes de `@mantine/core` (+ `@mantine/charts` para viz). Sin clases de color/tipografía/sombra de Tailwind (solo layout).

## Out of scope

- **"De dónde llegan" (ventas por canal)** — requiere feature de tracking de origen (columna nueva en `Order` + captura en checkout). No se implementa.
- **Mini-talonario con número secuencial global («Nº 312») y barra de progreso a-meta («312/500»)** — requieren numeración global de tickets y/o `Raffle.metaTickets`; decisión de producto aparte.
- **"Actividad reciente"** — diferida (se solapa con "Últimas ventas"); endpoint chico derivable si el usuario lo pide.
- Cambios de lógica de negocio, schema, o flujos (checkout, webhook, subida, ejecución del sorteo, credenciales).
- Logo/isotipo dibujado (decisión abierta, ya listada en design.md).
- Rediseño del storefront, landing o login (superficies de marca — su gramática suave se mantiene).

## Especialistas a consultar

- `frontend-reviewer` — el grueso del trabajo (chrome, gramática de cards, KPIs, charts, re-layout de 6 páginas): convenciones visuales, tokens, cero-hex, `@mantine/charts`, responsive.
- `backend-reviewer` — los endpoints nuevos del dashboard (F03): `getSerieVentasDiaria`, deltas en `getResumenTienda`, tenancy server-side, Decimal.
- `feature-tester` — E2E asistido con login Google real (el panel toca todo el flujo autenticado + UI cross-página); verificación visual del chrome colapsable y del dashboard.
- `change-set-reviewer` — review del diff completo antes de commit (toca `design.md`, `AdminLayout`, 6 páginas, 2 use cases, nueva dependencia).

## Bitácora

- [2026-07-18 12:00] [planner-grill] Arranco grill. Prototipo fuente de verdad leído (`src/pages/prototipo/panel-v2.tsx`, variante «Oscuro + calmo»). Chrome real (`admin-layout.tsx` = AppShell), dashboard real (`admin/index.tsx`), router panel (`panel.ts` + `domain/panel/*`), schema (Order/Payment/Raffle/RaffleEntry), design.md §4 y frontend-conventions cargados. Hallazgo crítico backend: NO existe numeración global secuencial de tickets (RaffleEntry.ordinal es 0..K-1 por-orden) ni campo "total del talonario" en Raffle ⇒ el mini-talonario «Nº 312» / «312/500» del prototipo no tiene respaldo de datos hoy. Tampoco hay tracking de canal en Order ("De dónde llegan").
- [2026-07-18 12:05] [planner-grill] Q1 answered: reescribir design.md §4 (opción recomendada). Prototipo C «Oscuro + calmo» = nueva verdad; la edición de design.md §4 (+§5 si hace falta) es parte del entregable.
- [2026-07-18 12:12] [planner-grill] Q2 answered: opción (c) — re-layout completo de las 6 páginas AHORA (chrome global + contenido de Resumen/Productos/Ventas/Sorteo/Configuración/Operador a la gramática nueva). Dimensionadas: Resumen (rebuild total), Ventas (1 tabla + reenviar por-fila), Sorteo (3 stat + card premio + tabla participantes + modal ejecutar), Productos (tabla + modal form + subida PDF/portada), Operador (tabla + suspender/reactivar), Configuración (form hidratado credencial Flow/plantilla/bases). Plan se separa por página para verificación incremental.
- [2026-07-18 12:12] [planner-grill] Q3: ¿Mecanismo del rail colapsable — Mantine `AppShell` (con `navbar.collapsed`) o layout propio (como el prototipo)? Hallazgo: `AppShell` NO tiene "mini variant" (su collapse OCULTA el navbar, no lo lleva a icon-only 76px↔224px); el prototipo usa layout flex propio con `<aside>` sticky + topbar propio. Recomendada: layout propio fiel al prototipo, reimplementando el drawer mobile con `Drawer` de Mantine + `useDisclosure` (hoy AppShell da el Burger/drawer gratis; lo perdemos y lo reponemos a mano). El estado del panel `AdminLayout` (query getAccesoActual, estados sin-tienda/error/operador, Spotlight, MenuCuenta) se preserva 1:1, solo cambia el contenedor.
- [2026-07-18 12:05] [planner-grill] Q2: ¿El rediseño del chrome (rail/topbar/canvas/full-width) aplica a TODO el panel (todas las páginas comparten `AdminLayout`) o solo a Resumen? Recomendada: el chrome es global e inevitable (un solo layout); Resumen se reconstruye entero; las demás páginas heredan el chrome nuevo + pierden el cap max-w-6xl, y sus cards migran a la gramática sin-borde por consistencia, pero su contenido/lógica interna no cambia en este trabajo.
- [2026-07-18 12:00] [planner-grill] Q1: ¿Cómo resolvemos el conflicto duro con `docs/design.md` §4 ("El chrome del panel NO se rediseña"; cards `withBorder`, elevación por borde)? El diseño aprobado lo contradice frontalmente (rail oscuro colapsable, cards sin borde con sombra, contenido full-width). Recomendada: registrar la decisión y **editar design.md §4 + §5** como parte de este trabajo, dado que el usuario ya aprobó el prototipo tras 3 rondas — pero requiere tu visto bueno explícito porque es una regla dura del doc de marca.
- [2026-07-18 14:00] [feature-implementer] Arranca implementación (alcance de este run: SOLO F01, F02, F03; parar y reportar al cerrar F03 para revisión del usuario antes de F04–F08). Read pass completo hecho: template, CLAUDE.md, design.md, ADRs relacionados, conventions (frontend/backend/data-fetching), theme.ts, admin-layout.tsx, admin/index.tsx, panel router + domain (getResumenTienda/listarVentas/getSorteoDelPanel/getAccesoActual/getEstadoPublicacion), authPolicy, StatCard/PageHeader/EstadoBadge/EstadoTiendaBadge/ChecklistPublicacion/Wordmark, formato.ts, getResumenTienda.test.ts (patrón fake-db).
- [2026-07-18 14:05] [feature-implementer] CORRECCIÓN a la nota de fuente de verdad del plan: el prototipo `src/pages/prototipo/panel-v2.tsx` SÍ existió (nunca commiteado; el dir `prototipo/` fue borrado del working tree). RECUPERADO su source completo (23.609 chars) desde el source-map embebido en el build `.next/server/pages/prototipo/panel-v2.js` (timestamp 22:47, POSTERIOR a los screenshots de variantes 21:02 y previo al plan 23:05 ⇒ ES la variante «Oscuro + calmo» final). También hay screenshots en `tmp/proto-panel-v2-{desktop,mobile,variante-a/b/c}.png`. El prototipo es la referencia visual/interacción autoritativa. Hallazgos clave del source recuperado: rail tinta (`var(--mantine-color-black)` #191b22) colapsable 224↔76 con transición CSS `width 180ms`, wordmark blanco + isotipo (IconTicket cobalto/amarillo), topbar sin borde sticky, canvas `light-dark(gray-0, dark-8)`, cards `SOMBRA_CARD = "0 1px 2px rgba(25,27,34,0.04), 0 6px 20px rgba(25,27,34,0.06)"` radius lg sin borde, KPI con número mono 1.7rem + delta badge + **sparkline SVG hand-rolled**, gráfico 14d como **barras div hand-rolled** (NO @mantine/charts), tabla últimas ventas. El prototipo incluye bloques FUERA DE ALCANCE por decisión del usuario (talonario grid/«Nº 312»/«312/500», CardCanales «De dónde llegan», CardActividad «Actividad reciente») que NO se implementan.
- [2026-07-18 14:10] [feature-implementer] PAUSA — decisión bloqueante sobre la librería de charts (D7). Verificado: `@mantine/charts` NO está instalado; `recharts@3.9.0` sí (pero NO se importa en ningún archivo de `src` — dep fantasma). `@mantine/charts@7.17.8` (versión que empareja con `@mantine/core@7.17.8`) peer-requiere `recharts@^2.13.3` ⇒ CONFLICTO con el recharts@3 instalado; `@mantine/charts@9` (que usa recharts@3) exige `@mantine/core@8` (upgrade mayor de toda la UI, descartado). El premisa de D7 («@mantine/charts sobre Recharts ya instalado») no es ejecutable limpio. Además el prototipo autoritativo hand-rollea los charts sin dependencia. Se eleva al usuario (ver mensaje AWAITING ANSWER). NO instalado nada. (run de foreground, sin grilling interactivo). Dos decisiones ya tomadas por el usuario (D1 reescribir design.md §4; D2 alcance = re-layout completo). Restante táctico resuelto con opción recomendada y justificación: D3 mecanismo del rail → **AppShell con ancho de navbar dinámico** (REVISA la recomendación tentativa de Q3 hacia layout propio: con el archivo completo a la vista, AppShell dinámico preserva el Drawer mobile + header + wiring con menos riesgo; layout propio queda como fallback documentado). D4 PanelCard compartida; D5 sombra como token; D6 rail tinta + Wordmark invertido; D7 @mantine/charts (recharts ya instalado); D8/D9 KPIs mono + sparkline/delta solo con serie real. **Hallazgo bloqueante mitigado:** el prototipo `panel-v2.tsx` NO existe (nunca commiteado + dir borrado; verificado en HEAD/stash/reflog) ⇒ la reescritura de design.md §4/§5/§6 (F01) se vuelve la referencia visual autoritativa. Viabilidad de datos verificada contra schema real: serie 14d + deltas + "Tu sorteo" (countdown/tickets) VIABLES; "De dónde llegan" y talonario secuencial/progreso-a-meta FUERA DE ALCANCE (no alucinar campos); "Actividad reciente" diferida. 8 features (F01 docs, F02 chrome, F03 Resumen+endpoints, F04–F08 una página c/u).
- [2026-07-18 15:00] [feature-implementer] RE-INVOCACIÓN. El usuario resolvió el bloqueo de charts (D7): **Opción B — honrar D7**. Baja `recharts` 3→`^2.13.3` (dep fantasma, no importada en `src` — verificado con grep, cero matches ⇒ downgrade seguro) e instala `@mantine/charts@7.17.8` (empareja con `@mantine/core@7.17.8`); peer-dep resuelto SIN `--legacy-peer-deps`. CSS `@mantine/charts/styles.css` en `_app.tsx` tras `@mantine/core/styles.css`. Gráfico 14d con `BarChart` (barra "hoy" amarillo, resto cobalto), sparklines con `Sparkline`, colores por token del theme (§6). Alcance de este run: SOLO F01, F02, F03 (parar y reportar al cerrar F03). Árbol compartido con catálogo-v2 (builder visual) — acotado quirúrgicamente a los archivos del dashboard admin; NO tocar editor/storefront/pagebuilder/prototipo. Fuente de verdad visual: `scratchpad/panel-v2-referencia.tsx` (spec del chrome + dashboard «Oscuro + calmo») + design.md §4 (reescrito en F01) + screenshots `tmp/proto-final-*.png`. Read mínimo on-demand de los archivos a tocar. F01 → `active`.
- [2026-07-18 15:20] [feature-implementer] F01 implementada (docs-only). `docs/design.md` reescrito: §4 (bullet "el chrome del panel NO se rediseña" → gramática «Oscuro + calmo»: rail tinta colapsable icon-only↔icon+label con estado persistido + wordmark invertido, `PanelCard` sin borde con sombra difusa por token `SOMBRA_PANEL`, contenido full-width sin cap `max-w-6xl`, canvas `light-dark(gray-0, dark-8)`, topbar `withBorder={false}`, radio lg — marca landing/login intacta); §5 (superficies: panel = chrome «Oscuro + calmo» + gramática de dashboard rica); §6 (data-viz: `@mantine/charts@7.17.8` sobre `recharts@^2.13.3`, `Sparkline` KPIs + `BarChart` 14d con "hoy" amarillo, ≤5 series, cero hex inline); §7 (colapso del rail = CSS puro, `motion-safe:`, no la librería `motion` que sigue prohibida en el panel); §1 (registro visual actualizado sin contradicción). TDD N/A (docs). Reviewer N/A (sin código; los `*-reviewer` auditan código, no markdown). Validación F01 = revisión humana (no marco `[x]`).
- [2026-07-18 16:10] [feature-implementer] F02 implementada. TDD N/A (chrome puramente UI, sin lógica de dominio testeable — anotado). Archivos: `src/components/admin/panel-card.tsx` (NUEVO — `PanelCard` = Card sin borde radius lg + token único `SOMBRA_PANEL` de elevación, D4/D5); `src/components/admin/admin-layout.tsx` (REESCRITO — chrome «Oscuro + calmo»: `AppShell` con ancho de navbar dinámico 76↔256 via `useLocalStorage`+`useMediaQuery` D3, rail tinta `--mantine-color-black` con Wordmark `invertido`/isotipo D6, NavLink re-estilado por CSS vars `--nl-*` + `data-mantine-color-scheme="dark"` en contenedor host, topbar `withBorder={false}`, canvas `light-dark(gray-0, dark-8)` full-width sin cap `max-w-6xl`, toggle colapsar desktop-only, transición de width CSS puro gateada por `prefers-reduced-motion` I8). Preservado 1:1: getAccesoActual+4 estados, PageHeader, Spotlight ⌘K, MenuCuenta, chip tienda ColorSwatch, NavLink Operador condicional, Ver mi tienda, Burger+Drawer mobile. `src/pages/_app.tsx` (+`import "@mantine/charts/styles.css"` tras core). `package.json` (`@mantine/charts@^7.17.8` + `recharts` `^3.9.0`→`^2.13.3`; `npm install` OK sin `--legacy-peer-deps`, resolvió recharts@2.15.4 — peer-dep satisfecho; el postinstall `prisma generate` falló por EPERM/lock del DLL de los dev servers corriendo, NO afecta charts ni el client ya generado). **Auto-chequeo design.md**: cero hex inline salvo `SOMBRA_PANEL` (token único de elevación, excepción documentada §4/§9); color por token; Tailwind solo layout; motion §7 CSS puro no-`motion`. **frontend-reviewer: APPROVE**, 0 blockers. Fixes aplicados de sus nits: (1) `aria-label` en el NavLink icon-only (Tooltip Mantine es solo visual, no da nombre accesible); (2) design.md §7 corregido (el gateo de reduced-motion es por hook `useMediaQuery`, no `motion-safe:`, porque la transición vive en props/estilos inline del AppShell). **DRIFT pendiente (no aplicado)**: `docs/agents/frontend-conventions.md` no documenta aún el patrón de rail dinámico (AppShell width + localStorage) ni la 2ª excepción cero-hex (`SOMBRA_PANEL`); el reviewer recomienda proponerlo tras validación del usuario ⇒ lo elevo en el reporte de cierre de F03 (no interrumpo mid-run). F02 queda `active`.
- [2026-07-19 10:45] [feature-implementer] F08 (Operador) implementada. TDD N/A (re-layout visual). Archivo: `src/pages/admin/operador.tsx` — `Card withBorder padding="lg" radius="md"`→`PanelCard` (variante padded del Resumen: ya tenía header in-card + tabla sin `pl-6`/`pr-6` ⇒ swap directo). Import de `Card` removido, `PanelCard` importado. Lógica intacta: gate `FORBIDDEN` (4ª rama "No tienes acceso"), suspender/reactivar con `openConfirmModal` color red, loading por-fila, `EstadoTiendaBadge`, conteos num()+tabular-nums, reactivar color="exito". **Auto-chequeo design.md**: cero-hex (tokens: dimmed, exito, red del theme), sin `motion`. **frontend-reviewer: APPROVE** (0 blockers; refuerza la variante padded+header ya existente, sin patrón nuevo).
- [2026-07-19 10:50] [feature-implementer] IMPLEMENTACIÓN COMPLETA del run F04–F08. Las 5 páginas del panel migradas a la gramática «Oscuro + calmo», reviewers verdes (5/5 APPROVE, 0 blockers). Verificación cruzada: cero `<Card>` (componente Mantine) residual en las 5 páginas (solo `PanelCard`/`StatCard`/`SettingCard`). NO corrí la suite completa (rol del feature-tester). NO toqué archivos fuera de las 5 páginas admin (cordón con catálogo-v2 respetado: sin editor/storefront/pagebuilder/_app/design.md, sin git, sin reiniciar dev). **DRIFT acumulado a proponer al user** (Step 4.5 — NO aplicado sin permiso): 2 sub-patrones a consolidar en `docs/agents/frontend-conventions.md` § "Chrome del panel «Oscuro + calmo»" — (1) las 2 variantes de tabla del panel (padded+header sin pl-6 vs edge-to-edge padding=0 con pl-6); (2) el inset borderless anidado (`Paper` sin borde + `bg=default-hover` + radius md, sin sombra), ya con 3 ocurrencias. Presentados en el reporte de cierre con diff + 4 opciones. status → `testing` (listo para revisión visual del user + feature-tester).
- [2026-07-19 10:25] [feature-implementer] F07 (Configuración) implementada. TDD N/A (re-layout visual). Archivo: `src/pages/admin/configuracion.tsx` — `SettingCard` (wrapper compartido de ambas cards) `Card withBorder padding="lg" radius="md"`→`PanelCard` ⇒ migra las 6 superficies (Flow + Tienda × loading/error/data). Caja de estado Flow: `Paper withBorder`→`Paper` inset borderless (`bg=default-hover`, radius md < lg de la card, sin sombra). Import de `Card` removido; `Paper` conservado. Hairlines internos del form (separadores de sección, token `default-border`) conservados: NO son bordes de card. Layout de 2 columnas intacto. Lógica intacta: credencial Flow WRITE-ONLY (form nace en blanco, nunca hidrata secretos, limpia en onSuccess), early-return isError/sin-data antes del form editable, `AssetUploader` inmediato. **Auto-chequeo design.md**: cero-hex (único hex = placeholder "#4f46e5" del input color-de-tenant = dato, no styling, misma exención del swatch §9); tokens; sin `motion`. **frontend-reviewer: APPROVE** (0 blockers; confirmó inset consistente con Sorteo, write-only preservado, y que los hairlines deben quedarse). Nit preexistente fuera del diff (hairlines a mano vs `<Divider>` de sorteo) NO tocado por I6. DRIFT reforzado: el inset borderless ya tiene 3 ocurrencias (Sorteo+Config) — firme candidato a documentar. F07 → `active`.
- [2026-07-19 10:05] [feature-implementer] F06 (Productos) implementada. TDD N/A (re-layout visual). Archivo: `src/pages/admin/productos.tsx` — tabla `Card withBorder padding={0} radius="md"`→`PanelCard padding={0}` (edge-to-edge, `pl-6`/`pr-6` preservados, misma variante headerless de Ventas). Import de `Card` removido, `PanelCard` importado. `Modal` del form intacto. Lógica intacta: modal crear/editar, presigned PUT del PDF, portada diferida, toggle sorteo, badges de estado, guards de UX. **Auto-chequeo design.md**: cero-hex (badges por token), precio clp+tabular-nums, sin `motion`. **frontend-reviewer: APPROVE** (0 blockers; reutiliza la variante edge-to-edge de F04, sin patrón nuevo). Nits preexistentes fuera del diff (paleta de badges de producto, orden interno del modal) NO tocados por I6. F06 → `active`.
- [2026-07-19 09:45] [feature-implementer] F05 (Sorteo) implementada. TDD N/A (re-layout visual). Archivo: `src/pages/admin/sorteo.tsx`. Card del premio y card de participantes → `PanelCard`; la de participantes usa la variante padded del Resumen (header in-card + tabla sin `pl-6`/`pr-6`). Caja del ganador: `Paper withBorder`→`Paper` inset borderless (mismo `bg="var(--mantine-color-default-hover)"`, sin sombra — la sombra es solo para superficies top-level, no anidadas). Skeletons `radius="md"`→`lg`. `Divider` interno del premio preservado (separador estructural, no borde de card). Countdown compartido NO extraído: Sorteo muestra `fechaHora(fechaFin)` estático, no countdown vivo ⇒ el nit diferido no aplica acá. Lógica intacta: `openConfirmModal` irreversible (color red + "no se puede deshacer"), `AssetUploader` del premio, botón Ejecutar con disabled sin participaciones, conteos. **Auto-chequeo design.md**: cero-hex (tokens: default-hover, premio-6), tabular-nums en tickets, sin `motion`. **frontend-reviewer: APPROVE** (0 blockers; confirmó que el inset borderless-con-bg SIN sombra es el tratamiento correcto para anidados, con precedente en `CardSorteo`). Nit aplicado: `mt="sm"`→`mt="md"` en la tabla de participantes (alinea con los 16px del Resumen). NIT diferido → DRIFT acumulado: consolidar en `frontend-conventions.md` el sub-patrón "inset borderless con `bg=default-hover` para contenido anidado en `PanelCard`" (ya 2+ ocurrencias). F05 → `active`.
- [2026-07-19 09:20] [feature-implementer] F04 (Ventas) implementada. TDD N/A (re-layout puramente visual). Archivo: `src/pages/admin/ventas.tsx` — `Card withBorder padding={0} radius="md"`→`PanelCard padding={0}` (radius lg + sombra token, sin borde); import de `Card` removido, `PanelCard` importado. Decisión: tabla edge-to-edge (padding 0 + `pl-6`/`pr-6`) en vez de la variante padded+header del Resumen, porque Ventas no tiene header in-card (el título vive en AdminLayout) y padding lg dejaría whitespace muerto. Lógica intacta (reenvío por-fila, infinite query, "Cargar más"). **Auto-chequeo design.md**: cero-hex (solo tokens), montos tabular-nums+clp, comisión dimmed con `−`, sin `motion`. **frontend-reviewer: APPROVE** (0 blockers; corrección/compliance/naming A, tests B por E2E pendiente del tester). NIT no bloqueante del reviewer → DRIFT acumulado: `frontend-conventions.md` no documenta aún la bifurcación de 2 variantes de tabla del panel (padded+header vs edge-to-edge) — a proponer al cierre del run. F04 → `active`.
- [2026-07-19 09:00] [feature-implementer] RE-INVOCACIÓN. Alcance de este run: F04–F08 (re-layout de las 5 páginas restantes del panel a la gramática «Oscuro + calmo», una feature por página). F01–F03 hechas y verificadas en vivo por el usuario (chrome + Resumen). Read mínimo: task file + panel-card.tsx + admin/index.tsx (patrón canónico) + las 5 páginas + frontend-conventions.md (la subsección "Chrome del panel «Oscuro + calmo»" ya la agregó el usuario ⇒ drift F02/F03 resuelto). Cordón estricto: árbol compartido con catálogo-v2; acotado a las 5 páginas admin + sus insets propios; NO tocar editor/storefront/pagebuilder/_app/design.md; NO git; NO reiniciar dev. Patrón de migración fijado contra el Resumen: `Card withBorder`→`PanelCard` (radius lg default, padding lg default), tablas sin `pl-6`/`pr-6` (la padding de la card provee el borde), `radius="md"`→`lg` en skeletons con forma de card; `Paper withBorder` anidados (caja ganador, estado Flow)→inset borderless con `bg="var(--mantine-color-default-hover)"` (patrón ya establecido por la caja de ganador de sorteo en F0x). TDD N/A por feature (re-layout puramente visual, sin lógica de dominio testeable). F04 → `active`.
- [2026-07-19 00:10] [feature-implementer] F03 implementada (TDD red→green por slices). **Backend**: `src/server/domain/panel/_fechas.ts` (NUEVO — `inicioDiaUTC`/`restarDiasUTC`/`claveDiaUTC`, aritmética UTC sin librería); `getSerieVentasDiaria.ts` (NUEVO — serie 14d PAGADO por día, tenant-scoped I1, suma Decimal→string I2, `ahora` inyectable); `getResumenTienda.ts` (EXTENDIDO — deltas ventas/ingresos actual-14d vs anterior-14d con Decimal, `calcularDelta` null si base 0); `panel.ts` (+procedure `getSerieVentasDiaria`); `formato.ts` (+`diaMes` para eje del gráfico — evita `Intl` inline en la página). **Frontend**: `stat-card.tsx` (→PanelCard, valor mono 1.7rem `ff="monospace"` D9, `Sparkline` opcional D8); `admin/index.tsx` (REESCRITO — saludo "Hola,{nombre}" via session en título + `EstadoTiendaBadge` como action; ChecklistPublicacion preservado full-width; 4 KPIs con delta+sparkline solo ventas/ingresos D8; `BarChart` 14d truco serie-apilada-de-2 para "hoy" amarillo D7; tabla últimas ventas en PanelCard, email igual que hoy I3; card "Tu sorteo" con `Countdown` client-only + tickets D10, fuera-de-alcance comentado I7). **Vitest** (filtrado, NO suite completa): getSerieVentasDiaria 3/3 + getResumenTienda 6/6 = 9/9 verde. **Auto-chequeo design.md**: cero hex (todo token: sorteatelo.6/amarillo.6/vars); ingresos cobalto NO verde §5; montos clp+mono+tabular; motion §7 sin lib `motion` (countdown = setInterval calmo sin segundos §8); Tailwind solo layout. **backend-reviewer: APPROVE** (0 blockers; I1/I2/ventanas sin off-by-one/layering OK). **frontend-reviewer: APPROVE** (0 blockers; tokens/semántica financiera/string-dinero/estados/privacidad/countdown-hydration OK). Nits aplicados: test delta `down` (panel.resumen.006), comentarios (flat-delta convención + asimetría `lt` de ventanas), ícono placeholder → `var(--mantine-primary-color-filled)`. Nits diferidos (no aplicados, anotados): (a) extraer `Countdown` a componente compartido — lo necesitará F05, fuera de este run; (b) `estadoPub` sin rama de error (badge decorativo, impacto bajo). **DRIFT frontend-conventions pendiente** (acumulado F02+F03): patrón rail dinámico + token `SOMBRA_PANEL` (2ª excepción cero-hex) + primer `Countdown` del panel + truco `BarChart` apilado-de-2 — a proponer tras validación del usuario. F03 queda `active`.
