import { View } from "react-native";
import { Stack } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Input,
  Label,
  TextField,
  Switch,
} from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useBudgetConfigStore } from "@/stores/useBudgetConfigStore";
import { useUserStore } from "@/stores/useUserStore";

/**
 * Budget Settings screen.
 *
 * Two modes, mutually exclusive based on whether the user has any accounts:
 *
 * - With accounts: per-account inclusion filter (writes to
 *   `useBudgetConfigStore`). Switches reflect "included in budget"; an empty
 *   inclusion list means "include all" (legacy default), so a switch toggled
 *   OFF while no filter is active will FLIP the semantics to an explicit
 *   inclusion list.
 * - Without accounts: editable onboarding-income fallback (writes to
 *   `useUserStore.setIncome`). This is what `calculateDailyBudget` falls
 *   back to when no accounts exist.
 */
export default function BudgetSettingsScreen() {
  const { accounts } = useFinanceData();
  const { includedAccountIds, setIncludedAccountIds } = useBudgetConfigStore();
  const income = useUserStore((s) => s.income);
  const setIncome = useUserStore((s) => s.setIncome);
  const hasAccounts = accounts.length > 0;

  const { control, handleSubmit } = useForm<{ income: string }>({
    defaultValues: { income: income || "" },
  });

  const filterActive = includedAccountIds.length > 0;

  const toggleAccount = async (id: string) => {
    // When no filter is active (empty list = "include all"), toggling a
    // switch OFF must materialize an explicit inclusion list of all OTHER
    // accounts. Otherwise we'd silently no-op.
    if (!filterActive) {
      const next = accounts.map((a) => a.id).filter((x) => x !== id);
      await setIncludedAccountIds(next);
      return;
    }
    const next = includedAccountIds.includes(id)
      ? includedAccountIds.filter((x) => x !== id)
      : [...includedAccountIds, id];
    await setIncludedAccountIds(next);
  };

  const onSaveIncome = (data: { income: string }) => {
    setIncome(data.income);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Budget Settings" }} />
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-6 gap-6"
      >
        {hasAccounts ? (
          <View className="gap-3">
            <AppText size="sm" color="muted">
              Accounts included in budget
            </AppText>
            <AppText size="xs" color="muted">
              Select which accounts should count toward your daily budget and
              spending trends. Leave all on to include everything.
            </AppText>
            {accounts.map((a) => {
              const enabled = !filterActive || includedAccountIds.includes(a.id);
              return (
                <View
                  key={a.id}
                  className="flex-row items-center justify-between p-4 rounded-xl bg-surface"
                >
                  <View className="flex-row items-center gap-3">
                    <AppText size="xl">{a.icon}</AppText>
                    <AppText size="sm" weight="medium">
                      {a.name}
                    </AppText>
                  </View>
                  <Switch
                    isSelected={enabled}
                    onSelectedChange={() => toggleAccount(a.id)}
                  />
                </View>
              );
            })}
          </View>
        ) : (
          <View className="gap-3">
            <AppText size="sm" color="muted">
              Monthly income
            </AppText>
            <AppText size="xs" color="muted">
              We use this to calculate your daily budget. Add accounts later to
              track by balance instead.
            </AppText>
            <TextField>
              <Label>Monthly income</Label>
              <Controller
                control={control}
                name="income"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </TextField>
            <Button onPress={handleSubmit(onSaveIncome)}>
              <Button.Label>Save</Button.Label>
            </Button>
          </View>
        )}
      </KeyboardAwareScrollView>
    </>
  );
}
