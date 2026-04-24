import { useFinanceStore } from "../useFinanceStore";
import { accountTypes as accountTypesTable } from "../../db/schema";
import type { Database } from "../../db/client";
import type { AccountType } from "../../types";

type Row = Record<string, unknown>;

function makeFakeDb(seedAccountTypeRows: Row[] = []) {
  const atRows: Row[] = [...seedAccountTypeRows];

  const db = {
    insert: (_table: unknown) => ({
      values: async (v: Row) => {
        atRows.push({ ...v });
      },
    }),
    update: (_table: unknown) => ({
      set: (patch: Row) => ({
        where: async () => {
          // For tests, just merge the patch into the first row (id-based match
          // isn't exposed via the fake; we only ever update 1 row per test).
          // If tests need multi-row updates later, extend this fake then.
          if (atRows[0]) Object.assign(atRows[0], patch);
        },
      }),
    }),
    delete: (_table: unknown) => ({
      where: async () => {
        // Remove the last-added row (or the single row in a 1-row test)
        // Tests below always delete a specific id, but the fake does not
        // discriminate; we simulate deletion by removing the only row.
        atRows.length = 0;
      },
    }),
    select: () => ({
      from: (_table: unknown) => atRows,
    }),
  } as unknown as Database;

  return { db, atRows };
}

function resetStore() {
  useFinanceStore.setState({
    isLoaded: false,
    accounts: [],
    transactions: [],
    categories: [],
    recurringBills: [],
    savingsGoals: [],
    budgetSettings: [],
    accountTypes: [],
  });
}

describe("useFinanceStore — accountTypes CRUD", () => {
  beforeEach(resetStore);

  it("addAccountType inserts row and appends to state", async () => {
    const { db, atRows } = makeFakeDb();

    const type: AccountType = {
      id: "at-custom-1",
      name: "Brokerage",
      icon: "📈",
      isDefault: false,
      sortOrder: 10,
    };

    await useFinanceStore.getState().addAccountType(db, type);

    expect(atRows).toHaveLength(1);
    expect(atRows[0]).toMatchObject({
      id: "at-custom-1",
      name: "Brokerage",
      icon: "📈",
      isDefault: 0,
      sortOrder: 10,
    });

    const state = useFinanceStore.getState();
    expect(state.accountTypes).toHaveLength(1);
    expect(state.accountTypes[0]).toEqual(type);
  });

  it("updateAccountType patches row and state", async () => {
    const { db } = makeFakeDb();
    const type: AccountType = {
      id: "at-custom-2",
      name: "Wallet",
      icon: "👛",
      isDefault: false,
      sortOrder: 20,
    };
    await useFinanceStore.getState().addAccountType(db, type);

    await useFinanceStore.getState().updateAccountType(db, type.id, {
      name: "Digital Wallet",
      icon: "💳",
      sortOrder: 25,
    });

    const updated = useFinanceStore
      .getState()
      .accountTypes.find((t) => t.id === type.id);
    expect(updated?.name).toBe("Digital Wallet");
    expect(updated?.icon).toBe("💳");
    expect(updated?.sortOrder).toBe(25);
  });

  it("deleteAccountType removes a non-default type from state", async () => {
    const { db } = makeFakeDb();
    const type: AccountType = {
      id: "at-custom-3",
      name: "Crypto",
      icon: "🪙",
      isDefault: false,
      sortOrder: 30,
    };
    await useFinanceStore.getState().addAccountType(db, type);
    expect(useFinanceStore.getState().accountTypes).toHaveLength(1);

    await useFinanceStore.getState().deleteAccountType(db, type.id);

    expect(
      useFinanceStore.getState().accountTypes.find((t) => t.id === type.id)
    ).toBeUndefined();
  });

  it("deleteAccountType allows removing a default type (user-curated)", async () => {
    const { db } = makeFakeDb();
    const type: AccountType = {
      id: "at-default-checking",
      name: "Checking",
      icon: "🏦",
      isDefault: true,
      sortOrder: 0,
    };
    await useFinanceStore.getState().addAccountType(db, type);

    await useFinanceStore.getState().deleteAccountType(db, type.id);

    expect(
      useFinanceStore.getState().accountTypes.find((t) => t.id === type.id)
    ).toBeUndefined();
  });

  it("loadAccountTypes hydrates state from db rows", async () => {
    const { db } = makeFakeDb([
      {
        id: "at-1",
        name: "Checking",
        icon: "🏦",
        isDefault: 1,
        sortOrder: 0,
        createdAt: "2026-01-01 00:00:00",
      },
      {
        id: "at-2",
        name: "Savings",
        icon: "💰",
        isDefault: 1,
        sortOrder: 1,
        createdAt: "2026-01-01 00:00:00",
      },
    ]);

    await useFinanceStore.getState().loadAccountTypes(db);

    const state = useFinanceStore.getState();
    expect(state.accountTypes).toHaveLength(2);
    expect(state.accountTypes[0]).toMatchObject({
      id: "at-1",
      name: "Checking",
      icon: "🏦",
      isDefault: true,
      sortOrder: 0,
    });
    expect(state.accountTypes[1]?.isDefault).toBe(true);
  });
});
