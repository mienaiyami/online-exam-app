import { and, eq } from "drizzle-orm";
import { userRoles } from "@/server/db/schema";
import type { TRPCContext } from "../trpc";

// ! instead of this, make specific protected procedures for each role?

export const isAdmin = async (ctx: TRPCContext): Promise<boolean> => {
    if (!ctx.session) return false;

    const isAdmin = await ctx.db.query.userRoles.findFirst({
        where: and(
            eq(userRoles.userId, ctx.session.user.id),
            eq(userRoles.role, "admin"),
        ),
    });

    return !!isAdmin;
};
export const isInstructor = async (ctx: TRPCContext): Promise<boolean> => {
    if (!ctx.session) return false;
    const isInstructor = await ctx.db.query.userRoles.findFirst({
        where: and(
            eq(userRoles.userId, ctx.session.user.id),
            eq(userRoles.role, "instructor"),
        ),
    });
    return !!isInstructor;
};
export const isAdminOrInstructor = async (
    ctx: TRPCContext,
): Promise<boolean> => {
    if (!ctx.session) return false;
    const isInstructor = await ctx.db.query.userRoles.findFirst({
        where: and(
            eq(userRoles.userId, ctx.session.user.id),
            eq(userRoles.role, "instructor"),
        ),
    });

    const isAdmin = await ctx.db.query.userRoles.findFirst({
        where: and(
            eq(userRoles.userId, ctx.session.user.id),
            eq(userRoles.role, "admin"),
        ),
    });

    return !!isInstructor || !!isAdmin;
};
