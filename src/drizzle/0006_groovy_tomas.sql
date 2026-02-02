CREATE TYPE "public"."time_formats" AS ENUM('12', '24');--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "time_format" SET DEFAULT '24'::time_formats;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "time_format" SET DATA TYPE time_formats USING "time_format"::time_formats;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "time_format" DROP NOT NULL;