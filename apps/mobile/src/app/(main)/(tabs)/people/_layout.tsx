import { Stack } from "expo-router";
import { useTabHeaderTitleStyle } from "@/hooks/useTabHeaderTitleStyle";
import { isLiquidGlass } from "@/utils/platform";

export default function PeopleStack() {
  const headerTitleStyle = useTabHeaderTitleStyle();

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBlurEffect: isLiquidGlass ? undefined : "systemMaterial",
        headerTitleStyle,
      }}
    />
  );
}
