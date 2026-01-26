import { relations } from "drizzle-orm";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { users } from "./users";

export const feeds = pgTable("feeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const feedRelations = relations(feeds, ({ one }) => ({
  user: one(users, {
    fields: [feeds.userId],
    references: [users.id],
  }),
}));
