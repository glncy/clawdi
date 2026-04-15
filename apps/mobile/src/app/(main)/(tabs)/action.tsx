import { useCallback } from "react";
import { View } from "react-native";
import { router, useFocusEffect } from "expo-router";

/**
 * Fallback screen for the action tab.
 * NativeTabs cannot prevent default navigation on tabPress, so tapping "+"
 * briefly activates this screen. useFocusEffect fires after the tab switch
 * settles, then we redirect to home. The QuickActionSheet opens via
 * listeners.tabPress in _layout.tsx — this screen must NOT call open()
 * so startup doesn't trigger the sheet.
 */
export default function ActionScreen() {
  useFocusEffect(
    useCallback(() => {
      router.navigate("/(main)/(tabs)/home");
    }, [])
  );

  return <View className="flex-1 bg-background" />;
}
