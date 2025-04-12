import { relations, sql } from "drizzle-orm";
import {
    index,
    integer,
    pgTableCreator,
    primaryKey,
    text,
    timestamp,
    varchar,
    boolean,
    pgEnum,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const questionTypeEnum = pgEnum("question_type", [
    "multiple_choice",
    //todo later
    "short_answer",
    "essay",
]);

export const examSessionStatusEnum = pgEnum("exam_session_status", [
    "in_progress",
    "submitted",
    "graded",
]);

export const userRoleEnum = pgEnum("user_role", [
    "admin",
    "instructor",
    "student",
]);

export const createTable = pgTableCreator((name) => `online-exam-app_${name}`);

export const users = createTable("user", {
    id: varchar("id", { length: 255 })
        .notNull()
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: timestamp("email_verified", {
        mode: "date",
        withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    roles: many(userRoles),
    createdExams: many(exams, { relationName: "createdExams" }),
    assignedExams: many(examAssignments),
    examSessions: many(examSessions),
    gradedResponses: many(responses, { relationName: "gradedResponses" }),
}));

export const accounts = createTable(
    "account",
    {
        userId: varchar("user_id", { length: 255 })
            .notNull()
            .references(() => users.id),
        type: varchar("type", { length: 255 })
            .$type<AdapterAccount["type"]>()
            .notNull(),
        provider: varchar("provider", { length: 255 }).notNull(),
        providerAccountId: varchar("provider_account_id", {
            length: 255,
        }).notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: varchar("token_type", { length: 255 }),

        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),

        scope: varchar("scope", { length: 255 }),
        id_token: text("id_token"),
        session_state: varchar("session_state", { length: 255 }),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
        userIdIdx: index("account_user_id_idx").on(account.userId),
    }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
    "session",
    {
        sessionToken: varchar("session_token", { length: 255 })
            .notNull()
            .primaryKey(),
        userId: varchar("user_id", { length: 255 })
            .notNull()
            .references(() => users.id),
        expires: timestamp("expires", {
            mode: "date",
            withTimezone: true,
        }).notNull(),
    },
    (session) => ({
        userIdIdx: index("session_user_id_idx").on(session.userId),
    }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
    "verification_token",
    {
        identifier: varchar("identifier", { length: 255 }).notNull(),
        token: varchar("token", { length: 255 }).notNull(),
        expires: timestamp("expires", {
            mode: "date",
            withTimezone: true,
        }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    }),
);

//
//
//

export const exams = createTable("exam", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    // in minutes
    timeLimit: integer("time_limit").notNull(),
    availableFrom: timestamp("available_from", { withTimezone: true }),
    availableTo: timestamp("available_to", { withTimezone: true }),
    finalized: boolean("finalized").notNull().default(false),
    createdById: varchar("created_by", { length: 255 })
        .notNull()
        .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
        () => new Date(),
    ),
});

export const questions = createTable("question", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    examId: integer("exam_id")
        .notNull()
        .references(() => exams.id, { onDelete: "cascade" }),
    questionText: text("question_text").notNull(),
    questionType: questionTypeEnum("question_type").notNull(),
    points: integer("points").notNull().default(1),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
        () => new Date(),
    ),
});

export const options = createTable("option", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    questionId: integer("question_id")
        .notNull()
        .references(() => questions.id, { onDelete: "cascade" }),
    optionText: text("option_text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    orderIndex: integer("order_index").notNull(),
});

export const examAssignments = createTable("exam_assignment", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    examId: integer("exam_id")
        .notNull()
        .references(() => exams.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
});

export const examSessions = createTable("exam_session", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    examId: integer("exam_id")
        .notNull()
        .references(() => exams.id),
    userId: varchar("user_id", { length: 255 })
        .notNull()
        .references(() => users.id),
    startedAt: timestamp("started_at", { withTimezone: true })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    status: examSessionStatusEnum("status").notNull().default("in_progress"),
    totalPoints: integer("total_points"),
});

export const responses = createTable("response", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    sessionId: integer("session_id")
        .notNull()
        .references(() => examSessions.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
        .notNull()
        .references(() => questions.id),
    responseText: text("response_text"),
    selectedOptionId: integer("selected_option_id").references(
        () => options.id,
    ),
    points: integer("points"), // for single response
    gradedBy: varchar("graded_by", { length: 255 }).references(() => users.id),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
    feedback: text("feedback"),
});

export const userRoles = createTable("user_role", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: varchar("user_id", { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
});

export const examsRelations = relations(exams, ({ one, many }) => ({
    creator: one(users, {
        fields: [exams.createdById],
        references: [users.id],
        relationName: "createdExams",
    }),
    questions: many(questions),
    assignments: many(examAssignments),
    sessions: many(examSessions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
    exam: one(exams, { fields: [questions.examId], references: [exams.id] }),
    options: many(options),
    responses: many(responses),
}));

export const optionsRelations = relations(options, ({ one }) => ({
    question: one(questions, {
        fields: [options.questionId],
        references: [questions.id],
    }),
}));

export const examAssignmentsRelations = relations(
    examAssignments,
    ({ one }) => ({
        exam: one(exams, {
            fields: [examAssignments.examId],
            references: [exams.id],
        }),
        user: one(users, {
            fields: [examAssignments.userId],
            references: [users.id],
        }),
    }),
);

export const examSessionsRelations = relations(
    examSessions,
    ({ one, many }) => ({
        exam: one(exams, {
            fields: [examSessions.examId],
            references: [exams.id],
        }),
        user: one(users, {
            fields: [examSessions.userId],
            references: [users.id],
        }),
        responses: many(responses),
    }),
);

export const responsesRelations = relations(responses, ({ one }) => ({
    session: one(examSessions, {
        fields: [responses.sessionId],
        references: [examSessions.id],
    }),
    question: one(questions, {
        fields: [responses.questionId],
        references: [questions.id],
    }),
    selectedOption: one(options, {
        fields: [responses.selectedOptionId],
        references: [options.id],
    }),
    grader: one(users, {
        fields: [responses.gradedBy],
        references: [users.id],
        relationName: "gradedResponses",
    }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, { fields: [userRoles.userId], references: [users.id] }),
}));
