import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const calendars = pgTable("calendars", {
  color: text("color").default("lavender").notNull(),
  default: boolean("default").default(false).notNull(),
  description: text("description"),
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const calendarEvents = pgTable("calendar_events", {
  allDay: boolean("all_day").notNull().default(false),
  calendarId: uuid("calendar_id")
    .notNull()
    .references(() => calendars.id, { onDelete: "cascade" }),
  end: timestamp("end", { withTimezone: true }).notNull(),
  id: uuid("id").primaryKey().defaultRandom(),
  location: text("location"),
  notes: text("notes"),
  start: timestamp("start", { withTimezone: true }).notNull(),
  title: text("title").notNull(),
});

export const calendarRelations = relations(calendars, ({ many, one }) => ({
  events: many(calendarEvents),
  user: one(users, {
    fields: [calendars.userId],
    references: [users.id],
  }),
}));

export const calendarEventRelations = relations(calendarEvents, ({ one }) => ({
  calendar: one(calendars, {
    fields: [calendarEvents.calendarId],
    references: [calendars.id],
  }),
}));
