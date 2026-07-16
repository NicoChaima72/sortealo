# Entrega de PDF vía storage privado + URL firmada con expiración

El producto es un PDF pirateable, así que la entrega **nunca** es un enlace público permanente. Los PDFs viven en un **bucket privado** y la descarga se sirve vía **URL firmada con expiración corta** (ej. 10 min) o un endpoint autenticado que valida que ese comprador pagó ese libro. La autoridad de acceso es el **`Entitlement`** (derecho de descarga creado al confirmarse el pago): sin Entitlement vigente, no hay descarga. Tras confirmar el pago, se envía el enlace firmado por correo.

Razón: un enlace público se filtra al fandom en minutos y destruye la venta. El requisito de entrega segura es crítico en el brief. La firma con expiración corta limita la ventana de redistribución sin obligar a cuentas de usuario (ver [ADR-0004](0004-sin-cuentas-de-comprador-en-el-mvp.md)).

## Consecuencias

- El path real del bucket nunca se expone al cliente; solo URLs firmadas efímeras o un endpoint que las genera al vuelo validando el `Entitlement`.
- El **proveedor de storage** quedó **resuelto el 2026-07-16: Cloudflare R2** — ver [ADR-0009](0009-storage-pdfs-cloudflare-r2.md). La abstracción de storage se modela igualmente como un service (`src/server/services/`) para poder cambiarlo con fricción mínima.
- **Marca de agua por-comprador** (correo/identificador embebido en el PDF) es recomendada para desincentivar la redistribución, pero su inclusión en el MVP es **decisión abierta** (#7).
- La expiración exige reenvío/regeneración del enlace si el comprador no descarga a tiempo (endpoint de "reenviar mi descarga" validando el `Entitlement`).
