/**
 * Helpers PUROS para armar URLs al APEX de la plataforma desde el storefront de un subdominio (F09b,
 * ADR-0019/D6). El login (OAuth) y el panel del Organizador viven en el apex (`NEXTAUTH_URL` fijo, un
 * único redirect URI de Google); el storefront vive en el subdominio. Un enlace de "Iniciar sesión" en
 * la tienda debe apuntar al apex con `callbackUrl` = la URL actual (validada contra `*.<apex>` por F08).
 * Client+server safe (solo strings). Nada hardcodeado: el apex sale de env/host.
 */

/**
 * Deriva el dominio del apex desde el `hostname` de un subdominio de Tienda, quitando el label del
 * `slug`. `autora.sorteatelo.cl` + slug `autora` ⇒ `sorteatelo.cl`; `autora.localhost` ⇒ `localhost`.
 * Fallback: si el host no empieza con `<slug>.`, devuelve el host tal cual (defensivo).
 */
export function apexDesdeHost(hostname: string, slug: string): string {
  const prefijo = `${slug}.`;
  return hostname.startsWith(prefijo) ? hostname.slice(prefijo.length) : hostname;
}

/**
 * Construye una URL absoluta al apex: `<protocol>//<apex>[:puerto]<path>[?callbackUrl=...]`. El
 * `callbackUrl` se URL-encodea. `protocol` incluye los `:` (como `window.location.protocol`).
 */
export function construirUrlApex({
  protocol,
  apex,
  puerto,
  path,
  callbackUrl,
}: {
  protocol: string;
  apex: string;
  puerto?: string;
  path: string;
  callbackUrl?: string;
}): string {
  const host = puerto ? `${apex}:${puerto}` : apex;
  const url = `${protocol}//${host}${path}`;
  return callbackUrl ? `${url}?callbackUrl=${encodeURIComponent(callbackUrl)}` : url;
}
