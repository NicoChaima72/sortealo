/**
 * Parser PURO del host de un request → zona de la plataforma (ADR-0007, F01 paso 3).
 *
 * Sin `env`, sin DB, sin I/O: solo strings. Es la ÚNICA definición de "qué zona
 * es este host" y la consumen tanto el middleware (edge) como la resolución
 * server-side del contexto — misma respuesta en ambos lados por construcción.
 */

/**
 * Config inyectada. El dominio raíz NO se lee de `env` acá: entra como parámetro
 * explícito para que el núcleo sea puro y testeable (y porque el dominio real de
 * la plataforma es la decisión abierta #4 — el parser es genérico sobre él).
 */
export interface ConfigPlataforma {
  /** Dominio raíz de la plataforma, sin protocolo ni puerto. Ej: `localhost` en dev (S1). */
  dominioRaiz: string;
  /**
   * Override de DEV (F09d, `~/config` `devTienda`): si está seteado, el host APEX PELADO
   * (`localhost`, sin subdominio) resuelve como la Tienda de este slug EN VEZ DE la plataforma. Solo
   * el borde de cableado (`configPlataformaDesdeEnv`) lo puebla, y SOLO en `NODE_ENV=development`
   * (guard `devTiendaAplica`) — en prod queda `undefined` ⇒ el parser es idéntico a antes (inerte).
   * NO afecta a los subdominios reales (`autora.localhost`), que siguen su camino normal.
   */
  devTiendaSlug?: string;
}

/**
 * Zona a la que apunta un host.
 * - `plataforma`: apex o `www` — landing/onboarding/panel (S4, D6). Sin tenant.
 * - `tenant`: subdominio de una Tienda — storefront del Comprador. Trae el slug
 *   CANDIDATO: que exista y esté publicada lo decide `resolverTenantDesdeHost`.
 *
 * `null` (fuera de este tipo) = host no interpretable ⇒ fail-closed (sin tenant).
 */
export type ZonaHost =
  | { zona: "plataforma" }
  | { zona: "tenant"; slug: string };

/**
 * Normaliza el header `Host`: minúsculas, sin espacios, sin puerto y sin el punto
 * final del FQDN absoluto (`a.dominio.` es válido en DNS y llega igual).
 * El puerto se saca con `:\d+$` en vez de `split(":")` para que un literal IPv6
 * (`[::1]:3000`) no se convierta en basura silenciosa: queda `[::1]`, que no
 * cuelga del dominio raíz y cae en el fail-closed de abajo.
 */
function normalizarHost(host: string): string {
  return host
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function parsearHost(
  host: string | undefined | null,
  config: ConfigPlataforma,
): ZonaHost | null {
  const dominioRaiz = config.dominioRaiz;
  const normalizado = host ? normalizarHost(host) : "";
  if (!normalizado) return null;

  if (normalizado === dominioRaiz) {
    // Override de DEV (F09d): el host apex PELADO se comporta como una Tienda concreta, para trabajar
    // el storefront/editor con login real sobre un solo host (`~/config` `devTienda`). Es inerte en
    // prod porque `devTiendaSlug` solo se puebla en development (ver `configPlataformaDesdeEnv`). NO
    // toca los subdominios reales: `autora.localhost` no entra acá (no es === dominioRaiz), cae abajo.
    if (config.devTiendaSlug) {
      return { zona: "tenant", slug: config.devTiendaSlug };
    }
    return { zona: "plataforma" };
  }

  const sufijo = `.${dominioRaiz}`;
  if (!normalizado.endsWith(sufijo)) return null;

  const prefijo = normalizado.slice(0, -sufijo.length);
  if (prefijo === "www") return { zona: "plataforma" };

  // Fail-closed: solo un label DNS ÚNICO y bien formado es un slug candidato.
  // Esto descarta de una: anidados (`x.y.dominio` — el prefijo `x.y` no es un
  // label), prefijo vacío (`.dominio`) y cualquier forma inválida.
  if (!esSlugValido(prefijo)) return null;

  return { zona: "tenant", slug: prefijo };
}

/**
 * Forma válida de un slug de Tienda = forma válida de un **label DNS** (RFC 1035
 * + RFC 1123): 1-63 chars de `[a-z0-9-]`, sin guion al borde. No es una regla
 * inventada — es la consecuencia de S3/ADR-0007 ("el slug ES el subdominio"):
 * lo que no puede ser un label DNS no puede ser la dirección de una Tienda.
 *
 * Exportado para que la validación del alta de Tiendas (F08 self-service) use
 * ESTA definición y no una paralela que se desincronice.
 */
export function esSlugValido(slug: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug);
}
