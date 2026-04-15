import { Platform, View } from "react-native";
import { Tabs, Stack } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useCSSVariable } from "uniwind";
import { CustomTabBar } from "@/components/organisms/CustomTabBar";
import { QuickActionSheet } from "@/components/organisms/QuickActionSheet";
import { SettingsSheet } from "@/components/organisms/SettingsSheet";
import { useSystemTheme } from "@/hooks/useCustomTheme";
import { useQuickActionStore } from "@/stores/useQuickActionStore";

/**
 * True on iOS 26+ — renders native liquid glass tab bar.
 * False on iOS < 26 and Android — renders custom floating FAB tab bar.
 */
const isLiquidGlass =
  Platform.OS === "ios" && parseInt(Platform.Version as string, 10) >= 26;

export default function TabLayout() {
  useSystemTheme();
  const [primaryColor] = useCSSVariable(["--color-primary"]);
  const tintColor = (primaryColor as string | undefined) ?? "#4ae2ac";

  if (isLiquidGlass) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <NativeTabs
          blurEffect="systemUltraThinMaterial"
          backgroundColor="transparent"
          minimizeBehavior="never"
          tintColor={tintColor}
        >
          <NativeTabs.Trigger name="home">
            <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="money">
            <NativeTabs.Trigger.Label>Finance</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{
                default: "dollarsign.circle",
                selected: "dollarsign.circle.fill",
              }}
            />
          </NativeTabs.Trigger>

          {/* Action tab — opens QuickActionSheet via listener */}
          <NativeTabs.Trigger
            name="action"
            listeners={{
              tabPress: () => {
                useQuickActionStore.getState().open();
              },
            }}
          >
            <NativeTabs.Trigger.Label>{""}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{ default: "plus.circle", selected: "plus.circle.fill" }}
            />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="day">
            <NativeTabs.Trigger.Label>Day</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={{ default: "sun.max", selected: "sun.max.fill" }} />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="life">
            <NativeTabs.Trigger.Label>Life</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={{ default: "leaf", selected: "leaf.fill" }} />
          </NativeTabs.Trigger>

          {/* Hidden screens — reachable only via router.push, not shown in tab bar */}
          <NativeTabs.Trigger name="people" hidden />
          <NativeTabs.Trigger name="settings" hidden />
          <NativeTabs.Trigger name="more" hidden />
        </NativeTabs>
        <QuickActionSheet />
        <SettingsSheet />
      </>
    );
  }

  // iOS < 26 and Android — unchanged floating FAB tab bar
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="money" />
          <Tabs.Screen name="day" />
          <Tabs.Screen name="life" />
          {/* Hidden from tab bar, accessible via router.push */}
          <Tabs.Screen name="people" options={{ href: null }} />
          <Tabs.Screen name="settings" options={{ href: null }} />
          <Tabs.Screen name="more" options={{ href: null }} />
        </Tabs>
        <QuickActionSheet />
        <SettingsSheet />
      </View>
    </>
  );
}
