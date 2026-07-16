# BYO-Flow: cada tenant conecta su propia cuenta de Flow; credenciales cifradas y ruteo de webhook

Cada Organizador crea y conecta **su propia cuenta de Flow.cl** (con sus trámites SII propios) para cobrar en su Tienda. La Plataforma **nunca recibe, custodia ni mueve dinero de terceros, ni hace split de pagos** — solo orquesta: guarda las credenciales Flow del tenant (`FlowCredential`: apiKey/secretKey) **cifradas at-rest**, instancia el service de Flow con las credenciales del tenant correspondiente, y **rutea cada notificación del webhook a la Tienda correcta** antes de confirmar server-side (ADR-0001) con las credenciales de ESE tenant.

Razón: intermediar plata de terceros convertiría a la Plataforma en procesador/recaudador de pagos (carga regulatoria y tributaria ante el SII, riesgo de fraude y contracargos ajenos) que un SaaS chico no puede absorber; Flow no ofrece split nativo trivial. Con BYO-Flow la relación comercial y tributaria queda directa entre el Organizador y Flow/SII, y la Plataforma se mantiene simple y barata.

## Consecuencias

- Las credenciales se cifran a nivel de aplicación (supuesto revisable: AES-256-GCM con key en env, sin KMS por costo). **Nunca** texto plano en DB, logs ni respuestas; rotar la key implica re-cifrar.
- El endpoint de webhook es **uno solo** a nivel plataforma: identifica el `Payment`/`Order` por el token/`commerceOrder` de la notificación, deriva el tenant desde ese registro, y consulta `payment/getStatus` con las credenciales del tenant. Idempotencia y confirmación server-side per ADR-0001, ahora por tenant.
- El onboarding de una Tienda exige cuenta Flow propia operativa (fricción aceptada; para el piloto ya estaba previsto). Sandbox/producción se configuran por tenant.
- El modelo de ingresos de la Plataforma es **independiente del flujo de pagos** (no hay comisión retenida en la pasarela); cómo cobra la Plataforma a los tenants queda como decisión abierta de negocio.
- Sin credenciales Flow válidas cargadas, la Tienda no puede publicarse con checkout activo.
