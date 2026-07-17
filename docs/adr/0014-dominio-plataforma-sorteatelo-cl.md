# Dominio de la Plataforma: sorteatelo.cl (NIC Chile)

El dominio de la Plataforma es **`sorteatelo.cl`**, inscrito directamente en **NIC Chile** (sin
registrador intermediario) el **2026-07-17** a nombre del Operador de plataforma (Nicolás Chaima
Cisternas), por 1 año (CLP $9.990/año, renovación anual sin descuento por volumen). Decisión tomada
con el usuario el 2026-07-17 — cierra la decisión abierta **#4**. Alternativas descartadas en la
misma sesión: `sortealo.cl` (la idea original — ocupado), `rifamos.cl`/`rifatelo.cl` (disponibles,
pero "rifa" es una figura legal distinta del sorteo promocional asociado a compra — mal nombre para
una plataforma que camina fino en lo legal, ADR-0008), `sorteable.cl` y `compraygana.cl` (débiles
como marca). Comprar directo en NIC Chile en vez de GoDaddy/registradores: mitad de precio, sin
intermediario, y el DNS se delega igual donde se necesite.

Razón: nombre en chileno, cercano al dominio del producto (sorteos promocionales), corto y natural
como base de subdominios (`<slug>.sorteatelo.cl`, `contacto@sorteatelo.cl`); es nombre de la
**Plataforma**, no del fandom (criterio fijado en la decisión #4 tras el pivote ADR-0005).

## Consecuencias

- **Subdominios**: las Tiendas publicadas viven en `<slug>.sorteatelo.cl`; el apex
  (`sorteatelo.cl` / `www`) queda reservado a la Plataforma (ADR-0007). Dev sigue con
  `*.localhost` — nada cambia en el código por ahora.
- **DNS pendiente de la decisión #5 (hosting)**: los nameservers se delegan al cerrar hosting
  (si es Vercel, los dominios wildcard exigen los nameservers de Vercel). El requisito wildcard
  `*.sorteatelo.cl` + certificado wildcard (ADR-0007) ahora aplica sobre este dominio.
- **Resend (ADR-0010)**: la verificación del remitente (`DKIM`/`SPF`) se hace agregando registros
  DNS una vez delegado el DNS — enviar desde `@sorteatelo.cl` no requiere contratar buzones.
- **Buzones** (`contacto@sorteatelo.cl`, recepción): resolver con Cloudflare Email Routing o
  Zoho Mail free al configurar el DNS; sigue siendo la herencia de la antigua decisión #2.
- **`NEXTAUTH_URL`** y URLs de producción quedan desbloqueadas: `https://sorteatelo.cl`.
- **Marca**: el nombre de la plataforma deriva del dominio ("Sortéatelo"); estilización, paleta y
  tipografía siguen PENDIENTES y se cierran en la sesión de marca (`docs/design.md`). El nombre
  vivirá en `src/config/app.ts` (`APP_CONFIG.name`), nunca hardcodeado.
- **Renovación anual** en nic.cl (vence 2027-07-17): el costo lo cubre la mantención. No dejar
  vencer — un dominio caído bota TODOS los storefronts de los tenants.
