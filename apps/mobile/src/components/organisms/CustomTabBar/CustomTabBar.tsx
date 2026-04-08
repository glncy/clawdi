import { View, Pressable } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  House,
  CurrencyDollar,
  Sun,
  Leaf,
  Plus,
} from "phosphor-react-native";
import type { ComponentType } from "react";
import type { IconProps } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/atoms/Text";
import { useQuickActionStore } from "@/stores/useQuickActionStore";

const TAB_CONFIG: Record<
  string,
  { label: string; icon: ComponentType<IconProps> }
> = {
  home: { label: "Home", icon: House },
  money: { label: "Finance", icon: CurrencyDollar },
  day: { label: "Day", icon: Sun },
  life: { label: "Life", icon: Leaf },
};

// Tab order: Home, Money, [+], Day, Life
const LEFT_TABS = ["home", "money"];
const RIGHT_TABS = ["day", "life"];

/**
 * Custom Tab Bar with center add button between Money and Day
 * @level Organism
 */
export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const toggleQuickAction = useQuickActionStore((s) => s.toggle);
  const [primaryColor, mutedColor, primaryForegroundColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
    "--color-primary-foreground",
  ]);

  const renderTab = (routeName: string) => {
    const routeIndex = state.routes.findIndex((r) => r.name === routeName);
    if (routeIndex === -1) return null;

    const route = state.routes[routeIndex];
    const config = TAB_CONFIG[routeName];
    if (!config) return null;

    const { options } = descriptors[route.key];
    const isFocused = state.index === routeIndex;
    const Icon = config.icon;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: "tabLongPress",
        target: route.key,
      });
    };

    const iconColor = isFocused
      ? (primaryColor as string)
      : (mutedColor as string);

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? config.label}
        onPress={onPress}
        onLongPress={onLongPress}
        className="flex-1 items-center gap-0.5 py-1.5"
      >
        <Icon
          size={22}
          weight={isFocused ? "fill" : "regular"}
          color={iconColor}
        />
        <AppText
          size="xs"
          color={isFocused ? "primary" : "muted"}
          align="center"
          style={{ fontSize: 9 }}
        >
          {config.label}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 border-t border-default bg-surface"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-end px-1 pt-1">
        {/* Left tabs: Home, Money */}
        {LEFT_TABS.map(renderTab)}

        {/* Center + button */}
        <View className="flex-1 items-center pb-3">
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-full bg-primary shadow-md"
            style={{ marginTop: -24, borderCurve: "continuous" }}
            onPress={toggleQuickAction}
          >
            <Plus
              size={22}
              weight="bold"
              color={primaryForegroundColor as string}
            />
          </Pressable>
        </View>

        {/* Right tabs: Day, Life */}
        {RIGHT_TABS.map(renderTab)}
      </View>
    </View>
  );
}
