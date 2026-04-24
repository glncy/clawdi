import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const accountTypes = sqliteTable("account_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  isDefault: int("is_default").notNull().default(0),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type AccountTypeRow = typeof accountTypes.$inferSelect;
export type NewAccountType = typeof accountTypes.$inferInsert;
