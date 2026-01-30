import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayStartHour: integer("day_start").default(0).notNull(),
  weekStart: integer("week_start").default(0).notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
});

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));
