import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const timeFormats = pgEnum("time_formats", ["12", "24"]);
export const completionBehavior = pgEnum("completion_behavior", [
  "crossout",
  "hide",
]);
export const calendarDisplayModes = pgEnum("calendar_display_modes", [
  "day",
  "week",
  "month",
]);

export const settings = pgTable("settings", {
  completionBehavior: completionBehavior("completion_behavior")
    .default("hide")
    .notNull(),
  dayStartHour: integer("day_start").default(6).notNull(),
  defaultCalendarDisplay: calendarDisplayModes("default_calendar_display")
    .default("month")
    .notNull(),
  id: uuid("id").primaryKey().defaultRandom(),
  timeFormat: timeFormats("time_format").default("24").notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  weekStart: integer("week_start").default(0).notNull(),
});

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));
