DO $$ BEGIN
 CREATE TYPE "public"."exam_session_status" AS ENUM('in_progress', 'submitted', 'graded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."question_type" AS ENUM('multiple_choice', 'short_answer', 'essay');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('admin', 'instructor', 'student');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_account" (
	"user_id" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "online-exam-app_account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_exam_assignment" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "online-exam-app_exam_assignment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"exam_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_exam_session" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "online-exam-app_exam_session_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"exam_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"submitted_at" timestamp with time zone,
	"status" "exam_session_status" DEFAULT 'in_progress' NOT NULL,
	"total_points" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_exam" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "online-exam-app_exam_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text,
	"time_limit" integer NOT NULL,
	"available_from" timestamp with time zone,
	"available_to" timestamp with time zone,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_option" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "online-exam-app_option_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"question_id" integer NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_question" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "online-exam-app_question_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"exam_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"question_type" "question_type" NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_response" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "online-exam-app_response_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"session_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"response_text" text,
	"selected_option_id" integer,
	"points" integer,
	"graded_by" varchar(255),
	"graded_at" timestamp with time zone,
	"feedback" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_session" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_user_role" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "online-exam-app_user_role_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "online-exam-app_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "online-exam-app_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_account" ADD CONSTRAINT "online-exam-app_account_user_id_online-exam-app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."online-exam-app_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_exam_assignment" ADD CONSTRAINT "online-exam-app_exam_assignment_exam_id_online-exam-app_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."online-exam-app_exam"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_exam_assignment" ADD CONSTRAINT "online-exam-app_exam_assignment_user_id_online-exam-app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."online-exam-app_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_exam_session" ADD CONSTRAINT "online-exam-app_exam_session_exam_id_online-exam-app_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."online-exam-app_exam"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_exam_session" ADD CONSTRAINT "online-exam-app_exam_session_user_id_online-exam-app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."online-exam-app_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_exam" ADD CONSTRAINT "online-exam-app_exam_created_by_online-exam-app_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."online-exam-app_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_option" ADD CONSTRAINT "online-exam-app_option_question_id_online-exam-app_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."online-exam-app_question"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_question" ADD CONSTRAINT "online-exam-app_question_exam_id_online-exam-app_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."online-exam-app_exam"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_response" ADD CONSTRAINT "online-exam-app_response_session_id_online-exam-app_exam_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."online-exam-app_exam_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_response" ADD CONSTRAINT "online-exam-app_response_question_id_online-exam-app_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."online-exam-app_question"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_response" ADD CONSTRAINT "online-exam-app_response_selected_option_id_online-exam-app_option_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."online-exam-app_option"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_response" ADD CONSTRAINT "online-exam-app_response_graded_by_online-exam-app_user_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."online-exam-app_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_session" ADD CONSTRAINT "online-exam-app_session_user_id_online-exam-app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."online-exam-app_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "online-exam-app_user_role" ADD CONSTRAINT "online-exam-app_user_role_user_id_online-exam-app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."online-exam-app_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "online-exam-app_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "online-exam-app_session" USING btree ("user_id");