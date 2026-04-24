import { backfillTransactionTimestamp } from "../migrations/backfillTransactionTimestamp";
import type { Database } from "../client";

type Row = Record<string, unknown>;

// Drizzle's eq() returns an opaque matcher object, so the fake can't
// introspect which id is being targeted. Instead, we lean on the fact
// that the backfill iterates rows in array order and calls update()
// exactly once per row whose `date` still needs migrating. We track a
// cursor and apply each incoming patch to the next migrateable row.
function makeSimpleFakeDb(initialRows: Row[]) {
  const rows: Row[] = initialRows.map((r) => ({ ...r }));
  let cursor = 0;

  const db = {
    select: () => ({
      from: async (_table: unknown) => rows.slice(),
    }),
    update: (_table: unknown) => ({
      set: (patch: Row) => ({
        where: async (_matcher: unknown) => {
          // Find the next row (from cursor) whose date needs migrating.
          while (
            cursor < rows.length &&
            !(
              typeof rows[cursor].date === "string" &&
              (rows[cursor].date as string).length === 10 &&
              !(rows[cursor].date as string).includes("T")
            )
          ) {
            cursor++;
          }
          if (cursor < rows.length) {
            Object.assign(rows[cursor], patch);
            cursor++;
          }
        },
      }),
    }),
  } as unknown as Database;

  return { db, rows };
}

describe("backfillTransactionTimestamp", () => {
  it("converts YYYY-MM-DD date into ISO timestamp using createdAt's time component", async () => {
    const { db, rows } = makeSimpleFakeDb([
      {
        id: "tx-1",
        type: "expense",
        amount: 10,
        currency: "USD",
        item: "Lunch",
        category: "Food",
        date: "2026-04-01",
        note: null,
        accountId: null,
        createdAt: "2026-04-01 09:30:00",
        updatedAt: "2026-04-01 09:30:00",
      },
    ]);

    await backfillTransactionTimestamp(db);

    const d = rows[0].date as string;
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    const parsed = new Date(d);
    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(3); // April = 3
    expect(parsed.getUTCDate()).toBe(1);
    expect(parsed.getUTCHours()).toBe(9);
    expect(parsed.getUTCMinutes()).toBe(30);
    expect(parsed.getUTCSeconds()).toBe(0);
  });

  it("leaves already-ISO date rows untouched (idempotent)", async () => {
    const iso = "2026-04-01T09:30:00.000Z";
    const { db, rows } = makeSimpleFakeDb([
      {
        id: "tx-1",
        type: "expense",
        amount: 10,
        currency: "USD",
        item: "Lunch",
        category: "Food",
        date: iso,
        note: null,
        accountId: null,
        createdAt: "2026-04-01 09:30:00",
        updatedAt: "2026-04-01 09:30:00",
      },
    ]);

    await backfillTransactionTimestamp(db);

    expect(rows[0].date).toBe(iso);
  });

  it("falls back to 12:00:00 UTC when createdAt lacks a time component", async () => {
    const { db, rows } = makeSimpleFakeDb([
      {
        id: "tx-1",
        type: "expense",
        amount: 5,
        currency: "USD",
        item: "Coffee",
        category: "Food",
        date: "2026-04-15",
        note: null,
        accountId: null,
        createdAt: "2026-04-15", // no time part
        updatedAt: "2026-04-15",
      },
    ]);

    await backfillTransactionTimestamp(db);

    const d = rows[0].date as string;
    const parsed = new Date(d);
    expect(parsed.getUTCHours()).toBe(12);
    expect(parsed.getUTCMinutes()).toBe(0);
    expect(parsed.getUTCSeconds()).toBe(0);
  });

  it("handles a mix of short-form and ISO dates in one pass", async () => {
    const iso = "2026-04-10T15:00:00.000Z";
    const { db, rows } = makeSimpleFakeDb([
      {
        id: "tx-a",
        type: "expense",
        amount: 5,
        currency: "USD",
        item: "A",
        category: "Food",
        date: "2026-04-01",
        note: null,
        accountId: null,
        createdAt: "2026-04-01 08:15:00",
        updatedAt: "2026-04-01 08:15:00",
      },
      {
        id: "tx-b",
        type: "expense",
        amount: 5,
        currency: "USD",
        item: "B",
        category: "Food",
        date: iso,
        note: null,
        accountId: null,
        createdAt: "2026-04-10 15:00:00",
        updatedAt: "2026-04-10 15:00:00",
      },
    ]);

    await backfillTransactionTimestamp(db);

    // Short-form row became ISO
    const dA = rows[0].date as string;
    expect(dA.includes("T")).toBe(true);
    expect(new Date(dA).getUTCHours()).toBe(8);
    expect(new Date(dA).getUTCMinutes()).toBe(15);

    // ISO row untouched
    expect(rows[1].date).toBe(iso);
  });
});
