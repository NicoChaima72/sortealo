import { type PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { setColorAcento } from "~/server/domain/pagebuilder/setColorAcento";
import { setColorAcentoInput } from "~/server/domain/pagebuilder/schemas";

/**
 * Tests del segundo color de marca (builder-tanda-1 F01/D2). El `colorAcento` vive en
 * `Tenant.colorAcento`, FUERA del Documento (I-T1). El borde valida el hex (`setColorAcentoInput`);
 * la autorización por membresía la hace `exigirEditor` en el router (ver `exigirEditor.test.ts`).
 */

/** DB fake que captura el `update` (sin Prisma real). */
function fakeDb() {
  const update = vi.fn().mockResolvedValue({});
  return { db: { tenant: { update } } as unknown as PrismaClient, update };
}

describe("pagebuilder/setColorAcentoInput — validación de hex en el borde", () => {
  // acento.input.001 — acepta hex de 3/6 dígitos y null; rechaza el resto SIN escribir (parse falla antes)
  it("acepta hex 3/6 y null; rechaza no-hex / vacío / campo extra", () => {
    expect(setColorAcentoInput.safeParse({ colorAcento: "#abc" }).success).toBe(true);
    expect(setColorAcentoInput.safeParse({ colorAcento: "#7c3aed" }).success).toBe(true);
    expect(setColorAcentoInput.safeParse({ colorAcento: null }).success).toBe(true);
    expect(setColorAcentoInput.safeParse({ colorAcento: "7c3aed" }).success).toBe(false);
    expect(setColorAcentoInput.safeParse({ colorAcento: "" }).success).toBe(false);
    expect(setColorAcentoInput.safeParse({ colorAcento: "rojo" }).success).toBe(false);
  });
});

describe("pagebuilder/setColorAcento — use case", () => {
  // acento.usecase.001 — escribe el hex validado en la columna del tenant (tenantId server-side, I1)
  it("escribe el hex en Tenant.colorAcento para el tenantId dado", async () => {
    const { db, update } = fakeDb();
    const res = await setColorAcento({ db, tenantId: "t-1", colorAcento: "#7c3aed" });
    expect(res).toEqual({ colorAcento: "#7c3aed" });
    expect(update).toHaveBeenCalledWith({
      where: { id: "t-1" },
      data: { colorAcento: "#7c3aed" },
    });
  });

  // acento.usecase.002 — null limpia el acento (⇒ degradación a marca, I-T2)
  it("null limpia el acento", async () => {
    const { db, update } = fakeDb();
    const res = await setColorAcento({ db, tenantId: "t-1", colorAcento: null });
    expect(res).toEqual({ colorAcento: null });
    expect(update).toHaveBeenCalledWith({ where: { id: "t-1" }, data: { colorAcento: null } });
  });

  // acento.usecase.003 — defensa: un valor no-hex (que no debería pasar el borde) se normaliza a null
  it("normaliza un valor no-hex a null (defensa en profundidad)", async () => {
    const { db, update } = fakeDb();
    const res = await setColorAcento({ db, tenantId: "t-1", colorAcento: "basura" });
    expect(res).toEqual({ colorAcento: null });
    expect(update).toHaveBeenCalledWith({ where: { id: "t-1" }, data: { colorAcento: null } });
  });
});
