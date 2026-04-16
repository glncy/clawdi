import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  notes: text("notes"),
  nudgeFrequencyDays: int("nudge_frequency_days").notNull().default(14),
  source: text("source", { enum: ["manual", "device"] })
    .notNull()
    .default("manual"),
  deviceContactId: text("device_contact_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type ContactRow = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
