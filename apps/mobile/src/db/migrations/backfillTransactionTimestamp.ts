import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { transactions } from "../schema/transactions";

/**
 * One-time backfill that upgrades `transactions.date` from the legacy
 * `YYYY-MM-DD` short form into a full ISO 8601 timestamp.
 *
 * Idempotent: only rows whose `date` is exactly length 10 and contains
 * no `T` are rewritten. Time-of-day is taken from `createdAt`
 * (SQLite `datetime('now')` → `YYYY-MM-DD HH:MM:SS`); if `createdAt`
 * has no time component we fall back to `12:00:00` UTC so we don't
 * drift the row into a different calendar day in any timezone.
 */
export async function backfillTransactionTimestamp(
  db: Database,
): Promise<void> {
  const all = await db.select().from(transactions);

  for (const row of all) {
    const date = row.date;
    if (typeof date !== "string") continue;
    if (date.length !== 10) continue;
    if (date.includes("T")) continue;

    try {
      const createdAt = row.createdAt;
      const time =
        typeof createdAt === "string" && createdAt.includes(" ")
          ? createdAt.split(" ")[1]
          : "12:00:00";

      const parsed = new Date(`${date}T${time}Z`);
      if (Number.isNaN(parsed.getTime())) continue;

      await db
        .update(transactions)
        .set({ date: parsed.toISOString() })
        .where(eq(transactions.id, row.id));
    } catch (err) {
      // Skip corrupted rows so one bad record doesn't block the one-time migration forever.
      console.warn(`[backfillTransactionTimestamp] skipped row ${row.id}:`, err);
    }
  }
}
