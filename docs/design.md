# Design — sorteatelo

**Línea gráfica de la marca.** Fuente de verdad para TODO artefacto visual: la app y cualquier asset. Los agentes leen este archivo antes de generar algo visual.

> ⚠️ **SEED — la identidad de marca está PENDIENTE, y tras el pivote SaaS (ADR-0005) hay DOS niveles de identidad.** (1) La **marca de la PLATAFORMA** — el nombre base ya está: **«Sortéatelo»**, derivado del dominio `sorteatelo.cl` (decisión #4 resuelta, ADR-0014); estilización, paleta y tipografía siguen pendientes. Ya no es una marca del fandom ARMY: es la marca del SaaS. (2) El **theming per-tenant**: cada Tienda configura logo/colores/textos sobre la plantilla base (F06 del roadmap) — la identidad ARMY vive, si acaso, en la tienda del tenant piloto, no en la plataforma. **No inventar dirección visual de marca.** Resolver en una sesión dedicada (`frontend-design` / `domain-planner`) y volcar acá lo aprobado. Lo que sigue son las reglas **estructurales** que ya fija el stack; las secciones `PENDIENTE` se completan al definir la marca de la plataforma y el sistema de theming.

> **Librería de UI: Mantine 7** (ADR-0011, decisión cerrada 2026-07-17 — reemplaza a shadcn/ui). Tailwind convive acotado a utilities de layout. Reglas duras en `docs/agents/frontend-conventions.md`.

## 1. Esencia de la marca — PENDIENTE

Producto: **plataforma SaaS de tiendas con sorteo** (compradores mayoritariamente mobile → storefront **mobile-first**). Doble audiencia: Organizadores (confianza, claridad para operar y cobrar) y Compradores (la marca que ven es la de la TIENDA, con disclaimer de la plataforma — ADR-0008). Nombre de la plataforma: **Sortéatelo** (dominio `sorteatelo.cl`, ADR-0014; estilización/logotipo pendientes de la sesión de marca; repo: `sorteatelo`, carpeta local histórica: `libros-iselk`). Vive en `src/config/app.ts` (`APP_CONFIG.name`) — la UI lo consume de ahí, nunca hardcodeado. El theming per-tenant (logo/colores/textos de cada Tienda) es **dato, no código**: sale del modelo `Tenant` y se aplica como theme override de Mantine (`mergeThemeOverrides` sobre el theme base, ADR-0011), jamás hardcodeado en componentes.

## 2. Paleta — PENDIENTE

A definir con el cliente. **Hoy rige el theme casi-default de Mantine** como placeholder (`src/styles/theme.ts`, `createTheme`); al cerrar la paleta de marca se vuelca ahí — nada más. Reglas duras que regirán **cualquiera** sea la paleta:

- La paleta vive en el **theme de Mantine** (`src/styles/theme.ts`): tuplas de 10 tonos en `theme.colors` + `primaryColor`. Cambiar la paleta = editar el theme, **nunca** hex inline en componentes ni clases de color Tailwind.
- Los componentes consumen color vía props semánticas de Mantine (`color`, `c`, `bg`, `variant`) o CSS vars `--mantine-color-*` — un color = un token del theme.
- **`red` reservado** para errores / acciones destructivas.
- Definir una semántica clara para los estados de **comercio** (ej. "pagado / vendido" positivo, "pendiente", "fallido") al cerrar la paleta — distinta de la semántica financiera de un banco. Mientras tanto rige el patrón provisorio del `estado-badge`: badge neutro outline + punto de color inline.

## 3. Tipografía — PENDIENTE

Hoy el scaffold trae **Geist** (`next/font`), cableada al theme de Mantine (`theme.fontFamily`). La familia definitiva se decide con la marca. Reglas que regirán:

- Jerarquía por **peso y tamaño**, no por familia.
- **Montos** siempre con `tabular-nums` (cifras de ancho fijo — las columnas de precios no "bailan").

## 4. Espaciado, formas y elevación

- Layout con utilities Tailwind estándar (`gap-4`/`gap-6`, `p-4`/`p-6`); dentro de componentes Mantine, su escala de spacing (`xs…xl`).
- **Mobile-first**: el chrome se aprieta en móvil (gutter `px-4` bajo `lg`, `lg:px-8` en desktop). El público es mayoritariamente mobile.
- Radios: `theme.defaultRadius = "md"` (~0.5rem). No fijar radios por componente salvo decisión registrada.
- Elevación: preferir **bordes sobre sombras** (`Card withBorder`); sombras solo sutiles (`shadow="sm"`) en superficies flotantes (Popover/Menu las traen por defecto).

## 5. Layout y componentes

- Componentes siempre de **Mantine 7** (`@mantine/core` + `form`/`modals`/`notifications`/`hooks`). Ver `docs/agents/frontend-conventions.md` para las reglas duras (theming, formularios, notificaciones, montos).
- **Íconos**: `@tabler/icons-react` es la **única** librería de íconos (navegación, acciones, estados, dominio — y es la que la doc de Mantine usa). Named imports, tree-shakeado.
- Superficies clave: storefront del Comprador (catálogo/carrito/checkout mobile-first, tematizado per-tenant — F06 + plantilla rica), panel de Organizador (`AppShell`: productos, ventas, sorteo, configuración), panel del Operador (F08).

### 5.1 Plantilla oficial del storefront (estructura rica tematizable)

**Fuente de verdad de la estructura del storefront del Comprador.** Es la **única** plantilla que ofrece la Plataforma (CONTEXT § Plantilla). NO es estética fija: es **estructura rica** — un skin neutro-profesional que **cada Tienda tematiza** con su `colorPrimario` (expandido a la escala de 10 tonos de Mantine, `src/styles/tenantTheme.ts`, ADR-0011) y sus [[Asset de marca]] (logo, hero, portadas, premio — bucket público, ADR-0013). Debe verse bien tanto para una tienda de fandom (color saturado + imágenes) como para una sobria (color neutro, pocas imágenes). **Mobile-first REAL** (el público es mayoritariamente mobile): móvil = columna tipo celular; desktop = hero a 2 columnas + grillas anchas. NO builder drag-and-drop (decisión cerrada).

Secciones, en orden — **todas tematizables, todas con degradación elegante** (ver 5.2):

1. **Header sticky.** Logo (imagen del tenant) + nombre de la Tienda; **chip de countdown** al cierre del sorteo (`Raffle.fechaFin`, solo si hay sorteo ACTIVO y la fecha es futura); ícono de carrito con badge de cantidad. En desktop, nav de anclas opcional (Catálogo · Sorteo · Cómo funciona). Es sticky con `backdrop-blur` sutil.
2. **Hero a 2 columnas** (desktop) / apilado (móvil). Izquierda: **eyebrow** ("Sorteo abierto" si hay sorteo), **titular grande** (`heroTitulo`, fallback a `nombre`), **subtítulo** (`heroSubtitulo`, fallback a `descripcion`), **CTA primaria** (baja al catálogo), y una **fila de 3 badges de confianza** (compra segura · entrega al instante · tu ticket al toque — copy FIJO de plataforma, íconos Tabler). Derecha: **imagen de hero** del tenant; si no hay, un **gradiente temático** derivado del `colorPrimario` (nunca un hueco). Este es el slot de "personalidad".
3. **Catálogo rico.** Grid de tarjetas de producto con **portada** (imagen), título, precio (`tabular-nums`, CLP vía `~/lib/formato`), **badge "Sorteo"** si `participaEnSorteo`, y control agregar / stepper de cantidad (reusa `StepperCantidad`). Card sin portada ⇒ **placeholder temático** (gradiente + ícono/inicial). Es un salto grande respecto de las cards texto-only actuales.
4. **Vitrina del sorteo / premio** (solo si hay sorteo ACTIVO). Sección destacada con **imagen del premio**, nombre, premio, fechas, **conteo de participaciones** (tickets, sin correos — privacidad ADR-0004), un "cómo funciona: comprar = participar", y el **disclaimer ADR-0008 visible** (texto fijo de plataforma, obligatorio, NO configurable). Sin imagen de premio ⇒ bloque de gradiente temático.
5. **Cómo funciona (3 pasos).** Copy FIJO de plataforma (comprar → recibir PDF + número → entrar al sorteo). Buena para conversión; no depende de datos del tenant ⇒ siempre presente.
6. **Footer.** Logo/nombre, **redes sociales** (Instagram / TikTok / WhatsApp — URLs configurables, cada ícono **se oculta si su URL está vacía**), enlace a las **Bases del sorteo**, **contacto** (si está), y la **atribución neutral de plataforma + disclaimer de responsabilidad**. ⚠ El nombre de la plataforma ya existe (**Sortéatelo**, ADR-0014), pero si el footer muestra la marca o mantiene la atribución neutral se decide en la sesión de marca: **mientras tanto la atribución sigue neutral, SIN nombre** ("tienda operada de forma independiente… con la tecnología de la plataforma").

Referencias de estructura (NO se copian literal): `tiotito.cl` y las 3 maquetas previas (`tmp/v-dreamy` / `v-concert` / `v-editorial`) — muestran las mismas secciones en tres estéticas; la plantilla oficial es UNA, neutra, que el color/assets del tenant vuelven cualquiera de esas.

### 5.2 Degradación elegante (regla dura de la plantilla)

Todo dato de marca es **opcional**. La plantilla nunca muestra un hueco, un `<img>` roto ni un campo vacío:

| Falta | La plantilla muestra |
|---|---|
| Imagen de hero | Gradiente temático derivado del `colorPrimario` (tonos de la escala) |
| Portada de producto | Placeholder temático (gradiente + ícono/inicial del título) |
| Imagen de premio | Bloque de gradiente temático |
| Logo | Nombre de la Tienda como texto (ya vigente) |
| Red social (IG/TikTok/WhatsApp) vacía | Se oculta ese ícono |
| Contacto vacío | Se oculta la línea |
| Sin sorteo ACTIVO | No aparece la vitrina del sorteo ni el countdown del header |
| `avisoTexto` vacío | No aparece el banner de aviso |
| `heroTitulo` / `heroSubtitulo` vacíos | Fallback a `nombre` / `descripcion` |

El gradiente temático se deriva de la escala de 10 tonos ya generada por `generarEscalaColor` (`tenantTheme.ts`) — mismo color de marca, cero hex inline (§9).

## 6. Data-viz

- El panel tendrá métricas simples (ventas, ingresos). Cuando lleguen charts, el default es **`@mantine/charts`** (construido sobre Recharts, ya instalado): hereda los colores del theme. Mantener la restricción: **nunca más de 5 series**; grid lines sutiles; tooltips discretos. Paleta de charts a derivar de la paleta de marca (§2).

## 7. Motion

Identidad de movimiento por defecto: **preciso y calmado** — nada rebota, nada gira (ajustable al cerrar la marca; el fandom podría pedir más energía). Las transiciones default de Mantine (fades/pops de Modal, Menu, Tooltip) ya cumplen esta identidad — no customizarlas sin decisión registrada.

| Token | Valor | Uso |
|---|---|---|
| `duration-fast` | 150ms | Hover, focus, toggles |
| `duration-base` | 250ms | Transiciones de UI, fades, dropdowns |
| `duration-slow` | 400ms | Entradas de cards/secciones |

- Respetar `prefers-reduced-motion` globalmente (Mantine lo respeta con `theme.respectReducedMotion: true` — dejarlo activado).
- Anti-patrón (default): springs exagerados, parallax, zooms dramáticos. Revisar al definir la marca.

## 8. Voz y tono

- **Español neutro**: "tienes", "puedes", "elige" (no voseo). UI con strings hardcodeados (sin i18n).
- Tono cercano al fandom sin sacrificar la confianza necesaria para pagar. Afinar al cerrar la marca.
- **Montos**: siempre `Intl.NumberFormat` (CLP) vía `~/lib/formato` — nunca concatenar `$` a mano.

## 9. Reglas duras y anti-patrones

- Cambios de paleta **solo** en el theme de Mantine (`src/styles/theme.ts`) — nunca hex inline en componentes.
- Tailwind **solo para layout** (flex/grid/gap/spacing/responsive); **prohibidas** las clases de color, tipografía y sombra de Tailwind (`bg-blue-900`, `text-zinc-500`…) — eso es territorio del theme de Mantine.
- Color dinámico (el color elegido por un tenant) vía theme override / `style={{}}` desde datos — no interpolar clases (`bg-${x}` no sobrevive el purge de Tailwind).
- `color="red"` reservado para errores / acciones destructivas.
- Dark mode: vía `colorScheme` de Mantine (decidir si hay toggle al definir la marca; hoy `defaultColorScheme="light"`).
- No introducir colores fuera del theme sin actualizar primero este archivo con aprobación del usuario.

## Decisiones pendientes

- [ ] **Identidad de marca**: nombre, paleta, tipografía (sesión `frontend-design` — ligado a `docs/decisiones-abiertas.md`).
- [ ] Semántica de color para estados de comercio (pagado / pendiente / fallido).
- [ ] Toggle de dark mode en la UI.
- [x] Diseño de la plantilla base del storefront + qué campos del `Tenant` alimentan el theme override (F06 + plantilla rica) — resuelto en §5.1/§5.2 (estructura oficial de 7 secciones, tematizable per-tenant, con degradación elegante) y ADR-0013 (assets públicos de marca). Ver `tasks/26-07-17-plantilla-rica.md`.
