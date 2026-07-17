import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Service Storage — adapter S3-compatible al bucket privado de PDFs (Cloudflare R2).
 *
 * Es un adapter de la capa `services/` (ADR-0002/0009): no conoce sesión ni reglas de
 * negocio, expone una interfaz estable para poder cambiar el proveedor concreto (R2 → S3 /
 * MinIO / otro) con fricción mínima. La config (endpoint/keys/bucket) entra como argumento
 * explícito de la factory (nunca importa `~/env` adentro), con fail-fast en runtime si falta
 * al ejecutar (I4/I7, patrón `services/flow.ts`). Los secretos NUNCA se loguean (I4).
 *
 * A diferencia de Flow (BYO por tenant, ADR-0006), el storage es de PLATAFORMA: una sola
 * cuenta R2 del Operador, un bucket con paths per-tenant. El aislamiento cross-tenant vive
 * en la KEY (`<tenantId>/<productId>.pdf`, siempre computada server-side, I6) y lo refuerza
 * el endpoint de descarga (defensa I9: jamás presignar una key fuera del prefijo del tenant
 * del grant). Ver ADR-0002 (entrega por URL firmada) y ADR-0009 (R2 S3-compatible).
 */

/** Expiración de la URL prefirmada de DESCARGA (GET). 10 min (ADR-0002/D6/S6). Constante. */
export const EXPIRACION_DESCARGA_SEGUNDOS = 600;
/** Expiración de la URL prefirmada de SUBIDA (PUT). 10 min (D6/S6). Constante. */
export const EXPIRACION_SUBIDA_SEGUNDOS = 600;

/** Content-Type único que aceptamos para el producto (MVP: PDF). */
export const CONTENT_TYPE_PDF = "application/pdf";

/**
 * Key determinística del PDF de un producto (D3/I6): `<tenantId>/<productId>.pdf`. Helper
 * PURO — una sola definición, la fuente del path per-tenant. El cliente NUNCA la elige: la
 * computa el server tanto para presignar la subida como para persistir `pdfPath`. Reemplazar
 * el PDF de un producto = re-presignar/overwrite la MISMA key (gratis por construcción).
 */
export function keyDePdfProducto(tenantId: string, productId: string): string {
  return `${tenantId}/${productId}.pdf`;
}

// Rango de caracteres de control (0x00–0x1F y 0x7F) y de ASCII imprimible (0x20–0x7E),
// como constantes para no incrustar bytes de control en las expresiones regulares.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = new RegExp("[\u0000-\u001f\u007f]", "g");
const NO_ASCII_PRINTABLE = new RegExp("[^\u0020-\u007e]", "g");

/**
 * Sanea el título de un producto para usarlo como nombre del archivo descargado (S8). Quita
 * caracteres de control y los peligrosos para un header `Content-Disposition` (comillas,
 * barras, CR/LF — anti header-injection), colapsa espacios, recorta el largo y garantiza
 * extensión `.pdf`.
 */
export function sanearNombreArchivo(titulo: string): string {
  const base = titulo
    .normalize("NFC")
    .replace(CONTROL_CHARS, "")
    .replace(/["\\/\r\n]/g, "") // comillas, barras, saltos de línea
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  const limpio = base.length > 0 ? base : "descarga";
  return limpio.toLowerCase().endsWith(".pdf") ? limpio : `${limpio}.pdf`;
}

/**
 * Valor de `Content-Disposition: attachment` con el filename saneado. Incluye el fallback
 * ASCII (`filename="…"`) y la variante RFC 5987 (`filename*=UTF-8''…`) para nombres con
 * acentos/no-ASCII. El adapter lo pasa como `ResponseContentDisposition` de la descarga.
 */
function contentDispositionAttachment(nombreArchivo: string): string {
  const asciiFallback = nombreArchivo.replace(NO_ASCII_PRINTABLE, "_").replace(/"/g, "");
  const encoded = encodeURIComponent(nombreArchivo);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export interface StorageConfig {
  endpoint: string | undefined;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  bucket: string | undefined;
}

export interface StorageService {
  /** URL prefirmada PUT para subir el objeto en `key` (content-type `application/pdf`). */
  presignarSubida(input: {
    key: string;
    expiresEnSegundos?: number;
  }): Promise<string>;
  /** URL prefirmada GET para descargar `key` como attachment con `nombreArchivo`. */
  presignarDescarga(input: {
    key: string;
    nombreArchivo: string;
    expiresEnSegundos?: number;
  }): Promise<string>;
  /** `true` si el objeto existe en el bucket; `false` si no (404 de R2). */
  headObject(key: string): Promise<boolean>;
  /** Sube un objeto server-side (scripts/usos futuros; el flujo del panel usa presign). */
  putObject(input: {
    key: string;
    body: Uint8Array | string;
    contentType?: string;
  }): Promise<void>;
  /** Borra un objeto (overwrite/limpieza; usado por el test de integración). */
  deleteObject(key: string): Promise<void>;
}

/** Fail-fast: exige que la config esté presente al ejecutar. NUNCA incluye el valor (secreto). */
function exigir(valor: string | undefined, nombre: string): string {
  if (!valor) {
    throw new Error(
      `Falta ${nombre} para operar con el storage R2 — configúralo en .env (ver .env.example).`,
    );
  }
  return valor;
}

export function crearStorageService(config: StorageConfig): StorageService {
  let clienteCache: S3Client | undefined;

  /** Resuelve (y memoiza) el S3Client + bucket, validando la config al ejecutar (fail-fast). */
  function resolver(): { s3: S3Client; bucket: string } {
    const endpoint = exigir(config.endpoint, "R2_ENDPOINT");
    const accessKeyId = exigir(config.accessKeyId, "R2_ACCESS_KEY_ID");
    const secretAccessKey = exigir(config.secretAccessKey, "R2_SECRET_ACCESS_KEY");
    const bucket = exigir(config.bucket, "R2_BUCKET");
    clienteCache ??= new S3Client({
      region: "auto", // R2 no usa regiones AWS (S4)
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true, // path-style predecible contra el endpoint de R2
      // Los checksums CRC32 default del aws-sdk v3 reciente rompen contra R2 (S4).
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
    return { s3: clienteCache, bucket };
  }

  return {
    async presignarSubida({ key, expiresEnSegundos }) {
      const { s3, bucket } = resolver();
      const comando = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: CONTENT_TYPE_PDF,
      });
      return getSignedUrl(s3, comando, {
        expiresIn: expiresEnSegundos ?? EXPIRACION_SUBIDA_SEGUNDOS,
        // Firma el content-type: la URL solo es válida si el cliente sube exactamente
        // `application/pdf` (sin esto el aws-sdk deja content-type fuera de SignedHeaders
        // y cualquier tipo pasaría). El fetch PUT del panel debe mandar ese header.
        signableHeaders: new Set(["content-type"]),
      });
    },

    async presignarDescarga({ key, nombreArchivo, expiresEnSegundos }) {
      const { s3, bucket } = resolver();
      const comando = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: contentDispositionAttachment(nombreArchivo),
        ResponseContentType: CONTENT_TYPE_PDF,
      });
      return getSignedUrl(s3, comando, {
        expiresIn: expiresEnSegundos ?? EXPIRACION_DESCARGA_SEGUNDOS,
      });
    },

    async headObject(key) {
      const { s3, bucket } = resolver();
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return true;
      } catch (e) {
        // R2/S3 devuelven 404 (NotFound / $metadata 404) para un objeto ausente: eso es
        // "no existe", no un error a propagar. Cualquier otro fallo (auth, red) sí se propaga.
        if (esNotFound(e)) return false;
        throw e;
      }
    },

    async putObject({ key, body, contentType }) {
      const { s3, bucket } = resolver();
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType ?? CONTENT_TYPE_PDF,
        }),
      );
    },

    async deleteObject(key) {
      const { s3, bucket } = resolver();
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

/** Distingue el 404 (objeto ausente) de un error real, sin depender de una clase concreta. */
function esNotFound(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const err = e as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return err.name === "NotFound" || err.$metadata?.httpStatusCode === 404;
}
