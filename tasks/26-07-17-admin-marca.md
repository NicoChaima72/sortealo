---
slug: admin-marca
status: implementing
owner: nicolas
created: 2026-07-17
related_adrs: [ADR-0005, ADR-0011, ADR-0013, ADR-0014]
related_context: [Tienda, Organizador, Operador, Plantilla]

features:
  - id: F01
    behavior: "La identidad de plataforma Sortéatelo existe en código: APP_CONFIG en src/config/app.ts, paleta y tipografía de la ruta elegida volcadas SOLO en theme.ts, y wordmark tipográfico reutilizable"
    state: not_started

  - id: F02
    behavior: "Los estados de comercio (orden: pagado/pendiente/fallido; tienda: alta/configuración/publicada/suspendida) se pintan con tokens semánticos del theme — cero hex inline en componentes"
    state: not_started

  - id: F03
    behavior: "Chrome del admin invertido: wordmark Sortéatelo arriba del navbar, tienda demotada a chip con swatch de su color, menú de cuenta con avatar arriba a la derecha y 'Ver mi tienda' persistente"
    state: not_started

  - id: F04
    behavior: "PageHeader propio dentro del contenido de cada página (título/descripción/acciones), con el AppShell.Header liviano de plataforma"
    state: not_started

  - id: F05
    behavior: "Arreglos de mayor impacto en páginas admin: login con marca, empty states con ícono+CTA, favicon/OG de plataforma, títulos de pestaña desde APP_CONFIG"
    state: not_started

  - id: F06
    behavior: "docs/design.md deja de decir PENDIENTE: paleta, tipografía, semántica de comercio y seam de theming (D13) quedan documentados como línea gráfica de plataforma"
    state: not_started

  - id: F07
    behavior: "(opcional, recortable) Spotlight Cmd+K de navegación del panel + toggle de dark mode"
    state: not_started
---

# Rediseño del panel admin + identidad de marca de la plataforma (carril B)

## Contexto

La marca de la plataforma **Sortéatelo** existe como nombre (ADR-0014) pero no como identidad visual: `docs/design.md` tiene la paleta/tipografía en estado PENDIENTE, `src/styles/theme.ts` es un theme casi-default de Mantine, el nombre no vive en ninguna config (`src/config/app.ts` no existe), el login es una página "throwaway sin marca", y los badges de estado (`estado-badge.tsx`, `estado-tienda-badge.tsx`) usan hex inline como excepción documentada "hasta cerrar la paleta". Además el chrome del admin tiene la jerarquía invertida respecto de un SaaS multi-tenant: el navbar corona con el nombre de la TIENDA (como si la tienda fuera la app) y no existe marca de plataforma, menú de cuenta ni acceso persistente al storefront propio.

Este plan es el **carril B** del pivote page-builder (síntesis en `.scratch/page-builder/investigacion-builder-profesional.md`): rediseñar el chrome del admin con Mantine 7 y cerrar la identidad de marca de la plataforma. **Este plan ES la sesión de decisión de marca que design.md exige**: presenta las 3 rutas de la investigación para que el usuario elija (pregunta bloqueante D1); todo lo demás está decidido acá como REVISABLE. El carril A (page builder del storefront) lo planifica otro agente en paralelo — este plan NO toca `src/components/storefront/`, el schema de página ni el MCP.

## Decisiones

- **D1 — Ruta de marca (BLOQUEANTE — decide el usuario, pregunta abierta en AWAITING APPROVAL)**: las 3 rutas de la investigación:
  - **A · Confeti** (festivo-fandom): fucsia `#E11D63` + violeta `#7C3AED` + dorado `#FBBF24`; Bricolage Grotesque / Inter. Máxima energía; el fucsia compite con los colores de tenant.
  - **B · Herramienta** (premium-restraint): índigo `#4338CA` + zinc neutro; Geist. Confiable pero indistinguible de otro SaaS.
  - **C · Confeti Pro** *(recomendada por la investigación y por este plan)*: primario **violeta `#7C3AED`**, semántica dorado `#F59E0B` (premio) / verde `#16A34A` (pagado) / ámbar `#D97706` (pendiente) / rojo `#DC2626` (solo error); Sora o Bricolage Grotesque para headings, Inter o Geist para body. Celebra sin pelear con el `colorPrimario` de cada tienda — clave por el seam de theming (D13 de la investigación).
  El resto del plan está redactado condicional: donde dice "paleta elegida" se instancia la ruta que el usuario elija. Razón de recomendar C: memorable y festiva sin colisionar con el theming per-tenant, y su semántica de comercio cierra de paso la deuda de los hex inline (que HOY ya usan exactamente esos valores: `#16a34a`/`#d97706`/`#dc2626`).
- **D2 — Seam de theming (D13 de la investigación, se documenta en design.md)**: el admin monta **siempre** el theme base de plataforma; el override del tenant se arma solo en el path del storefront. `_app.tsx` ya cumple (el panel no setea `tenantBranding`) — el trabajo acá es DOCUMENTARLO como regla y respetarlo. El `colorPrimario` del tenant aparece en el admin únicamente como **dato puntual** (el swatch del chip de tienda, `style={{ background }}` desde datos — patrón permitido por frontend-conventions para color dinámico), jamás como theme. REVISABLE.
- **D3 — La paleta vive SOLO en `src/styles/theme.ts`**: tupla de 10 tonos **estática y hand-tuneada** en `theme.colors` (clave `sorteatelo`) + `primaryColor: "sorteatelo"` + las tuplas semánticas que la ruta requiera. No se reusa `generarEscalaColor` de `tenantTheme.ts` para la marca propia (esa función es para el dato del tenant en runtime; la marca de plataforma es código estático y merece tonos ajustados a mano — se puede usar su salida como punto de partida). REVISABLE.
- **D4 — Tipografía (si gana C)**: **Sora** para headings (`theme.headings.fontFamily`, vía `next/font/google`) + **Geist** para body (ya instalada — cero dependencia nueva de body font). Si gana A: Bricolage Grotesque headings + Geist body. Si gana B: Geist para todo. REVISABLE.
- **D5 — Semántica de color de comercio como fuente única en el theme**: un mapa exportado desde `theme.ts` (p. ej. `ESTADO_ORDEN_COLOR` / `ESTADO_TIENDA_COLOR`: estado → token de color del theme, resuelto en componentes vía CSS var `--mantine-color-<token>-*` o prop `color`). `estado-badge.tsx` y `estado-tienda-badge.tsx` se refactorizan para consumir ese mapa y se **elimina la excepción de hex inline** (y sus comentarios de excepción). `red` queda reservado a error/destructivo; "pendiente" usa ámbar, no rojo. REVISABLE (el shape exacto del mapa lo afina el implementer).
- **D6 — Chrome invertido del admin (REVISABLE)**: en `admin-layout.tsx`:
  - Navbar corona con el **wordmark Sortéatelo** (componente `Wordmark`: texto en la font de headings, peso fuerte, con ícono/isotipo provisional Tabler `IconTicket` en `ThemeIcon` del primario — NO se dibuja logo custom en este plan).
  - La tienda baja a un **chip** (nombre + swatch circular con su `colorPrimario`, fallback a gris si `null`) debajo del wordmark o al pie del navbar.
  - **Menú de cuenta** con `Avatar` (imagen de la sesión NextAuth, fallback iniciales) en el `AppShell.Header` arriba a la derecha: nombre/email, badge "Operador de plataforma" si aplica, y "Cerrar sesión" (sale del navbar).
  - **"Ver mi tienda"** persistente en el header (link a `<slug>.<host>` con `target="_blank"` — extraer a helper la construcción de URL que hoy vive inline en `checklist-publicacion.tsx`), visible solo si hay tienda.
- **D7 — `getAccesoActual` suma `colorPrimario` al select de tenants** (backend, cambio mínimo): el chip necesita el swatch y el slug ya viene. Modifica `src/server/domain/panel/getAccesoActual.ts` + su test existente. REVISABLE.
- **D8 — PageHeader propio (REVISABLE)**: componente `PageHeader` (título h1, descripción, `actions`) renderizado al tope del contenido (`AppShell.Main`), reemplazando el título/descripción que hoy van dentro del `AppShell.Header`. El header del shell queda liviano: burger (mobile), "Ver mi tienda", menú de cuenta. `AdminLayout` mantiene su API (`title`/`description`/`actions`) para no tocar las 6 páginas más que lo necesario.
- **D9 — Arreglos de páginas seleccionados (REVISABLE, en orden de impacto)**:
  1. **Login con marca**: wordmark + Card centrada + fondo sutil del primario; deja de ser "throwaway sin marca".
  2. **Componente `EmptyState` reutilizable** (ícono Tabler + mensaje + CTA opcional) y aplicarlo donde hoy hay texto plano: tabla de últimas ventas del dashboard ("Todavía no hay ventas" → CTA "Ver mi tienda"/"Crear producto"), tabla de ventas, participantes del sorteo, tiendas del operador.
  3. **Favicon + OG de plataforma**: favicon SVG/ICO (inicial "S" sobre el primario) + `og:image` estática de plataforma para apex/login/panel (NO per-tenant — eso es carril A/roadmap). Meta description del panel desde APP_CONFIG.
  4. **Títulos de pestaña**: `"<página> · <APP_CONFIG.name>"` en el panel (hoy `· Panel`/nombre de tienda) y en login.
  5. **StatCard**: acento del ícono ya usa `--mantine-primary-color-filled` — hereda la paleta sola; revisar el comentario "casi-default" y el contraste con la paleta nueva.
  6. **Toques de consistencia**: reemplazos puntuales de bordes/fondos `style={{}}` repetidos en `sorteo.tsx` por `Card`/`Divider`/props Mantine donde sea trivial (sin rediseñar la página).
- **D10 — Spotlight Cmd+K + dark toggle van al final y son recortables (F07)**: agregan `@mantine/spotlight` (misma major 7) y el toggle vía `useMantineColorScheme`. Si el usuario prefiere MVP mínimo, se recorta F07 completo sin afectar el resto. El dark mode exige que F01 defina la paleta también legible en dark (las tuplas de 10 tonos de Mantine ya lo dan casi gratis). REVISABLE.
- **D11 — Orden de implementación**: F01 → F02 → F03 → F04 → F05 → F06 → F07. F01 desbloquea todo (tokens); F06 se escribe al final para documentar lo realmente construido.

## Plan

1. **Config e identidad base** (F01): crear `src/config/app.ts` con `APP_CONFIG` (`name: "Sortéatelo"`, `tagline`, `dominio: "sorteatelo.cl"`); volcar en `src/styles/theme.ts` la paleta de la ruta elegida (tupla `sorteatelo` + `primaryColor` + tuplas/mapa semántico D5) y la tipografía D4; crear `src/components/marca/wordmark.tsx`. Nada de hex fuera del theme.
2. **Semántica de comercio** (F02): refactor de `estado-badge.tsx` y `estado-tienda-badge.tsx` al mapa semántico del theme; borrar los comentarios de excepción de hex inline.
3. **Backend mínimo** (F03): `getAccesoActual` devuelve `colorPrimario` en cada tenant (D7) + actualizar su test Vitest existente.
4. **Chrome del admin** (F03): invertir el navbar (wordmark arriba, chip de tienda con swatch), menú de cuenta con avatar en el header, "Ver mi tienda" persistente (helper de URL extraído de `checklist-publicacion.tsx`).
5. **PageHeader** (F04): componente propio en el contenido; `AppShell.Header` liviano; verificación de las 6 páginas admin con la nueva jerarquía.
6. **Páginas** (F05): login con marca; `EmptyState` reutilizable aplicado a los 4 vacíos listados en D9.2; favicon/OG/meta de plataforma; títulos de pestaña con APP_CONFIG; toques D9.5–D9.6.
7. **Docs** (F06): actualizar `docs/design.md` (§1 esencia, §2 paleta, §3 tipografía, semántica de comercio, seam de theming D13 como regla explícita, checklist de "Decisiones pendientes") y la nota de `frontend-conventions.md` sobre `APP_CONFIG` ("cuando se cree" → creado). Redactado según la ruta elegida.
8. **(Opcional)** Spotlight Cmd+K con las 5–6 rutas del panel + dark toggle en el menú de cuenta (F07). Recortable.

## Validaciones

### F01 — Identidad en código (config + theme + wordmark)

**Vitest** (integration):
- [ ] `APP_CONFIG` expone nombre/tagline/dominio y es importable desde cliente (sin dependencias de `~/server`)
- [ ] El theme define la tupla `sorteatelo` (10 tonos) y `primaryColor` apunta a ella
- [ ] El mapa semántico de estados cubre TODOS los estados de `EstadoOrden` y `EstadoTienda` (exhaustividad)

**E2E** (browser):
- [ ] El panel se ve con la paleta elegida (botones/acentos primarios ya no son el azul default de Mantine) y los headings usan la font de la marca

### F02 — Semántica de color de comercio sin hex inline

**Vitest**:
- [ ] Los badges resuelven cada estado al token semántico esperado (pagado→verde, pendiente→ámbar, fallido→rojo; publicada→verde, suspendida→rojo, etc.)

**E2E**:
- [ ] En `/admin/ventas` y `/admin/operador` los badges de estado se pintan con la semántica nueva y no queda ningún hex inline en `src/components/admin/estado-*.tsx` (verificación por grep + visual)

### F03 — Chrome invertido (wordmark, chip, cuenta, Ver mi tienda)

**Vitest**:
- [ ] `getAccesoActual` incluye `colorPrimario` (con valor y con `null`) en los tenants devueltos

**E2E**:
- [ ] El navbar muestra el wordmark Sortéatelo arriba y la tienda como chip con swatch; el menú de avatar abre con email/rol y permite cerrar sesión; "Ver mi tienda" abre `<slug>.<host>` en pestaña nueva
- [ ] Un Operador sin tienda propia NO ve el chip ni "Ver mi tienda" y el resto del chrome no se rompe

### F04 — PageHeader propio

**Vitest**:
- [ ] (no aplica — componente presentacional; lo cubre E2E)

**E2E**:
- [ ] Las 6 páginas del admin muestran título/descripción/acciones dentro del contenido (no en la barra superior) sin solaparse con el header liviano, en mobile y desktop

### F05 — Arreglos de páginas

**Vitest**:
- [ ] (no aplica — cambios presentacionales; lo cubre E2E)

**E2E**:
- [ ] `/login` muestra el wordmark y la marca de plataforma (ya no la página cruda)
- [ ] Los estados vacíos (dashboard sin ventas, ventas, participantes, operador) muestran ícono + mensaje + CTA cuando corresponde
- [ ] La pestaña del navegador muestra `<página> · Sortéatelo` y el favicon de plataforma

### F06 — design.md actualizado

**Vitest**:
- [ ] (no aplica — docs)

**E2E**:
- [ ] (no aplica — docs; revisión humana: §2/§3 sin "PENDIENTE", seam de theming documentado, checklist final actualizado)

### F07 — Spotlight + dark toggle (opcional)

**Vitest**:
- [ ] (no aplica — presentacional)

**E2E**:
- [ ] Cmd+K abre el Spotlight y navega a cada página del panel; el toggle de dark mode conmuta y el chrome sigue legible

## Invariantes

- I1: **NO tocar** `src/components/storefront/`, el schema de página, `src/styles/tenantTheme.ts` (más allá de leerlo) ni nada del MCP — es territorio del carril A.
- I2: La paleta vive **solo** en `src/styles/theme.ts`. Cero hex inline en componentes, cero clases de color Tailwind (frontend-conventions / design.md §9). El único color-desde-dato permitido en el admin es el swatch del chip (D2).
- I3: El admin monta **siempre** el theme base de plataforma — jamás el override del tenant (seam D13). `_app.tsx` no cambia su lógica de merge.
- I4: El nombre de la plataforma se consume **siempre** desde `APP_CONFIG` — nunca literal "Sortéatelo" en JSX/títulos (frontend-conventions § Idioma).
- I5: `color="red"` reservado para errores/destructivo; "pendiente" NUNCA en rojo.
- I6: No introducir librerías nuevas fuera de: la font elegida vía `next/font/google` y (solo si F07 se aprueba) `@mantine/spotlight` major 7.
- I7: Los cambios de backend se limitan al select de `getAccesoActual` (D7) — nada de lógica nueva de autorización ni de tenancy.
- I8: Si la ruta elegida difiere de C, los valores concretos de D3/D4/D5 se instancian según esa ruta ANTES de implementar F01 — el implementer no inventa paleta.

## Out of scope

- Todo el carril A: page builder, widgets, MCP, CSP, sesión wildcard, banner "Editar mi tienda".
- Logo/isotipo dibujado de Sortéatelo (se usa wordmark tipográfico + ícono Tabler provisional; un logo real es encargo de diseño futuro).
- Favicon/OG/SEO **per-tenant** del storefront (es "profesionalismo invisible" del carril A / roadmap).
- Atribución con nombre de plataforma en el **footer del storefront** (archivo de storefront → carril A; la decisión de mostrar "Sortéatelo" ahí queda registrada como pendiente en design.md).
- Rediseño profundo de `productos.tsx`/`configuracion.tsx` (formularios): solo heredan theme, PageHeader y empty states.
- Presets de página, "2–3 presets desde la plantilla semilla" (Fase 2-B de la investigación — depende del carril A).
- Marca de agua (decisión abierta #6) y cualquier decisión de `docs/decisiones-abiertas.md`.

## Especialistas a consultar

- `frontend-reviewer` — tras F03/F04 (chrome nuevo) y F05 (páginas): convenciones Mantine, estados de pantalla, jerarquía.
- `backend-reviewer` — el tweak de `getAccesoActual` (D7).
- `change-set-reviewer` — al cierre, con la lista de archivos de la sesión + este plan.
- `feature-tester` — E2E browser (el grueso de las validaciones es visual); agregar los checks nuevos a `tasks/e2e-panel-organizadores.md`.

## Bitácora

- [2026-07-17 18:05] [planner-grill] Arranco carril B (admin + marca). Insumo leído: `.scratch/page-builder/investigacion-builder-profesional.md` (§2 D13, §4 fases B, §5 rutas de marca). Contexto cargado: `docs/design.md` (marca PENDIENTE, este plan es la sesión de decisión), `frontend-conventions.md`, `theme.ts` (casi-default), `_app.tsx` (merge per-tenant ya respeta el seam), `admin-layout.tsx` (navbar corona con la tienda, sin marca de plataforma ni menú de cuenta), `estado-badge.tsx`/`estado-tienda-badge.tsx` (hex inline `#16a34a`/`#d97706`/`#dc2626` — coinciden con la semántica de la ruta C), páginas admin (index/ventas/sorteo/operador/login), `getAccesoActual` (devuelve slug pero no colorPrimario), `tasks/e2e-panel-organizadores.md` y suite Vitest del área (`getAccesoActual.test.ts` a modificar).
- [2026-07-17 18:05] [planner-grill] Directiva del orquestador: una sola pregunta bloqueante (ruta de marca A/B/C — la elección es del usuario per design.md), todo lo demás decidido por el planner como REVISABLE. NO tocar `tasks/INDEX.md` (lo registra la sesión principal). Plan escrito condicional a la ruta.
- [2026-07-17 18:10] [planner-grill] Q1 (BLOQUEANTE): ¿Ruta de marca A (Confeti fucsia), B (Herramienta índigo) o C (Confeti Pro violeta)? Recomendada: **C** — violeta #7C3AED no compite con el color de cada tienda (seam D13) y su semántica verde/ámbar/rojo cierra la deuda de hex inline. AWAITING USER APPROVAL del plan + esta elección.
- [2026-07-17 19:20] [orquestador] **VISTO BUENO del usuario al plan + D1 resuelta: RUTA C · Confeti Pro** (violeta #7C3AED primario; semántica dorado #F59E0B premio / verde #16A34A pagado / ámbar #D97706 pendiente / rojo #DC2626 solo error; Sora headings + Geist body). F07 (Spotlight+dark) APROBADO también — contrato nocturno, se implementa al final y se recorta solo si bloquea. status → implementing.
