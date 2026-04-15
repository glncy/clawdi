import { useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useQuickActionStore } from "@/stores/useQuickActionStore";

/**
 * Fallback screen for the action tab.
 * The NativeTabs trigger uses href={null} so this screen should never
 * activate. If it does (e.g., during development), it opens the sheet
 * and navigates back immediately.
 */
export default function ActionScreen() {
  useEffect(() => {
    useQuickActionStore.getState().open();
    router.back();
  }, []);

  return <View />;
}
