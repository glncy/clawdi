import { useSystemTheme } from "@/hooks/useCustomTheme";
import { Redirect } from "expo-router";

export default function Index() {
  useSystemTheme();
  // Redirect to onboarding for now to verify the new screens.
  // We will change this to conditionally route based on auth/onboarding state later.
  return <Redirect href="/(main)/onboarding" />;
}
