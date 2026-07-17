import { type NextApiRequest } from "next";

import { sanearNombreArchivo } from "~/server/services/storage";

/**
 * Núcleo testeable del endpoint público de descarga por token (F03/D5, patrón núcleo+wrapper
 * como el webhook de Flow). Recibe un `req` acotado y sus dependencias inyectables (el repo de
 * grants, el presigner de descarga, el reloj); devuelve `{ status, headers?, body? }` — NO
 * escribe la respuesta ni toca env. El wrapper (`src/pages/api/descargas/[token].ts`) lee env,
 * cablea `db` + storage y escribe `res`.
 *
 * Política (ADR-0002/0004/0005, invariantes I1-I3/I9):
 * - Método ≠ GET ⇒ 405 sin efecto.
 * - `token` ⇒ grant (unique global: token⇒grant⇒tenant/producto, igual que `Payment.token`).
 *   El endpoint NO exige sesión (ADR-0004: el Comprador no tiene cuenta; el token ES la
 *   autoridad).
 * - Grant vigente (`expiresAt` > ahora) Y `pdfPath` no-null ⇒ **302** con `Location` = URL
 *   prefirmada corta (~10 min) del `pdfPath`.
 * - **Cualquier otro caso ⇒ 404 neutral IDÉNTICO** (I3): token inexistente, grant expirado o
 *   PDF pendiente son indistinguibles por construcción (mismo status y body).
 * - **Defensa en profundidad (I9/I2)**: si `pdfPath` no empieza con `<grant.tenantId>/`, también
 *   404 neutral — jamás se presigna una key fuera del prefijo del tenant del grant (aunque la
 *   FK lo haga imposible por construcción, no confiamos: un tenant NUNCA sirve archivos de otro).
 * - **No loguea** token, path ni email en ningún camino (I4).
 */

/** Proyección del grant necesaria para decidir y presignar (la carga el repo del wrapper). */
export interface GrantParaDescarga {
  tenantId: string;
  pdfPath: string | null;
  /** Título del producto: base del nombre del archivo descargado (S8). */
  titulo: string;
  expiresAt: Date;
}

export type BuscarGrantPorToken = (
  token: string,
) => Promise<GrantParaDescarga | null>;

export type PresignarDescargaFn = (input: {
  key: string;
  nombreArchivo: string;
}) => Promise<string>;

export interface ManejarDescargaArgs {
  req: Pick<NextApiRequest, "method" | "query">;
  buscarGrant: BuscarGrantPorToken;
  presignarDescarga: PresignarDescargaFn;
  /** Reloj inyectable (default: ahora). Permite testear la expiración sin esperar. */
  ahora?: Date;
}

export interface RespuestaDescarga {
  status: number;
  headers?: Record<string, string>;
  body?: string;
}

/** Respuesta neutral IDÉNTICA para todos los caminos de fallo (I3). Única definición. */
const RESPUESTA_404_NEUTRAL: RespuestaDescarga = {
  status: 404,
  body: "No encontrado.",
};

/** Extrae el token del query del route dinámico `[token]`. */
function extraerToken(query: NextApiRequest["query"]): string | null {
  const t = query.token;
  if (typeof t === "string" && t.length > 0) return t;
  if (Array.isArray(t) && typeof t[0] === "string" && t[0].length > 0) return t[0];
  return null;
}

export async function manejarDescarga({
  req,
  buscarGrant,
  presignarDescarga,
  ahora = new Date(),
}: ManejarDescargaArgs): Promise<RespuestaDescarga> {
  // Gate de método: solo GET (es una descarga que el Comprador abre en el navegador).
  if (req.method !== "GET") {
    return { status: 405, body: "Método no permitido." };
  }

  const token = extraerToken(req.query);
  if (!token) return RESPUESTA_404_NEUTRAL;

  const grant = await buscarGrant(token);
  // Token inexistente ⇒ 404 neutral (indistinguible de expirado / PDF pendiente).
  if (!grant) return RESPUESTA_404_NEUTRAL;

  // Grant expirado ⇒ 404 neutral.
  if (grant.expiresAt.getTime() <= ahora.getTime()) return RESPUESTA_404_NEUTRAL;

  // PDF pendiente (pdfPath null) ⇒ 404 neutral.
  if (grant.pdfPath === null) return RESPUESTA_404_NEUTRAL;

  // Defensa I9: la key DEBE vivir bajo el prefijo del tenant del grant. Si no, 404 neutral
  // (jamás presignar una key de otro tenant). El grant y el pdfPath son del mismo tenant por
  // construcción (FK); esto es defensa en profundidad, no una ruta esperada.
  if (!grant.pdfPath.startsWith(`${grant.tenantId}/`)) return RESPUESTA_404_NEUTRAL;

  // Grant vigente + PDF presente + key bajo su prefijo ⇒ 302 a la URL prefirmada corta.
  const url = await presignarDescarga({
    key: grant.pdfPath,
    nombreArchivo: sanearNombreArchivo(grant.titulo),
  });

  return {
    status: 302,
    headers: {
      Location: url,
      // La URL prefirmada expira pronto (~10 min): no cachear el redirect.
      "Cache-Control": "no-store, max-age=0",
    },
  };
}
