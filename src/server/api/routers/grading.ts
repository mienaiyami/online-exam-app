import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { examSessions, responses, exams } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const gradingRouter = createTRPCRouter({
  getSessionForGrading: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.query.examSessions.findFirst({
        where: eq(examSessions.id, input.sessionId),
        with: {
          exam: true,
          user: true,
          responses: {
            with: {
              question: true,
              selectedOption: true,
            },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (session.exam.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can grade this exam",
        });
      }

      return session;
    }),

  gradeResponse: protectedProcedure
    .input(
      z.object({
        responseId: z.number().int().positive(),
        // todo: currently has a risk, if response.points is not properly taken from question.points
        points: z.number().int().nonnegative(),
        feedback: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.db.query.responses.findFirst({
        where: eq(responses.id, input.responseId),
        with: {
          session: {
            with: {
              exam: true,
            },
          },
        },
      });

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Response not found",
        });
      }

      if (response.session.exam.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can grade this exam",
        });
      }

      return await ctx.db.transaction(async (tx) => {
        await tx
          .update(responses)
          .set({
            points: input.points,
            feedback: input.feedback,
            gradedBy: ctx.session.user.id,
            gradedAt: new Date(),
          })
          .where(eq(responses.id, input.responseId));

        const totalPointsResult = await tx
          .select({ sum: sql<number>`sum(${responses.points})` })
          .from(responses)
          .where(
            and(
              eq(responses.sessionId, response.sessionId),
              sql`${responses.points} IS NOT NULL`,
            ),
          );

        const totalPoints = totalPointsResult[0]?.sum ?? 0;

        const allResponses = await tx.query.responses.findMany({
          where: eq(responses.sessionId, response.sessionId),
        });

        const allGraded = allResponses.every((r) => r.points !== null);

        await tx
          .update(examSessions)
          .set({
            totalPoints,
            status: allGraded ? "graded" : "submitted",
          })
          .where(eq(examSessions.id, response.sessionId));

        return { success: true, totalPoints };
      });
    }),
});
