import { View } from "react-native";
import { Separator } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { getCategoryIcon } from "@/utils/categoryIcon";
import { CheckCircle } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useCurrency } from "@/hooks/useCurrency";
import type { RecurringBill } from "@/types";

interface RecurringBillRowProps {
  bill: RecurringBill;
  isLast?: boolean;
}

function getDaysUntilDue(nextDueDate: string): number {
  const today = new Date();
  const due = new Date(nextDueDate + "T12:00:00");
  const diff = due.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDueDate(nextDueDate: string): string {
  const date = new Date(nextDueDate + "T12:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const FREQUENCY_LABELS: Record<RecurringBill["frequency"], string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const RecurringBillRow = ({ bill, isLast }: RecurringBillRowProps) => {
  const [successColor] = useCSSVariable([
    "--color-success",
  ]);
  const { format } = useCurrency();

  const daysUntil = getDaysUntilDue(bill.nextDueDate);

  let dueDateColor: "muted" | "warning" | "danger" = "muted";
  if (!bill.isPaid && daysUntil < 0) dueDateColor = "danger";
  else if (!bill.isPaid && daysUntil <= 7) dueDateColor = "warning";

  return (
    <View>
      <View className="flex-row items-center gap-3 px-3 py-3">
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-default">
          <AppText>{getCategoryIcon(bill.category)}</AppText>
        </View>
        <View className="flex-1">
          <AppText size="sm" weight="medium">
            {bill.name}
          </AppText>
          <AppText size="xs" color="muted">
            {FREQUENCY_LABELS[bill.frequency]}
          </AppText>
        </View>
        <View className="items-end gap-0.5">
          <AppText size="sm" weight="semibold" family="mono">
            {format(bill.amount)}
          </AppText>
          {bill.isPaid ? (
            <View className="flex-row items-center gap-1">
              <CheckCircle size={11} weight="fill" color={successColor as string} />
              <AppText size="xs" color="success">Paid</AppText>
            </View>
          ) : (
            <AppText size="xs" color={dueDateColor}>
              Due {formatDueDate(bill.nextDueDate)}
            </AppText>
          )}
        </View>
      </View>
      {!isLast && <Separator className="ml-14" />}
    </View>
  );
};
