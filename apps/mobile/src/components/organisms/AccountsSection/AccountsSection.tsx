import { Pressable, ScrollView, View } from "react-native";
import { AppText } from "@/components/atoms/Text";
import { useCurrency } from "@/hooks/useCurrency";
import type { Account } from "@/types";

interface AccountsSectionProps {
  accounts: Account[];
  onAdd?: () => void;
}

const TYPE_LABELS: Record<Account["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit",
  cash: "Cash",
  investment: "Investment",
};

export const AccountsSection = ({ accounts, onAdd }: AccountsSectionProps) => {
  const { format } = useCurrency();
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText size="sm" weight="semibold">
          Accounts
        </AppText>
        {accounts.length > 0 && (
          <AppText size="xs" color="muted">
            Net {format(totalBalance)}
          </AppText>
        )}
      </View>
      {accounts.length === 0 ? (
        <View className="rounded-xl bg-surface p-6 items-center gap-2">
          <AppText size="sm" color="muted" align="center">
            No accounts added yet
          </AppText>
          <AppText size="xs" color="muted" align="center">
            Add a checking, savings, or credit account to track your balances.
          </AppText>
          {onAdd && (
            <Pressable onPress={onAdd} className="mt-1">
              <AppText size="xs" color="primary" weight="semibold">
                + Add Account
              </AppText>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3"
        >
          {accounts.map((account) => {
            const isNegative = account.balance < 0;
            return (
              <View
                key={account.id}
                className="w-36 rounded-xl bg-surface p-4 gap-2"
              >
                <View className="flex-row items-center justify-between">
                  <AppText size="xl">{account.icon}</AppText>
                </View>
                <View className="gap-0.5">
                  <AppText size="xs" color="muted">
                    {TYPE_LABELS[account.type]}
                  </AppText>
                  <AppText size="sm" weight="medium" numberOfLines={1}>
                    {account.name}
                  </AppText>
                </View>
                <AppText
                  size="base"
                  weight="bold"
                  family="mono"
                  color={isNegative ? "danger" : "foreground"}
                >
                  {isNegative ? "-" : ""}
                  {format(Math.abs(account.balance))}
                </AppText>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};
