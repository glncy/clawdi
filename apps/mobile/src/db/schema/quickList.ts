import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const quickList = sqliteTable("quick_list", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  completed: int("completed").notNull().default(0),
  completedAt: text("completed_at"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type QuickListRow = typeof quickList.$inferSelect;
export type NewQuickListItem = typeof quickList.$inferInsert;
