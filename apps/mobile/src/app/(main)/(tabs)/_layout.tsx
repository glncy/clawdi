import { Platform, Pressable, View } from "react-native";
import { Tabs, Stack } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { GlassContainer, GlassView } from "expo-glass-effect";
import { Plus } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import { AppTabBar, AppTabBarFAB } from "@/components/organisms/AppTabBar";
import { QuickActionSheet } from "@/components/organisms/QuickActionSheet";
import { SettingsSheet } from "@/components/organisms/SettingsSheet";
import { LogInteractionSheet } from "@/components/organisms/LogInteractionSheet";
import { useSystemTheme } from "@/hooks/useCustomTheme";
import { useQuickActionStore } from "@/stores/useQuickActionStore";

/**
 * True on iOS 26+ — renders native liquid glass tab bar.
 * False on iOS <26 and Android — renders custom floating pill tab bar.
 */
const isLiquidGlass =
  Platform.OS === "ios" && parseInt(Platform.Version as string, 10) >= 26;

/**
 * Center-positioned glass "+" FAB for iOS 26+.
 * Matches the liquid glass material of the NativeTabs pill.
 */
function NativeTabsFAB() {
  const insets = useSafeAreaInsets();
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center"
      style={{ bottom: insets.bottom + 64 }}
    >
      <GlassContainer>
        <Pressable
          onPress={() => useQuickActionStore.getState().open()}
          accessibilityLabel="Quick actions"
          accessibilityRole="button"
        >
          <GlassView
            glassEffectStyle="clear"
            colorScheme="light"
            isInteractive
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus
              size={28}
              weight="bold"
              color={(primaryColor as string) ?? "#4ae2ac"}
            />
          </GlassView>
        </Pressable>
      </GlassContainer>
    </View>
  );
}

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
            <NativeTabs.Trigger.Icon
              sf={{ default: "house", selected: "house.fill" }}
            />
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

          <NativeTabs.Trigger name="day">
            <NativeTabs.Trigger.Label>Day</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{ default: "sun.max", selected: "sun.max.fill" }}
            />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="life">
            <NativeTabs.Trigger.Label>Life</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{ default: "leaf", selected: "leaf.fill" }}
            />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="people">
            <NativeTabs.Trigger.Label>People</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{ default: "person.2", selected: "person.2.fill" }}
            />
          </NativeTabs.Trigger>

          {/* Hidden screens — reachable via router.push, not shown in tab bar */}
          <NativeTabs.Trigger name="settings" hidden />
          <NativeTabs.Trigger name="more" hidden />
        </NativeTabs>

        <NativeTabsFAB />
        <QuickActionSheet />
        <SettingsSheet />
        <LogInteractionSheet />
      </>
    );
  }

  // iOS <26 and Android — floating pill tab bar + bottom-right FAB
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <Tabs
          tabBar={(props) => <AppTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="money" />
          <Tabs.Screen name="day" />
          <Tabs.Screen name="life" />
          <Tabs.Screen name="people" />
          {/* Hidden from tab bar, accessible via router.push */}
          <Tabs.Screen name="settings" options={{ href: null }} />
          <Tabs.Screen name="more" options={{ href: null }} />
        </Tabs>
        <AppTabBarFAB />
        <QuickActionSheet />
        <SettingsSheet />
        <LogInteractionSheet />
      </View>
    </>
  );
}
