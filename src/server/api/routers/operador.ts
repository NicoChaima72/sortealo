import { runDomain } from "~/server/api/runDomain";
import { createTRPCRouter, panelProcedure } from "~/server/api/trpc";
import { listarTiendas } from "~/server/domain/operador/listarTiendas";
import { reactivarTienda } from "~/server/domain/operador/reactivarTienda";
import {
  reactivarTiendaInput,
  suspenderTiendaInput,
} from "~/server/domain/operador/schemas";
import { suspenderTienda } from "~/server/domain/operador/suspenderTienda";

/**
 * Router del panel del Operador de plataforma (F08/F04, D9) — SUPERVISIÓN, no operación de
 * contenido. Todos sus procedures usan `panelProcedure` (exige sesión + carga `ctx.acceso`); la
 * autorización REAL es `acceso.esOperador` verificado DENTRO de cada use case (server-side, del
 * env `PLATFORM_OPERATOR_EMAILS`). Se monta APARTE de `panelRouter` para que la frontera "esto es
 * del Operador, autorizado por el flag, no por membresía" quede visible en el shape del API.
 *
 * El `tenantId` de suspender/reactivar entra por input (el Operador opera cualquier Tienda), pero
 * SELECCIONA, no autoriza (I1/I5). Ningún procedure edita productos/precios/credenciales/config.
 */
export const operadorRouter = createTRPCRouter({
  listarTiendas: panelProcedure.query(({ ctx }) =>
    runDomain(() => listarTiendas({ db: ctx.db, acceso: ctx.acceso })),
  ),

  suspenderTienda: panelProcedure
    .input(suspenderTiendaInput)
    .mutation(({ ctx, input }) =>
      runDomain(() =>
        suspenderTienda({ db: ctx.db, acceso: ctx.acceso, input }),
      ),
    ),

  reactivarTienda: panelProcedure
    .input(reactivarTiendaInput)
    .mutation(({ ctx, input }) =>
      runDomain(() =>
        reactivarTienda({ db: ctx.db, acceso: ctx.acceso, input }),
      ),
    ),
});
