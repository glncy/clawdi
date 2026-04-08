import { create } from "zustand";
import { eq } from "drizzle-orm";
import { Database } from "../db/client";
import {
  accounts as accountsTable,
  transactions as transactionsTable,
  categories as categoriesTable,
  recurringBills as recurringBillsTable,
  savingsGoals as savingsGoalsTable,
  budgetSettings as budgetSettingsTable,
} from "../db/schema";
import {
  Account,
  Transaction,
  Category,
  RecurringBill,
  SavingsGoal,
  BudgetSetting,
} from "../types";

function rowToAccount(row: typeof accountsTable.$inferSelect): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    balance: row.balance,
    currency: row.currency,
    icon: row.icon,
    excludeFromBudget: row.excludeFromBudget === 1,
  };
}

function rowToTransaction(
  row: typeof transactionsTable.$inferSelect
): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    item: row.item,
    category: row.category,
    date: row.date,
    note: row.note ?? undefined,
    accountId: row.accountId ?? undefined,
  };
}

function rowToCategory(row: typeof categoriesTable.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    isDefault: row.isDefault === 1,
    sortOrder: row.sortOrder,
  };
}

function rowToRecurringBill(
  row: typeof recurringBillsTable.$inferSelect
): RecurringBill {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    currency: row.currency,
    frequency: row.frequency,
    nextDueDate: row.nextDueDate,
    category: row.category,
    isPaid: row.isPaid === 1,
  };
}

function rowToSavingsGoal(
  row: typeof savingsGoalsTable.$inferSelect
): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.targetAmount,
    currentAmount: row.currentAmount,
    currency: row.currency,
    targetDate: row.targetDate,
    icon: row.icon ?? undefined,
  };
}

function rowToBudgetSetting(
  row: typeof budgetSettingsTable.$inferSelect
): BudgetSetting {
  return {
    id: row.id,
    category: row.category,
    budgetAmount: row.budgetAmount,
    period: row.period,
  };
}

interface FinanceState {
  isLoaded: boolean;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  recurringBills: RecurringBill[];
  savingsGoals: SavingsGoal[];
  budgetSettings: BudgetSetting[];

  loadAll: (db: Database) => Promise<void>;
  addAccount: (db: Database, account: Account) => Promise<void>;
  updateAccount: (
    db: Database,
    id: string,
    updates: Partial<Account>
  ) => Promise<void>;
  deleteAccount: (db: Database, id: string) => Promise<void>;
  addTransaction: (db: Database, tx: Transaction) => Promise<void>;
  updateTransaction: (
    db: Database,
    id: string,
    updates: Partial<Omit<Transaction, "id">>
  ) => Promise<void>;
  deleteTransaction: (db: Database, id: string) => Promise<void>;
  addRecurringBill: (db: Database, bill: RecurringBill) => Promise<void>;
  toggleBillPaid: (db: Database, id: string) => Promise<void>;
  addSavingsGoal: (db: Database, goal: SavingsGoal) => Promise<void>;
  updateSavingsGoal: (
    db: Database,
    id: string,
    updates: Partial<SavingsGoal>
  ) => Promise<void>;
  setBudget: (
    db: Database,
    category: string,
    budgetAmount: number
  ) => Promise<void>;
  addCategory: (db: Database, category: Category) => Promise<void>;
  updateCategory: (
    db: Database,
    id: string,
    updates: Partial<Pick<Category, "name" | "icon" | "sortOrder">>
  ) => Promise<void>;
  deleteCategory: (db: Database, id: string) => Promise<void>;
  reorderCategories: (db: Database, orderedIds: string[]) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isLoaded: false,
  accounts: [],
  transactions: [],
  categories: [],
  recurringBills: [],
  savingsGoals: [],
  budgetSettings: [],

  loadAll: async (db) => {
    const [
      accountRows,
      transactionRows,
      categoryRows,
      recurringBillRows,
      savingsGoalRows,
      budgetSettingRows,
    ] = await Promise.all([
      db.select().from(accountsTable),
      db.select().from(transactionsTable),
      db.select().from(categoriesTable),
      db.select().from(recurringBillsTable),
      db.select().from(savingsGoalsTable),
      db.select().from(budgetSettingsTable),
    ]);

    set({
      isLoaded: true,
      accounts: accountRows.map(rowToAccount),
      transactions: transactionRows.map(rowToTransaction),
      categories: categoryRows.map(rowToCategory),
      recurringBills: recurringBillRows.map(rowToRecurringBill),
      savingsGoals: savingsGoalRows.map(rowToSavingsGoal),
      budgetSettings: budgetSettingRows.map(rowToBudgetSetting),
    });
  },

  addAccount: async (db, account) => {
    await db.insert(accountsTable).values({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      icon: account.icon,
      excludeFromBudget: account.excludeFromBudget ? 1 : 0,
    });
    set((state) => ({ accounts: [...state.accounts, account] }));
  },

  updateAccount: async (db, id, updates) => {
    const dbUpdates: Partial<typeof accountsTable.$inferInsert> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.excludeFromBudget !== undefined) {
      dbUpdates.excludeFromBudget = updates.excludeFromBudget ? 1 : 0;
    }
    await db
      .update(accountsTable)
      .set(dbUpdates)
      .where(eq(accountsTable.id, id));
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  },

  deleteAccount: async (db, id) => {
    await db.delete(accountsTable).where(eq(accountsTable.id, id));
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));
  },

  addTransaction: async (db, tx) => {
    await db.insert(transactionsTable).values({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      item: tx.item,
      category: tx.category,
      date: tx.date,
      note: tx.note ?? null,
      accountId: tx.accountId ?? null,
    });
    set((state) => ({
      transactions: [tx, ...state.transactions],
    }));
  },

  updateTransaction: async (db, id, updates) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
    if (updates.item !== undefined) dbUpdates.item = updates.item;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.note !== undefined) dbUpdates.note = updates.note ?? null;
    if (updates.accountId !== undefined) dbUpdates.accountId = updates.accountId ?? null;
    dbUpdates.updatedAt = new Date().toISOString();

    await db
      .update(transactionsTable)
      .set(dbUpdates)
      .where(eq(transactionsTable.id, id));
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  deleteTransaction: async (db, id) => {
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  addRecurringBill: async (db, bill) => {
    await db.insert(recurringBillsTable).values({
      id: bill.id,
      name: bill.name,
      amount: bill.amount,
      currency: bill.currency,
      frequency: bill.frequency,
      nextDueDate: bill.nextDueDate,
      category: bill.category,
      isPaid: bill.isPaid ? 1 : 0,
    });
    set((state) => ({
      recurringBills: [...state.recurringBills, bill],
    }));
  },

  toggleBillPaid: async (db, id) => {
    const { recurringBills } = get();
    const bill = recurringBills.find((b) => b.id === id);
    if (!bill) return;

    const newIsPaid = !bill.isPaid;
    await db
      .update(recurringBillsTable)
      .set({ isPaid: newIsPaid ? 1 : 0 })
      .where(eq(recurringBillsTable.id, id));
    set((state) => ({
      recurringBills: state.recurringBills.map((b) =>
        b.id === id ? { ...b, isPaid: newIsPaid } : b
      ),
    }));
  },

  addSavingsGoal: async (db, goal) => {
    await db.insert(savingsGoalsTable).values({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      currency: goal.currency,
      targetDate: goal.targetDate,
      icon: goal.icon ?? null,
    });
    set((state) => ({
      savingsGoals: [...state.savingsGoals, goal],
    }));
  },

  updateSavingsGoal: async (db, id, updates) => {
    const dbUpdates: Partial<typeof savingsGoalsTable.$inferInsert> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.targetAmount !== undefined)
      dbUpdates.targetAmount = updates.targetAmount;
    if (updates.currentAmount !== undefined)
      dbUpdates.currentAmount = updates.currentAmount;
    if (updates.targetDate !== undefined)
      dbUpdates.targetDate = updates.targetDate;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon ?? null;

    await db
      .update(savingsGoalsTable)
      .set(dbUpdates)
      .where(eq(savingsGoalsTable.id, id));
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    }));
  },

  setBudget: async (db, category, budgetAmount) => {
    const { budgetSettings } = get();
    const existing = budgetSettings.find((b) => b.category === category);

    if (existing) {
      await db
        .update(budgetSettingsTable)
        .set({ budgetAmount })
        .where(eq(budgetSettingsTable.id, existing.id));
      set((state) => ({
        budgetSettings: state.budgetSettings.map((b) =>
          b.category === category ? { ...b, budgetAmount } : b
        ),
      }));
    } else {
      const id = `budget-${category}-${Date.now()}`;
      await db.insert(budgetSettingsTable).values({
        id,
        category,
        budgetAmount,
        period: "monthly",
      });
      set((state) => ({
        budgetSettings: [
          ...state.budgetSettings,
          { id, category, budgetAmount, period: "monthly" },
        ],
      }));
    }
  },

  addCategory: async (db, category) => {
    await db.insert(categoriesTable).values({
      id: category.id,
      name: category.name,
      icon: category.icon,
      isDefault: category.isDefault ? 1 : 0,
      sortOrder: category.sortOrder,
    });
    set((state) => ({ categories: [...state.categories, category] }));
  },

  updateCategory: async (db, id, updates) => {
    const dbUpdates: Partial<typeof categoriesTable.$inferInsert> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.sortOrder !== undefined) dbUpdates.sortOrder = updates.sortOrder;
    await db
      .update(categoriesTable)
      .set(dbUpdates)
      .where(eq(categoriesTable.id, id));
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteCategory: async (db, id) => {
    const { categories } = get();
    const category = categories.find((c) => c.id === id);
    if (category?.isDefault) return;
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  reorderCategories: async (db, orderedIds) => {
    const updates = orderedIds.map((id, index) =>
      db
        .update(categoriesTable)
        .set({ sortOrder: index })
        .where(eq(categoriesTable.id, id))
    );
    await Promise.all(updates);
    set((state) => ({
      categories: state.categories
        .map((c) => {
          const newOrder = orderedIds.indexOf(c.id);
          return newOrder >= 0 ? { ...c, sortOrder: newOrder } : c;
        })
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  },
}));
