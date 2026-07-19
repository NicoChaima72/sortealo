import NextAuth from "next-auth";

import { authOptions } from "~/server/auth";

/**
 * Handler de NextAuth (Google OAuth). Ruta estándar del pages router — sin interceptores: en dev el
 * override de subdominio (F09d, `~/config` `devTienda`) hace que el storefront corra sobre el MISMO
 * host que el login (`localhost`), así que la cookie de sesión real alcanza sin necesidad de simular
 * la sesión del cliente.
 */
export default NextAuth(authOptions);
