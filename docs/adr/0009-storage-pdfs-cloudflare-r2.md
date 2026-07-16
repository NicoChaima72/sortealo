# Storage de PDFs: Cloudflare R2 (bucket privado, URLs prefirmadas S3-compatible)

El storage privado de los PDFs ([ADR-0002](0002-entrega-pdf-storage-privado-url-firmada.md)) se implementa sobre **Cloudflare R2**: un bucket privado con paths per-tenant (`<tenantId>/<productId>/...`), accedido vía la **API S3-compatible** (aws-sdk / presigned URLs con expiración). Decisión tomada con el usuario el 2026-07-16 (cierra la decisión abierta #1).

Razón: (a) **costo ~cero al volumen del proyecto** — 10 GB gratis y, a diferencia de S3, **cero costo de egreso** (las descargas no cuestan, relevante para un producto cuyo único tráfico pesado es servir PDFs); (b) URLs prefirmadas con expiración nativas, exactamente el mecanismo que exige el ADR-0002; (c) **sin lock-in**: al ser API S3, el service de storage puede apuntarse a S3/MinIO/otro sin reescribir callers. Se descartó upload.io/Bytescale con evidencia directa: el proyecto hermano `datawalt-app` lo usó y **migró fuera** (a Azure Blob con capa de compatibilidad — ver `datawalt-app/src/lib/azure-storage.ts`), señal de que no escala bien en costo/control. Supabase Storage solo habría ganado si se adoptara Supabase como Postgres del proyecto, cosa no decidida.

## Consecuencias

- La abstracción sigue siendo un **service** (`src/server/services/`) que recibe la config como argumento (bucket, credenciales R2 vía `src/env.js`); R2 es un detalle del adapter, no del dominio.
- Paths per-tenant obligatorios y nunca expuestos al cliente (invariante I9 del roadmap SaaS): el cliente solo ve URLs prefirmadas efímeras generadas tras validar el `Entitlement`.
- Credenciales R2 (account id, access key) en env vars vía Zod; jamás en logs.
- La cuenta de Cloudflare la opera el Operador de plataforma (los tenants NO traen su propio storage — a diferencia del modelo BYO-Flow de pagos, ADR-0006).
- La decisión #6 (marca de agua en PDFs) sigue abierta y es ortogonal a esta.
