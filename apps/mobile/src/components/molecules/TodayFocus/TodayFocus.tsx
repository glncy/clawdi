import { View, Pressable } from "react-native";
import { Card } from "heroui-native";
import { router } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { PriorityRow } from "@/components/molecules/PriorityRow";
import type { Priority } from "@/types";

interface TodayFocusProps {
  priorities: Priority[];
  maxItems?: number;
}

/**
 * Compact priority list for the dashboard.
 * Shows top priorities with inline checkboxes and a "See all" link.
 * @level Molecule
 */
export const TodayFocus = ({
  priorities,
  maxItems = 3,
}: TodayFocusProps) => {
  const displayPriorities = priorities.slice(0, maxItems);

  if (displayPriorities.length === 0) return null;

  return (
    <Card className="bg-surface p-4">
      <Card.Body className="gap-2">
        <View className="flex-row items-center justify-between">
          <AppText size="sm" weight="semibold">
            Today{"'"}s Focus
          </AppText>
          <Pressable
            onPress={() => router.navigate("/(main)/(tabs)/day")}
            hitSlop={8}
          >
            <AppText size="xs" color="primary" weight="medium">
              See all
            </AppText>
          </Pressable>
        </View>
        {displayPriorities.map((priority) => (
          <PriorityRow key={priority.id} priority={priority} />
        ))}
      </Card.Body>
    </Card>
  );
};
