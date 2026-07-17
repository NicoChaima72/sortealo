# Correo transaccional: Resend, enviado por la Plataforma en nombre de los tenants

El correo transaccional (enlace de descarga firmado al confirmar el pago, reenvíos — fase F04 del roadmap SaaS) se implementa con **Resend**, con templates de `react-email`. En el MVP, **la Plataforma envía desde su propio dominio en nombre del tenant** (formato "Tienda X · vía <plataforma>", con reply-to del Organizador); remitentes con dominio propio del tenant quedan post-MVP (exigirían verificación DNS por tenant). Decisión tomada con el usuario el 2026-07-16 (cierra la parte transaccional de la decisión abierta #2).

Razón: (a) capa gratuita de 3.000 correos/mes — órdenes de magnitud sobre el volumen esperado; (b) DX simple (SDK mínimo + react-email) acorde al principio "simple y barato"; (c) buena entregabilidad transaccional, el criterio crítico del flujo de compra; (d) familiaridad: el proyecto hermano `datawalt-app` ya tiene el cliente Resend integrado (`src/server/common/resend.ts`).

## Consecuencias

- El envío sigue siendo un **service** (`src/server/services/`) con la config inyectada (API key vía `src/env.js`); Resend es un adapter reemplazable.
- La verificación del dominio remitente requiere el **dominio de la Plataforma** — resuelto: `sorteatelo.cl` ([ADR-0014](0014-dominio-plataforma-sorteatelo-cl.md)); los registros DKIM/SPF se agregan al delegar el DNS (decisión #5, hosting). No bloquea el desarrollo: en dev se usa el remitente de prueba de Resend.
- El disclaimer de responsabilidad ([ADR-0008](0008-responsabilidad-legal-del-sorteo-del-organizador.md)) aplica también al correo: el comprador debe poder distinguir que compra al Organizador, no a la Plataforma.
- La necesidad (b) de la decisión #2 original — **buzones del dominio** (`contacto@sorteatelo.cl`) — NO la resuelve Resend; se resuelve al configurar el DNS del dominio (Cloudflare Email Routing / Zoho free, ver ADR-0014).
- API key de Resend en env vars; jamás en logs.
