import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/server/db";
import {
    accounts,
    sessions,
    userRoles,
    users,
    verificationTokens,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/env";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            // ...other properties
            roles: ("admin" | "instructor" | "student")[];
        } & DefaultSession["user"];
    }

    // interface User {
    //   // ...other properties
    //   // role: UserRole;
    // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
    // debug: process.env.NODE_ENV === "development",
    providers: [
        // DiscordProvider
        GitHubProvider,
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    callbacks: {
        session: async ({ session, user }) => {
            const userRolesList = await db.query.userRoles.findMany({
                where: eq(userRoles.userId, user.id),
            });
            const roles = userRolesList.map((role) => role.role);
            return {
                ...session,
                user: {
                    ...session.user,
                    id: user.id,
                    roles,
                },
            };
        },
        signIn: async ({ user }) => {
            if (!user.id) {
                return false;
            }
            const existingRole = await db.query.userRoles.findMany({
                where: eq(userRoles.userId, user.id),
            });
            if (existingRole.length === 0) {
                await db.insert(userRoles).values({
                    role: "student",
                    userId: user.id,
                });
            }
            return true;
        },
    },
} satisfies NextAuthConfig;
