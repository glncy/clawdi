import { Stack } from "expo-router";
import { useTabHeaderTitleStyle } from "@/hooks/useTabHeaderTitleStyle";
import { HeaderGearButton } from "@/components/molecules/HeaderGearButton";

export default function HomeStack() {
  const headerTitleStyle = useTabHeaderTitleStyle();

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerTitleStyle,
        headerRight: () => <HeaderGearButton tab="home" />,
      }}
    />
  );
}
