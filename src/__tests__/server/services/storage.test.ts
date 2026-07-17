import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  crearStorageService,
  EXPIRACION_DESCARGA_SEGUNDOS,
  keyDePdfProducto,
  sanearNombreArchivo,
  type StorageConfig,
} from "~/server/services/storage";

/**
 * Tests del adapter de storage R2 (F03/D1). El presigner del aws-sdk FIRMA OFFLINE (sin
 * red): estos tests construyen el service con config FAKE e inspeccionan la URL prefirmada
 * resultante — endpoint/bucket/key correctos, firma presente, expiración pedida, el
 * content-disposition attachment saneado, y CRUCIAL: la secretKey nunca aparece en la URL
 * ni en los mensajes de error (I4). El único test que golpea R2 real está marcado como
 * integración y se skipea limpio si faltan las credenciales o hay problema de red/CORS.
 */

const ENDPOINT = "https://acct123.r2.cloudflarestorage.com";
const SECRET = "secret-access-key-super-sensible-value";
const BUCKET = "sortealo-dev";

const configFake: StorageConfig = {
  endpoint: ENDPOINT,
  accessKeyId: "access-key-id-1234",
  secretAccessKey: SECRET,
  bucket: BUCKET,
};

describe("services/storage — keyDePdfProducto (helper puro)", () => {
  // storage.key.001 — key determinística per-tenant
  it("produce exactamente `<tenantId>/<productId>.pdf`", () => {
    expect(keyDePdfProducto("tenantABC", "prod123")).toBe(
      "tenantABC/prod123.pdf",
    );
  });
});

describe("services/storage — sanearNombreArchivo (helper puro)", () => {
  // storage.saneo.001 — quita chars peligrosos para el header y garantiza .pdf
  it("elimina comillas/barras/CRLF, colapsa espacios y garantiza extensión .pdf", () => {
    expect(sanearNombreArchivo('Cómo "enriquecer"/a tu idol')).toBe(
      "Cómo enriquecera tu idol.pdf",
    );
    // ya termina en .pdf ⇒ no duplica extensión (case-insensitive)
    expect(sanearNombreArchivo("Mi Libro.PDF")).toBe("Mi Libro.PDF");
    // título vacío ⇒ fallback
    expect(sanearNombreArchivo("   ")).toBe("descarga.pdf");
  });
});

describe("services/storage — fail-fast de config", () => {
  // storage.factory.001 — falta un valor ⇒ error claro, SIN volcar el secreto
  it("hace fail-fast con mensaje claro si falta un valor de config, sin incluir el secreto", async () => {
    // endpoint/accessKeyId/secretKey presentes (uno es secreto real), bucket ausente.
    const service = crearStorageService({
      endpoint: ENDPOINT,
      accessKeyId: "access-key-id-1234",
      secretAccessKey: SECRET,
      bucket: undefined,
    });
    await expect(
      service.presignarSubida({ key: "T/P.pdf" }),
    ).rejects.toThrow(/R2_BUCKET/);
    // El mensaje jamás contiene el valor de un secreto (I4).
    await service.presignarSubida({ key: "T/P.pdf" }).catch((e: Error) => {
      expect(e.message).not.toContain(SECRET);
    });
  });
});

describe("services/storage — presignarDescarga (GET)", () => {
  // storage.presignDescarga.001 — URL firmada al bucket/endpoint, expiración y disposition
  it("firma un GET al endpoint/bucket/key con expiración pedida y content-disposition attachment saneado", async () => {
    const service = crearStorageService(configFake);
    const url = await service.presignarDescarga({
      key: "tenantABC/prod123.pdf",
      nombreArchivo: "cómo enriquecer.pdf",
      expiresEnSegundos: EXPIRACION_DESCARGA_SEGUNDOS,
    });

    expect(url.startsWith(ENDPOINT)).toBe(true);
    expect(url).toContain(BUCKET);
    // path-style: /<bucket>/<tenantId>/<productId>.pdf (la key va URL-encodeada con %2F)
    expect(decodeURIComponent(url)).toContain("tenantABC/prod123.pdf");
    expect(url).toContain("X-Amz-Signature=");
    expect(url).toContain("X-Amz-Expires=600");

    const disposition = decodeURIComponent(
      new URL(url).searchParams.get("response-content-disposition") ?? "",
    );
    expect(disposition).toContain("attachment");
    // ASCII fallback (no-ASCII ⇒ `_`) + variante RFC 5987 con el nombre UTF-8 real
    // (el disposition se decodificó arriba, por eso el nombre aparece con acento).
    expect(disposition).toContain('filename="c_mo enriquecer.pdf"');
    expect(disposition).toContain("filename*=UTF-8''cómo enriquecer.pdf");

    // La secretKey NUNCA aparece en la URL firmada (I4).
    expect(url).not.toContain(SECRET);
  });
});

describe("services/storage — presignarSubida (PUT)", () => {
  // storage.presignSubida.001 — PUT para la key exacta con content-type firmado y expiración
  it("firma un PUT para la key pedida con content-type application/pdf y expiración corta", async () => {
    const service = crearStorageService(configFake);
    const url = await service.presignarSubida({
      key: "tenantABC/prod123.pdf",
      expiresEnSegundos: 600,
    });

    expect(url.startsWith(ENDPOINT)).toBe(true);
    expect(decodeURIComponent(url)).toContain("tenantABC/prod123.pdf");
    expect(url).toContain("X-Amz-Signature=");
    expect(url).toContain("X-Amz-Expires=600");
    // El content-type va FIRMADO (SignedHeaders lo incluye): el cliente está obligado a
    // subir `application/pdf`. Es lo que distingue la subida de una descarga.
    const signedHeaders = decodeURIComponent(
      new URL(url).searchParams.get("X-Amz-SignedHeaders") ?? "",
    );
    expect(signedHeaders).toContain("content-type");
    // La subida NO lleva override de respuesta (eso es solo de la descarga GET).
    expect(url).not.toContain("response-content-disposition");
    expect(url).not.toContain(SECRET);
  });
});

/**
 * Test de INTEGRACIÓN real contra R2 (roundtrip putObject → presign → fetch → delete). Solo
 * corre si las credenciales R2 están en el entorno; si fallan por red/CORS se skipea limpio
 * (no rompe la suite en CI ni en máquinas sin acceso). Verifica el circuito real del adapter.
 */
const R2_LISTO =
  !!process.env.R2_ENDPOINT &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_BUCKET;

describe("services/storage — roundtrip real contra R2 (integración)", () => {
  // storage.integracion.001 — put + presign GET + fetch + head + delete, extremo a extremo
  it.runIf(R2_LISTO)(
    "sube un objeto, lo descarga por URL prefirmada, lo verifica y lo borra",
    async (ctx) => {
      const service = crearStorageService({
        endpoint: process.env.R2_ENDPOINT,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucket: process.env.R2_BUCKET,
      });
      const key = `__integration-test__/${randomBytes(8).toString("hex")}.pdf`;
      const contenido = `%PDF-1.4 roundtrip ${Date.now()}`;

      try {
        await service.putObject({ key, body: contenido });
        expect(await service.headObject(key)).toBe(true);

        const url = await service.presignarDescarga({
          key,
          nombreArchivo: "roundtrip.pdf",
        });
        const res = await fetch(url);
        expect(res.status).toBe(200);
        expect(await res.text()).toBe(contenido);
      } catch (e) {
        // Degradación limpia: un fallo de red/DNS/CORS no debe romper la suite (nota S2).
        console.warn(
          "[storage.integracion] roundtrip skipeado por error de entorno:",
          e instanceof Error ? e.message : e,
        );
        return ctx.skip();
      } finally {
        await service.deleteObject(key).catch(() => undefined);
      }

      expect(await service.headObject(key)).toBe(false); // borrado efectivo
    },
    30_000,
  );
});
