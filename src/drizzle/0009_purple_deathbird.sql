ALTER TYPE "public"."completed_display" RENAME TO "completion_behavior";--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "completion_behavior" "completion_behavior" DEFAULT 'hide' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "completed_display";