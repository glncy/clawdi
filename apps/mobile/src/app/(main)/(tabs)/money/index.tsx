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
import { FinanceInsight } from "@/components/organisms/FinanceInsight";
import { AddTransactionSheet } from "@/components/organisms/AddTransactionSheet";
import { AddAccountSheet } from "@/components/organisms/AddAccountSheet";
import { AddBillSheet } from "@/components/organisms/AddBillSheet";
import { AddGoalSheet } from "@/components/organisms/AddGoalSheet";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useCurrency } from "@/hooks/useCurrency";
import { useAddTransactionSheetStore } from "@/stores/useAddTransactionSheetStore";
import { useAddAccountSheetStore } from "@/stores/useAddAccountSheetStore";
import { useAddBillSheetStore } from "@/stores/useAddBillSheetStore";
import { useAddGoalSheetStore } from "@/stores/useAddGoalSheetStore";

export default function MoneyScreen() {
  const {
    totalBalance,
    monthIncome,
    monthSpent,
    dailyBudget,
    budgetLeftToday,
    accounts,
    transactions,
    recurringBills,
    savingsGoals,
    categoryBudgets,
    thisWeekSpending,
  } = useFinanceData();
  const { format } = useCurrency();

  const overBudget = budgetLeftToday < 0 ? Math.abs(budgetLeftToday) : 0;

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
              {format(totalBalance)}
            </AppText>
            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
                <AppText size="xs" color="primary" weight="semibold">
                  ↑
                </AppText>
                <AppText size="xs" color="primary" weight="medium">
                  {format(monthIncome)}
                </AppText>
              </View>
              <View className="flex-row items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1">
                <AppText size="xs" color="danger" weight="semibold">
                  ↓
                </AppText>
                <AppText size="xs" color="danger" weight="medium">
                  {format(monthSpent)}
                </AppText>
              </View>
            </View>
          </Card.Body>
        </Card>

        {/* Finance Insight */}
        <FinanceInsight />

        {/* Spending Trend — This Week */}
        <SpendingTrend data={thisWeekSpending} dailyBudget={dailyBudget} />

        {/* Budget + Shield */}
        <BudgetCard amountLeft={budgetLeftToday} dailyBudget={dailyBudget} />
        <BudgetShieldBanner overAmount={overBudget} />

        {/* Accounts */}
        <AccountsSection
          accounts={accounts}
          onAdd={() => useAddAccountSheetStore.getState().open()}
        />

        {/* Category Spending */}
        {categoryBudgets.length > 0 && (
          <CategorySpendingRow categories={categoryBudgets} />
        )}

        {/* Recurring Bills */}
        <RecurringBillsSection
          bills={recurringBills}
          onAdd={() => useAddBillSheetStore.getState().open()}
        />

        {/* Transactions */}
        <TransactionList
          transactions={transactions}
          limit={5}
          onAdd={() => useAddTransactionSheetStore.getState().open()}
        />

        {/* Savings Goals */}
        <SavingsGoalsSection
          goals={savingsGoals}
          onAdd={() => useAddGoalSheetStore.getState().open()}
        />

      </ScrollView>

      <AddTransactionSheet />
      <AddAccountSheet />
      <AddBillSheet />
      <AddGoalSheet />
    </>
  );
}
