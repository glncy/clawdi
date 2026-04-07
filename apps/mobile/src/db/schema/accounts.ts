import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["checking", "savings", "credit", "cash", "investment"],
  }).notNull(),
  balance: real("balance").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  icon: text("icon").notNull().default(""),
  excludeFromBudget: int("exclude_from_budget").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type AccountRow = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
