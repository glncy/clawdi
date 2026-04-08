import { Stack } from "expo-router";
import { useTabHeaderTitleStyle } from "@/hooks/useTabHeaderTitleStyle";

export default function SettingsStack() {
  const headerTitleStyle = useTabHeaderTitleStyle();

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerTitleStyle,
      }}
    />
  );
}
