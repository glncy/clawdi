import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const recurringBills = sqliteTable("recurring_bills", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  frequency: text("frequency", {
    enum: ["weekly", "monthly", "yearly"],
  }).notNull(),
  nextDueDate: text("next_due_date").notNull(), // YYYY-MM-DD
  category: text("category").notNull(),
  isPaid: int("is_paid").notNull().default(0),
  accountId: text("account_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type RecurringBillRow = typeof recurringBills.$inferSelect;
export type NewRecurringBill = typeof recurringBills.$inferInsert;
