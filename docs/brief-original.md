<!--
ARCHIVO DE RESPALDO — texto original del brief del proyecto, tal cual lo entregó el cliente.
La fuente de verdad operativa NO es este archivo, sino el split del harness:
  - CLAUDE.md ............... propósito, alcance, regla de oro, fuera de alcance
  - CONTEXT.md ............. glosario de dominio (Libro, Orden, Pago, Entitlement, Sorteo, Hermes…)
  - docs/adr/0001-0004 ..... decisiones cerradas (Flow, storage privado, Hermes LLM-ag, sin cuentas)
  - docs/decisiones-abiertas.md ... las decisiones por definir
Este archivo se conserva solo como referencia histórica del documento fuente.
-->

# Brief de proyecto — Tienda de e-books con sorteo (fandom K-pop)

▎ Para el agente receptor: este documento describe un proyecto que aún no tiene código. Conviértelo en un CLAUDE.md que sirva como fuente de verdad del proyecto: propósito, alcance funcional, requisitos legales, arquitectura sugerida, integraciones, decisiones abiertas y fuera de alcance. Respeta la separación entre lo decidido y lo por definir — no cierres decisiones marcadas como abiertas sin consultar.

## 1. Resumen

Plataforma web para que una autora venda sus libros en formato PDF (e-books): los sube, la gente los compra desde el sitio y los descarga. Sobre la venta se monta un sorteo promocional (entre quienes compran se sortean entradas a un recital de BTS). Es un encargo de desarrollo para un cliente externo (la autora); lo desarrolla y mantiene un freelancer/estudio. Público objetivo del producto: fandom K-pop / ARMY (seguidores de BTS) en Chile.

Primer libro a vender: "Cómo enriquecer a tu idol favorito" (hay más libros previstos).

## 2. Contexto de negocio

- Cliente: autora, persona natural en Chile. Vende contenido digital propio.
- Volumen esperado (realista, inicial): ~10 ventas/mes o menos, a $3.000 CLP por libro (~$30.000 CLP/mes de ingreso bruto).
- Modelo comercial del desarrollo: desarrollo inicial como cobro único + mantención mensual (~$40.000 CLP) que cubre hosting, cambios menores, operación del sorteo y costos de IA del módulo de contenido.
- Implicancia clave de diseño: por el bajo volumen y bajo ingreso del cliente, la solución debe ser simple y barata de construir y mantener. No sobre-ingenierizar. Priorizar un MVP funcional sobre features avanzadas.

## 3. Usuarios

- Comprador (fan): entra, ve el catálogo, compra uno o más libros, paga, descarga el PDF y queda automáticamente inscrito en el sorteo. Mayoritariamente mobile.
- Autora (admin): sube libros y precios, ve ventas/ingresos, gestiona y ejecuta el sorteo, genera contenido de marketing con el módulo "Hermes".

## 4. Alcance funcional

### 4.1 Catálogo y tienda

- Listado de libros con portada, título, descripción, precio.
- Página de detalle por libro.
- Diseño simple por fuera, mobile-first, con identidad acorde al fandom.

### 4.2 Carrito y checkout

- Carrito que admite múltiples libros (productos digitales).
- Checkout que recoge, como mínimo, el correo del comprador (clave para la entrega y el sorteo). Sin necesidad de registro/cuenta en el MVP.

### 4.3 Pago — integración con Flow (DECIDIDO: Flow.cl)

Flujo obligatorio (patrón estándar de pasarela):
1. El backend crea el pago vía API de Flow → Flow devuelve una URL de pago.
2. Se redirige al comprador a esa URL (Flow renderiza el checkout: tarjetas, transferencia, MACH, Servipag).
3. Flow notifica el resultado a un webhook del backend.
4. Recién al confirmar el pago contra la API de Flow (no confiando en el redirect del navegador) se habilita la descarga y se registra la participación en el sorteo.

Datos de Flow (verificados jun 2026, plan estándar):
- Comisión 2,89% + IVA, sin cargo fijo por transacción, abono al 3er día hábil (o 3,19% + IVA al día siguiente).
- Tasa efectiva ≈ 3,44% → de un libro de $3.000, Flow descuenta ~$103; le llega ~$2.897.
- Requiere cuenta Flow + cuenta bancaria a nombre de la autora.
- Nota: "pagar con Mercado Pago" como billetera no es un método de Flow; las tarjetas vía Webpay ya cubren a esos usuarios. Una integración directa de Mercado Pago queda fuera de alcance salvo decisión explícita.

### 4.4 Entrega segura del PDF (REQUISITO CRÍTICO)

El producto es digital y pirateable, así que la entrega no puede ser un enlace público:
- PDFs almacenados en bucket privado (S3 / Cloudflare R2 / Supabase Storage — por definir).
- Descarga vía URL firmada con expiración corta (ej. 10 min) o endpoint autenticado que valide que ese comprador pagó ese libro.
- Opcional/recomendado: marca de agua por-comprador (correo/identificador) embebida en el PDF para desincentivar la redistribución.
- Entrega típica: tras confirmar pago, enviar enlace de descarga por correo (firmado y con expiración).

### 4.5 Sistema de sorteo (mecánica de negocio + parte legal del cliente)

- Cada compra registra al comprador como participante del sorteo activo.
- El admin puede ver participantes y ejecutar el sorteo de forma transparente y auditable (registrar ganador/es, fecha, criterio).
- Premio del MVP: 2 entradas a un recital de BTS.
- Parte legal (la arma la autora, NO es código): bases legales del sorteo (quiénes participan, cómo se elige, fechas, premio), idealmente protocolizadas ante notario, y cumplimiento de normas de SERNAC/publicidad. El sistema debe permitir operar el sorteo de acuerdo a esas bases, pero las bases son responsabilidad del cliente.

### 4.6 Hermes — generador de contenido con IA

Herramienta para que la autora genere posts de marketing para subir a los fandoms (TikTok, Instagram, X, comunidades de ARMY):
- Entrada mínima de la autora: objetivo (promocionar libro / empujar el sorteo / interactuar), plataforma y tono.
- Salida: varias variaciones de copy + hashtags (opcional: ideas de imagen / guiones de video).
- Por debajo: una llamada a un LLM con un system prompt afinado para la voz del fandom K-pop, que ya conoce el contexto del libro, el precio y el sorteo (lo inyecta el sistema, no la autora).
- MVP = "genera y copia" (la autora publica a mano). El auto-posteo a redes queda fuera de alcance (requiere APIs/aprobaciones de cada plataforma; no se justifica al inicio).
- LLM-agnóstico (DECISIÓN DE DISEÑO): abstraer el proveedor detrás de una interfaz para poder cambiar de modelo con mínima fricción. Importante: la cuenta gratis de claude.ai (chat) NO sirve para esto; se requiere acceso vía API (de pago por uso). Opciones de modelo por costo/calidad: Google Gemini (tiene plan gratis), Claude Haiku (~centavos por post, alta calidad), DeepSeek / Kimi (Moonshot) (muy baratos). Costo absorbido por la mantención; es marginal al volumen esperado.

### 4.7 Dominio y correos

- Dominio .cl o .com, comprado por la autora, pago anual (~$10.000–$15.000/año). Nombre por definir.
- Correos profesionales asociados al dominio (contacto@dominio.cl): opción gratis Zoho Mail, o Google Workspace (pago).

### 4.8 Panel de administración

- Subir/editar libros (PDF, portada, precio, descripción).
- Ver ventas e ingresos.
- Ver participantes y ejecutar el sorteo.
- Acceder a Hermes.

## 5. Requisitos legales y tributarios (Chile)

- La autora debe hacer Inicio de Actividades en el SII (puede como persona natural, no requiere empresa; trámite online, casi inmediato).
- Debe emitir boleta electrónica y manejar IVA 19% (en Chile los libros y e-books pagan IVA; ~$479 de cada $3.000 es IVA que declara en el F29).
- Importante para el cálculo: el depósito de Flow es bruto; lo que "le queda limpio" considera además el IVA y eventuales costos.
- Bases del sorteo: ver 4.5.
- Estas obligaciones son del cliente; el sistema no las automatiza, pero la emisión de boleta podría integrarse a futuro (fuera de alcance del MVP salvo decisión).

## 6. Arquitectura y consideraciones técnicas

▎ Stack: POR DEFINIR. El cliente (Nicolás) aún no fijó tecnología. Candidatos típicos: Next.js (buen encaje con Vercel/hosting moderno) o Laravel/PHP. El agente debe confirmar el stack antes de asumir convenciones. No inventar un stack en el CLAUDE.md como si estuviera decidido.

Principios:
- Backend con webhook para confirmar pagos (no confiar en el front).
- Almacenamiento privado + URLs firmadas para los PDFs.
- Manejo de secretos (API keys de Flow, del proveedor LLM, del storage, del correo) fuera del repo (variables de entorno).
- Mantener el sistema simple; favorecer servicios administrados baratos.

### Modelo de datos sugerido (orientativo, ajustar al stack)

- Book — id, título, descripción, precio, portada, ref. al archivo PDF en storage privado, activo.
- Order — id, correo del comprador, estado (pendiente/pagado/fallido), total, timestamps, referencia de pago Flow.
- OrderItem — order_id, book_id, precio.
- Payment — order_id, token/orden de Flow, estado, monto, datos del webhook.
- DownloadGrant / Entitlement — order_id, book_id, token firmado, expiración (controla el acceso de descarga).
- Raffle — id, nombre, premio, fechas, estado, (referencia a las bases).
- RaffleEntry — raffle_id, order_id/correo, fecha de inscripción (se crea al confirmarse el pago).
- AdminUser — credenciales del panel.

### Flujos críticos a implementar bien

1. Compra → pago confirmado: crear Order pendiente → crear pago Flow → redirigir → webhook confirma → marcar pagado → generar Entitlement(s) → crear RaffleEntry → enviar correo con enlace de descarga firmado.
2. Descarga: validar Entitlement vigente → servir PDF vía URL firmada/endpoint autenticado (opcional: marca de agua).
3. Hermes: request del admin → construir prompt con contexto del libro/sorteo → llamar al LLM (proveedor configurable) → devolver variaciones.

## 7. Integraciones externas

- Flow.cl — pasarela de pago (API + webhook). DECIDIDO.
- Proveedor de almacenamiento de PDFs (S3 / R2 / Supabase). POR DEFINIR.
- Proveedor de correo (envío transaccional del enlace de descarga + correos del dominio: Zoho/Google/servicio transaccional). POR DEFINIR.
- Proveedor LLM para Hermes (Gemini/Claude/DeepSeek/Kimi), detrás de una abstracción. POR DEFINIR el default.

## 8. Restricciones y economía

- Volumen muy bajo (~10 ventas/mes) → optimizar simplicidad y costo de operación, no escala.
- Costos recurrentes a minimizar: hosting (idealmente plan barato/gratuito), correo (Zoho gratis), API LLM (centavos o gratis con Gemini).
- La mantención mensual (~$40.000) debe cubrir esos costos con holgura.

## 9. Fuera de alcance (MVP)

- Auto-posteo de Hermes a redes sociales.
- Campañas de SEO / Ads pagadas (el público vive en redes/fandom, no en buscadores; el sorteo es el motor de marketing orgánico).
- Integración directa de Mercado Pago como método propio.
- Emisión automática de boletas SII (responsabilidad del cliente por ahora).
- Cuentas de usuario / login de compradores (entrega por correo basta en el MVP).

## 10. Decisiones abiertas (requieren confirmación del cliente)

1. Stack tecnológico (Next.js vs Laravel/PHP vs otro).
2. Proveedor de almacenamiento de PDFs.
3. Proveedor de correo (transaccional + buzones del dominio).
4. Modelo LLM por defecto para Hermes.
5. Nombre de dominio (.cl o .com).
6. Hosting / despliegue.
7. Si se incluye marca de agua en los PDFs en el MVP.

## 11. Datos clave (referencia rápida)

- Precio por libro: $3.000 CLP · Volumen: ~10/mes.
- Comisión Flow: 2,89% + IVA (efectiva ~3,44%, sin cargo fijo) → ~$103/libro, le llega ~$2.897/libro, ~$28.970/mes (10 libros).
- IVA: 19% (los e-books pagan IVA en Chile).
- Mantención: ~$40.000 CLP/mes. Desarrollo: cobro único (referencia mercado: $300.000–$700.000, a ajustar).
- Costo Hermes: ~6 pesos/post con Claude Haiku, o gratis con Gemini (plan gratuito).
- Fuente tarifas Flow: https://web.flow.cl/es-cl/tarifas/ (verificado jun 2026).
