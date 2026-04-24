import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const reflections = sqliteTable("reflections", {
  date: text("date").primaryKey(),
  wins: text("wins").notNull().default("[]"),
  improve: text("improve").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type ReflectionRow = typeof reflections.$inferSelect;
export type NewReflection = typeof reflections.$inferInsert;
