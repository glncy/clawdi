import { View, Pressable } from "react-native";
import { format as formatDate } from "date-fns";
import { AppText } from "@/components/atoms/Text";
import { getCategoryIcon } from "@/utils/categoryIcon";
import { useCurrency } from "@/hooks/useCurrency";
import type { Transaction } from "@/types";

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: () => void;
}

function formatTime(dateStr: string): string | null {
  if (!dateStr) return null;
  // Date-only strings (YYYY-MM-DD) have no time component; skip rendering.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return formatDate(d, "h:mm a");
}

export const TransactionRow = ({ transaction, onPress }: TransactionRowProps) => {
  const { format } = useCurrency();
  const isExpense = transaction.type === "expense";
  const timeLabel = formatTime(transaction.date);

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 rounded-xl bg-surface p-3">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-default">
        <AppText size="base">{getCategoryIcon(transaction.category)}</AppText>
      </View>
      <View className="flex-1 gap-0.5">
        <AppText size="sm" weight="medium">
          {transaction.item}
        </AppText>
        <AppText size="xs" color="muted">
          {timeLabel ? `${transaction.category} · ${timeLabel}` : transaction.category}
        </AppText>
      </View>
      <AppText
        size="sm"
        weight="semibold"
        family="mono"
        color={isExpense ? "foreground" : "primary"}
        selectable
      >
        {isExpense ? "-" : "+"}
        {format(transaction.amount)}
      </AppText>
    </Pressable>
  );
};
