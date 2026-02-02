ALTER TABLE "settings" ALTER COLUMN "completed_display" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "completed_display" SET DEFAULT 'hide'::text;--> statement-breakpoint
DROP TYPE "public"."completed_display";--> statement-breakpoint
CREATE TYPE "public"."completed_display" AS ENUM('crossout', 'hide');--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "completed_display" SET DEFAULT 'hide'::"public"."completed_display";--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "completed_display" SET DATA TYPE "public"."completed_display" USING "completed_display"::"public"."completed_display";