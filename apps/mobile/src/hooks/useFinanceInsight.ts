import { useCallback, useEffect, useRef, useState } from "react";
import { useFinanceData } from "./useFinanceData";
import { useLocalAI } from "./useLocalAI";
import { useIsAIAvailable } from "./useIsAIAvailable";
import { useCurrency } from "./useCurrency";
import {
  buildFinanceInsightPrompt,
  FINANCE_INSIGHT_SYSTEM_PROMPT,
} from "../services/financeInsightPrompt";

export function useFinanceInsight() {
  const isAIAvailable = useIsAIAvailable();
  const { complete } = useLocalAI();
  const { symbol: currency } = useCurrency();
  const {
    totalBalance,
    dailyBudget,
    budgetLeftToday,
    monthIncome,
    monthSpent,
    todaySpent,
    thisWeekSpending,
    categoryBudgets,
    recurringBills,
    savingsGoals,
  } = useFinanceData();

  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatedRef = useRef(false);

  const generate = useCallback(async () => {
    if (!isAIAvailable || isGenerating) return;

    setIsGenerating(true);
    generatedRef.current = true;

    const today = new Date().toISOString().split("T")[0];
    const upcomingBills = recurringBills.filter(
      (b) => !b.isPaid && b.nextDueDate >= today
    );
    const totalSavingsCurrent = savingsGoals.reduce(
      (sum, g) => sum + g.currentAmount,
      0
    );
    const totalSavingsTarget = savingsGoals.reduce(
      (sum, g) => sum + g.targetAmount,
      0
    );

    const prompt = buildFinanceInsightPrompt({
      totalBalance,
      dailyBudget,
      budgetLeftToday,
      monthIncome,
      monthSpent,
      todaySpent,
      currency,
      thisWeekSpending,
      categoryBudgets,
      upcomingBillsCount: upcomingBills.length,
      upcomingBillsTotal: upcomingBills.reduce((sum, b) => sum + b.amount, 0),
      savingsProgress:
        totalSavingsTarget > 0
          ? { current: totalSavingsCurrent, target: totalSavingsTarget }
          : null,
    });

    try {
      const result = await complete(prompt, FINANCE_INSIGHT_SYSTEM_PROMPT);
      if (result?.text) {
        setInsight(result.text.trim());
      }
    } catch (err) {
      console.warn("[useFinanceInsight] Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAIAvailable, isGenerating, totalBalance, dailyBudget, budgetLeftToday, monthIncome, monthSpent, todaySpent, thisWeekSpending, categoryBudgets, recurringBills, savingsGoals]);

  useEffect(() => {
    if (isAIAvailable && !generatedRef.current) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAIAvailable]);

  return { insight, isGenerating, refresh: generate };
}
