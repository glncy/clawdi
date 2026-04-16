import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { contacts } from "./contacts";

export const specialDates = sqliteTable("special_dates", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["birthday", "anniversary", "other"],
  }).notNull(),
  label: text("label"),
  month: int("month").notNull(),
  day: int("day").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type SpecialDateRow = typeof specialDates.$inferSelect;
export type NewSpecialDate = typeof specialDates.$inferInsert;
