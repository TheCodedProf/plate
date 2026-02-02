CREATE TYPE "public"."completed_display" AS ENUM('crossout', 'dissappear');--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "time_format" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "completed_display" "completed_display" DEFAULT 'dissappear' NOT NULL;