import { Tabs, Stack } from "expo-router";
import { View } from "react-native";
import { CustomTabBar } from "@/components/organisms/CustomTabBar";
import { QuickActionSheet } from "@/components/organisms/QuickActionSheet";
import { SettingsSheet } from "@/components/organisms/SettingsSheet";
import { useSystemTheme } from "@/hooks/useCustomTheme";

export default function TabLayout() {
  useSystemTheme();

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
          {/* People and Settings are accessible via gear icon, hidden from tab bar */}
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
