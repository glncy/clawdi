import { View } from "react-native";
import { AppText } from "@/components/atoms/Text";
import { SavingsGoalCard } from "@/components/molecules/SavingsGoalCard";
import type { SavingsGoal } from "@/types";

interface SavingsGoalsSectionProps {
  goals: SavingsGoal[];
}

export const SavingsGoalsSection = ({ goals }: SavingsGoalsSectionProps) => {
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const currency = goals[0]?.currency === "USD" ? "$" : (goals[0]?.currency ?? "$");

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText size="sm" weight="semibold">
          Savings Goals
        </AppText>
        <AppText size="xs" color="muted">
          {currency}{totalSaved.toLocaleString()} / {currency}{totalTarget.toLocaleString()}
        </AppText>
      </View>
      <View className="gap-3">
        {goals.map((goal) => (
          <SavingsGoalCard key={goal.id} goal={goal} />
        ))}
      </View>
    </View>
  );
};
