import { Account } from "../types";

interface BudgetInput {
  accounts: Account[];
  onboardingIncome: string;
  todaySpent: number;
}

interface BudgetResult {
  dailyBudget: number;
  budgetLeftToday: number;
}

const EXCLUDE_FROM_BUDGET_BY_DEFAULT: Account["type"][] = [
  "savings",
  "investment",
  "credit",
];

function getRemainingDaysInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remaining = lastDay - now.getDate() + 1;
  return Math.max(remaining, 1);
}

export function calculateDailyBudget({
  accounts,
  onboardingIncome,
  todaySpent,
}: BudgetInput): BudgetResult {
  let dailyBudget: number;

  if (accounts.length === 0) {
    const income = parseFloat(onboardingIncome) || 0;
    dailyBudget = income / 30;
  } else {
    const spendableBalance = accounts
      .filter((account) => {
        if (account.excludeFromBudget !== undefined) {
          return !account.excludeFromBudget;
        }
        return !EXCLUDE_FROM_BUDGET_BY_DEFAULT.includes(account.type);
      })
      .reduce((sum, account) => sum + account.balance, 0);

    const remainingDays = getRemainingDaysInMonth();
    dailyBudget = spendableBalance / remainingDays;
  }

  const budgetLeftToday = dailyBudget - todaySpent;

  return { dailyBudget, budgetLeftToday };
}
