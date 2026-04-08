import { DailySpending, CategoryBudget } from "../types";

interface FinanceInsightData {
  totalBalance: number;
  dailyBudget: number;
  budgetLeftToday: number;
  monthIncome: number;
  monthSpent: number;
  todaySpent: number;
  currency: string;
  thisWeekSpending: DailySpending[];
  categoryBudgets: CategoryBudget[];
  upcomingBillsCount: number;
  upcomingBillsTotal: number;
  savingsProgress: { current: number; target: number } | null;
}

export function buildFinanceInsightPrompt(data: FinanceInsightData): string {
  const lines = [
    `Balance: ${data.currency}${data.totalBalance.toFixed(2)}`,
    `Today: ${data.currency}${data.budgetLeftToday.toFixed(2)} left of ${data.currency}${data.dailyBudget.toFixed(2)} daily budget`,
    `Month: ${data.currency}${data.monthSpent.toFixed(2)} spent of ${data.currency}${data.monthIncome.toFixed(2)} income`,
  ];

  if (data.thisWeekSpending.length > 0) {
    const weekTotal = data.thisWeekSpending.reduce(
      (sum, d) => sum + d.amount,
      0
    );
    lines.push(`This week spending: ${data.currency}${weekTotal.toFixed(2)}`);
  }

  if (data.categoryBudgets.length > 0) {
    const overBudget = data.categoryBudgets.filter(
      (c) => c.spentAmount > c.budgetAmount
    );
    if (overBudget.length > 0) {
      const names = overBudget.map((c) => c.category).join(", ");
      lines.push(`Over budget in: ${names}`);
    }
    const topCategory = data.categoryBudgets.reduce((a, b) =>
      a.spentAmount > b.spentAmount ? a : b
    );
    lines.push(
      `Biggest spending: ${topCategory.category} (${data.currency}${topCategory.spentAmount.toFixed(2)})`
    );
  }

  if (data.upcomingBillsCount > 0) {
    lines.push(
      `Upcoming bills: ${data.upcomingBillsCount} bills totaling ${data.currency}${data.upcomingBillsTotal.toFixed(2)}`
    );
  }

  if (data.savingsProgress) {
    const pct = Math.round(
      (data.savingsProgress.current / data.savingsProgress.target) * 100
    );
    lines.push(
      `Savings goals: ${pct}% of ${data.currency}${data.savingsProgress.target.toFixed(2)} target reached`
    );
  }

  return lines.join("\n");
}

export const FINANCE_INSIGHT_SYSTEM_PROMPT = `You are clawdi's finance analyst. Generate a brief, conversational finance insight (2-3 sentences max) based on the user's spending data.

Identify the most actionable pattern: budget warnings, category overspending, or positive trends. Be specific with numbers. Do not use bullet points, emojis, or lists. Write like a thoughtful friend who noticed something in the data, not a financial advisor.

Keep it under 60 words.`;
