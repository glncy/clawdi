interface BudgetShieldData {
  budgetLeftToday: number;
  dailyBudget: number;
  todaySpent: number;
  topCategory: string;
  topCategoryAmount: number;
  currency: string;
}

export function buildBudgetShieldPrompt(data: BudgetShieldData): string {
  const percentLeft = Math.round(
    (data.budgetLeftToday / data.dailyBudget) * 100
  );

  return [
    `Daily budget: ${data.currency}${data.dailyBudget.toFixed(2)}`,
    `Spent today: ${data.currency}${data.todaySpent.toFixed(2)} (${100 - percentLeft}% used)`,
    `Remaining: ${data.currency}${data.budgetLeftToday.toFixed(2)} (${percentLeft}% left)`,
    `Biggest spend today: ${data.topCategory} (${data.currency}${data.topCategoryAmount.toFixed(2)})`,
  ].join("\n");
}

export const BUDGET_SHIELD_SYSTEM_PROMPT = `You are clawdi's budget guard. The user's daily budget is running very low (below 20% remaining). Write a single short warning sentence (under 30 words) that:
- States what's causing the budget pressure
- Suggests one concrete action
Be direct but friendly. No emojis. No bullet points.`;
