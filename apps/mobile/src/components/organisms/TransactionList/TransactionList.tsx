import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { TransactionRow } from "@/components/molecules/TransactionRow";
import { AppText } from "@/components/atoms/Text";
import { useAddTransactionSheetStore } from "@/stores/useAddTransactionSheetStore";
import type { Transaction } from "@/types";

function openEditTransaction(tx: Transaction) {
  useAddTransactionSheetStore.getState().setEdit(tx);
  router.push("/(main)/add-transaction");
}

interface TransactionListProps {
  transactions: Transaction[];
  limit?: number;
  onAdd?: () => void;
}

export function getDateLabel(dateStr: string): string {
  const today = new Date();
  const date = new Date(dateStr + "T12:00:00");
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function groupByDate(
  transactions: Transaction[]
): { date: string; label: string; items: Transaction[] }[] {
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const existing = groups.get(tx.date);
    if (existing) {
      existing.push(tx);
    } else {
      groups.set(tx.date, [tx]);
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label: getDateLabel(date),
      items,
    }));
}

export const TransactionList = ({ transactions, limit, onAdd }: TransactionListProps) => {
  const displayed = limit ? transactions.slice(0, limit) : transactions;
  const grouped = groupByDate(displayed);
  const hasMore = limit !== undefined && transactions.length > limit;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText size="sm" weight="semibold">
          Recent Activity
        </AppText>
        {hasMore && (
          <Pressable
            onPress={() => router.push("/(main)/(tabs)/money/transactions" as never)}
            hitSlop={8}
          >
            <AppText size="xs" color="primary" weight="medium">
              See all
            </AppText>
          </Pressable>
        )}
      </View>
      {grouped.length === 0 ? (
        <View className="rounded-xl bg-surface p-6 items-center gap-2">
          <AppText size="sm" color="muted" align="center">
            No transactions yet
          </AppText>
          <AppText size="xs" color="muted" align="center">
            Tap the + button to log your first income or expense.
          </AppText>
          {onAdd && (
            <Pressable onPress={onAdd} className="mt-1">
              <AppText size="xs" color="primary" weight="semibold">
                + Add Transaction
              </AppText>
            </Pressable>
          )}
        </View>
      ) : (
        grouped.map((group) => (
          <View key={group.date} className="gap-2">
            <AppText size="xs" color="muted" weight="medium">
              {group.label}
            </AppText>
            {group.items.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onPress={() => openEditTransaction(tx)}
              />
            ))}
          </View>
        ))
      )}
    </View>
  );
};
