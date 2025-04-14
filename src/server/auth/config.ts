import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
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
import { randomUUID } from "crypto";

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
    session: {
        strategy: "jwt",
    },

    providers: [
        // DiscordProvider
        GitHubProvider,
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: "Mock Credentials",
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "mock@example.com",
                },
            },
            async authorize(credentials) {
                if (!credentials?.email) {
                    return null;
                }

                const user = await db.query.users.findFirst({
                    where: eq(users.email, credentials.email as string),
                });

                if (!user?.id.startsWith("mock-")) {
                    return null;
                }
                return user;
            },
        }),
    ],
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    callbacks: {
        session: async ({ session, token }) => {
            // token.sub is the user id
            if (!token.sub) {
                return session;
            }
            const userRolesList = await db.query.userRoles.findMany({
                where: eq(userRoles.userId, token.sub),
            });
            const roles = userRolesList.map((role) => role.role);
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.sub,
                    roles,
                },
            };
        },
        signIn: async ({ user }) => {
            if (!user?.id) {
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
