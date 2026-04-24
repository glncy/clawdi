import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen
        name="ai-settings"
        options={{ headerShown: true, title: "AI" }}
      />
      <Stack.Screen
        name="add-person"
        options={{ presentation: "modal", headerShown: true, title: "Add Person" }}
      />
      <Stack.Screen
        name="add-transaction"
        options={{ presentation: "modal", headerShown: true, title: "Add Transaction" }}
      />
      <Stack.Screen
        name="add-account"
        options={{ presentation: "modal", headerShown: true, title: "Add Account" }}
      />
      <Stack.Screen
        name="add-bill"
        options={{ presentation: "modal", headerShown: true, title: "Add Bill" }}
      />
      <Stack.Screen
        name="add-goal"
        options={{ presentation: "modal", headerShown: true, title: "Add Goal" }}
      />
      <Stack.Screen
        name="manage-categories"
        options={{ presentation: "modal", headerShown: true, title: "Manage Categories" }}
      />
      <Stack.Screen
        name="budget-settings"
        options={{ headerShown: true, title: "Budget Settings" }}
      />
    </Stack>
  );
}
