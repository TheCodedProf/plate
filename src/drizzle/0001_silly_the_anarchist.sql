ALTER TABLE "calendars" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "calendars" ADD COLUMN "color" text DEFAULT 'lavendar';--> statement-breakpoint
ALTER TABLE "calendar_events" DROP COLUMN "description";