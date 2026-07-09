# Pasarela de pago = Flow.cl, con confirmación server-side vía webhook

Los pagos se procesan con **Flow.cl** (DECIDIDO en el brief). El flujo es el patrón estándar de pasarela: el backend crea el pago vía la API de Flow → Flow devuelve una URL de pago → se redirige al comprador a esa URL (Flow renderiza el checkout: tarjetas/Webpay, transferencia, MACH, Servipag) → Flow notifica el resultado a un **webhook** del backend. La habilitación de la descarga y el registro de la participación en el sorteo ocurren **solo tras confirmar el pago contra la API de Flow**, nunca confiando en el redirect del navegador.

Razón: el cliente es persona natural en Chile con bajo volumen (~10 ventas/mes a $3.000 CLP); necesita cobrar con los medios locales y una cuenta a su nombre. El redirect del navegador es manipulable y no es prueba de pago. La confirmación server-side contra la API es la única fuente de verdad. Comisión efectiva ≈ 3,44% (2,89% + IVA, sin cargo fijo). Una integración directa de Mercado Pago queda fuera de alcance (las tarjetas vía Webpay ya cubren a esos usuarios).

## Consecuencias

- Existe un endpoint `pages/api` de webhook que recibe la notificación de Flow y confirma contra la API antes de mutar estado. Debe ser **idempotente**: el webhook puede llegar más de una vez.
- El estado del `Pago`/`Order` avanza `pendiente → pagado | fallido` solo desde la confirmación server-side.
- Al confirmar: se generan los `Entitlement`(s) de descarga, se crea la `RaffleEntry` y se envía el correo con el enlace firmado — idealmente dentro de una transacción / con reintentos.
- Dependencia operativa: cuenta Flow + cuenta bancaria a nombre de la autora. El abono es bruto (al 3er día hábil); el neto considera comisión + IVA.
- Todos los montos (precio, comisión, IVA, neto) son `Decimal`, nunca `Float`.
