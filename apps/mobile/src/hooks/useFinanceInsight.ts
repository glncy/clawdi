import { useEffect, useRef, useState } from "react";
import { load as kvLoad, save as kvSave } from "@/utils/storage/storage";
import { buildInsightCacheKey } from "@/utils/financeInsightCacheKey";
import {
  buildFinanceInsightPrompt,
  FINANCE_INSIGHT_SYSTEM_PROMPT,
} from "@/services/financeInsightPrompt";
import { useLocalAI } from "./useLocalAI";
import { useIsAIAvailable } from "./useIsAIAvailable";
import { useFinanceData } from "./useFinanceData";
import { useCurrency } from "./useCurrency";

interface CachedInsight {
  insight: string;
}

/**
 * AI-powered finance insight, cached by data-hash + day-bucket.
 *
 * On each relevant data change, the hook:
 *   1. Builds a canonical snapshot of the user's finances.
 *   2. Derives a deterministic cache key scoped to the current day-bucket.
 *   3. Loads an existing insight from KV — if present, serves the cache.
 *   4. Otherwise, runs the on-device model and persists the result.
 *
 * `inFlightKey` guards against duplicate generations when the same cache key
 * is computed across re-renders while an async load/generate is pending.
 */
export function useFinanceInsight() {
  const data = useFinanceData();
  const { complete } = useLocalAI();
  const { symbol: currency } = useCurrency();
  const isAIAvailable = useIsAIAvailable();

  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const inFlightKey = useRef<string | null>(null);

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
  } = data;

  useEffect(() => {
    if (!isAIAvailable) return;

    const snapshot = {
      totalBalance,
      dailyBudget,
      budgetLeftToday,
      monthIncome,
      monthSpent,
      todaySpent,
      thisWeekSpending,
      categoryBudgets: categoryBudgets.map((c) => ({
        category: c.category,
        spentAmount: c.spentAmount,
        budgetAmount: c.budgetAmount,
      })),
      bills: recurringBills.map((b) => ({
        id: b.id,
        amount: b.amount,
        frequency: b.frequency,
      })),
      goals: savingsGoals.map((g) => ({
        id: g.id,
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount,
      })),
    };
    const key = buildInsightCacheKey(snapshot);

    if (inFlightKey.current === key) return;
    inFlightKey.current = key;

    let cancelled = false;

    (async () => {
      const cached = await kvLoad<CachedInsight>(key);
      if (cancelled) return;

      if (cached?.insight) {
        setInsight(cached.insight);
        return;
      }

      setIsGenerating(true);
      try {
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
          upcomingBillsTotal: upcomingBills.reduce(
            (sum, b) => sum + b.amount,
            0
          ),
          savingsProgress:
            totalSavingsTarget > 0
              ? { current: totalSavingsCurrent, target: totalSavingsTarget }
              : null,
        });

        const result = await complete(prompt, FINANCE_INSIGHT_SYSTEM_PROMPT);
        if (cancelled) return;

        const text = result?.text?.trim();
        if (text) {
          setInsight(text);
          await kvSave<CachedInsight>(key, { insight: text });
        }
      } catch (err) {
        console.warn("[useFinanceInsight] Generation failed:", err);
      } finally {
        if (!cancelled) setIsGenerating(false);
        // Clear the guard so a subsequent re-render with the same (or any) key
        // can legitimately re-run. Without this, the ref stays pinned and a
        // genuine refresh would be silently blocked.
        if (inFlightKey.current === key) inFlightKey.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isAIAvailable,
    currency,
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
    complete,
  ]);

  return { insight, isGenerating };
}
