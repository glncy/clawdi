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
import { useFinanceData } from "@/hooks/useFinanceData";

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
              $
              {totalBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </AppText>
            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
                <AppText size="xs" color="primary" weight="semibold">
                  ↑
                </AppText>
                <AppText size="xs" color="primary" weight="medium">
                  $
                  {monthIncome.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </AppText>
              </View>
              <View className="flex-row items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1">
                <AppText size="xs" color="danger" weight="semibold">
                  ↓
                </AppText>
                <AppText size="xs" color="danger" weight="medium">
                  $
                  {monthSpent.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </AppText>
              </View>
            </View>
          </Card.Body>
        </Card>

        {/* Spending Trend — This Week */}
        <SpendingTrend data={thisWeekSpending} dailyBudget={dailyBudget} />

        {/* Budget + Shield */}
        <BudgetCard amountLeft={budgetLeftToday} dailyBudget={dailyBudget} />
        <BudgetShieldBanner overAmount={overBudget} />

        {/* Accounts */}
        <AccountsSection accounts={accounts} />

        {/* Category Spending */}
        {categoryBudgets.length > 0 && (
          <CategorySpendingRow categories={categoryBudgets} />
        )}

        {/* Recurring Bills */}
        <RecurringBillsSection bills={recurringBills} />

        {/* Transactions */}
        <TransactionList transactions={transactions} limit={5} />

        {/* Savings Goals */}
        <SavingsGoalsSection goals={savingsGoals} />

        {/* Finance Insight */}
        <FinanceInsight />
      </ScrollView>

      <AddTransactionSheet />
    </>
  );
}
