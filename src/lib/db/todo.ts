import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const todos = pgTable("todos", {
  completed: boolean("completed").default(false),
  description: text("description"),
  dueDate: timestamp("due_date"),
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
});

export const todoRelations = relations(todos, ({ one }) => ({
  user: one(users, {
    fields: [todos.userId],
    references: [users.id],
  }),
}));
