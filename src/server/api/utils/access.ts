import { and, eq, InferSelectModel } from "drizzle-orm";
import { exams, userRoles } from "@/server/db/schema";
import type { TRPCContext } from "../trpc";
import { TRPCError } from "@trpc/server";

// ! instead of this, make specific protected procedures for each role?

export const isAdmin = async (ctx: TRPCContext): Promise<boolean> => {
    if (!ctx.session) return false;
    return ctx.session.user.roles.includes("admin");
};
export const isInstructor = async (ctx: TRPCContext): Promise<boolean> => {
    if (!ctx.session) return false;
    return ctx.session.user.roles.includes("instructor");
};
export const isAdminOrInstructor = async (
    ctx: TRPCContext,
): Promise<boolean> => {
    if (!ctx.session) return false;
    return (
        ctx.session.user.roles.includes("admin") ||
        ctx.session.user.roles.includes("instructor")
    );
};

export const canAccessExam = async (
    ctx: TRPCContext,
    examId: number,
    allowAdmin = false,
): Promise<InferSelectModel<typeof exams> | null> => {
    if (!ctx.session) return null;
    const exam = await ctx.db.query.exams.findFirst({
        where: eq(exams.id, examId),
    });
    if (!exam) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Exam not found",
        });
    }
    if (
        exam.createdById !== ctx.session.user.id &&
        !(allowAdmin && ctx.session.user.roles.includes("admin"))
    ) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not allowed to access this exam",
        });
    }
    return exam;
};
