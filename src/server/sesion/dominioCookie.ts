import { type ConfigPlataforma } from "~/server/tenancy/parsearHost";

/**
 * Dominio de la cookie de sesión al WILDCARD (F08/D11, ADR-0019). La cookie `sessionToken` de NextAuth
 * (de DB, token opaco) se emite con `Domain=.<apex>` para que el navegador la mande a CUALQUIER
 * subdominio y `getServerAuthSession` la resuelva en el storefront del tenant — habilita el banner
 * "Editar mi tienda" (F09). Puro: recibe el apex ya resuelto (`ConfigPlataforma`), separado del acceso
 * a env para testear sin `process.env`.
 *
 * - Apex real (`sorteatelo.cl`, `lvh.me`) ⇒ `.<apex>` (con punto líder ⇒ compartida por subdominios).
 * - `localhost` (dev por defecto, S1) ⇒ `undefined`: los `*.localhost` NO comparten cookies entre
 *   subdominios (por eso dev cross-subdominio usa `lvh.me`, R3). Cookie host-only = comportamiento
 *   actual, sin cambio de sesión para quien desarrolla en localhost.
 *
 * El fail-fast "en producción exige el apex" NO vive acá: lo garantiza `configPlataformaDesdeEnv`
 * (throw si falta `NEXT_PUBLIC_PLATFORM_DOMAIN` en prod, ADR-0007). Este resolver solo mapea el apex
 * ya resuelto al valor del `Domain`.
 */
export function resolverDominioCookieSesion(
  config: ConfigPlataforma,
): string | undefined {
  if (config.dominioRaiz === "localhost") return undefined;
  return `.${config.dominioRaiz}`;
}
