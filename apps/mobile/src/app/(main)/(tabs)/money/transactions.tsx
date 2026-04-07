import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { TransactionRow } from "@/components/molecules/TransactionRow";
import { groupByDate } from "@/components/organisms/TransactionList/TransactionList";
import { MOCK_TRANSACTIONS } from "@/data/mockData";

export default function TransactionsScreen() {
  const grouped = groupByDate(MOCK_TRANSACTIONS);

  return (
    <>
      <Stack.Screen options={{ title: "All Transactions" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-32 gap-4"
      >
        {grouped.map((group) => (
          <View key={group.date} className="gap-2">
            <AppText size="xs" color="muted" weight="medium">
              {group.label}
            </AppText>
            <View className="overflow-hidden rounded-xl bg-surface">
              {group.items.map((tx, i) => (
                <View key={tx.id}>
                  <TransactionRow transaction={tx} />
                  {i < group.items.length - 1 && (
                    <View className="ml-14 h-px bg-default" />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}
