import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const focusSessions = sqliteTable("focus_sessions", {
  id: text("id").primaryKey(),
  priorityId: text("priority_id"),
  goal: text("goal"),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  plannedSec: int("planned_sec").notNull(),
  actualSec: int("actual_sec").notNull().default(0),
  completedNaturally: int("completed_naturally").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type FocusSessionRow = typeof focusSessions.$inferSelect;
export type NewFocusSession = typeof focusSessions.$inferInsert;
