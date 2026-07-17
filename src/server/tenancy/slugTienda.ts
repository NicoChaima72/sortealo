import { esSlugValido } from "~/server/tenancy/parsearHost";

/**
 * Disponibilidad de un slug para el alta self-service de Tiendas (F08/D7).
 *
 * El slug ES el subdominio de la Tienda (ADR-0007). Su forma válida la define
 * `esSlugValido` (label DNS, en `parsearHost.ts`): se REUSA acá, no se
 * reimplementa, para que la validación del alta y la resolución del host nunca
 * se desincronicen (drift que advirtió F01-B). Este módulo solo agrega la capa de
 * **reservados**: labels que son DNS-válidos pero que la plataforma se reserva
 * (apex/www, endpoints, el propio panel del Operador). La **unicidad** NO vive
 * acá: la garantiza el `@unique` de `Tenant.slug` en la DB (colisión ⇒ CONFLICT).
 */

/**
 * Slugs que la plataforma se reserva y que NINGUNA Tienda puede tomar, aunque sean
 * labels DNS válidos: el apex/www (ADR-0007), los prefijos de endpoints/infra, y las
 * superficies de administración de la plataforma. Vive JUNTO a `esSlugValido` (misma
 * carpeta `tenancy/`) a propósito: la definición de "qué es un subdominio de Tienda" y
 * "qué subdominios NO puede tomar una Tienda" no deben poder divergir.
 */
export const SLUGS_RESERVADOS: ReadonlySet<string> = new Set([
  "www",
  "api",
  "admin",
  "app",
  "panel",
  "operador",
  "mail",
  "email",
  "smtp",
  "static",
  "assets",
  "cdn",
  "dev",
  "staging",
  "test",
  "status",
  "docs",
  "blog",
  "help",
  "soporte",
  "support",
  "billing",
  "pagos",
  "checkout",
  "webhooks",
  "webhook",
  "auth",
  "login",
  "cuenta",
  "account",
]);

/**
 * `true` sii `slug` (normalizado `trim` + `toLowerCase`) está reservado por la plataforma.
 * Normaliza antes de comparar para que `ADMIN`/`  www ` no burlen la lista.
 */
export function esSlugReservado(slug: string): boolean {
  return SLUGS_RESERVADOS.has(slug.trim().toLowerCase());
}

/**
 * `true` sii `slug` puede TOMARSE como subdominio de una Tienda nueva: es un label DNS
 * válido (`esSlugValido`, reusado) Y no está reservado. NO consulta la DB: la unicidad
 * la resuelve el `@unique` de la DB en el momento del create (colisión ⇒ CONFLICT).
 */
export function esSlugDisponible(slug: string): boolean {
  return esSlugValido(slug) && !esSlugReservado(slug);
}
