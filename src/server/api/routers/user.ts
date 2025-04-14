import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { users, userRoles } from "@/server/db/schema";
import {
    eq,
    and,
    like,
    desc,
    or,
    inArray,
    sql,
    asc,
    exists,
} from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { isAdminOrInstructor, isAdmin } from "../utils/access";

const userColumns = {
    email: true,
    id: true,
    image: true,
    name: true,
} as const;

type UserWithRoles = {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    roles: Array<"admin" | "instructor" | "student">;
};

export const userRouter = createTRPCRouter({
    getAllStudentsByIds: protectedProcedure
        .input(z.array(z.string()))
        .query(async ({ ctx, input }) => {
            return await ctx.db.query.users.findMany({
                where: inArray(users.id, input),
                columns: {
                    email: true,
                    id: true,
                },
            });
        }),

    search: protectedProcedure
        .input(
            z.object({
                query: z.string().default(""),
                role: z.enum(["admin", "instructor", "student", "all"]),
            }),
        )
        .query(async ({ ctx, input }) => {
            if (!(await isAdminOrInstructor(ctx))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only admins or instructors can search users",
                });
            }

            if (!input.query && ["all", "student"].includes(input.role)) {
                return [];
            }

            const results = await ctx.db
                .select({
                    user: users,
                    role: userRoles.role,
                })
                .from(users)
                .leftJoin(userRoles, eq(users.id, userRoles.userId))
                .where(
                    and(
                        or(
                            like(users.email, `%${input.query}%`),
                            like(users.name, `%${input.query}%`),
                        ),
                        input.role === "all"
                            ? undefined
                            : exists(
                                  ctx.db
                                      .select({ id: userRoles.userId })
                                      .from(userRoles)
                                      .where(
                                          and(
                                              eq(userRoles.userId, users.id),
                                              eq(userRoles.role, input.role),
                                          ),
                                      ),
                              ),
                    ),
                )
                .limit(20)
                .orderBy(desc(users));

            const userMap = new Map<string, UserWithRoles>();

            for (const row of results) {
                const userId = row.user.id;

                if (!userMap.has(userId)) {
                    userMap.set(userId, {
                        id: row.user.id,
                        email: row.user.email,
                        name: row.user.name,
                        image: row.user.image,
                        roles: [],
                    });
                }

                if (row.role) {
                    const user = userMap.get(userId);
                    if (user) {
                        user.roles.push(row.role);
                    }
                }
            }

            return Array.from(userMap.values());
        }),

    searchStudents: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                page: z.number().int().default(0),
                limit: z.number().int().min(1).max(100).default(10),
            }),
        )
        .query(async ({ ctx, input }) => {
            if (!(await isAdminOrInstructor(ctx))) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only admins or instructors can search students",
                });
            }

            const studentRoleId = "student";

            const countResult = await ctx.db
                .select({ count: sql<number>`count(*)` })
                .from(users)
                .leftJoin(userRoles, eq(users.id, userRoles.userId))
                .where(
                    and(
                        like(users.email, `%${input.query}%`),
                        eq(userRoles.role, studentRoleId),
                    ),
                );

            const totalCount = countResult[0]?.count ?? 0;

            const students = await ctx.db.query.users.findMany({
                where: like(users.email, `%${input.query}%`),
                limit: input.limit,
                offset: input.page * input.limit,
                orderBy: [asc(users.email)],
                with: {
                    roles: {
                        where: eq(userRoles.role, studentRoleId),
                        columns: {
                            userId: true,
                            role: true,
                        },
                    },
                },
            });

            return {
                students,
                totalCount,
                page: input.page,
                limit: input.limit,
                pageCount: Math.ceil(totalCount / input.limit),
            };
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
        if (roles.length === 0) {
            return await ctx.db
                .insert(userRoles)
                .values({
                    userId: ctx.session.user.id,
                    role: "student",
                })
                .returning();
        }
        return roles;
    }),
});
