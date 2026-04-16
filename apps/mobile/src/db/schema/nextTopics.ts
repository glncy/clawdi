import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { contacts } from "./contacts";

export const nextTopics = sqliteTable("next_topics", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  isDone: int("is_done").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type NextTopicRow = typeof nextTopics.$inferSelect;
export type NewNextTopic = typeof nextTopics.$inferInsert;
