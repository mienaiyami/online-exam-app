import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { users, userRoles } from "@/server/db/schema";
import { eq, and, like, desc, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { isAdminOrInstructor, isAdmin } from "../utils/access";

const userColumns = {
    email: true,
    id: true,
    image: true,
    name: true,
} as const;

export const userRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        if (!(await isAdminOrInstructor(ctx))) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only admins or instructors can view all users",
            });
        }

        return await ctx.db.query.users.findMany({
            with: {
                roles: true,
            },
        });
    }),

    search: protectedProcedure
        .input(
            z.object({
                query: z.string(),
            }),
        )
        .query(async ({ ctx, input }) => {
            if (!(await isAdminOrInstructor(ctx))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only admins or instructors can search users",
                });
            }
            return await ctx.db.query.users.findMany({
                where: or(
                    like(users.email, `%${input.query}%`),
                    like(users.name, `%${input.query}%`),
                ),
                limit: 20,
                orderBy: [desc(users.email)],
                columns: userColumns,
                with: {
                    roles: {
                        columns: {
                            role: true,
                        },
                    },
                },
            });
        }),
    getById: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            if (!(await isAdminOrInstructor(ctx))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only admins or instructors can view user details",
                });
            }
            return await ctx.db.query.users.findFirst({
                where: eq(users.id, input),
                columns: userColumns,
            });
        }),
    getStudents: protectedProcedure.query(async ({ ctx }) => {
        if (!(await isAdminOrInstructor(ctx))) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only instructors or admins can view students",
            });
        }

        const studentRoles = await ctx.db.query.userRoles.findMany({
            where: eq(userRoles.role, "student"),
            with: {
                user: true,
            },
        });

        return studentRoles.map((role) => role.user);
    }),

    getUserRoles: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            if (!(await isAdmin(ctx))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only admins can view user roles",
                });
            }
            return await ctx.db.query.userRoles.findMany({
                where: eq(userRoles.userId, input),
            });
        }),

    assignRole: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                role: z.enum(["admin", "instructor", "student"]),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            if (!(await isAdmin(ctx))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only admins can assign roles",
                });
            }

            return await ctx.db.transaction(async (tx) => {
                const existingRole = await tx.query.userRoles.findFirst({
                    where: and(
                        eq(userRoles.userId, input.userId),
                        eq(userRoles.role, input.role),
                    ),
                });

                if (existingRole) {
                    return { success: true, message: "Role already assigned" };
                }

                await tx.insert(userRoles).values({
                    userId: input.userId,
                    role: input.role,
                });

                return { success: true };
            });
        }),

    removeRole: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                role: z.enum(["admin", "instructor", "student"]),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            if (!(await isAdmin(ctx))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only admins can remove roles",
                });
            }

            await ctx.db
                .delete(userRoles)
                .where(
                    and(
                        eq(userRoles.userId, input.userId),
                        eq(userRoles.role, input.role),
                    ),
                );

            return { success: true };
        }),

    getCurrentUserRoles: protectedProcedure.query(async ({ ctx }) => {
        const roles = await ctx.db.query.userRoles.findMany({
            where: eq(userRoles.userId, ctx.session.user.id),
        });
        return roles;
    }),
});
