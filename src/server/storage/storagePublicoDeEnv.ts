import { env } from "~/env";
import {
  crearStoragePublicoService,
  type StoragePublicoService,
} from "~/server/services/storagePublico";

/**
 * Borde de cableado del storage PÚBLICO de assets de marca (plantilla-rica F01/ADR-0013): compone
 * el `StoragePublicoService` con la config leída de `env` (única parte que toca `~/env` — el
 * service y el dominio nunca lo hacen, I5). Lo usa el router del panel (subida de logo/hero/
 * portada/premio por presigned PUT + confirmación).
 *
 * Reusa la cuenta R2 del Operador (mismo endpoint/keys que el bucket privado, ADR-0009) pero
 * apunta al bucket PÚBLICO (`R2_PUBLIC_BUCKET`) y su base de URL (`R2_PUBLIC_BASE_URL`). Las env
 * son opcionales en `env.js` (la app arranca sin ellas); la factory hace fail-fast en runtime si
 * faltan al presignar/componer (I7).
 */
export function crearStoragePublicoDeEnv(): StoragePublicoService {
  return crearStoragePublicoService({
    endpoint: env.R2_ENDPOINT,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_PUBLIC_BUCKET,
    baseUrl: env.R2_PUBLIC_BASE_URL,
  });
}
