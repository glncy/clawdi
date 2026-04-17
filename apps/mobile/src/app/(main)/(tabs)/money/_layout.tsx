import { Stack } from "expo-router";
import { useTabHeaderTitleStyle } from "@/hooks/useTabHeaderTitleStyle";
import { HeaderGearButton } from "@/components/molecules/HeaderGearButton";
import { isLiquidGlass } from "@/utils/platform";

export default function MoneyStack() {
  const headerTitleStyle = useTabHeaderTitleStyle();

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBlurEffect: isLiquidGlass ? undefined : "systemMaterial",
        headerTitleStyle,
        headerRight: () => <HeaderGearButton tab="money" />,
      }}
    />
  );
}
