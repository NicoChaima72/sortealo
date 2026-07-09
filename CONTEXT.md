# CONTEXT — Glosario del dominio (libros-iselk)

Fuente de verdad del **vocabulario del dominio**. Cuando un agente nombra un concepto (en un
título de issue, un test, un modelo Prisma, una propuesta), usa el término **como está definido
acá** — no derives a sinónimos.

Es un **seed**: arranca chico y crece vía `domain-planner` (skill `grill-with-docs`) a medida que
las decisiones cristalizan. Si un concepto que necesitas no está acá, es señal: o estás inventando
lenguaje que el proyecto no usa (reconsiderar), o hay un hueco real (anotarlo para `domain-modeling`).

> **Colisión de nombres**: `Account` en el schema es la **cuenta OAuth de NextAuth**, NO una
> entidad del dominio. Para entidades del dominio usar los nombres de este glosario (`Book`,
> `Order`, `Payment`...). Ver `docs/agents/prisma-conventions.md`.

---

## Producto y catálogo

### Libro (`Book`)
Un e-book que la autora vende, en formato PDF. Atributos: título, descripción, precio (`Decimal`,
CLP), portada, referencia al archivo PDF en **storage privado**, y un flag de activo. Primer libro:
*"Cómo enriquecer a tu idol favorito"*. El PDF **nunca** se expone por enlace público (ver
[[Entitlement]] y `docs/adr/0002-...`).

### Catálogo
El listado de [[Libro]]s activos que ve el [[Comprador]]: portada, título, descripción, precio,
con página de detalle por libro. Mobile-first.

### Carrito
Selección de uno o más [[Libro]]s (productos digitales) que el [[Comprador]] va a comprar en un
mismo checkout. No requiere cuenta (ver [[Comprador]]).

---

## Compra y pago

### Orden (`Order`)
Una compra. Registra el **correo** del comprador, el estado (`pendiente | pagado | fallido`), el
total (`Decimal`), timestamps y la referencia de pago de Flow. Una Orden tiene uno o más
[[ÍtemDeOrden]]. Es el ancla de la entrega y del sorteo.

### ÍtemDeOrden (`OrderItem`)
Una línea de una [[Orden]]: el [[Libro]] comprado y su precio al momento de la compra (`Decimal`).

### Pago (`Payment`)
El registro del cobro vía **Flow** sobre una [[Orden]]: token/orden de Flow, estado, monto y datos
del webhook. **La confirmación es server-side contra la API de Flow** (no el redirect del navegador);
el webhook es idempotente. Ver `docs/adr/0001-...`. Monto y comisiones en `Decimal`.

---

## Entrega

### Entitlement (derecho de descarga; `DownloadGrant`)
La **autoridad de acceso** a la descarga de un [[Libro]]: liga una [[Orden]] pagada a un libro, con
un token firmado y expiración. Sin Entitlement vigente no hay descarga. Se crea al confirmarse el
[[Pago]]. La descarga se sirve por **URL firmada con expiración corta** o endpoint autenticado, nunca
por enlace público. Ver `docs/adr/0002-...`.

---

## Sorteo

### Sorteo (`Raffle`)
Promoción montada sobre la venta: entre quienes compran se sortea un premio. MVP: **2 entradas a un
recital de BTS**. Atributos: nombre, premio, fechas, estado, referencia a las **bases**. Cada compra
inscribe al comprador como [[Participación]].

### Participación (`RaffleEntry`)
La inscripción de un comprador (por su **correo**, vía la [[Orden]]) en un [[Sorteo]] activo. Se crea
**al confirmarse el pago**, junto con el [[Entitlement]]. El admin puede ver participantes y ejecutar
el sorteo de forma auditable (ganador/es, fecha, criterio).

### Bases del sorteo
El documento legal (quiénes participan, cómo se elige, fechas, premio), responsabilidad **del cliente**
(la autora), idealmente protocolizado ante notario + cumplimiento SERNAC. **No es código**: el sistema
debe permitir operar el sorteo de acuerdo a las bases, pero no las redacta ni automatiza.

---

## Actores

### Comprador (fan / ARMY)
Quien compra. Entra, ve el [[Catálogo]], compra uno o más [[Libro]]s, paga vía [[Pago]], descarga el
PDF (vía [[Entitlement]]) y queda inscrito en el [[Sorteo]]. **No tiene cuenta** en el MVP: su
identidad es el **correo** (ver `docs/adr/0004-...`). Mayoritariamente mobile.

### Autora (admin)
La clienta dueña del contenido. Sube [[Libro]]s y precios, ve ventas/ingresos, gestiona y ejecuta el
[[Sorteo]], y usa [[Hermes]]. Es **mono-usuario** y va detrás de autenticación (provider OAuth).

---

## Marketing

### Hermes
Herramienta de IA para que la [[Autora]] genere copy de marketing para los fandoms (TikTok, Instagram,
X, comunidades ARMY). Input mínimo: objetivo (promocionar libro / empujar sorteo / interactuar),
plataforma, tono. Salida: variaciones de copy + hashtags (opcional: ideas de imagen / guiones). El
**system prompt** (voz del fandom + contexto de libro/precio/sorteo) lo inyecta el sistema. Proveedor
LLM **agnóstico** detrás de una interfaz. MVP = "genera y copia" (sin auto-posteo). Ver `docs/adr/0003-...`.

---

## Dinero (regla transversal)

Todo monto (precio, total, IVA 19%, comisión de Flow ~3,44%, neto al vendedor) es **`Decimal`, nunca
`Float`**. Las operaciones que mueven plata van en `prisma.$transaction`. Formato en UI con
`Intl.NumberFormat` (CLP). Ver `CLAUDE.md` § Regla de oro y `docs/agents/*-conventions.md`.
