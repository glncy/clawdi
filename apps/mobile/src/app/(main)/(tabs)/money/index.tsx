import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";
import { Card } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { BudgetCard } from "@/components/molecules/BudgetCard";
import { BudgetShieldBanner } from "@/components/atoms/BudgetShieldBanner";
import { CategorySpendingRow } from "@/components/molecules/CategorySpendingRow";
import { SpendingTrend } from "@/components/molecules/SpendingTrend";
import { TransactionList } from "@/components/organisms/TransactionList";
import { AccountsSection } from "@/components/organisms/AccountsSection";
import { RecurringBillsSection } from "@/components/organisms/RecurringBillsSection";
import { SavingsGoalsSection } from "@/components/organisms/SavingsGoalsSection";
import {
  MOCK_BALANCE,
  MOCK_INCOME,
  MOCK_SPENT,
  MOCK_BUDGET_LEFT,
  MOCK_DAILY_BUDGET,
  MOCK_TRANSACTIONS,
  MOCK_SAVINGS_GOALS,
  MOCK_CATEGORY_BUDGETS,
  MOCK_DAILY_SPENDING,
  MOCK_ACCOUNTS,
  MOCK_RECURRING_BILLS,
} from "@/data/mockData";

export default function MoneyScreen() {
  const overBudget = MOCK_DAILY_BUDGET - MOCK_BUDGET_LEFT > MOCK_DAILY_BUDGET
    ? MOCK_SPENT - MOCK_DAILY_BUDGET
    : 0;

  return (
    <>
      <Stack.Screen options={{ title: "Finance" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-32 gap-5"
      >
        {/* Balance Hero */}
        <Card className="bg-surface p-5">
          <Card.Body className="gap-3">
            <AppText size="xs" color="muted">
              Available Balance
            </AppText>
            <AppText size="4xl" weight="bold" family="mono" selectable>
              ${MOCK_BALANCE.toLocaleString()}.00
            </AppText>
            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
                <AppText size="xs" color="primary" weight="semibold">
                  ↑
                </AppText>
                <AppText size="xs" color="primary" weight="medium">
                  ${MOCK_INCOME.toLocaleString()}
                </AppText>
              </View>
              <View className="flex-row items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1">
                <AppText size="xs" color="danger" weight="semibold">
                  ↓
                </AppText>
                <AppText size="xs" color="danger" weight="medium">
                  ${MOCK_SPENT.toLocaleString()}
                </AppText>
              </View>
            </View>
          </Card.Body>
        </Card>

        {/* Accounts */}
        <AccountsSection accounts={MOCK_ACCOUNTS} />

        {/* Category Spending */}
        <CategorySpendingRow categories={MOCK_CATEGORY_BUDGETS} />

        {/* Spending Trend */}
        <SpendingTrend
          data={MOCK_DAILY_SPENDING}
          dailyBudget={MOCK_DAILY_BUDGET}
        />

        {/* Budget + Shield */}
        <BudgetCard
          amountLeft={MOCK_BUDGET_LEFT}
          dailyBudget={MOCK_DAILY_BUDGET}
        />
        <BudgetShieldBanner overAmount={overBudget} />

        {/* Recurring Bills */}
        <RecurringBillsSection bills={MOCK_RECURRING_BILLS} />

        {/* Transactions */}
        <TransactionList transactions={MOCK_TRANSACTIONS} limit={5} />

        {/* Savings Goals */}
        <SavingsGoalsSection goals={MOCK_SAVINGS_GOALS} />
      </ScrollView>
    </>
  );
}
