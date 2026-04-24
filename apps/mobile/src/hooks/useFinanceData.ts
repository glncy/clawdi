import { useEffect, useMemo } from "react";
import { useDatabase } from "./useDatabase";
import { useFinanceStore } from "../stores/useFinanceStore";
import { useUserStore } from "../stores/useUserStore";
import { useBudgetConfigStore } from "../stores/useBudgetConfigStore";
import { calculateDailyBudget } from "../utils/budgetCalculator";
import { CategoryBudget, DailySpending } from "../types";

export function useFinanceData() {
  const { db, isReady } = useDatabase();
  const income = useUserStore((s) => s.income);
  const store = useFinanceStore();
  const includedAccountIds = useBudgetConfigStore((s) => s.includedAccountIds);

  useEffect(() => {
    if (isReady && db && !store.isLoaded) {
      store.loadAll(db);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, db, store.isLoaded]);

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // `tx.date` may be either a legacy `YYYY-MM-DD` string (pre-backfill)
  // or an ISO 8601 timestamp. Normalize to the UTC calendar day for
  // bucketing/comparisons — `new Date(...)` accepts both forms.
  const txDay = (d: string): string =>
    d.length === 10 && !d.includes("T")
      ? d
      : new Date(d).toISOString().split("T")[0];

  // Per-account inclusion filter (see `useBudgetConfigStore`).
  //
  // Semantics:
  //   - Empty list  → include ALL accounts (legacy behavior, unchanged).
  //   - Non-empty   → include only accounts whose id is in the list.
  //     Transactions with no `accountId` are EXCLUDED when a filter is
  //     active — the user explicitly scoped the budget to specific
  //     accounts, so unassigned rows should not inflate the numbers.
  const filterActive = includedAccountIds.length > 0;
  const includedAccountIdSet = useMemo(
    () => new Set(includedAccountIds),
    [includedAccountIds]
  );

  const includedAccounts = useMemo(
    () =>
      filterActive
        ? store.accounts.filter((a) => includedAccountIdSet.has(a.id))
        : store.accounts,
    [store.accounts, filterActive, includedAccountIdSet]
  );

  const includedTransactions = useMemo(
    () =>
      filterActive
        ? store.transactions.filter(
            (t) => t.accountId !== undefined && includedAccountIdSet.has(t.accountId)
          )
        : store.transactions,
    [store.transactions, filterActive, includedAccountIdSet]
  );

  const todayTransactions = useMemo(
    () => includedTransactions.filter((t) => txDay(t.date) === today),
    [includedTransactions, today]
  );

  const todaySpent = useMemo(
    () =>
      todayTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [todayTransactions]
  );

  const monthTransactions = useMemo(
    () =>
      includedTransactions.filter((t) => txDay(t.date).startsWith(currentMonth)),
    [includedTransactions, currentMonth]
  );

  const monthIncome = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const monthSpent = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const totalBalance = useMemo(
    () => includedAccounts.reduce((sum, a) => sum + a.balance, 0),
    [includedAccounts]
  );

  const { dailyBudget, budgetLeftToday } = useMemo(
    () =>
      calculateDailyBudget({
        accounts: includedAccounts,
        onboardingIncome: income,
        todaySpent,
      }),
    [includedAccounts, income, todaySpent]
  );

  const thisWeekSpending: DailySpending[] = useMemo(() => {
    const days: DailySpending[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const amount = includedTransactions
        .filter((t) => txDay(t.date) === dateStr && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      days.push({ date: dateStr, amount });
    }
    return days;
  }, [includedTransactions]);

  const categoryBudgets: CategoryBudget[] = useMemo(() => {
    const categoryIconMap = Object.fromEntries(
      store.categories.map((c) => [c.name, c.icon])
    );
    return store.budgetSettings.map((bs) => {
      const spentAmount = monthTransactions
        .filter((t) => t.type === "expense" && t.category === bs.category)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        category: bs.category,
        icon: categoryIconMap[bs.category] ?? "📦",
        budgetAmount: bs.budgetAmount,
        spentAmount,
      };
    });
  }, [store.budgetSettings, monthTransactions, store.categories]);

  // Archived bills (e.g. "once" bills that have been marked paid) should not
  // appear in active lists or insight/dashboard computations. The raw rows
  // remain in the store so the user can un-archive via toggle-unpay.
  const activeRecurringBills = useMemo(
    () => store.recurringBills.filter((b) => !b.isArchived),
    [store.recurringBills]
  );

  return {
    // state
    isLoaded: store.isLoaded,
    accounts: store.accounts,
    transactions: store.transactions,
    categories: store.categories,
    recurringBills: activeRecurringBills,
    savingsGoals: store.savingsGoals,
    budgetSettings: store.budgetSettings,
    accountTypes: store.accountTypes,

    // computed
    totalBalance,
    dailyBudget,
    budgetLeftToday,
    monthIncome,
    monthSpent,
    todaySpent,
    thisWeekSpending,
    categoryBudgets,

    // actions (forward db automatically)
    addAccount: (account: Parameters<typeof store.addAccount>[1]) =>
      db ? store.addAccount(db, account) : Promise.resolve(),
    updateAccount: (
      id: string,
      updates: Parameters<typeof store.updateAccount>[2]
    ) => (db ? store.updateAccount(db, id, updates) : Promise.resolve()),
    deleteAccount: (id: string) =>
      db ? store.deleteAccount(db, id) : Promise.resolve(),
    addTransaction: (tx: Parameters<typeof store.addTransaction>[1]) =>
      db ? store.addTransaction(db, tx) : Promise.resolve(),
    updateTransaction: (
      id: string,
      updates: Parameters<typeof store.updateTransaction>[2]
    ) => (db ? store.updateTransaction(db, id, updates) : Promise.resolve()),
    deleteTransaction: (id: string) =>
      db ? store.deleteTransaction(db, id) : Promise.resolve(),
    addRecurringBill: (bill: Parameters<typeof store.addRecurringBill>[1]) =>
      db ? store.addRecurringBill(db, bill) : Promise.resolve(),
    toggleBillPaid: (id: string) =>
      db ? store.toggleBillPaid(db, id) : Promise.resolve(),
    addSavingsGoal: (goal: Parameters<typeof store.addSavingsGoal>[1]) =>
      db ? store.addSavingsGoal(db, goal) : Promise.resolve(),
    updateSavingsGoal: (
      id: string,
      updates: Parameters<typeof store.updateSavingsGoal>[2]
    ) => (db ? store.updateSavingsGoal(db, id, updates) : Promise.resolve()),
    setBudget: (category: string, budgetAmount: number) =>
      db ? store.setBudget(db, category, budgetAmount) : Promise.resolve(),
    addCategory: (category: Parameters<typeof store.addCategory>[1]) =>
      db ? store.addCategory(db, category) : Promise.resolve(),
    updateCategory: (
      id: string,
      updates: Parameters<typeof store.updateCategory>[2]
    ) => (db ? store.updateCategory(db, id, updates) : Promise.resolve()),
    deleteCategory: (id: string) =>
      db ? store.deleteCategory(db, id) : Promise.resolve(),
    reorderCategories: (orderedIds: string[]) =>
      db ? store.reorderCategories(db, orderedIds) : Promise.resolve(),
    addAccountType: (accountType: Parameters<typeof store.addAccountType>[1]) =>
      db ? store.addAccountType(db, accountType) : Promise.resolve(),
    updateAccountType: (
      id: string,
      updates: Parameters<typeof store.updateAccountType>[2]
    ) => (db ? store.updateAccountType(db, id, updates) : Promise.resolve()),
    deleteAccountType: (id: string) =>
      db ? store.deleteAccountType(db, id) : Promise.resolve(),
  };
}
