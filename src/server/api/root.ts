import { examRouter } from "@/server/api/routers/exam";
import { examSessionRouter } from "@/server/api/routers/examSession";
import { gradingRouter } from "@/server/api/routers/grading";
import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  exam: examRouter,
  examSession: examSessionRouter,
  grading: gradingRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
