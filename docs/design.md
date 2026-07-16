# Design — libros-iselk

**Línea gráfica de la marca.** Fuente de verdad para TODO artefacto visual: la app y cualquier asset. Los agentes leen este archivo antes de generar algo visual.

> ⚠️ **SEED — la identidad de marca está PENDIENTE, y tras el pivote SaaS (ADR-0005) hay DOS niveles de identidad.** (1) La **marca de la PLATAFORMA** (nombre, paleta, tipografía — pendientes; ya no es una marca del fandom ARMY: es la marca del SaaS, ligada a la decisión de dominio #4). (2) El **theming per-tenant**: cada Tienda configura logo/colores/textos sobre la plantilla base (F06 del roadmap) — la identidad ARMY vive, si acaso, en la tienda del tenant piloto, no en la plataforma. **No inventar dirección visual de marca.** Resolver en una sesión dedicada (`frontend-design` / `domain-planner`) y volcar acá lo aprobado. Lo que sigue son las reglas **estructurales** que ya fija el stack; las secciones `PENDIENTE` se completan al definir la marca de la plataforma y el sistema de theming.

## 1. Esencia de la marca — PENDIENTE

Producto: **plataforma SaaS de tiendas con sorteo** (compradores mayoritariamente mobile → storefront **mobile-first**). Doble audiencia: Organizadores (confianza, claridad para operar y cobrar) y Compradores (la marca que ven es la de la TIENDA, con disclaimer de la plataforma — ADR-0008). Nombre de la plataforma: pendiente (codename del repo: `libros-iselk`). Cuando se decida, vive en `src/config/app.ts` (`APP_CONFIG.name`) — la UI lo consume de ahí, nunca hardcodeado. El theming per-tenant (logo/colores/textos de cada Tienda) es **dato, no código**: sale del modelo `Tenant`, jamás hardcodeado en componentes.

## 2. Paleta — PENDIENTE

A definir con el cliente. **Hoy está instalada la base `zinc` neutra de shadcn como placeholder** (valores HSL en `src/styles/globals.css`); al cerrar la paleta de marca se reemplazan esos valores ahí — nada más. Reglas duras que regirán **cualquiera** sea la paleta:

- Implementada como **canales HSL crudos** en `src/styles/globals.css`, mapeada a tokens shadcn (`tailwind.config.ts` los envuelve en `hsl(var(--…))`). **OJO**: van en **HSL**, NO oklch — el proyecto es Tailwind v3. El init de shadcn puede generar oklch (formato v4); si se re-corre, convertir a HSL o los colores no renderizan.
- Un color = una variable. Cambiar la paleta = editar `globals.css`, **nunca** hex inline en componentes.
- `destructive` reservado para errores / acciones destructivas.
- Definir una semántica clara para los estados de **comercio** (ej. "pagado / vendido" positivo, "pendiente", "fallido") al cerrar la paleta — distinta de la semántica financiera de un banco.

## 3. Tipografía — PENDIENTE

Hoy el scaffold trae **Geist** (`next/font`). La familia definitiva se decide con la marca. Reglas que regirán:

- Jerarquía por **peso y tamaño**, no por familia.
- **Montos** siempre con `tabular-nums` (cifras de ancho fijo — las columnas de precios no "bailan").

## 4. Espaciado, formas y elevación

- Escala de espaciado Tailwind estándar; padding de cards `p-4`/`p-6`, ritmo `gap-4`/`gap-6`.
- **Mobile-first**: el chrome se aprieta en móvil (gutter `px-4` bajo `lg`, `lg:px-8` en desktop). El público es mayoritariamente mobile.
- Radios: `--radius: 0.5rem` (`rounded-lg` cards, `rounded-md` controles).
- Elevación: preferir **bordes sobre sombras**; sombras solo sutiles (`shadow-sm`) en superficies flotantes.

## 5. Layout y componentes

- Componentes siempre de **shadcn/ui** (`~/components/ui/`, estilo new-york, base zinc neutra, CSS variables). Ver `docs/agents/frontend-conventions.md` para las reglas duras (`cn()`, no editar `ui/`, no interpolar clases dinámicas…).
- **Íconos**: `@tabler/icons-react` es la librería de la app (navegación, acciones, estados, dominio); `lucide-react` queda **solo** para lo que shadcn usa internamente. Named imports, tree-shakeado.
- Superficies clave del MVP: catálogo (grid de cards de [[Libro]]), detalle de libro, carrito, checkout (mobile-first), panel admin (subir libros, ventas, sorteo, Hermes).

## 6. Data-viz

- El panel admin tendrá métricas simples (ventas, ingresos). Mantener la restricción: **nunca más de 5 series**; grid lines sutiles; tooltips sobre `popover`. Paleta de charts a derivar de la paleta de marca (§2).

## 7. Motion

Identidad de movimiento por defecto: **preciso y calmado** — nada rebota, nada gira (ajustable al cerrar la marca; el fandom podría pedir más energía).

| Token | Valor | Uso |
|---|---|---|
| `duration-fast` | 150ms | Hover, focus, toggles |
| `duration-base` | 250ms | Transiciones de UI, fades, dropdowns |
| `duration-slow` | 400ms | Entradas de cards/secciones |

- Respetar `prefers-reduced-motion` globalmente.
- Anti-patrón (default): springs exagerados, parallax, zooms dramáticos. Revisar al definir la marca.

## 8. Voz y tono

- **Español neutro**: "tienes", "puedes", "elige" (no voseo). UI con strings hardcodeados (sin i18n).
- Tono cercano al fandom sin sacrificar la confianza necesaria para pagar. Afinar al cerrar la marca.
- **Montos**: siempre `Intl.NumberFormat` (CLP) — nunca concatenar `$` a mano.

## 9. Reglas duras y anti-patrones

- Cambios de paleta **solo** en `globals.css` — nunca hex inline en componentes.
- Usar tokens semánticos (`bg-primary`, `text-muted-foreground`, `border-border`…), no colores Tailwind crudos (`bg-blue-900`).
- No interpolar clases Tailwind dinámicas (`bg-${x}` no sobrevive el purge) — color dinámico vía `style={{}}` o variantes CVA.
- Dark mode vía clase `dark` (decidir si hay toggle al definir la marca).
- No introducir colores fuera de la paleta sin actualizar primero este archivo con aprobación del usuario.

## Decisiones pendientes

- [ ] **Identidad de marca**: nombre, paleta, tipografía (sesión `frontend-design` — ligado a `docs/decisiones-abiertas.md`).
- [ ] Semántica de color para estados de comercio (pagado / pendiente / fallido).
- [ ] Toggle de dark mode en la UI.
