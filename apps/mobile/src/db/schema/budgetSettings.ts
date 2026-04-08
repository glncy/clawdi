import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const budgetSettings = sqliteTable("budget_settings", {
  id: text("id").primaryKey(),
  category: text("category").notNull().unique(),
  budgetAmount: real("budget_amount").notNull(),
  period: text("period").notNull().default("monthly"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type BudgetSettingRow = typeof budgetSettings.$inferSelect;
export type NewBudgetSetting = typeof budgetSettings.$inferInsert;
