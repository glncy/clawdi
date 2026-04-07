import { View } from "react-native";
import { Card } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useCurrency } from "@/hooks/useCurrency";

interface BudgetCardProps {
  amountLeft: number;
  dailyBudget: number;
}

export const BudgetCard = ({ amountLeft, dailyBudget }: BudgetCardProps) => {
  const { format } = useCurrency();
  const progress = Math.min(1 - amountLeft / dailyBudget, 1);
  const percentage = Math.round((1 - progress) * 100);

  return (
    <Card className="bg-surface p-4">
      <Card.Body className="gap-2">
        <AppText size="xs" color="muted">
          Budget left today
        </AppText>
        <AppText size="2xl" weight="bold" family="mono" selectable>
          {format(amountLeft)}
        </AppText>
        <View className="h-2 overflow-hidden rounded-full bg-default">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${percentage}%` }}
          />
        </View>
      </Card.Body>
    </Card>
  );
};
