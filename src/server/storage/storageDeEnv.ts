import { env } from "~/env";
import {
  crearStorageService,
  type StorageService,
} from "~/server/services/storage";

/**
 * Borde de cableado del storage R2 (F03): compone el `StorageService` con la config leída de
 * `env` (única parte que toca `~/env` — el service y el dominio nunca lo hacen, I5). Lo usan
 * el router del panel (subida del PDF) y el wrapper del endpoint de descarga.
 *
 * A diferencia de Flow (BYO por tenant, ADR-0006), el storage es de PLATAFORMA: una sola
 * config global (no hay `storageDeTenant`). Las env vars son opcionales en `env.js` (la app
 * arranca sin ellas); la factory hace fail-fast en runtime si faltan al presignar/subir (I4/I7).
 */
export function crearStorageDeEnv(): StorageService {
  return crearStorageService({
    endpoint: env.R2_ENDPOINT,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET,
  });
}
