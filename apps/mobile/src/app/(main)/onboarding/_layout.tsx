import { Stack } from "expo-router";
import { useSystemTheme } from "@/hooks/useCustomTheme";

export default function OnboardingLayout() {
  useSystemTheme();

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="step-sliders" />
      <Stack.Screen name="step-result" />
      <Stack.Screen name="step-questions" />
      <Stack.Screen name="step-score" />
    </Stack>
  );
}
