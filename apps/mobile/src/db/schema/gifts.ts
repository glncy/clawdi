import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { contacts } from "./contacts";
import { specialDates } from "./specialDates";

export const gifts = sqliteTable("gifts", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  specialDateId: text("special_date_id").references(() => specialDates.id),
  name: text("name").notNull(),
  isAiSuggested: int("is_ai_suggested").notNull().default(0),
  givenAt: text("given_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type GiftRow = typeof gifts.$inferSelect;
export type NewGift = typeof gifts.$inferInsert;
