import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  examSessions,
  responses,
  questions,
  options,
  exams,
  examAssignments,
} from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const responseSchema = z.object({
  questionId: z.number().int().positive(),
  responseText: z.string().optional(),
  selectedOptionId: z.number().int().positive().optional(),
});

export const examSessionRouter = createTRPCRouter({
  start: protectedProcedure
    .input(z.object({ examId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const exam = await ctx.db.query.exams.findFirst({
        where: eq(exams.id, input.examId),
      });

      if (!exam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Exam not found",
        });
      }

      const assignment = await ctx.db.query.examAssignments.findFirst({
        where: and(
          eq(examAssignments.examId, input.examId),
          eq(examAssignments.userId, ctx.session.user.id),
        ),
      });

      if (!assignment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this exam",
        });
      }

      return await ctx.db.transaction(async (tx) => {
        const existingSession = await tx.query.examSessions.findFirst({
          where: and(
            eq(examSessions.userId, ctx.session.user.id),
            eq(examSessions.status, "in_progress"),
          ),
        });

        if (existingSession) {
          if (existingSession.examId !== input.examId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You are already taking another exam",
            });
          }
          return existingSession;
        }

        const [session] = await tx
          .insert(examSessions)
          .values({
            examId: input.examId,
            userId: ctx.session.user.id,
            status: "in_progress",
          })
          .returning();

        return session;
      });
    }),

  getActive: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.query.examSessions.findFirst({
        where: and(
          eq(examSessions.id, input.sessionId),
          eq(examSessions.userId, ctx.session.user.id),
        ),
        with: {
          exam: true,
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

      // todo: currently options are being send with "correct" field
      const examQuestions = await ctx.db.query.questions.findMany({
        where: eq(questions.examId, session.examId),
        with: {
          options: {
            orderBy: (options, { asc }) => [asc(options.orderIndex)],
          },
        },
        orderBy: (questions, { asc }) => [asc(questions.orderIndex)],
      });
      return {
        session,
        questions: examQuestions,
      };
    }),

  saveResponse: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().int().positive(),
        response: responseSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.query.examSessions.findFirst({
        where: and(
          eq(examSessions.id, input.sessionId),
          eq(examSessions.userId, ctx.session.user.id),
          eq(examSessions.status, "in_progress"),
        ),
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active session not found",
        });
      }

      const question = await ctx.db.query.questions.findFirst({
        where: and(
          eq(questions.id, input.response.questionId),
          eq(questions.examId, session.examId),
        ),
      });

      if (!question) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question not found for this exam",
        });
      }

      return await ctx.db.transaction(async (tx) => {
        const existingResponse = await tx.query.responses.findFirst({
          where: and(
            eq(responses.sessionId, input.sessionId),
            eq(responses.questionId, input.response.questionId),
          ),
        });

        if (existingResponse) {
          await tx
            .update(responses)
            .set({
              responseText: input.response.responseText,
              selectedOptionId: input.response.selectedOptionId,
            })
            .where(eq(responses.id, existingResponse.id));
        } else {
          await tx.insert(responses).values({
            sessionId: input.sessionId,
            questionId: input.response.questionId,
            responseText: input.response.responseText,
            selectedOptionId: input.response.selectedOptionId,
          });
        }

        return { success: true };
      });
    }),

  submit: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.query.examSessions.findFirst({
        where: and(
          eq(examSessions.id, input.sessionId),
          eq(examSessions.userId, ctx.session.user.id),
          eq(examSessions.status, "in_progress"),
        ),
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active session not found",
        });
      }

      return await ctx.db.transaction(async (tx) => {
        // auto grading mcq
        const sessionResponses = await tx.query.responses.findMany({
          where: eq(responses.sessionId, input.sessionId),
          with: {
            question: true,
            selectedOption: true,
          },
        });

        for (const response of sessionResponses) {
          if (
            response.question.questionType === "multiple_choice" &&
            response.selectedOption
          ) {
            await tx
              .update(responses)
              .set({
                points: response.selectedOption.isCorrect
                  ? response.question.points
                  : 0,
              })
              .where(eq(responses.id, response.id));
          }
        }

        const totalPointsResult = await tx
          .select({ sum: sql<number>`sum(${responses.points})` })
          .from(responses)
          .where(
            and(
              eq(responses.sessionId, input.sessionId),
              sql`${responses.points} IS NOT NULL`,
            ),
          );

        const totalPoints = totalPointsResult[0]?.sum ?? 0;

        await tx
          .update(examSessions)
          .set({
            status: "submitted",
            submittedAt: new Date(),
            totalPoints,
          })
          .where(eq(examSessions.id, input.sessionId));

        return { success: true, totalPoints };
      });
    }),

  getSessionsByExam: protectedProcedure
    .input(z.object({ examId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const exam = await ctx.db.query.exams.findFirst({
        where: eq(exams.id, input.examId),
      });

      if (!exam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Exam not found",
        });
      }

      if (exam.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can view sessions for this exam",
        });
      }

      return await ctx.db.query.examSessions.findMany({
        where: eq(examSessions.examId, input.examId),
        with: {
          user: true,
        },
        orderBy: (examSessions, { desc }) => [desc(examSessions.startedAt)],
      });
    }),

  getUserHistory: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.examSessions.findMany({
      where: eq(examSessions.userId, ctx.session.user.id),
      with: {
        exam: true,
      },
      orderBy: (examSessions, { desc }) => [desc(examSessions.startedAt)],
    });
  }),
});
