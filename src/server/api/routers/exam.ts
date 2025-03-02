import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { exams, questions, options, examAssignments } from "@/server/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const questionTypeSchema = z.enum(["multiple_choice", "short_answer", "essay"]);

const createExamSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  timeLimit: z.number().int().positive(),
  availableFrom: z.date().optional(),
  availableTo: z.date().optional(),
});

const createQuestionSchema = z.object({
  examId: z.number().int().positive(),
  questionText: z.string().min(1),
  questionType: questionTypeSchema,
  points: z.number().int().positive().default(1),
  orderIndex: z.number().int().nonnegative(),
  options: z
    .array(
      z.object({
        optionText: z.string().min(1),
        isCorrect: z.boolean().default(false),
        orderIndex: z.number().int().nonnegative(),
      }),
    )
    .optional(),
});

const assignExamSchema = z.object({
  examId: z.number().int().positive(),
  userIds: z.array(z.string()),
});

export const examRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createExamSchema)
    .mutation(async ({ ctx, input }) => {
      const [exam] = await ctx.db
        .insert(exams)
        .values({
          title: input.title,
          description: input.description,
          timeLimit: input.timeLimit,
          availableFrom: input.availableFrom,
          availableTo: input.availableTo,
          createdById: ctx.session.user.id,
        })
        .returning();

      return exam;
    }),

  // exams created by the current user
  getCreatedExams: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.exams.findMany({
      where: eq(exams.createdById, ctx.session.user.id),
      orderBy: (exams, { desc }) => [desc(exams.createdAt)],
    });
  }),

  // exams assigned to the current user
  getAssignedExams: protectedProcedure.query(async ({ ctx }) => {
    const assignments = await ctx.db.query.examAssignments.findMany({
      where: eq(examAssignments.userId, ctx.session.user.id),
      with: {
        exam: true,
      },
    });

    return assignments.map((assignment) => assignment.exam);
  }),

  getById: protectedProcedure
    .input(z.object({ examId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const exam = await ctx.db.query.exams.findFirst({
        where: eq(exams.id, input.examId),
        with: {
          questions: {
            with: {
              options: true,
            },
            orderBy: (questions, { asc }) => [asc(questions.orderIndex)],
          },
        },
      });

      if (!exam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Exam not found",
        });
      }

      const isCreator = exam.createdById === ctx.session.user.id;

      if (!isCreator) {
        const assignment = await ctx.db.query.examAssignments.findFirst({
          where: and(
            eq(examAssignments.examId, input.examId),
            eq(examAssignments.userId, ctx.session.user.id),
          ),
        });

        if (!assignment) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this exam",
          });
        }
      }

      return exam;
    }),

  addQuestion: protectedProcedure
    .input(createQuestionSchema)
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

      if (exam.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can add questions to this exam",
        });
      }

      return await ctx.db.transaction(async (tx) => {
        const [question] = await tx
          .insert(questions)
          .values({
            examId: input.examId,
            questionText: input.questionText,
            questionType: input.questionType,
            points: input.points,
            orderIndex: input.orderIndex,
          })
          .returning();

        if (!question) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create question",
          });
        }

        if (
          input.questionType === "multiple_choice" &&
          input.options &&
          input.options.length > 0
        ) {
          await tx.insert(options).values(
            input.options.map((option) => ({
              questionId: question.id,
              optionText: option.optionText,
              isCorrect: option.isCorrect,
              orderIndex: option.orderIndex,
            })),
          );
        }

        return question;
      });
    }),

  assignExam: protectedProcedure
    .input(assignExamSchema)
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

      if (exam.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can assign this exam",
        });
      }

      await ctx.db.insert(examAssignments).values(
        input.userIds.map((userId) => ({
          examId: input.examId,
          userId,
        })),
      );

      return { success: true };
    }),

  getAvailableExams: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const assignments = await ctx.db.query.examAssignments.findMany({
      where: eq(examAssignments.userId, ctx.session.user.id),
      with: {
        exam: true,
      },
    });

    return assignments
      .map((assignment) => assignment.exam)
      .filter((exam) => {
        const isAvailableNow =
          (!exam.availableFrom || exam.availableFrom <= now) &&
          (!exam.availableTo || exam.availableTo >= now);

        return isAvailableNow;
      });
  }),
});
