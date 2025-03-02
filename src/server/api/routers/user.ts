import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { users, userRoles } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userRole = await ctx.db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.userId, ctx.session.user.id),
        eq(userRoles.role, "admin"),
      ),
    });

    if (!userRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view all users",
      });
    }

    return await ctx.db.query.users.findMany({
      with: {
        roles: true,
      },
    });
  }),

  getStudents: protectedProcedure.query(async ({ ctx }) => {
    const userRole = await ctx.db.query.userRoles.findFirst({
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

    if (!userRole && !isAdmin) {
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
      const userRole = await ctx.db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.userId, ctx.session.user.id),
          eq(userRoles.role, "admin"),
        ),
      });

      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can assign roles",
        });
      }

      return await ctx.db.transaction(async (tx) => {
        const user = await tx.query.users.findFirst({
          where: eq(users.id, input.userId),
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

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

  getCurrentUserRoles: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.userRoles.findMany({
      where: eq(userRoles.userId, ctx.session.user.id),
    });
  }),
});
