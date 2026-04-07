export { accounts } from "./accounts";
export { transactions } from "./transactions";
export { categories } from "./categories";
export { recurringBills } from "./recurringBills";
export { savingsGoals } from "./savingsGoals";
export { budgetSettings } from "./budgetSettings";

export type { AccountRow, NewAccount } from "./accounts";
export type { TransactionRow, NewTransaction } from "./transactions";
export type { CategoryRow, NewCategory } from "./categories";
export type { RecurringBillRow, NewRecurringBill } from "./recurringBills";
export type { SavingsGoalRow, NewSavingsGoal } from "./savingsGoals";
export type { BudgetSettingRow, NewBudgetSetting } from "./budgetSettings";

import { accounts } from "./accounts";
import { transactions } from "./transactions";
import { categories } from "./categories";
import { recurringBills } from "./recurringBills";
import { savingsGoals } from "./savingsGoals";
import { budgetSettings } from "./budgetSettings";

export const schema = {
  accounts,
  transactions,
  categories,
  recurringBills,
  savingsGoals,
  budgetSettings,
};
