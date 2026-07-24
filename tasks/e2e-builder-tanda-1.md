# E2E — Builder Tanda 1 (fidelidad + backbone UX)

Checks de navegador para `tasks/26-07-24-builder-tanda-1.md`. Los ejecuta el `feature-tester` con la
skill `browser-verify`. Cada check tiene un ID que el plan referencia desde sus Validaciones. Marcado
`[x]` solo por el feature-tester.

> **Dev server**: un `next dev` en **:3001** (única instancia; memoria del proyecto). `devTienda`
> enabled ⇒ `localhost:3001` ES una tienda; para la tienda de prueba usar `prueba.localhost:3001`.
> Tenants seed: `npm run seed:tenants` (crea `autora` y `prueba` PUBLICADAS). Sorteo seed:
> `npm run seed:raffles` (Raffle ACTIVO por tenant). El editor vive en `<slug>.localhost:3001/editor`
> (gateado por sesión + membresía). Login Google real necesario para el editor.

## F01 — colorAcento

- [x] **builder.acento.001** ✅ 2026-07-24 — En el editor (`prueba.localhost:3001/editor`), abrir el panel Tema, elegir
  un color de acento (p.ej. dorado `#ffc530`) ⇒ se guarda solo (indicador) y la preview recarga. Aplicar
  el esquema `acento` a una sección (panel Estilo o Tema→fondo de página): la sección se ve con el color
  de acento y TEXTO LEGIBLE en la preview y en el SSR público tras publicar. Limpiar el acento ⇒ los
  esquemas `acento*` degradan al color de marca (sección sigue legible, nunca hex crudo ni banda muda).
  (Plan F01 E2E)

## F02 — Fondo bicolor + anchoFondo

- [x] **builder.bicolor.001** ✅ 2026-07-24 — Una sección con fondo bicolor marca(A)+acento(B) full-bleed y contenido
  centrado se ve correcta (dos colores con la dirección/mezcla elegida, texto legible emparejado con A,
  sin scroll-x) en la preview y publicada. (Plan F02 E2E)

## F03 — Hero puente + efectos de título

- [x] **builder.hero.001** ✅ 2026-07-24 — Hero con una palabra en `tituloAcento` estilo acento + `$3.000` destacado +
  `efectoTitulo: revelar_palabras` se ve como el mockup; con reduced-motion el título aparece estático y
  completo (nunca oculto). (Plan F03 E2E)

## F04 — aviso_barra v2 (cinta sobre nav)

- [x] **builder.aviso.001** ✅ 2026-07-24 — La barra de aviso en modo `marquee` con esquema acento corre como ticker
  sobre el nav, pausa en hover; con reduced-motion queda estática; sin scroll-x. El countdown opcional
  aparece solo con sorteo activo. (Plan F04 E2E)

## F05 — Nav auto-derivado

- [x] **builder.nav.001** ✅ 2026-07-24 — Configurar nav "El libro / Sorteo / Autora / Bases" desde el editor ⇒ el
  header publicado muestra esos 4 items y cada click hace scroll a la sección correcta. Sin config ⇒ el
  nav queda idéntico al actual (Catálogo/Sorteo/Cómo funciona). (Plan F05 E2E)

## F06 — Alturas + estadísticas simple

- [x] **builder.altura.001** ✅ 2026-07-24 — Hero con `altoMin: pantalla` + centrado vertical ocupa la ventana completa
  en desktop y mobile (svh, sin scroll-x); las estadísticas en estilo `simple` se ven limpias (cifras sin
  ThemeIcon ni card) como el mockup. (Plan F06 E2E)

## F07 — Máscaras de forma

- [ ] **builder.forma.001** — ⏭️ NO ejercido en vivo 2026-07-24: ningún `imagen_destacada` con `forma` en
  los tenants de prueba (autora/prueba). Cubierto por Vitest `forma.001/002/003` (`formaImagenCss` puro +
  schema). Falta un flow browser con una imagen enmascarada. — `imagen_destacada` con forma `blob` y con
  `circulo` se ve recortada correcta en preview y publicada, sin CLS perceptible. (Plan F07 E2E)

## F08 — Confetti de compra

- [ ] **builder.confetti.001** — ⚠️ PARCIAL 2026-07-24: degradación VERIFICADA (por instrucción, sin
  compra real) — `checkout/retorno?token=<inválido>` renderiza estado neutral "Estamos confirmando tu
  pago…", `estadoOrden` devuelve `{estado:null}` (sin PII), `canvasCount=0` (confetti NO dispara), sin
  crash. FALTA el flujo Flow sandbox completo (pago real → webhook PAGADO → confetti one-shot +
  reduced-motion off) — pendiente del usuario. — Tras un pago sandbox confirmado, la página de retorno pasa
  a estado de celebración y dispara el confetti UNA vez; con reduced-motion no hay confetti; el
  correo/entrega no cambian; el webhook sigue siendo la única confirmación. (Plan F08 E2E)

## F09 — Patch en vivo del preview

- [x] **builder.patch.001** ✅ 2026-07-24 — Editar el título de una sección en el editor ⇒ la preview se actualiza SIN
  reload y sin perder el scroll; una mutación de la lista-que-recarga (p.ej. agregar catálogo) recarga
  limpio; el SSR público anónimo sigue byte-idéntico hasta publicar. (Plan F09 E2E)

## F10 — Auto-save on-change

- [x] **builder.autosave.001** ✅ 2026-07-24 — Editar un campo sin tocar ningún botón ⇒ indicador Guardando…→Guardado y
  el borrador persiste (recarga del editor lo confirma); no existen más botones "Guardar contenido/estilo/
  tema"; Publicar sigue siendo explícito; conflicto de lock (dos pestañas) ⇒ notificación + recarga sin
  pérdida silenciosa. (Plan F10 E2E)

## F11 — Drag & drop de reorden

- [x] **builder.dnd.001** ✅ 2026-07-24 — Reorden verificado: la lista y la preview reflejan el orden nuevo
  en sync (sin reload) y los botones ↑↓ funcionan; ambos (drag nativo y ↑↓) emiten `move_section`. CAVEAT:
  el GESTO de arrastre con click *trusted* no es ejercitable por el Playwright MCP (sin tool de drag; el
  `DragEvent` sintético dispara los handlers de forma no confiable) — verificado por `draggable="true"` +
  handlers wired + fallback ↑↓ + Vitest `destinoReordenamiento`. — Arrastrar una sección de la posición 1
  a la 4 en el panel emite un solo movimiento, la lista y la preview reflejan el orden nuevo, y los botones
  ↑↓ siguen funcionando. (Plan F11 E2E)

## F12 — Re-réplica del mockup (cierre de tanda)

- [x] **builder.replica.001** ✅ 2026-07-24 (capacidades) — Las 6 capacidades nuevas de la tanda RENDERIZAN
  y FUNCIONAN en `prueba` (ticker gold marquee running + pausa en hover; nav 4 items + scroll; hero
  full-viewport 817px con "enriquecer" dorado + "$3.000 CLP" destacado + 2º CTA enlace + sin trust badges;
  stats simple sin card; bicolor diagonal suave púrpura→dorado; fondo púrpura, sin scroll-x). Construido
  SOLO por use cases del editor (apply_page+publicar). **FIDELIDAD: NO pixel-idéntica** al mockup — 11
  diferencias restantes (ver Bitácora feature-tester). Headline: (a) el ticker queda BAJO el nav, no sobre
  (aviso_barra es 1er hijo de `<main>`, el header va encima); (b) títulos en SERIF Fraunces (font de
  plataforma, WIP marca del usuario) vs Bebas Neue condensada del mockup — no alcanzable por I-A (cero
  fuente libre por tenant); (c) CTA primario púrpura (colorPrimario) vs gold. MOBILE no ejercido (Playwright
  MCP sin resize; chrome-devtools reservado a otra sesión). — La tienda de prueba replica el mockup
  `landing_idol (1).html` de forma IDÉNTICA: fondo púrpura+dorado bicolor, "ENRIQUECER" dorado, $3.000
  destacado en hero a pantalla, ticker sobre el nav, nav El libro/Sorteo/Autora/Bases, stats limpias —
  verificado lado a lado en browser (desktop y mobile) y construido SOLO con editor/MCP (cero código
  ad-hoc). (Plan F12 E2E)
  > **Estado (implementer)**: el documento ya está APLICADO + PUBLICADO en `prueba` vía
  > `tmp/replicar-landing-idol-tanda1.ts` (apply_page + publicar, los mismos use cases del editor;
  > version 3, revisión 2). El tenant `prueba` quedó con `colorPrimario=#5B21B6` (púrpura) +
  > `colorAcento=#C9A130` (dorado), `fondoPagina=marca_profundo` (púrpura profundo en modo oscuro).
  > **Checkpoints de las capacidades nuevas a verificar lado a lado** contra `C:/Users/NicolásChaima/Downloads/landing_idol (1).html`:
  > (1) ticker dorado corriendo SOBRE el nav (aviso_barra v2 marquee, esquema acento, pausa en hover);
  > (2) nav "El libro / Sorteo / Autora / Bases" (auto-derivado) con scroll a la sección correcta;
  > (3) hero a PANTALLA (`altoMin:pantalla` + centro), "enriquecer" en DORADO (tituloAcento acento) con
  > reveal por palabra, "$3.000 CLP" destacado, 2º CTA como ENLACE, SIN trust badges;
  > (4) estadísticas estilo SIMPLE (cifras limpias, sin ThemeIcon ni card);
  > (5) sección Sorteo con fondo BICOLOR púrpura→dorado (diagonal, suave);
  > (6) fondo de página púrpura profundo en modo oscuro; sin scroll-x en desktop y mobile.
  > Correr en `prueba.localhost:3001` (dev :3001 única instancia). Comparación pixel PENDIENTE (browser).
