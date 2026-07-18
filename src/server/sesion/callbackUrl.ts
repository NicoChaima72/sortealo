import { parsearHost, type ConfigPlataforma } from "~/server/tenancy/parsearHost";

/**
 * Validación del `callbackUrl` de NextAuth contra el WILDCARD de la plataforma (F08/D11, ADR-0019).
 * Con la cookie de sesión al wildcard, un `redirect` sin validar sería un OPEN-REDIRECT (el OAuth
 * dance podría devolver a un host ajeno con la sesión). Reusa `parsearHost` (misma definición de "qué
 * es un host de la plataforma") — no una lista paralela que se desincronice. Puro.
 *
 * Reglas (se aplican en el callback `redirect` de NextAuth):
 *  - URL RELATIVA (`/algo`) ⇒ se ancla al `baseUrl` (mismo origen). Caso más común.
 *  - URL ABSOLUTA cuyo host es el apex o un subdominio de Tienda (parseable por `parsearHost`) ⇒ se
 *    permite tal cual (redirección cross-subdominio legítima dentro de la plataforma).
 *  - Cualquier otra (host ajeno, URL corrupta) ⇒ cae al `baseUrl` (fail-closed, sin open-redirect).
 */
export function validarCallbackUrl({
  url,
  baseUrl,
  config,
}: {
  url: string;
  baseUrl: string;
  config: ConfigPlataforma;
}): string {
  // Relativa ⇒ mismo origen. Acepta `/ruta` pero NO `//host` (protocol-relative = host ajeno).
  if (url.startsWith("/") && !url.startsWith("//")) {
    return `${baseUrl}${url}`;
  }

  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return baseUrl; // URL no parseable ⇒ fail-closed
  }

  // Host del apex o de un subdominio de Tienda ⇒ dentro de la plataforma (parsearHost !== null).
  return parsearHost(host, config) !== null ? url : baseUrl;
}
