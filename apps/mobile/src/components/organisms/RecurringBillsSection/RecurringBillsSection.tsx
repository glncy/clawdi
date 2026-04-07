import { View } from "react-native";
import { AppText } from "@/components/atoms/Text";
import { RecurringBillRow } from "@/components/molecules/RecurringBillRow";
import type { RecurringBill } from "@/types";

interface RecurringBillsSectionProps {
  bills: RecurringBill[];
}

export const RecurringBillsSection = ({ bills }: RecurringBillsSectionProps) => {
  const unpaid = bills
    .filter((b) => !b.isPaid)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const paid = bills.filter((b) => b.isPaid);
  const sorted = [...unpaid, ...paid];

  const upcomingTotal = unpaid.reduce((sum, b) => sum + b.amount, 0);
  const currency = bills[0]?.currency === "USD" ? "$" : (bills[0]?.currency ?? "$");

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText size="sm" weight="semibold">
          Upcoming Bills
        </AppText>
        <AppText size="xs" color="muted">
          {currency}{upcomingTotal.toFixed(2)} due
        </AppText>
      </View>
      <View className="overflow-hidden rounded-xl bg-surface">
        {sorted.map((bill, i) => (
          <RecurringBillRow
            key={bill.id}
            bill={bill}
            isLast={i === sorted.length - 1}
          />
        ))}
      </View>
    </View>
  );
};
