import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { contacts } from "./contacts";

export const interactions = sqliteTable("interactions", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["call", "coffee", "text", "voicenote", "other"],
  }).notNull(),
  note: text("note"),
  aiSummary: text("ai_summary"),
  occurredAt: text("occurred_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type InteractionRow = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;
