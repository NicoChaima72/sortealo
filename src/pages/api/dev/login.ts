import { randomUUID } from "node:crypto";
import { type NextApiRequest, type NextApiResponse } from "next";

import { env } from "~/env";
import { db } from "~/server/db";
import { resolverDominioCookieSesion } from "~/server/sesion/dominioCookie";
import { configPlataformaDesdeEnv } from "~/server/tenancy/configPlataforma";

/**
 * Login DEV cross-subdominio (F08/R3, ADR-0019) — SOLO fuera de producción (404 en prod). Prueba el
 * 100% del flujo de sesión al wildcard sin Google/certs: `GET /api/dev/login?slug=autora` en el apex
 * `lvh.me:3001` crea una sesión de DB para el DUEÑO de esa tienda y setea la cookie con
 * `Domain=.lvh.me` ⇒ la sesión se ve en `autora.lvh.me:3001` (habilita el banner "Editar mi tienda").
 *
 * REVISABLE (desvío del ADR): ADR-0019 propone un `CredentialsProvider` de NextAuth, pero éste es
 * INCOMPATIBLE con el adapter de DB (NextAuth fuerza JWT para credentials, y este proyecto usa
 * sesiones de DB). Este endpoint preserva la INTENCIÓN del ADR (dev cross-subdominio sin Google)
 * creando una `Session` de DB directamente (el mismo modelo que usa el `PrismaAdapter`) y seteando la
 * cookie con el mismo nombre/dominio que `authOptions.cookies.sessionToken`. El flujo Google real se
 * sigue probando con túnel cloudflared al apex (memoria del proyecto).
 */
const DIAS_30_MS = 30 * 24 * 60 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (env.NODE_ENV === "production") {
    res.status(404).end(); // dev-only: no existe en producción
    return;
  }
  // Solo GET dispara el efecto (se usa como enlace del navegador). Otros verbos ⇒ 405.
  if (req.method !== "GET") {
    res.status(405).json({ error: "Solo GET." });
    return;
  }

  const slug = typeof req.query.slug === "string" ? req.query.slug : null;
  if (!slug) {
    res.status(400).json({ error: "Falta ?slug=<tienda>" });
    return;
  }

  // Dueño de la tienda: la primera membresía (MVP: 1 Organizador por Tienda, D8).
  const membership = await db.tenantMembership.findFirst({
    where: { tenant: { slug } },
    select: { userId: true, user: { select: { email: true } } },
  });
  if (!membership) {
    res.status(404).json({
      error: `No hay dueño para la tienda "${slug}". Creá la membresía con: npm run otorgar:membresia.`,
    });
    return;
  }

  // Sesión de DB (mismo modelo `Session` que usa el PrismaAdapter de NextAuth).
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + DIAS_30_MS);
  await db.session.create({
    data: { sessionToken, userId: membership.userId, expires },
  });

  // Cookie con el MISMO nombre que NextAuth en dev + `Domain=.<apex>` (wildcard). Construida a mano
  // para no agregar dependencia; `getServerAuthSession` la resuelve por el sessionToken.
  const domain = resolverDominioCookieSesion(configPlataformaDesdeEnv());
  const partes = [
    `next-auth.session-token=${sessionToken}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Expires=${expires.toUTCString()}`,
  ];
  if (domain) partes.push(`Domain=${domain}`);
  res.setHeader("Set-Cookie", partes.join("; "));

  res.status(200).json({ ok: true, slug, email: membership.user.email });
}
