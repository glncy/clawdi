import { useFinanceStore } from "../useFinanceStore";
import { accountTypes as accountTypesTable } from "../../db/schema";
import type { Database } from "../../db/client";
import type { AccountType, RecurringBill } from "../../types";

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

// -- Bills: "once" frequency + auto-archive on mark-paid --

function makeFakeBillsDb(seedBillRows: Row[] = []) {
  const billRows: Row[] = [...seedBillRows];

  const db = {
    insert: (_table: unknown) => ({
      values: async (v: Row) => {
        billRows.push({ ...v });
      },
    }),
    update: (_table: unknown) => ({
      set: (patch: Row) => ({
        // The fake ignores the where clause; tests below only keep one bill
        // in the table at a time so there's no ambiguity.
        where: async () => {
          if (billRows[0]) Object.assign(billRows[0], patch);
        },
      }),
    }),
    delete: (_table: unknown) => ({
      where: async () => {
        billRows.length = 0;
      },
    }),
    select: () => ({
      from: (_table: unknown) => billRows,
    }),
  } as unknown as Database;

  return { db, billRows };
}

describe("useFinanceStore — recurring bills archival", () => {
  beforeEach(resetStore);

  it("toggleBillPaid on a 'once' bill marks it paid AND archived", async () => {
    const { db, billRows } = makeFakeBillsDb();

    const bill: RecurringBill = {
      id: "bill-once-1",
      name: "Dentist",
      amount: 200,
      currency: "USD",
      frequency: "once",
      nextDueDate: "2026-05-01",
      category: "Health",
      isPaid: false,
      isArchived: false,
    };

    await useFinanceStore.getState().addRecurringBill(db, bill);
    expect(billRows).toHaveLength(1);
    expect(billRows[0]).toMatchObject({ isPaid: 0, isArchived: 0 });

    await useFinanceStore.getState().toggleBillPaid(db, bill.id);

    // DB row is both paid and archived
    expect(billRows[0]).toMatchObject({ isPaid: 1, isArchived: 1 });

    // In-memory state mirrors the DB row
    const stateBill = useFinanceStore
      .getState()
      .recurringBills.find((b) => b.id === bill.id);
    expect(stateBill?.isPaid).toBe(true);
    expect(stateBill?.isArchived).toBe(true);
  });

  it("toggleBillPaid on a 'monthly' bill marks paid but does NOT archive", async () => {
    const { db, billRows } = makeFakeBillsDb();

    const bill: RecurringBill = {
      id: "bill-monthly-1",
      name: "Netflix",
      amount: 15,
      currency: "USD",
      frequency: "monthly",
      nextDueDate: "2026-05-15",
      category: "Subscriptions",
      isPaid: false,
      isArchived: false,
    };

    await useFinanceStore.getState().addRecurringBill(db, bill);
    await useFinanceStore.getState().toggleBillPaid(db, bill.id);

    expect(billRows[0]).toMatchObject({ isPaid: 1, isArchived: 0 });

    const stateBill = useFinanceStore
      .getState()
      .recurringBills.find((b) => b.id === bill.id);
    expect(stateBill?.isPaid).toBe(true);
    expect(stateBill?.isArchived).toBe(false);
  });

  it("toggling a paid-and-archived 'once' bill back to unpaid clears isArchived", async () => {
    const { db, billRows } = makeFakeBillsDb();

    const bill: RecurringBill = {
      id: "bill-once-2",
      name: "Plumber",
      amount: 150,
      currency: "USD",
      frequency: "once",
      nextDueDate: "2026-05-20",
      category: "Home",
      isPaid: false,
      isArchived: false,
    };

    await useFinanceStore.getState().addRecurringBill(db, bill);

    // First toggle: paid + archived
    await useFinanceStore.getState().toggleBillPaid(db, bill.id);
    expect(billRows[0]).toMatchObject({ isPaid: 1, isArchived: 1 });

    // Second toggle: unpaid + unarchived (so the once bill reappears)
    await useFinanceStore.getState().toggleBillPaid(db, bill.id);
    expect(billRows[0]).toMatchObject({ isPaid: 0, isArchived: 0 });

    const stateBill = useFinanceStore
      .getState()
      .recurringBills.find((b) => b.id === bill.id);
    expect(stateBill?.isPaid).toBe(false);
    expect(stateBill?.isArchived).toBe(false);
  });
});
