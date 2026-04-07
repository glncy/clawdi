import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  item: text("item").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  note: text("note"),
  accountId: text("account_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
