import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalAI } from "./useLocalAI";
import { useIsAIAvailable } from "./useIsAIAvailable";
import { useDayData } from "./useDayData";
import {
  buildDayInsightPrompt,
  getTimeOfDay,
  DAY_INSIGHT_SYSTEM_PROMPT,
} from "../services/dayInsightPrompt";

export function useDayInsight() {
  const isAIAvailable = useIsAIAvailable();
  const { complete } = useLocalAI();
  const {
    grouped,
    completedToday,
    totalToday,
    pomodoroSessionsToday,
  } = useDayData();

  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatedRef = useRef(false);

  const generate = useCallback(async () => {
    if (!isAIAvailable || isGenerating) return;

    setIsGenerating(true);
    generatedRef.current = true;

    const prompt = buildDayInsightPrompt({
      priorityCount: totalToday,
      mustCount: grouped.must.length,
      winCount: grouped.win.length,
      overdueCount: grouped.overdue.length,
      completedToday,
      pomodoroSessionsToday,
      timeOfDay: getTimeOfDay(),
    });

    try {
      const result = await complete(prompt, DAY_INSIGHT_SYSTEM_PROMPT);
      if (result?.text) {
        setInsight(result.text.trim());
      }
    } catch (err) {
      console.warn("[useDayInsight] Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAIAvailable, isGenerating, totalToday, grouped, completedToday, pomodoroSessionsToday]);

  useEffect(() => {
    if (isAIAvailable && !generatedRef.current) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAIAvailable]);

  return { insight, isGenerating, refresh: generate };
}
