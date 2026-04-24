import { accountTypes, type NewAccountType } from "../schema";
import { seedAccountTypes } from "../seed";
import type { Database } from "../client";

type SeedTable = typeof accountTypes;

function createMockDb(initialRows: NewAccountType[] = []) {
  const rows: NewAccountType[] = [...initialRows];

  const mockDb = {
    select: () => ({
      from: (_table: SeedTable) => Promise.resolve(rows.slice()),
    }),
    insert: (_table: SeedTable) => ({
      values: async (newRows: NewAccountType[] | NewAccountType) => {
        if (Array.isArray(newRows)) {
          rows.push(...newRows);
        } else {
          rows.push(newRows);
        }
      },
    }),
  };

  return { mockDb, rows };
}

describe("seedAccountTypes", () => {
  it("seeds exactly 5 built-in account types on a fresh database", async () => {
    const { mockDb, rows } = createMockDb();

    await seedAccountTypes(mockDb as unknown as Database);

    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.id).sort()).toEqual(
      [
        "type-cash",
        "type-checking",
        "type-credit",
        "type-investment",
        "type-savings",
      ].sort(),
    );
    for (const row of rows) {
      expect(row.name).toBeTruthy();
      expect(row.icon).toBeTruthy();
      expect(row.isDefault).toBe(1);
    }
  });

  it("is idempotent — running twice leaves exactly 5 rows", async () => {
    const { mockDb, rows } = createMockDb();

    await seedAccountTypes(mockDb as unknown as Database);
    await seedAccountTypes(mockDb as unknown as Database);

    expect(rows).toHaveLength(5);
  });

  it("does not insert when rows already exist", async () => {
    const { mockDb, rows } = createMockDb([
      {
        id: "type-custom",
        name: "Custom",
        icon: "⭐",
        isDefault: 0,
        sortOrder: 0,
      },
    ]);

    await seedAccountTypes(mockDb as unknown as Database);

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("type-custom");
  });
});
