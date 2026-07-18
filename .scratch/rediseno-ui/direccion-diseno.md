# Dirección de diseño — Sortéatelo

> Síntesis de dirección de arte a partir de 5 informes de investigación (competidores, público objetivo, tendencias UI 2025-2026, paletas/tipografía, landings de referencia). Cubre **solo el nivel 1**: la marca de plataforma (landing, login, panel del Organizador). El theming per-tenant (nivel 2) queda libre por tienda; todo lo que sigue está pensado para **no competir** con los colores arbitrarios de los tenants.

---

## 1. Resumen ejecutivo

La investigación converge en un mismo punto desde cinco ángulos distintos: **en este rubro, y en el Chile de 2026, la confianza no se gana con pulido visual ni con sellos — se gana mostrando el mecanismo y sonando humano.** El caso Naya Fácil / Arturo Vidal (15 denuncias en SERNAC, fiscalización del SII, cobertura de prensa nacional en abril-julio 2026) prueba que una rifa puede tener producción impecable y aun así ser percibida como trucha: lo que delata a la estafa es la **ausencia de mecánica verificable** (número de ticket que no llega, exclusiones sin explicar, pago a cuenta personal, sin sorteo público). El público de Sortéatelo ya llega con esa alarma encendida.

En paralelo, el rubro de plataformas de sorteo es un mar de **azul-SaaS genérico** que compra confianza con certificaciones ISO y logos de marcas grandes — un registro frío y ajeno para "una persona común que hace un sorteo en su live". El hueco de diferenciación es claro y nadie lo ocupa: **cálido + verificablemente honesto a la vez**. Las tendencias UI 2026 empujan en esa dirección (neo-minimalismo: neutros cálidos crema + un acento vivo + voz humana), y los competidores directos del segmento creator (Stan Store, Beacons, Ko-fi) ya resolvieron la convivencia multi-tenant con un chrome de plataforma neutro-cálido que le cede el color al contenido del creador. La referencia "Elera" que le gustó al usuario es exactamente ese registro. Fintual entrega el molde de landing: hero corto, escala temprana, "cómo funciona" en pasos, y una **sección de confianza en lenguaje llano** que Sortéatelo debe copiar en estructura.

---

## 2. Direcciones de diseño

Las tres comparten la misma **arquitectura de neutrales cálidos** (no es negociable según la evidencia: es lo que separa "herramienta con dirección de arte propia" de "flyer de Canva"). Lo que cambia entre direcciones es el **acento primario** y, con él, el campo semántico de la marca.

Base neutra común a las tres:

| Rol | Hex | Notas |
|---|---|---|
| Fondo de plataforma (chrome) | `#FAF6F0` (o `#FBF3E7` más cálida) | crema, nunca blanco puro ni gris frío |
| Superficie de cards | `#FFFFFF` / `#FDFBF7` | blanco reservado para cards y previews de tienda |
| Texto principal | `#2B2420` | café-negro cálido, no negro puro — 14:1 sobre la crema |
| Texto secundario | `#6B5F55` | derivado neutro cálido |

---

### Dirección A — "En Vivo" (violeta) · recomendada

**Concepto:** el color de la plataforma que ninguna tienda chica elegiría, que separa limpiamente "esto es Sortéatelo" de "esto es la tienda que estás mirando", y que conecta con el momento del sorteo en un live.

**Paleta:**

| Rol | Hex | Mantine |
|---|---|---|
| **Primario (`primaryColor`)** | `#7239D5` | violeta, tupla `violet` custom, `primaryShade: 5` |
| Alternativa profunda (headers/dark) | `#6027C4` | índice 6 |
| Apoyo — ámbar "premio/ganaste" | `#DF910C` | el momento de triunfo dentro de UI violeta |
| Apoyo — coral (calidez, onboarding) | `#B34914` | ilustraciones, ilustración de vacío |
| Apoyo — teal (éxito/confirmación) | `#258380` | estados de dinero confirmado |
| Neutrales | crema `#FBF3E7`, texto `#2B2420` | crema más cálida para compensar el violeta frío |

- `primaryColor` de Mantine: **violeta (`#7239D5`, índice 5)**. Pasa AA con texto blanco a 6.44:1 **sin necesitar `autoContrast`** — el índice recomendado ya es accesible.

**Tipografía:** Manrope (una sola familia para UI, titulares y montos; tiene tabular figures nativas). Sora opcional solo para el hero si se quiere más carácter.

**Tono de voz:** cercano-chileno neutro, tranquilizador, "amiga que te explica cómo funciona". Tuteo total.
- Microcopy 1 (confirmación de compra): *"Listo. Tu número quedó adentro del sorteo: **#0428**. Te lo mandamos también a tu correo."*
- Microcopy 2 (estado vacío del panel): *"Todavía no vendes nada — y está bien. Sube tu primer PDF y arma tu sorteo; te toma menos de lo que crees."*

**Cómo se ve aplicada:**
- **(a) Landing:** fondo crema, hero con headline en Manrope bold y un solo CTA violeta grande. El violeta aparece con disciplina (botones, links, badge "en vivo"); el ámbar entra solo en el bloque del sorteo/ticket. Ilustración simple de ticket/número, nada de gradientes tipo TikTok.
- **(b) Login:** card blanca centrada sobre fondo crema, botón "Continuar con Google" grande y primario (arriba, como pide el patrón consumer y las reglas de Google), "o entra con tu correo" bajo un divisor. Cero densidad.
- **(c) Panel del Organizador:** registro Elera — cards blancas radio `lg`/`xl` sobre crema, KPI tiles arriba (ventas del mes, tickets del sorteo activo, próximo sorteo), acento violeta solo en la navegación activa y CTAs primarios. Nada de sidebar oscura tipo Shakuro.

**Pros:** máxima distinción frente al theming arbitrario de tenants (patrón Stripe: casi ninguna tienda chica usa violeta); AA sin trucos; libera al ámbar para su rol semántico puro de "premio"; se aleja del azul-SaaS del rubro y del rojo de error sin esfuerzo. **Contras:** el violeta es intrínsecamente frío — depende de la crema cálida y del copy para no leerse "tech"; es menos literal al nombre "Sortéatelo" que el oro.

---

### Dirección B — "Premio" (ámbar dorado)

**Concepto:** la lectura literal del nombre — sortéatelo = ganar un premio; el oro del trofeo como color de marca.

**Paleta:**

| Rol | Hex | Mantine |
|---|---|---|
| **Primario (`primaryColor`)** | `#DF910C` | ámbar, índice 6 — coincide con el shade por defecto |
| Apoyo — coral cálido | `#B34914` | acentos secundarios |
| Apoyo — violeta (en vivo) | `#6027C4` | badges de "sorteo en vivo", countdown |
| Apoyo — teal (éxito) | `#258380` | confirmaciones |
| Neutrales | crema `#FAF6F0`, texto `#2B2420` | |

- `primaryColor` de Mantine: **ámbar (`#DF910C`)**, pero **exige `theme.autoContrast: true`**: con texto blanco da solo 2.56:1 (falla); con autoContrast el texto pasa a `#2B2420` y sube a 5.95:1 (AA holgado). La alternativa sin autoContrast es un ámbar más oscuro/mostaza (`#9B670D`, 4.84:1) que pierde el brillo "oro".

**Tipografía:** Manrope, o el par Sora (titulares con aire celebratorio) + Inter (montos/tablas) si se quiere más carácter en el hero.

**Tono de voz:** cálido y celebratorio, un punto más festivo que la Dirección A.
- Microcopy 1: *"¡Adentro! Tu número **#0428** ya está participando. Que la suerte te pille comprando."*
- Microcopy 2: *"Tu sorteo está armado. Cuando quieras, lo lanzas en vivo y elegimos al ganador frente a todos."*

**Cómo se ve aplicada:**
- **(a) Landing:** el oro domina el hero — cálido, emocional, muy "premio". Riesgo de leerse genérico si no se ejecuta con tipografía e ilustración cuidadas.
- **(b) Login:** card blanca, botón Google primario; el ámbar entra en el acento de marca y el borde de foco.
- **(c) Panel:** el oro es tan cálido que puede sentirse "todo es premio" — conviene bajarlo a acento y dejar el chrome más neutro para no cansar en uso diario.

**Pros:** el más on-brand emocionalmente; conexión inmediata y sin explicación con "sorteo/premio/suerte"; el más cálido de las tres. **Contras:** el oro es el color **más obvio** del rubro de sorteos — puede leerse genérico; **requiere `autoContrast`** para ser vívido y AA a la vez; al ser el ámbar el primario, pierde su valor como señal exclusiva de "ganaste".

---

### Dirección C — "Cercano" (coral)

**Concepto:** ir directo al requisito de calidez — el coral/guava es el color con el que las fintech se alejan deliberadamente de la banca para sonar humanas.

**Paleta:**

| Rol | Hex | Mantine |
|---|---|---|
| **Primario (`primaryColor`)** | `#B34914` | coral, índice 7 — 5.41:1 con blanco, AA sin trucos |
| Swatch de marca (vívido) | `#D55515` | índice 6, solo decorativo o con autoContrast |
| Apoyo — ámbar premio | `#DF910C` | badges de premio/ticket ganador |
| Apoyo — violeta vivo | `#6027C4` | en vivo / countdown |
| Apoyo — teal (éxito) | `#289F9B` | confirmaciones |
| Neutrales | crema `#FBF3E7` (algo más rosada), texto `#2B2420` | |

- `primaryColor` de Mantine: **coral (`#B34914`, índice 7)**, AA con blanco sin autoContrast.

**Tipografía:** Plus Jakarta Sans (un punto más redonda/cálida que Manrope, hace juego con el coral) o Manrope.

**Tono de voz:** el más humano y de tú-a-tú de las tres.
- Microcopy 1: *"Quedó todo listo, tu número es el **#0428**. Cualquier cosa, nos escribes."*
- Microcopy 2: *"Tú cobras con tu propia cuenta de Flow. La plata llega directa a ti — Sortéatelo nunca la toca."*

**Cómo se ve aplicada:** landing y panel se sienten los más cálidos y "de barrio"; buena para el ángulo "apoya a un creador". Login idéntico en estructura a A/B.

**Pros:** cumple "cercanía" de forma más directa; se diferencia del azul-SaaS. **Contras (importante):** el coral vive en hue ~20°, a solo ~15-20° del **rojo de error** reservado. Es manejable, pero **obliga a fijar el rojo de error deliberadamente más oscuro/ladrillo** para que nunca se confundan en un botón o alerta — un costo de mantenimiento permanente. Además, al ser un naranja-rojizo cálido, es un color que **sí** podría elegir una tienda de tenant, así que resuelve peor la convivencia (c) que el violeta.

---

## 3. Recomendación fundamentada

**Recomiendo la Dirección A — "En Vivo" (violeta `#7239D5` como `primaryColor`), sobre crema `#FBF3E7`, con ámbar `#DF910C` reservado para "premio/ganaste" y teal `#258380` para confirmaciones de dinero.**

El anclaje en los hallazgos:

1. **Convivencia con theming per-tenant (el requisito técnico duro).** Los informes 3 y 5 coinciden: el problema exacto de Sortéatelo — un chrome de plataforma que aparece junto a previews de tiendas de cualquier color — ya lo resolvieron Stripe (índigo/violeta que "se gana el derecho de ser botón") y Stan/Beacons (chrome neutro + acento que ningún creador elegiría). Casi ninguna tienda chica elige violeta como color de marca; el coral y el ámbar sí son colores de tienda comunes. El violeta separa "plataforma" de "tienda" **sin esfuerzo**.

2. **Confianza anti-"rifa trucha".** La confianza no la da el color sino el mecanismo visible y el tono humano (informes 1 y 4). El violeta, al no ser ni el azul-banco-frío ni el oro-obvio-de-rifa, deja que la confianza la carguen las piezas que de verdad la construyen: pasarela Flow visible en checkout, número de ticket confirmado al instante (no "después por correo" — el fallo exacto de Naya Fácil), y la frase ancla "tu plata llega directa a ti, Sortéatelo nunca la toca". El registro cálido-crema + copy de amiga aporta la **cercanía**; el mecanismo aporta la **honestidad**. Esa combinación "cálido + verificablemente honesto" es el hueco que el informe 4 identifica como vacante en todo el rubro.

3. **Accesibilidad y costo de implementación.** Es la única de las tres cuyo índice primario recomendado pasa AA (6.44:1) **sin depender de `autoContrast`** ni de mover manualmente la tupla. Menos deuda de accesibilidad, menos sorpresas al derivar tonos.

4. **Semántica limpia.** Al no ser el ámbar el primario, queda **libre para significar exclusivamente "ganaste/premio"** — máximo contraste emocional cuando aparece dentro de una UI mayormente violeta. La marca cubre dos campos semánticos del negocio (vivo vía violeta, premio vía ámbar) en vez de uno.

**Tipografía recomendada, transversal a la decisión de color: Manrope** (Google Fonts, `next/font`-friendly, tabular figures nativas → cubre landing, panel y montos CLP con una sola familia). Esto implica **retirar Geist**, que es placeholder y arrastra asociación con Vercel/dev-tooling (registro frío) — traiciona la calidez de la paleta. Plus Jakarta Sans es la alternativa si se quiere un punto más de calidez.

En cualquier paleta: activar `theme.autoContrast: true` de todos modos (bajo costo, margen de accesibilidad a futuro) y forzar `font-variant-numeric: tabular-nums` en componentes de monto y tablas.

---

## 4. Estructura de landing recomendada

Sortéatelo combina tres modelos: storefront multi-tenant (Tiendanube), producto para creators no técnicos (Ko-fi/Stan/Gumroad) y manejo de plata real que exige confianza (Fintual). La landing debe tomar de cada uno.

1. **Hero** — 1 frase de beneficio + subheadline concreto + un solo CTA. Sin jerga de "SaaS multi-tenant" ni "plataforma". Fondo crema, CTA violeta.
   - **Headline:** *"Vende lo que hiciste. Sortea entre quienes te compraron."*
   - **Subheadline:** *"Sortéatelo es tu tienda para vender PDFs y hacer sorteos en vivo — sin código, cobrando con tu propia cuenta de Flow."*
   - **CTA:** *"Crea tu tienda gratis"* (con "Continuar con Google" visible como opción).
   - *(Alt. de headline fandom, a validar: "Tu tienda, tu sorteo, tu comunidad".)*

2. **Prueba social temprana** — arriba del fold. Como aún no hay volumen, usar el **piloto (tienda de la autora ARMY) como testimonio nombrado con foto**, no una cifra inflada. La evidencia (informe 4) es tajante: la confianza en este rubro viene de personas reales operando ahora, no de sellos. **No inventar números.**

3. **Cómo funciona (3-4 pasos, verbo + resultado)** — íconos simples, tono de acción: *"Sube tus PDFs" → "Conecta tu Flow" → "Comparte tu tienda" → "Haz tu sorteo en vivo"*.

4. **Mockup del producto en contexto** — captura de una tienda real (o del piloto) en un teléfono, mostrando **el momento del sorteo/tickets** (el gancho emocional único frente a Stan/Ko-fi/Gumroad). No un dashboard vacío.

5. **Sección de confianza dedicada** (molde Fintual, lenguaje llano — el diferenciador central):
   - *"Tú cobras con tu propia cuenta de Flow. La plata llega directa a ti; Sortéatelo nunca la toca."*
   - *"Tus PDFs solo los descarga quien te compró — con un enlace privado que expira."*
   - *"Cada compra confirma su número al instante, en pantalla y por correo."*
   - Sin la palabra "custodia", sin jerga legal. Convertir el "no tocamos tu plata" en un **pilar visual** (ícono + sección propia), no una nota al pie — el informe 4 lo marca como territorio subexplotado.

6. **FAQ corto** — dudas de alguien que nunca vendió online: *"¿Necesito boleta?", "¿Cómo elijo al ganador del sorteo?", "¿Qué pasa si Flow me rechaza un pago?"*.

7. **CTA final repetido** — con "Continuar con Google" visible junto al signup por correo.

8. **Pricing simple** (si aplica al MVP) — directo, en CLP con IVA explícito, sin letra chica (registro Tiendanube).

> Nota de tono transversal: **evitar en el chrome de plataforma** todo lenguaje de urgencia/escasez de rifa genérica (contadores agresivos, "¡últimos números!" en rojo) — es exactamente la bandera de alerta que SERNAC identifica. Puede vivir en el storefront del tenant si el organizador lo elige; nunca en la marca Sortéatelo.

---

## 5. Semántica de color de comercio

Coherente con la paleta recomendada (Dirección A). El principio de las tendencias 2026 es **color funcional, no decorativo**: el estado se comunica con color, el resto de la UI vive en neutros.

| Estado | Color | Hex | Uso |
|---|---|---|---|
| **Pagado / confirmado** | teal | `#258380` | orden pagada, PDF liberado, ticket dentro del sorteo. Teal (cian) en vez de verde-esmeralda para evitar el "verde-banco" que el brief pide evitar, manteniendo la convención universal verde≈aprobado. |
| **Pendiente / en proceso** | ámbar | `#B8770A` | pago iniciado no confirmado, esperando webhook de Flow. Ámbar más oscuro que el `#DF910C` de "premio" para no colisionar semánticamente (pendiente ≠ celebración). |
| **Fallido / rechazado** | rojo (reservado) | `#B42318` | pago rechazado por Flow, error destructivo. Rojo-ladrillo desaturado, deliberadamente **más oscuro que cualquier acento cálido de marca** para que nunca se confunda con un CTA. |
| **Neutro / borrador** | gris cálido | `#6B5F55` | orden sin iniciar, tienda en borrador. |

Notas:
- El **ámbar `#DF910C` de "premio/ganaste"** es distinto del **ámbar `#B8770A` de "pendiente"** — reservar el brillante para el momento de celebración y el apagado para el estado de espera evita ambigüedad.
- Si en el futuro se eligiera la Dirección C (coral), esta tabla **debe** fijar el rojo de fallido aún más oscuro/desaturado para distanciarlo del coral primario; con la Dirección A recomendada no hay ese riesgo.
- Acompañar siempre el color con **ícono + texto** (no solo color) — accesibilidad y claridad en el momento de estrés de un pago.

---

## 6. Riesgos y qué validar con el usuario

1. **El nombre visual y la paleta siguen siendo decisión abierta** (`docs/decisiones-abiertas.md`; la identidad fandom/ARMY está sin definir). Este documento es propuesta de dirección de arte, **no cierra la decisión**. El siguiente paso natural es una sesión de `frontend-design` / `domain-planner` para elegir entre A/B/C y aterrizarlo en `docs/design.md`. No cerrar sin visto bueno explícito.

2. **La convivencia con theming per-tenant es una hipótesis a probar en pantalla**, no solo en teoría. Antes de comprometer el violeta, montar una preview del panel con dos o tres tiendas de colores dispares (incluida una violeta, el peor caso) y confirmar que el chrome se sigue leyendo como "plataforma".

3. **La prueba social depende del piloto.** Toda la estrategia de confianza (informe 4) se apoya en testimonios reales nombrados y tiendas activas. Al lanzamiento habrá una sola (la autora ARMY). Validar con el usuario: ¿usamos su testimonio con foto y nombre? ¿Hay permiso? Sin eso, la sección de prueba social queda débil y **no se deben inventar cifras**.

4. **Retirar Geist es un cambio real.** Manrope encaja mejor con la calidez, pero implica tocar la config de `next/font`. Confirmar que el usuario acepta el cambio de tipografía antes de implementarlo.

5. **`autoContrast` y decisión #6 (marca de agua) siguen abiertas.** Recomiendo activar `autoContrast: true` igual; confirmarlo. La marca de agua de PDFs (decisión #6, la única abierta según CLAUDE.md) puede tener implicación visual/de marca — no darla por resuelta aquí.

6. **Dark mode no está cubierto por la investigación.** Las paletas están verificadas en modo claro (crema). Si el panel necesita dark mode, hay que derivar la variante y re-verificar contrastes — validar si entra en el alcance del MVP o se difiere.

7. **Debilidades declaradas de la investigación** (heredadas de los informes, para no sobre-confiar): varios hex de competidores son aproximaciones de la paleta visible, no extracción de CSS (informe 4); la cifra "84% abandona por SSL inseguro" y los benchmarks de conversión de Google OAuth son de fuentes secundarias/orientativas, no estudios primarios chilenos (informes 1 y 2); no hay un comparable chileno confirmado con Google OAuth visible en el hero — la recomendación de ponerlo se apoya en benchmark de industria + reglas de Google, no en un caso local verificado.
