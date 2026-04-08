import { Pressable, View } from "react-native";
import { AppText } from "@/components/atoms/Text";
import { RecurringBillRow } from "@/components/molecules/RecurringBillRow";
import { useCurrency } from "@/hooks/useCurrency";
import type { RecurringBill } from "@/types";

interface RecurringBillsSectionProps {
  bills: RecurringBill[];
  onAdd?: () => void;
}

export const RecurringBillsSection = ({ bills, onAdd }: RecurringBillsSectionProps) => {
  const { format } = useCurrency();
  const unpaid = bills
    .filter((b) => !b.isPaid)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const paid = bills.filter((b) => b.isPaid);
  const sorted = [...unpaid, ...paid];

  const upcomingTotal = unpaid.reduce((sum, b) => sum + b.amount, 0);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText size="sm" weight="semibold">
          Upcoming Bills
        </AppText>
        {bills.length > 0 && (
          <AppText size="xs" color="muted">
            {format(upcomingTotal)} due
          </AppText>
        )}
      </View>
      {bills.length === 0 ? (
        <View className="rounded-xl bg-surface p-6 items-center gap-2">
          <AppText size="sm" color="muted" align="center">
            No upcoming bills
          </AppText>
          <AppText size="xs" color="muted" align="center">
            Add recurring bills to stay on top of your subscriptions and payments.
          </AppText>
          {onAdd && (
            <Pressable onPress={onAdd} className="mt-1">
              <AppText size="xs" color="primary" weight="semibold">
                + Add Bill
              </AppText>
            </Pressable>
          )}
        </View>
      ) : (
        <View className="overflow-hidden rounded-xl bg-surface">
          {sorted.map((bill, i) => (
            <RecurringBillRow
              key={bill.id}
              bill={bill}
              isLast={i === sorted.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};
