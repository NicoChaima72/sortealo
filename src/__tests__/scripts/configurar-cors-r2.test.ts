import { type S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import {
  aplicarCorsR2,
  construirReglasCors,
  ORIGENES_DEV,
} from "../../../scripts/configurar-cors-r2";

/**
 * Test del núcleo del script de CORS de R2 (F03). El `send` del S3Client se inyecta como fake
 * (sin red): verifica que las reglas habilitan el PUT desde los orígenes de dev con
 * content-type, y que el núcleo envía exactamente esa configuración al bucket.
 */

describe("scripts/configurar-cors-r2 — construirReglasCors (puro)", () => {
  // cors.r2.reglas.001
  it("habilita PUT con content-type desde el apex y los subdominios de tenant en :3001", () => {
    const reglas = construirReglasCors();
    expect(reglas).toHaveLength(1);
    const regla = reglas[0]!;
    expect(regla.AllowedMethods).toEqual(["PUT"]);
    expect(regla.AllowedHeaders).toEqual(["content-type"]);
    expect(regla.AllowedOrigins).toEqual(ORIGENES_DEV);
    expect(regla.AllowedOrigins).toContain("http://localhost:3001");
    expect(regla.AllowedOrigins).toContain("http://*.localhost:3001");
  });
});

describe("scripts/configurar-cors-r2 — aplicarCorsR2 (núcleo, fake send)", () => {
  // cors.r2.aplicar.001
  it("envía PutBucketCors con las reglas al bucket dado", async () => {
    const send = vi.fn().mockResolvedValue({});
    const client = { send } as unknown as Pick<S3Client, "send">;

    const res = await aplicarCorsR2({ client, bucket: "sortealo-dev" });

    expect(res.bucket).toBe("sortealo-dev");
    expect(send).toHaveBeenCalledTimes(1);
    const comando = send.mock.calls[0]![0] as {
      input: { Bucket: string; CORSConfiguration: { CORSRules: unknown[] } };
    };
    expect(comando.input.Bucket).toBe("sortealo-dev");
    expect(comando.input.CORSConfiguration.CORSRules).toEqual(
      construirReglasCors(),
    );
  });
});
