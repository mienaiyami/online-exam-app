import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
    exams,
    questions,
    options,
    examAssignments,
    users,
} from "@/server/db/schema";
import { eq, and, gte, lte, InferSelectModel, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { canAccessExam, isInstructor } from "../utils/access";

const questionTypeSchema = z.enum(["multiple_choice", "short_answer", "essay"]);

const createExamSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    timeLimit: z.number().int().positive(),
    availableFrom: z.date().optional(),
    availableTo: z.date().optional(),
});
const updateExamSchema = createExamSchema.extend({
    examId: z.number().int().positive(),
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
            }),
        )
        .optional(),
});

const updateQuestionSchema = createQuestionSchema
    .omit({ examId: true })
    .extend({
        questionId: z.number().int().positive(),
    });

const assignExamSchema = z.object({
    examId: z.number().int().positive(),
    userIds: z.array(z.string()),
});

const assignExamBulkSchema = z.object({
    examId: z.number().int().positive(),
    userIdentifiers: z.array(
        z.object({
            type: z.enum(["id", "email"]),
            value: z.string(),
        }),
    ),
});

export const examRouter = createTRPCRouter({
    create: protectedProcedure
        .input(createExamSchema)
        .mutation(async ({ ctx, input }) => {
            if (!(await isInstructor(ctx))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only instructors can create exams",
                });
            }
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

            if (!exam) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create exam",
                });
            }
            return exam;
        }),
    finalizeExam: protectedProcedure
        .input(z.object({ examId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            await canAccessExam(ctx, input.examId);

            await ctx.db
                .update(exams)
                .set({ finalized: true })
                .where(eq(exams.id, input.examId));
            return { success: true };
        }),
    deleteExam: protectedProcedure
        .input(z.object({ examId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            await canAccessExam(ctx, input.examId, true);

            await ctx.db.delete(exams).where(eq(exams.id, input.examId));

            return { success: true, message: "Exam deleted successfully" };
        }),

    updateExam: protectedProcedure
        .input(updateExamSchema)
        .mutation(async ({ ctx, input }) => {
            const { examId, ...updateData } = input;

            await canAccessExam(ctx, examId, true);

            const [updatedExam] = await ctx.db
                .update(exams)
                .set(updateData)
                .where(eq(exams.id, examId))
                .returning();

            return updatedExam;
        }),

    // exams created by the current user
    getCreatedExams: protectedProcedure.query(async ({ ctx }) => {
        if (!(await isInstructor(ctx))) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only instructors can view created exams",
            });
        }
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

    // only for instructors
    getById: protectedProcedure
        .input(z.object({ examId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            const exam = await ctx.db.query.exams.findFirst({
                where: (exams) =>
                    and(
                        eq(exams.id, input.examId),
                        eq(exams.createdById, ctx.session.user.id),
                    ),
                with: {
                    questions: {
                        with: {
                            options: true,
                        },
                        orderBy: (questions, { asc }) => [
                            asc(questions.orderIndex),
                        ],
                    },
                },
            });

            if (!exam) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Exam (created by you) not found",
                });
            }

            return exam;
        }),

    getByIdForStudent: protectedProcedure
        .input(z.object({ examId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
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

            const exam = await ctx.db.query.exams.findFirst({
                where: eq(exams.id, input.examId),
            });

            if (!exam) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Exam not found",
                });
            }
            const questionsCount = await ctx.db
                .select({
                    count: sql<number>`count(*)`,
                })
                .from(questions)
                .where(eq(questions.examId, input.examId));

            if (!questionsCount[0]?.count) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to get questions count",
                });
            }

            return {
                ...exam,
                questionsCount: questionsCount[0]?.count ?? 0,
            };
        }),
    addQuestion: protectedProcedure
        .input(createQuestionSchema)
        .mutation(async ({ ctx, input }) => {
            await canAccessExam(ctx, input.examId);

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
                        input.options.map((option, i) => ({
                            questionId: question.id,
                            optionText: option.optionText,
                            isCorrect: option.isCorrect,
                            orderIndex: i,
                        })),
                    );
                }

                return question;
            });
        }),

    updateQuestion: protectedProcedure
        .input(updateQuestionSchema)
        .mutation(async ({ ctx, input }) => {
            const question = await ctx.db.query.questions.findFirst({
                where: eq(questions.id, input.questionId),
                with: {
                    exam: true,
                },
            });

            if (!question) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Question not found",
                });
            }

            if (question.exam.createdById !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "Only the creator can update questions in this exam",
                });
            }

            return await ctx.db.transaction(async (tx) => {
                const [updatedQuestion] = await tx
                    .update(questions)
                    .set({
                        questionText: input.questionText,
                        questionType: input.questionType,
                        points: input.points,
                        orderIndex: input.orderIndex,
                    })
                    .where(eq(questions.id, input.questionId))
                    .returning();

                if (!updatedQuestion) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to update question",
                    });
                }

                if (input.questionType === "multiple_choice" && input.options) {
                    if (input.options.length === 0) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message:
                                "Multiple choice questions must have at least one option",
                        });
                    }
                    await tx
                        .delete(options)
                        .where(eq(options.questionId, input.questionId));

                    if (input.options.length > 0) {
                        await tx.insert(options).values(
                            input.options.map((option, i) => ({
                                questionId: input.questionId,
                                optionText: option.optionText,
                                isCorrect: option.isCorrect,
                                orderIndex: i,
                            })),
                        );
                    }
                }

                return updatedQuestion;
            });
        }),

    reorderQuestions: protectedProcedure
        .input(
            z.object({
                examId: z.number().int().positive(),
                questionIds: z.array(z.number().int().positive()),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            await canAccessExam(ctx, input.examId);

            await ctx.db.transaction(async (tx) => {
                for (let i = 0; i < input.questionIds.length; i++) {
                    await tx
                        .update(questions)
                        .set({ orderIndex: i })
                        .where(eq(questions.id, input.questionIds[i]!));
                }
            });

            return {
                success: true,
                message: "Questions reordered successfully",
            };
        }),
    deleteQuestion: protectedProcedure
        .input(z.object({ questionId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            const question = await ctx.db.query.questions.findFirst({
                where: eq(questions.id, input.questionId),
                with: {
                    exam: true,
                },
            });

            if (!question) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Question not found",
                });
            }

            if (question.exam.createdById !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "Only the creator can delete questions in this exam",
                });
            }

            await ctx.db
                .delete(questions)
                .where(eq(questions.id, input.questionId));

            return { success: true, message: "Question deleted successfully" };
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
            if (!exam.finalized) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot assign an exam that is not finalized",
                });
            }

            if (exam.createdById !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only the creator can assign this exam",
                });
            }

            const result = {
                success: true,
                assignedCount: 0,
                alreadyAssignedCount: 0,
                notFoundCount: [] as string[],
                totalInputCount: input.userIds.length,
            };

            await ctx.db.transaction(async (tx) => {
                for (const userId of input.userIds) {
                    const user = await tx.query.users.findFirst({
                        where: eq(users.id, userId),
                    });

                    if (!user) {
                        result.notFoundCount.push(userId);
                        continue;
                    }

                    const existingAssignment =
                        await tx.query.examAssignments.findFirst({
                            where: and(
                                eq(examAssignments.examId, input.examId),
                                eq(examAssignments.userId, userId),
                            ),
                        });

                    if (existingAssignment) {
                        result.alreadyAssignedCount++;
                        continue;
                    }

                    await tx.insert(examAssignments).values({
                        examId: input.examId,
                        userId,
                    });

                    result.assignedCount++;
                }
            });

            return result;
        }),

    assignExamBulk: protectedProcedure
        .input(assignExamBulkSchema)
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
            if (!exam.finalized) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot assign an exam that is not finalized",
                });
            }

            if (exam.createdById !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only the creator can assign this exam",
                });
            }

            const result = {
                success: true,
                assignedCount: 0,
                alreadyAssignedCount: 0,
                notFoundCount: [] as string[],
                totalInputCount: input.userIdentifiers.length,
            };

            await ctx.db.transaction(async (tx) => {
                for (const identifier of input.userIdentifiers) {
                    let user: InferSelectModel<typeof users> | undefined;

                    if (identifier.type === "id") {
                        user = await tx.query.users.findFirst({
                            where: eq(users.id, identifier.value),
                        });
                    } else {
                        user = await tx.query.users.findFirst({
                            where: eq(users.email, identifier.value),
                        });
                    }

                    if (!user) {
                        result.notFoundCount.push(identifier.value);
                        continue;
                    }

                    const existingAssignment =
                        await tx.query.examAssignments.findFirst({
                            where: and(
                                eq(examAssignments.examId, input.examId),
                                eq(examAssignments.userId, user.id),
                            ),
                        });

                    if (existingAssignment) {
                        result.alreadyAssignedCount++;
                        continue;
                    }

                    await tx.insert(examAssignments).values({
                        examId: input.examId,
                        userId: user.id,
                    });

                    result.assignedCount++;
                }
            });

            return result;
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
            .filter((assignment) => {
                const exam = assignment.exam;
                const isAvailableNow =
                    (!exam.availableFrom || exam.availableFrom <= now) &&
                    (!exam.availableTo || exam.availableTo >= now);

                return isAvailableNow;
            })
            .map((assignment) => ({
                ...assignment.exam,
                assignment: {
                    completed: assignment.completed,
                    id: assignment.id,
                },
            }));
    }),

    getQuestions: protectedProcedure
        .input(
            z.object({
                examId: z.number().nullable(),
            }),
        )
        .query(async ({ ctx, input }) => {
            if (!input.examId) {
                return [];
            }
            await canAccessExam(ctx, input.examId);
            return (
                (await ctx.db.query.questions.findMany({
                    where: eq(questions.examId, input.examId),
                    orderBy: (questions, { asc }) => [
                        asc(questions.orderIndex),
                    ],
                    with: {
                        options: true,
                    },
                })) || []
            );
        }),
});
