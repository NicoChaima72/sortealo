import { checkoutRouter } from "~/server/api/routers/checkout";
import { operadorRouter } from "~/server/api/routers/operador";
import { pagebuilderRouter } from "~/server/api/routers/pagebuilder";
import { panelRouter } from "~/server/api/routers/panel";
import { postRouter } from "~/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  checkout: checkoutRouter,
  panel: panelRouter,
  operador: operadorRouter,
  pagebuilder: pagebuilderRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
