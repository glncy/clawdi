import { Pressable, View } from "react-native";
import { AppText } from "@/components/atoms/Text";
import { SavingsGoalCard } from "@/components/molecules/SavingsGoalCard";
import { useCurrency } from "@/hooks/useCurrency";
import type { SavingsGoal } from "@/types";

interface SavingsGoalsSectionProps {
  goals: SavingsGoal[];
  onAdd?: () => void;
}

export const SavingsGoalsSection = ({ goals, onAdd }: SavingsGoalsSectionProps) => {
  const { format } = useCurrency();
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText size="sm" weight="semibold">
          Savings Goals
        </AppText>
        {goals.length > 0 && (
          <AppText size="xs" color="muted">
            {format(totalSaved)} / {format(totalTarget)}
          </AppText>
        )}
      </View>
      {goals.length === 0 ? (
        <View className="rounded-xl bg-surface p-6 items-center gap-2">
          <AppText size="sm" color="muted" align="center">
            No savings goals yet
          </AppText>
          <AppText size="xs" color="muted" align="center">
            Set a goal to start tracking your progress toward something meaningful.
          </AppText>
          {onAdd && (
            <Pressable onPress={onAdd} className="mt-1">
              <AppText size="xs" color="primary" weight="semibold">
                + Add Goal
              </AppText>
            </Pressable>
          )}
        </View>
      ) : (
        <View className="gap-3">
          {goals.map((goal) => (
            <SavingsGoalCard key={goal.id} goal={goal} />
          ))}
        </View>
      )}
    </View>
  );
};
