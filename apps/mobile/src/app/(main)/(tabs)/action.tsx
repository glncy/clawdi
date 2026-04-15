import { useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";

/**
 * Fallback screen for the action tab.
 * NativeTabs cannot prevent default navigation on tabPress, so tapping "+"
 * briefly activates this screen. We immediately redirect to home.
 * The QuickActionSheet opens via listeners.tabPress in _layout.tsx —
 * this screen must NOT call open() so startup doesn't trigger the sheet.
 */
export default function ActionScreen() {
  useEffect(() => {
    router.navigate("/(main)/(tabs)/home");
  }, []);

  return <View />;
}
