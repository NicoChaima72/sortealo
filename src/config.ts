/**
 * config — configuración de DEV que simula el SUBDOMINIO de una Tienda (F09d, estilo datawalt-app).
 *
 * ⚠️ SOLO afecta DEVELOPMENT. En producción se trabaja SIEMPRE a nivel de subdominios reales
 * (`autora.sorteatelo.cl`, ADR-0007). En dev NO existen los subdominios cómodamente (`*.localhost`
 * no comparte cookies), así que en vez de simular una SESIÓN, simulamos el SUBDOMINIO: con
 * `devTienda.enabled` prendido, el host apex pelado (`localhost:<puerto>`) ENTERO se comporta como la
 * Tienda `slug`. La gracia es que con UN SOLO host el login real de Google y las cookies funcionan
 * normal, sin trucos: la cookie es host-only sobre `localhost`, no hay nada que cruzar entre
 * subdominios.
 *
 * Consecuencia con `enabled: true`:
 *  - `http://localhost:3001/`        ⇒ storefront de la Tienda `slug` (no la landing de plataforma).
 *  - `http://localhost:3001/login`   ⇒ login real de Google (mismo host ⇒ cookie host-only funciona).
 *  - `http://localhost:3001/editor`  ⇒ editor de la Tienda `slug` (tras autorizar por membresía).
 *  - `http://localhost:3001/admin`   ⇒ panel del Organizador (mismo host, sigue alcanzable).
 * Los subdominios REALES (`http://autora.localhost:3001/`) siguen funcionando igual: el override solo
 * toca el host pelado, no un subdominio ya escrito a mano.
 *
 * En PRODUCCIÓN es INERTE por diseño: el guard `devTiendaAplica` exige `nodeEnv === "development"`, así
 * que aunque `enabled` quede en `true`, en prod jamás aplica (cubierto por test). Es el único archivo
 * que hay que tocar para prender/apagar el override (o cambiar de Tienda de trabajo).
 */
export const devTienda = {
  /** Slug de la Tienda que el host apex pelado impersona en dev (debe existir y estar PUBLICADA). */
  slug: "autora",
  /** Switch maestro. `true` + `NODE_ENV=development` ⇒ el apex pelado = la Tienda `slug`. `false` ⇒ apex/plataforma normal. */
  enabled: true,
};

/**
 * Guard PURO del override de subdominio de dev — testeable sin manosear `process.env`. Devuelve `true`
 * SOLO si el switch está prendido Y el runtime es `development`. En cualquier otro `nodeEnv` (production,
 * test) es `false`: garantiza que el mecanismo es inerte fuera de dev (el ruteo por subdominio real manda).
 */
export function devTiendaAplica({
  enabled,
  nodeEnv,
}: {
  enabled: boolean;
  nodeEnv: string | undefined;
}): boolean {
  return enabled && nodeEnv === "development";
}
