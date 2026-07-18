import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Gate de autenticación del Editor MCP (F06/PD5, ADR-0016). Puro y testeable — separado del borde
 * HTTP. El MCP es god-mode del Operador: un único token Bearer compartido (`MCP_OPERADOR_TOKEN`).
 * Fail-closed: sin token configurado en env, NADIE entra (devuelve `false` siempre). El token jamás
 * se loguea. OAuth 2.1 per-tenant queda para fase Pro.
 */

/**
 * Comparación en TIEMPO CONSTANTE (anti-timing): hashea ambos a longitud fija con SHA-256 y usa
 * `timingSafeEqual` — no filtra ni la longitud ni el prefijo común. Es el único secreto server-to-
 * server comparado por igualdad en el repo, y el MCP es god-mode ⇒ vale el endurecimiento.
 */
function igualesConstante(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function verificarBearer(
  authHeader: string | null,
  token: string | undefined,
): boolean {
  if (!token) return false; // fail-closed: sin token configurado, nadie entra
  if (!authHeader) return false;
  return igualesConstante(authHeader, `Bearer ${token}`);
}
