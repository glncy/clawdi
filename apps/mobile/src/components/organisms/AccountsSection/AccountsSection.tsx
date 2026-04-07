import { ScrollView, View } from "react-native";
import { AppText } from "@/components/atoms/Text";
import type { Account } from "@/types";

interface AccountsSectionProps {
  accounts: Account[];
}

const TYPE_LABELS: Record<Account["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit",
  cash: "Cash",
  investment: "Investment",
};

export const AccountsSection = ({ accounts }: AccountsSectionProps) => {
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const currency = accounts[0]?.currency === "USD" ? "$" : (accounts[0]?.currency ?? "$");

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText size="sm" weight="semibold">
          Accounts
        </AppText>
        <AppText size="xs" color="muted">
          Net {currency}{totalBalance.toLocaleString()}
        </AppText>
      </View>
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
                {isNegative ? "-" : ""}{currency}
                {Math.abs(account.balance).toLocaleString()}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};
