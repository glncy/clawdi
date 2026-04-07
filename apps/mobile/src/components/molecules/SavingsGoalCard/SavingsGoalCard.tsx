import { View } from "react-native";
import { Card } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import type { SavingsGoal } from "@/types";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
}

export const SavingsGoalCard = ({ goal }: SavingsGoalCardProps) => {
  const progress = goal.currentAmount / goal.targetAmount;
  const percentage = Math.round(progress * 100);
  const currency = goal.currency === "USD" ? "$" : goal.currency;
  const remaining = goal.targetAmount - goal.currentAmount;

  const progressBarColor =
    percentage >= 75 ? "bg-success" : "bg-primary";

  return (
    <Card className="bg-surface p-5">
      <Card.Body className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {goal.icon && (
              <AppText size="lg">{goal.icon}</AppText>
            )}
            <AppText size="sm" weight="semibold">
              {goal.name}
            </AppText>
          </View>
          <AppText size="xs" color="muted">
            {goal.targetDate}
          </AppText>
        </View>
        <View className="flex-row items-baseline gap-1">
          <AppText size="lg" weight="bold" family="mono" selectable>
            {currency}
            {goal.currentAmount.toLocaleString()}
          </AppText>
          <AppText size="xs" color="muted">
            / {currency}
            {goal.targetAmount.toLocaleString()}
          </AppText>
        </View>
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <AppText size="xs" color="muted">
              {currency}{remaining.toLocaleString()} to go
            </AppText>
            <AppText size="xs" weight="semibold" color={percentage >= 75 ? "success" : "primary"}>
              {percentage}%
            </AppText>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-default">
            <View
              className={`h-full rounded-full ${progressBarColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </View>
        </View>
      </Card.Body>
    </Card>
  );
};
