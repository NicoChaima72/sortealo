import { env } from "~/env";
import { runDomain } from "~/server/api/runDomain";
import { createTRPCRouter, tenantProcedure } from "~/server/api/trpc";
import { esOperador, parsearAllowlist } from "~/server/authPolicy";
import { puedoEditar } from "~/server/domain/pagebuilder/puedoEditar";

/**
 * Router del page builder de cara al STOREFRONT (F09, ADR-0016/0019). `tenantProcedure`: el tenant se
 * resuelve SERVER-SIDE del host (`ctx.tenant`), jamás del input (I1). La sesión (`ctx.session`) viene
 * de la cookie wildcard (ADR-0019) — puede ser null (visitante anónimo).
 */
export const pagebuilderRouter = createTRPCRouter({
  /**
   * ¿El que mira puede editar esta Tienda? (banner "Editar mi tienda", F09). Anónimo ⇒ false (y así
   * la respuesta no depende de sesión para el 99% de los visitantes). Con sesión ⇒ autorización por
   * `TenantMembership`/Operador server-side (la cookie es identidad, no autorización, I7).
   */
  puedoEditar: tenantProcedure.query(({ ctx }) => {
    const user = ctx.session?.user;
    if (!user) return { puedeEditar: false };
    const esOp = esOperador(
      user.email,
      parsearAllowlist(env.PLATFORM_OPERATOR_EMAILS),
    );
    return runDomain(() =>
      puedoEditar({
        db: ctx.db,
        tenantId: ctx.tenant.id, // del host (I1), no del input
        userId: user.id,
        esOperador: esOp,
      }),
    );
  }),
});
