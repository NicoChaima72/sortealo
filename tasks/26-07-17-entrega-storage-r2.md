---
slug: entrega-storage-r2
status: testing               # planning | implementing | testing | done
owner: nicolas
created: 2026-07-17
related_adrs: [ADR-0002, ADR-0005, ADR-0009]
related_context: [Entitlement, Producto, Tienda, Comprador, Orden, Organizador]

features:
  - id: F01
    behavior: "Service de storage S3-compatible contra R2: factory con config explícita, putObject, presign de descarga (GET) y de subida (PUT) con expiración corta, headObject; env vars R2_* declaradas"
    state: active

  - id: F02
    behavior: "Subida real del PDF del Producto desde el panel (cierra el seam pdfPath de F05): presigned PUT desde el cliente a la key determinística <tenantId>/<productId>.pdf + confirmación server-side con HeadObject; sin PDF no hay producto activo"
    state: active

  - id: F03
    behavior: "Endpoint público de descarga del Comprador: valida DownloadGrant por token (vigente, no expirado, PDF subido) ⇒ 302 a URL prefirmada de ~10 min; cualquier fallo ⇒ 404 neutral idéntico"
    state: active

  - id: F04
    behavior: "Puente dev hasta F04-correo: página /dev/descargas (solo development) que lista los enlaces de descarga de las órdenes pagadas para el E2E"
    state: active
---

# F03 del roadmap — Storage privado R2 + entrega de PDF por Entitlement

## Contexto

Fase **F03 del roadmap SaaS** (`tasks/26-07-16-saas-roadmap.md`). F02 dejó el `DownloadGrant`
(Entitlement, ADR-0002) creándose idempotente en la transacción del webhook, con `token` opaco
crypto-random y `expiresAt` (30 días). F05 dejó el CRUD de productos del panel con `pdfPath` como
**seam de texto** ("la subida real llega con F03"). Falta el storage real: los PDFs deben vivir en
un **bucket privado Cloudflare R2** (ADR-0009, decisión cerrada) con paths per-tenant, subirse desde
el panel, y servirse al Comprador SOLO vía URL prefirmada de expiración corta autorizada por su
grant. La infraestructura ya existe: bucket `sortealo-dev` privado + API token Object R&W, con
credenciales ya en `.env` (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
`R2_ENDPOINT`) — falta declararlas en `src/env.js` + `.env.example`.

El correo transaccional aún no existe (F04): el Comprador todavía no recibe su enlace. Para el E2E,
una página dev (throwaway, como `/dev/checkout`) lista los enlaces de descarga. La **marca de agua**
(decisión abierta #6) queda **DIFERIDA**: el diseño trata el PDF como blob opaco de punta a punta,
así que si #6 se cierra después se inserta como transformación en la subida o en la descarga sin
tocar contratos.

## Decisiones

- **D1 — Service de storage = adapter S3-compatible en `services/storage.ts`**, patrón exacto de
  `services/flow.ts`: factory `crearStorageService(config)` que recibe la config como argumento
  explícito (endpoint, accessKeyId, secretAccessKey, bucket — nunca importa `~/env` adentro),
  fail-fast con mensaje claro y sin volcar secretos si falta config al ejecutar. Cliente:
  `@aws-sdk/client-s3` (`S3Client` con `endpoint = R2_ENDPOINT`, `region: "auto"`) +
  `@aws-sdk/s3-request-presigner`. Operaciones: `putObject` (server-side, para scripts/futuros
  usos), `presignarSubida` (PUT, content-type `application/pdf`, expiración corta),
  `presignarDescarga` (GET, expiración corta, `ResponseContentDisposition: attachment` con filename
  saneado) y `headObject` (verificación de existencia). Razón: ADR-0009 exige el adapter S3 sin
  lock-in; el patrón factory-config-explícita ya es convención (I7).
- **D2 — Subida por presigned PUT desde el cliente** (no upload por el server vía tRPC/route
  handler). Razón: tRPC es JSON (un PDF en base64 es frágil y pesado) y el body de un route handler
  choca con los límites de los runtimes serverless (~4.5 MB en Vercel — hosting aún abierto, #5, no
  hay que apostar en contra); el presigned PUT saca los bytes del camino del server y es el
  mecanismo nativo de R2/S3. El cliente NUNCA elige la key: pide la URL a una mutation
  `panelProcedure` que la computa server-side. Supuesto S2 (revisable) cubre el costo: CORS en el
  bucket.
- **D3 — Key determinística `<tenantId>/<productId>.pdf`, computada SIEMPRE server-side** (helper
  puro `keyDePdfProducto(tenantId, productId)` exportado por el service — una sola definición). El
  `tenantId` sale de `resolverTenantAutorizado(ctx.acceso)`, jamás del input (I1). Reemplazar el PDF
  de un producto = re-presignar la misma key (overwrite), gratis por construcción.
- **D4 — `Product.pdfPath` pasa a `String?` (nullable); null = "PDF pendiente"**. El seam de texto
  de F05 muere: `crearProducto`/`actualizarProducto` pierden `pdfPath` del input (el cliente ya no
  puede escribir paths — cierra de paso el vector de un path arbitrario/ajeno como input).
  `crearProducto` crea con `pdfPath: null` y `activo: false` (fail-closed: sin PDF no hay venta).
  El flujo de subida: mutation `crearUrlSubidaPdf({ productId })` (autoriza tenant + producto DE ese
  tenant ⇒ presigned PUT) → el cliente sube → mutation `confirmarPdfProducto({ productId })` que
  verifica con `headObject` que el objeto existe y recién ahí persiste `pdfPath` = key
  determinística. Regla dura en `actualizarProducto`: no se puede poner `activo: true` con
  `pdfPath` null (`INVALID`). Cambio de schema aditivo/relajante (required→nullable), pasa por
  `schema-guardian` (I8); las filas seed con paths placeholder quedan como están (S5).
- **D5 — Endpoint público de descarga `GET /api/descargas/[token]`** (pages/api, borde no-tRPC,
  patrón núcleo+wrapper como el webhook). Núcleo `manejarDescarga` con deps inyectadas (repo de
  grants, presigner, clock): método ≠ GET ⇒ 405; token ⇒ grant (unique global, rutea
  token⇒grant⇒tenant/producto igual que `Payment.token`); grant vigente (`expiresAt` > now) y
  `pdfPath` no-null ⇒ **302** con `Location` = URL prefirmada (~10 min) del `pdfPath`. **Cualquier
  otro caso ⇒ 404 neutral IDÉNTICO** (token inexistente, expirado, PDF pendiente — indistinguibles
  por construcción, mismo criterio que la resolución de tenant de F01). Defensa en profundidad I9:
  si `pdfPath` no empieza con `<grant.tenantId>/`, también 404 neutral (jamás presignar una key de
  otro tenant, aunque la FK lo haga imposible por construcción). El endpoint no exige sesión
  (ADR-0004: el Comprador no tiene cuenta; el token ES la autoridad) y no loguea token ni path.
- **D6 — Política de expiraciones**: URL prefirmada de descarga = **10 minutos** (ADR-0002);
  presigned PUT de subida = 10 minutos; **`GRANT_TTL_DIAS = 30` se RATIFICA** (el schema decía
  "política final en F03" — queda 30 días). El reenvío/regeneración del enlace cuando la URL corta
  expira es simplemente volver a pegarle a `/api/descargas/<token>` (el grant sigue vigente); el
  "reenviar mi correo" llega con F04.
- **D7 — Puente E2E sin correo**: página `/dev/descargas` (throwaway, estilo `/dev/checkout`, muere
  en F06/F04) que server-side (solo `NODE_ENV=development`, en prod 404) lista órdenes PAGADAS
  recientes con sus grants y el enlace `/api/descargas/<token>`. Es una página DEV de operador local:
  no simula al Comprador real (eso lo hará el correo de F04).
- **D8 — Marca de agua (#6) NO se cierra** (instrucción explícita): DIFERIDA. Ningún contrato de
  esta fase la bloquea (blob opaco end-to-end).

## Plan

1. **Deps + env** (F01): instalar `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner`; declarar
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` en
   `src/env.js` (server, `z.string().optional()` — la app arranca sin ellas, fail-fast en la
   factory, patrón Flow; secretos jamás logueados) + placeholders comentados en `.env.example`
   (los valores reales YA están en `.env`).
2. **Service de storage** `src/server/services/storage.ts` (F01): D1 completa — factory con config
   explícita + `keyDePdfProducto` puro + saneo de filename para el content-disposition. Config del
   `S3Client`: `region: "auto"`, `requestChecksumCalculation: "WHEN_REQUIRED"` y
   `responseChecksumValidation: "WHEN_REQUIRED"` (los checksums CRC32 default del SDK v3 reciente
   rompen contra R2 — S4).
3. **Schema** (F02): `Product.pdfPath String` → `String?` + comentario actualizado ("null = PDF
   pendiente; key determinística per-tenant, la escribe solo `confirmarPdfProducto`"). Invocar
   `schema-guardian` ANTES; `npm run db:push` aditivo.
4. **Domain panel** (F02): quitar `pdfPath` de `crearProductoInput`/`actualizarProductoInput`;
   `crearProducto` ⇒ `pdfPath: null` + `activo: false`; nuevos use cases `crearUrlSubidaPdf` y
   `confirmarPdfProducto` (firma `{ db, acceso, input, storage }` con el service inyectado;
   producto inexistente O de otro tenant ⇒ `NOT_FOUND` indistinguible); guard en
   `actualizarProducto` (activar sin PDF ⇒ `INVALID`). Router `panel`: 2 mutations nuevas espejo,
   cableando el storage vía factory desde `env` en el borde (I7). **Adaptar los tests existentes**
   del panel que hoy pasan `pdfPath` por input (ver Validaciones — se modifican, ninguno queda
   obsoleto entero).
5. **Panel UI** (F02, Mantine): el form de producto reemplaza el campo de texto `pdfPath` por
   `FileInput` (accept `application/pdf`); el submit encadena crear → `fetch` PUT a la URL
   prefirmada → confirmar; editar ofrece "reemplazar PDF" (mismo par de mutations) y muestra el
   estado ("PDF pendiente" / subido); activar exige PDF (espeja el guard del server).
6. **CORS del bucket** (F02, prerequisito del PUT desde el browser): script
   `scripts/configurar-cors-r2.ts` (núcleo+wrapper per backend-conventions § Scripts) que aplica
   `PutBucketCors` (AllowedOrigins: `http://localhost:3001` + `http://*.localhost:3001`;
   AllowedMethods: PUT; AllowedHeaders: content-type). Si el token Object R&W no tiene permiso para
   `PutBucketCors` (S2), el script reporta el error claro y la config se hace manual en el dashboard
   de Cloudflare (queda anotado para el usuario — no bloquea el resto de la fase).
7. **Endpoint de descarga** `src/pages/api/descargas/[token].ts` (F03): núcleo `manejarDescarga`
   exportado (D5, deps inyectadas, devuelve `{ status, headers?, body? }`) + wrapper que cabla
   `db` + storage desde env (fail-fast 500 `server_misconfigured` si falta config R2, como el
   webhook).
8. **Dev page** `src/pages/dev/descargas.tsx` (F04): D7 — getServerSideProps solo-development,
   lista órdenes PAGADAS con email/tienda/grants y enlaces `/api/descargas/<token>`; sin marca,
   `noindex`.
9. **Cierre**: `backend-reviewer` (service + endpoint + use cases), `frontend-reviewer` (form del
   panel), `change-set-reviewer` con la lista de archivos de la sesión; registrar en la Bitácora del
   roadmap. `feature-tester` orquesta Vitest + E2E (flujo real: subir PDF desde el panel de
   `autora`, comprar/usar orden pagada, descargar vía `/dev/descargas`).

## Validaciones

### F01 — Service de storage R2

**Vitest** (integration — el presigner del SDK firma offline, sin red):
- [ ] La factory hace fail-fast con mensaje claro si falta cualquier valor de config (endpoint/keys/bucket), y el mensaje NUNCA contiene el valor de un secreto. — `src/__tests__/server/services/storage.test.ts::storage.factory.001`
- [ ] `keyDePdfProducto(tenantId, productId)` produce exactamente `<tenantId>/<productId>.pdf`. — `src/__tests__/server/services/storage.test.ts::storage.key.001`
- [ ] La URL prefirmada de descarga apunta al endpoint/bucket configurados, incluye firma (`X-Amz-Signature`), la expiración pedida (`X-Amz-Expires` ≈ 600) y el content-disposition attachment con filename saneado; la secretKey no aparece en la URL. — `src/__tests__/server/services/storage.test.ts::storage.presignDescarga.001` (+ saneo `storage.saneo.001`)
- [ ] La URL prefirmada de subida es un PUT para la key exacta pedida con content-type `application/pdf` y expiración corta. — `src/__tests__/server/services/storage.test.ts::storage.presignSubida.001`

**E2E**:
- [ ] (no aplica — backend-only; el roundtrip real contra R2 lo cubre el E2E de F02/F03) — bonus: test de integración real contra R2 `storage.integracion.001` (put+presign+fetch+head+delete) PASA en verde local.

### F02 — Subida del PDF desde el panel

**Vitest**:
- [ ] `crearProducto` ya no acepta `pdfPath` en el input y crea el producto con `pdfPath` null y `activo` false. — `src/__tests__/server/panel/crearProducto.test.ts::panel.productos.crear.001`
- [ ] `crearUrlSubidaPdf` de un producto propio devuelve la URL PUT prefirmada para la key determinística `<tenantId>/<productId>.pdf`; de un producto inexistente o de OTRA tienda ⇒ `NOT_FOUND` (indistinguibles). — `src/__tests__/server/panel/crearUrlSubidaPdf.test.ts::panel.pdf.subir.001` / `panel.pdf.subir.002` / `panel.pdf.subir.003`
- [ ] `confirmarPdfProducto` con el objeto presente en el storage (headObject OK, fake) persiste `pdfPath` = key determinística; con el objeto ausente ⇒ `INVALID` y NO persiste; producto ajeno ⇒ `NOT_FOUND`. — `src/__tests__/server/panel/confirmarPdfProducto.test.ts::panel.pdf.confirmar.001` / `panel.pdf.confirmar.002` / `panel.pdf.confirmar.003`
- [ ] `actualizarProducto` rechaza `activo: true` con `pdfPath` null (`INVALID`) y ya no acepta `pdfPath` en el input. — `src/__tests__/server/panel/actualizarProducto.test.ts::panel.productos.actualizar.004` (+ `.001` verifica que el update no escribe `pdfPath`)
- [ ] Tests existentes del panel (crear/actualizar producto y sus schemas, de F05) adaptados al contrato nuevo — ninguno borrado, sin regresión del resto de la suite. — `crearProducto.test.ts::panel.productos.crear.001/002` + `actualizarProducto.test.ts::panel.productos.actualizar.001/002/003` adaptados (inputs sin `pdfPath`, aserciones a null/false)

**E2E** (browser, dev server :3001):
- [ ] Desde el panel de `autora`: crear un producto con un PDF real ⇒ el PUT presignado sube el archivo a R2 (objeto visible bajo `<tenantId>/<productId>.pdf`), el producto queda con PDF confirmado y puede activarse; el path nunca aparece en la UI como enlace público. — E2E del feature-tester (browser). **PREREQUISITO**: CORS del bucket (ver Bitácora F02 — falló por token, requiere paso manual en Cloudflare).

### F03 — Endpoint público de descarga por token

**Vitest**:
- [ ] Token de un grant vigente con PDF subido ⇒ 302 con `Location` = URL prefirmada del `pdfPath` del grant (~10 min). — `src/__tests__/server/descargas/manejarDescarga.test.ts::descargas.302`
- [ ] Token inexistente, grant expirado y producto con `pdfPath` null ⇒ los tres devuelven exactamente la MISMA respuesta 404 neutral (mismo status y body). — `src/__tests__/server/descargas/manejarDescarga.test.ts::descargas.404.neutral`
- [ ] Método ≠ GET ⇒ 405 sin efectos. — `src/__tests__/server/descargas/manejarDescarga.test.ts::descargas.405`
- [ ] Defensa I9: un grant cuyo `pdfPath` no empieza con `<grant.tenantId>/` ⇒ 404 neutral (jamás se presigna). — `src/__tests__/server/descargas/manejarDescarga.test.ts::descargas.i9`
- [ ] El núcleo no loguea token, path ni email en ningún camino. — `src/__tests__/server/descargas/manejarDescarga.test.ts::descargas.no-log`

**E2E**:
- [ ] Con la orden pagada real de `autora`: seguir el enlace de descarga ⇒ redirect a R2 ⇒ el PDF descarga; el mismo enlace re-visitado dentro de la vigencia del grant vuelve a servir (URL nueva); un token inventado ⇒ 404 neutral. — E2E del feature-tester (browser). La descarga GET NO requiere CORS (navegación top-level al 302), así que este flujo NO depende del CORS pendiente.

### F04 — Dev page de descargas

**Vitest**:
- [ ] (no aplica — página dev throwaway sin lógica de dominio propia; el gate solo-development se verifica por inspección + E2E) — `src/pages/dev/descargas.tsx` (getServerSideProps con `if (env.NODE_ENV !== "development") return { notFound: true }`)

**E2E**:
- [ ] `/dev/descargas` en dev lista la(s) orden(es) PAGADAS con sus enlaces `/api/descargas/<token>` y desde ahí se completa el flujo de F03. — E2E del feature-tester (browser).

## Invariantes

- **I1 — Tenancy (ADR-0005)**: el `tenantId` de la key y de toda query sale de
  `resolverTenantAutorizado`/del grant cargado server-side, JAMÁS del input. Ningún input del panel
  ni del endpoint público lleva `tenantId` ni paths.
- **I2 — I9 del roadmap (ADR-0002/0009)**: el PDF nunca se sirve por enlace público ni se expone el
  path como URL accesible; SOLO URLs prefirmadas efímeras (~10 min) generadas tras validar el
  `DownloadGrant`. Un tenant jamás sirve archivos de otro.
- **I3 — Respuesta neutral**: el endpoint de descarga responde IDÉNTICO (404) ante token
  inexistente, expirado o PDF pendiente — indistinguibles por construcción.
- **I4 — Secretos**: credenciales R2 solo en env (Zod) y en memoria dentro del closure del service;
  jamás en logs, respuestas ni mensajes de error. El token del grant tampoco se loguea.
- **I5 — Layering D8**: router/endpoint = borde fino que cabla; use cases en `domain/panel/`;
  adapter R2 en `services/storage.ts` con factory de config explícita; núcleo+wrapper en el
  endpoint. El dominio no importa `~/env` ni instancia el S3Client.
- **I6 — El cliente nunca elige la key**: ni en la subida (la mutation la computa) ni en la
  descarga (sale del grant). `pdfPath` lo escribe únicamente `confirmarPdfProducto`.
- **I7 — Sin PDF no hay venta**: un producto no puede quedar `activo: true` con `pdfPath` null
  (guard de use case; las filas seed pre-existentes se toleran, S5).
- **I8 — Marca de agua (#6) sigue ABIERTA**: prohibido cerrarla o predecirla en código (nada de
  flags/columnas "watermark").
- **I9 — Dinero/schema**: esta fase no toca montos; el cambio de schema (pdfPath nullable) pasa por
  `schema-guardian` antes de `db push` (I8 del roadmap).

## Out of scope

- **Correo con el enlace de descarga** (F04 — Resend) y el "reenviar mi descarga" del Comprador.
- **Marca de agua por comprador** (decisión abierta #6 — DIFERIDA, no se cierra acá).
- **Subida del archivo de bases del sorteo** (`Raffle.basesUrl`): el service queda listo para
  reutilizarse, pero ese flujo se planifica con su fase (panel/F06) — no acá.
- **Portadas/logos a R2** (`portadaUrl`/`logoUrl` siguen siendo URLs externas hasta F06).
- **Límite de tamaño/validación de contenido del PDF más allá del content-type** (antivirus,
  páginas, etc.) y multipart upload para archivos gigantes.
- **UI del Comprador** (la página de descarga con marca llega con F06; hoy el enlace es el endpoint
  directo).
- Migraciones versionadas (sigue `db push` hasta F10, S7 del roadmap).

## Supuestos (resueltos por criterio, revisables)

- **S1 — Presigned PUT desde el cliente** (D2) en lugar de upload proxied por el server. Si el
  usuario prefiere que los bytes pasen por el server (p.ej. para la futura marca de agua en la
  subida), se cambia el borde sin tocar dominio ni service.
- **S2 — CORS del bucket**: se intenta por script (`PutBucketCors` vía S3 API con el token actual);
  si el token Object R&W no alcanza, config manual en el dashboard de Cloudflare (paso operativo
  del usuario, no bloquea el resto).
- **S3 — Al confirmar la subida el producto NO se auto-activa**: `confirmarPdfProducto` solo
  persiste `pdfPath`; activarlo es acción explícita del Organizador (el form del panel puede
  encadenarla). Fail-closed y sin sorpresas; revisable si la UX resulta pesada.
- **S4 — Config R2 del SDK**: `region: "auto"` + `requestChecksumCalculation`/`responseChecksumValidation:
  "WHEN_REQUIRED"` (compatibilidad R2 con aws-sdk v3 reciente). Detalle del adapter, no del dominio.
- **S5 — Productos seed con `pdfPath` placeholder**: se toleran (su descarga daría 404 en R2); el
  E2E usa un producto con PDF real subido por el panel. No se hace backfill.
- **S6 — Expiraciones**: descarga 10 min, subida 10 min, grant 30 días ratificado (D6). Cambiarlas
  es una constante.
- **S7 — Un solo bucket para dev** (`sortealo-dev`); el bucket de producción y sus credenciales son
  parte del hito F07 (decisión #5 hosting mediante).
- **S8 — Nombre del archivo descargado** = `titulo` del producto saneado + `.pdf` (content-disposition);
  cosmético, revisable.

## Especialistas a consultar

- `schema-guardian` — ANTES de tocar `prisma/schema.prisma` (pdfPath a nullable + comentarios).
- `backend-reviewer` — service storage, use cases de subida, endpoint de descarga (neutralidad,
  layering, env vars, no-logueo de secretos).
- `frontend-reviewer` — form de producto con FileInput/flujo de subida en Mantine.
- `feature-tester` — Vitest + E2E asistido con browser (subida real + descarga real contra R2).
- `change-set-reviewer` — diff completo de la fase con la lista de archivos de la sesión.

## Bitácora

- [2026-07-17 01:56] [planner-grill] Task file de F03 creado SIN grill (instrucción vigente del
  usuario: criterio propio + Supuestos revisables, cero preguntas; turno nocturno secuencial).
  Contexto cargado: ADR-0002/0009, roadmap (F03 coarse + criterio de hecho), CONTEXT
  (Entitlement/DownloadGrant), backend-conventions (layering D8, núcleo+wrapper, factory config
  explícita), schema (DownloadGrant con token único global + expiresAt; Product.pdfPath seam),
  `services/flow.ts` (patrón factory), `domain/panel/crearProducto.ts` + `schemas.ts` (seam pdfPath),
  webhook `pages/api/webhooks/flow.ts` (patrón borde), `env.js`/`.env.example` (R2_* pendientes de
  declarar; valores ya en `.env` — bucket `sortealo-dev` + token Object R&W listos). Decisiones D1–D8
  por criterio: adapter S3 en services, presigned PUT cliente (S1), key determinística server-side,
  pdfPath nullable (schema-guardian), endpoint 302 con 404 neutral, TTLs (10 min URL / 30 días grant
  ratificado), dev page /dev/descargas como puente pre-F04, marca de agua #6 DIFERIDA sin cerrar.
  **AWAITING USER APPROVAL** — la implementación no arranca sin visto bueno explícito.
- [2026-07-17 02:01] [feature-implementer] Arranca implementación (visto bueno delegado — contrato
  nocturno). Read pass completo: task file, _template, ADR-0002/0009, backend/frontend-conventions,
  schema, `services/flow.ts` (patrón factory config-explícita), webhook `pages/api/webhooks/flow.ts`
  + núcleo `pago/webhookFlow.ts` (patrón núcleo+wrapper), `domain/panel/{crearProducto,
  actualizarProducto,schemas,_internal}`, router `panel.ts`, `aplicarEfectosPostPago.ts`
  (GRANT_TTL=30, shape del DownloadGrant), tests existentes de crearProducto/actualizarProducto/flow/
  webhookFlow/seed-raffles, `dev/checkout.tsx` (patrón dev page), scripts (`seed-raffles.ts` núcleo+
  wrapper), vitest.config (loadEnv del `.env` local + SKIP_ENV_VALIDATION), `.env` (R2_* reales
  presentes). Features pendientes: F01, F02, F03, F04.
- [2026-07-17 02:10] [feature-implementer] F01 implementada. Deps `@aws-sdk/client-s3` +
  `@aws-sdk/s3-request-presigner` (^3.1089) instaladas con `--ignore-scripts` (evita el lock EPERM
  de `prisma generate` con el dev server vivo en :3001 — no se tocó el server). R2_* declaradas en
  `src/env.js` (server, `.optional()` — fail-fast en la factory) + `.env.example` (placeholders).
  Archivos: `src/server/services/storage.ts` (factory `crearStorageService(config)` config-explícita
  patrón flow.ts; `keyDePdfProducto` puro; `sanearNombreArchivo` puro; presignarSubida/Descarga +
  headObject/putObject/deleteObject; `region:auto` + `forcePathStyle` + checksums `WHEN_REQUIRED`
  por S4), `src/__tests__/server/services/storage.test.ts` (6 tests verdes). Decisiones tácticas:
  (a) agregué `deleteObject` a la interfaz (no listado en D1) — necesario para el cleanup del test de
  integración y natural para overwrite/"reemplazar PDF"; bajo riesgo, es método nuevo de un service
  que estoy creando. (b) La subida FIRMA el content-type via `signableHeaders:{content-type}` — sin
  eso el aws-sdk deja content-type fuera de SignedHeaders y cualquier tipo pasaría; el fetch PUT del
  panel (F02) DEBE mandar `Content-Type: application/pdf`. (c) constantes de expiración
  `EXPIRACION_{DESCARGA,SUBIDA}_SEGUNDOS = 600` exportadas (S6). **Bonus**: el test de integración
  real contra R2 (`storage.integracion.001`) PASA en verde — putObject+presign+fetch+head+delete
  roundtrip funciona server-side contra el bucket `sortealo-dev` (no hubo problema de red/CORS para
  ops server-side; el CORS del browser-PUT se valida en F02). backend-reviewer diferido al cierre
  (instrucción operativa: reviewers + gates al cierre del batch nocturno).
- [2026-07-17 02:22] [feature-implementer] F02 implementada. **Schema**: `Product.pdfPath`
  String→String? — schema-guardian APPROVE (cambio relajante, metadata-only, no-destructivo).
  Aplicado con `npx prisma db push --skip-generate` (DB sync OK en 6.35s). `npx prisma generate`
  EPERM en el rename del `query_engine-windows.dll.node` (dev server :3001 lo tiene abierto — lock
  esperado por la instrucción operativa), PERO el `index.d.ts` SÍ se regeneró antes del rename:
  `pdfPath: string | null` correcto en los tipos ⇒ tsc ve el tipo nuevo; el engine binario viejo
  es la misma versión y el runtime sigue funcionando (EPERM benigno). **Dominio**: `schemas.ts`
  (quité `pdfPath` de crear/actualizar; +`crearUrlSubidaPdfInput`/`confirmarPdfProductoInput`),
  `crearProducto` (pdfPath:null + activo:false), `actualizarProducto` (guard I7: activar sin PDF ⇒
  INVALID vía findFirst scopeado; sin pdfPath en data), nuevos `crearUrlSubidaPdf.ts` +
  `confirmarPdfProducto.ts` (storage inyectado, key server-side I6, NOT_FOUND indistinguible),
  `listarProductosDelPanel` (pdfPath: string|null). **Borde**: `src/server/storage/storageDeEnv.ts`
  (cabla StorageService desde env — único lugar que toca ~/env, reusado por F03), router `panel.ts`
  (+2 mutations `crearUrlSubidaPdf`/`confirmarPdfProducto`). **UI** (`admin/productos.tsx`, Mantine):
  FileInput accept application/pdf reemplaza el TextInput de ruta; submit encadena crear→
  crearUrlSubidaPdf→fetch PUT (Content-Type application/pdf)→confirmarPdfProducto (mutateAsync);
  editar ofrece "reemplazar PDF" con badge de estado (PDF subido/pendiente/nuevo); activar espeja
  el guard I7; tabla muestra badge "Sin PDF" (naranja) para borradores sin archivo. **CORS**:
  `scripts/configurar-cors-r2.ts` (núcleo+wrapper, `npm run cors:r2`). Tests: crearProducto (2) +
  actualizarProducto (4, +guard) + crearUrlSubidaPdf (3) + confirmarPdfProducto (3) + cors (2) = 14
  verdes. tsc --noEmit LIMPIO (0 errores). Decisiones tácticas: (a) FileInput OPCIONAL en crear —
  un producto puede nacer como borrador sin PDF (el schema nullable lo soporta) y subirlo luego al
  editar; "sin PDF no hay VENTA" ≠ "sin PDF no hay producto". (b) en editar, subo el PDF ANTES del
  actualizar cuando hay archivo nuevo, para que el guard de activación del server no rechace. **⚠
  ACCIÓN MANUAL PENDIENTE (S2)**: `npm run cors:r2` falló con **Access Denied** — el token Object R&W
  del bucket NO tiene permiso `PutBucketCors`. El E2E de subida por browser (F02) queda BLOQUEADO
  hasta configurar el CORS manualmente en Cloudflare dashboard → R2 → sortealo-dev → Settings → CORS
  Policy con: AllowedOrigins `http://localhost:3001` + `http://*.localhost:3001`, AllowedMethods
  `PUT`, AllowedHeaders `content-type`. NO bloquea F03/F04 ni ningún test Vitest (solo el PUT desde
  el navegador). frontend/backend-reviewer diferidos al cierre.
- [2026-07-17 02:26] [feature-implementer] F03 implementada. Endpoint público de descarga por
  token. Archivos: `src/server/descargas/manejarDescarga.ts` (núcleo puro D5 — deps inyectadas:
  buscarGrant + presignarDescarga + reloj; devuelve `{status, headers?, body?}`; 405 no-GET; 302 a
  URL prefirmada con Location + Cache-Control no-store; **404 neutral IDÉNTICO** para token
  inexistente/expirado/pdfPath null; **defensa I9** por prefijo `<tenantId>/`; sin console.* en
  ningún camino), `src/pages/api/descargas/[token].ts` (wrapper: fail-fast 500 server_misconfigured
  si falta config R2 como el webhook; repo `buscarGrantPorToken` con findUnique token⇒grant⇒
  product{pdfPath,titulo}; escribe res — 302 end() / else send(body); NO exige sesión, ADR-0004),
  `src/__tests__/server/descargas/manejarDescarga.test.ts` (5 tests verdes: 302, 404-neutral triple,
  405, I9, no-log). El filename de descarga = `sanearNombreArchivo(titulo)` (S8). Reusa
  `crearStorageDeEnv` de F02. backend-reviewer diferido al cierre.
- [2026-07-17 02:28] [feature-implementer] F04 implementada. `src/pages/dev/descargas.tsx` —
  página DEV throwaway (D7): getServerSideProps solo-development (`env.NODE_ENV !== "development"
  ⇒ notFound:true` = 404 en prod), lista órdenes PAGADAS recientes (take 25) de CUALQUIER Tienda
  con email/tienda/grants y enlace `/api/descargas/<token>` por grant (marca "PDF pendiente" si
  el producto aún no tiene pdfPath); Dates serializadas a ISO string (requisito de props de Next);
  `noindex`, sin marca (patrón `dev/checkout`). Sin Vitest (página sin lógica de dominio, per
  Validaciones). tsc --noEmit LIMPIO. Todas las features F01-F04 implementadas; procedo al cierre
  (reviewers + gates).
- [2026-07-17 02:32] [feature-implementer] GATES al cierre (instrucción operativa): `tsc --noEmit`
  exit 0; `next lint` "No ESLint warnings or errors"; `vitest run` COMPLETO **165/165 verde** (33
  archivos, incluye el roundtrip real contra R2 y toda la suite DB-backed previa — CERO regresión;
  las F03 nuevas suman: storage 6, crearUrlSubidaPdf 3, confirmarPdfProducto 3, manejarDescarga 5,
  cors 2, + adaptados crearProducto 2 / actualizarProducto 4). Duración ~151s (DB remota Supabase).
- [2026-07-17 02:32] [feature-implementer] backend-reviewer: **APPROVE** (0 blockers). Verificó I1/
  I3/I4/I6/I7/I9 con cita de línea, layering núcleo+wrapper + factory-config-explícita, env vars,
  no-logueo de secretos. Rúbrica: Compliance A, Naming A, Tests B (E2E de F02 pendiente con razón
  explícita = CORS Access Denied). 1 NIT: `R2_ACCOUNT_ID` declarada en env.js pero no leída por el
  código (solo documenta cómo armar `R2_ENDPOINT`) — cosmético, la DEJO (es parte del set canónico
  de credenciales R2 que alguien espera ver en `.env`). Recomendación del reviewer: el
  change-set-reviewer/usuario confirme el CORS manual de Cloudflare antes de dar por cerrado el E2E
  de F02.
- [2026-07-17 02:33] [feature-implementer] frontend-reviewer (`admin/productos.tsx`): **APPROVE**
  (0 blockers). FileInput Mantine correcto, pdfPath jamás expuesto como enlace (solo `!= null` para
  lógica de estado), notifications green/red, loading compuesto con `subiendo`, colores por token,
  iconos tabler named, español neutro, cero any. Rúbrica: Naming/estructura B (orden de hooks
  mutations-tras-effects diverge de la letra de la convención pero espeja el precedente real de
  `configuracion.tsx` — NIT 2, NO lo toco: consistencia con el repo gana). **NIT 1 CORREGIDO**: el
  `catch` del submit hacía `onError(e as { message: string })`; ahora `onError(error: unknown)` con
  `error instanceof Error ? error.message : fallback`. tsc + lint re-verificados verdes tras el fix.
- [2026-07-17 02:33] [feature-implementer] DRIFT candidato (docs/agents/*) — NO aplicado (requiere
  confirmación del usuario, fuera del alcance autónomo de tocar convenciones). `productos.tsx` es la
  **primera pantalla con subida de archivo por presigned PUT** (fetch nativo fuera de tRPC,
  encadenado con mutations). Patrón que estableció (`subirPdf`, productos.tsx): (1) `fetch` PUT
  nativo con `Content-Type` EXPLÍCITO que coincide con lo que el server firmó; (2) estado local
  `subiendo: boolean` sumado al loading compuesto del submit; (3) la key/`pdfPath` nunca se expone
  en el cliente más allá de un chequeo de presencia; (4) orden del flujo: crear/actualizar →
  crearUrlSubida (mutation) → PUT → confirmar (mutation), con el PUT ANTES del activar en edición.
  **Propuesta de sección nueva en `docs/agents/frontend-conventions.md` § "Subida de archivos
  (presigned PUT)"** — dejo el draft acá para que el usuario decida aplicarlo (F06 bases del sorteo
  probablemente repita el flujo). Tambien: schema-guardian + backend-reviewer sugirieron una nota en
  `CONTEXT.md` § Producto ("nace sin PDF/pendiente, activo=false hasta confirmar") — es territorio de
  domain-planner, solo lo SUGIERO acá, no lo aplico.
- [2026-07-17 02:34] [feature-implementer] Implementación completa. F01..F04 escritas, gates verdes
  (tsc/lint/vitest 165/165), backend-reviewer + frontend-reviewer APPROVE. `status` → `testing`.
  Listo para feature-tester (Vitest ya verde; E2E browser: subida F02 BLOQUEADA por CORS manual
  pendiente en Cloudflare, descarga F03 + dev page F04 NO dependen de CORS). Sin commit/push/
  feature-tester (instrucción operativa nocturna). **2 acciones para el usuario**: (1) configurar el
  CORS del bucket `sortealo-dev` a mano en Cloudflare (el token no tiene `PutBucketCors`); (2) decidir
  sobre el drift de `frontend-conventions.md` (subida presigned PUT) y la nota sugerida en CONTEXT.md.
