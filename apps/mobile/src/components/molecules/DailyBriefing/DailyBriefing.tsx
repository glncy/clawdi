import { useEffect, useState, useCallback } from "react";
import { View } from "react-native";
import { Card, Skeleton } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { Lightning } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useAIStore } from "@/stores/useAIStore";
import { useLocalAI } from "@/hooks/useLocalAI";
import { useIsAIAvailable } from "@/hooks/useIsAIAvailable";
import { useCurrency } from "@/hooks/useCurrency";
import {
  buildBriefingPrompt,
  BRIEFING_SYSTEM_PROMPT,
} from "@/services/briefingPrompt";
import type { Priority, Habit, Contact } from "@/types";
import { formatBytes } from "@/services/localAI";

interface DailyBriefingProps {
  userName: string;
  budgetLeft: number;
  dailyBudget: number;
  priorities: Priority[];
  habits: Habit[];
  contacts: Contact[];
}

/**
 * AI-powered daily briefing card.
 * Only renders when local AI is available (downloading, loading, or ready).
 * Returns null when AI is not set up.
 * @level Molecule
 */
export const DailyBriefing = ({
  userName,
  budgetLeft,
  dailyBudget,
  priorities,
  habits,
  contacts,
}: DailyBriefingProps) => {
  const { symbol: currency } = useCurrency();
  const aiStatus = useAIStore((s) => s.status);
  const downloadProgress = useAIStore((s) => s.downloadProgress);
  const downloadedBytes = useAIStore((s) => s.downloadedBytes);
  const totalBytes = useAIStore((s) => s.totalBytes);
  const { complete, loadModel, isModelLoaded } = useLocalAI();
  const isAIAvailable = useIsAIAvailable();
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const completedPriorities = priorities.filter((p) => p.isCompleted).length;
  const incompletePriorities = priorities.filter((p) => !p.isCompleted);
  const completedHabits = habits.filter((h) => h.isCompleted).length;
  const nudgeContact = contacts.find((c) => c.lastTalkedDaysAgo >= 4);

  const generateBriefing = useCallback(async () => {
    if (hasGenerated || !isModelLoaded) return;
    setHasGenerated(true);

    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    const prompt = buildBriefingPrompt({
      userName,
      timeOfDay,
      budgetLeft,
      dailyBudget,
      currency,
      prioritiesTotal: priorities.length,
      prioritiesCompleted: completedPriorities,
      topPriorities: incompletePriorities.map((p) => p.text).slice(0, 3),
      habitsTotal: habits.length,
      habitsCompleted: completedHabits,
      nudgeContactName: nudgeContact?.name,
      nudgeContactDays: nudgeContact?.lastTalkedDaysAgo,
    });

    const result = await complete(prompt, BRIEFING_SYSTEM_PROMPT);
    if (result?.text) {
      setAiBriefing(result.text.trim());
    }
  }, [
    hasGenerated,
    isModelLoaded,
    userName,
    budgetLeft,
    dailyBudget,
    currency,
    priorities.length,
    completedPriorities,
    incompletePriorities,
    habits.length,
    completedHabits,
    nudgeContact,
    complete,
  ]);

  // Auto-load model if downloaded but not loaded
  useEffect(() => {
    if (isAIAvailable && aiStatus === "idle" && !isModelLoaded) {
      loadModel();
    }
  }, [isAIAvailable, aiStatus, isModelLoaded, loadModel]);

  // Auto-generate briefing once model is ready
  useEffect(() => {
    if (aiStatus === "ready" && isModelLoaded && !hasGenerated) {
      generateBriefing();
    }
  }, [aiStatus, isModelLoaded, hasGenerated, generateBriefing]);

  // Not available at all — render nothing
  if (!isAIAvailable) return null;

  // AI downloading state
  if (aiStatus === "downloading") {
    return (
      <Card className="bg-primary/5 p-4">
        <Card.Body className="gap-2">
          <View className="flex-row items-center gap-2">
            <Lightning
              size={14}
              weight="fill"
              color={primaryColor as string}
            />
            <AppText size="xs" color="primary" weight="medium">
              clawdi AI is setting up...
            </AppText>
          </View>
          <View className="h-1.5 overflow-hidden rounded-full bg-default">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.round(downloadProgress * 100)}%` }}
            />
          </View>
          <AppText size="xs" color="muted">
            {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
          </AppText>
        </Card.Body>
      </Card>
    );
  }

  // AI generating state
  if (aiStatus === "inferring") {
    return (
      <Card className="bg-primary/5 p-4">
        <Card.Body className="gap-2">
          <View className="flex-row items-center gap-2">
            <Lightning
              size={14}
              weight="fill"
              color={primaryColor as string}
            />
            <AppText size="xs" color="primary" weight="medium">
              clawdi is thinking...
            </AppText>
          </View>
          <Skeleton className="h-3 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </Card.Body>
      </Card>
    );
  }

  // AI briefing generated
  if (aiBriefing) {
    return (
      <Card className="bg-primary/5 p-4">
        <Card.Body className="gap-2">
          <View className="flex-row items-center gap-2">
            <Lightning
              size={14}
              weight="fill"
              color={primaryColor as string}
            />
            <AppText size="xs" color="primary" weight="medium">
              clawdi AI
            </AppText>
          </View>
          <AppText size="sm" style={{ lineHeight: 22 }}>
            {aiBriefing}
          </AppText>
        </Card.Body>
      </Card>
    );
  }

  // AI available but loading model into memory
  return (
    <Card className="bg-primary/5 p-4">
      <Card.Body className="gap-2">
        <View className="flex-row items-center gap-2">
          <Lightning
            size={14}
            weight="fill"
            color={primaryColor as string}
          />
          <AppText size="xs" color="primary" weight="medium">
            clawdi AI is getting ready...
          </AppText>
        </View>
        <Skeleton className="h-3 w-2/3 rounded" />
      </Card.Body>
    </Card>
  );
};
