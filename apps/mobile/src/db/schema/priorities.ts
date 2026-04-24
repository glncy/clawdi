import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const priorities = sqliteTable("priorities", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  type: text("type", { enum: ["must", "win", "overdue"] }).notNull(),
  date: text("date").notNull(),
  completed: int("completed").notNull().default(0),
  completedAt: text("completed_at"),
  sortOrder: int("sort_order").notNull().default(0),
  rolledOverFrom: text("rolled_over_from"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type PriorityRow = typeof priorities.$inferSelect;
export type NewPriority = typeof priorities.$inferInsert;
