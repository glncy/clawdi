import { View, Pressable } from "react-native";
import { Card } from "heroui-native";
import { SunHorizon } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { AppText } from "@/components/atoms/Text";
import { usePlanTomorrowSheetStore } from "@/stores/usePlanTomorrowSheetStore";

interface PlanTomorrowCardProps {
  priorityCount?: number;
}

/**
 * Compact card that shows the count of tomorrow's planned priorities and
 * opens the Plan Tomorrow sheet when tapped.
 * @level Molecule
 */
export const PlanTomorrowCard = ({
  priorityCount = 0,
}: PlanTomorrowCardProps) => {
  const open = usePlanTomorrowSheetStore((s) => s.open);
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  const label =
    priorityCount === 0
      ? "Plan your tomorrow"
      : priorityCount === 1
        ? "1 priority planned"
        : `${priorityCount} priorities planned`;

  return (
    <Pressable onPress={open} accessibilityRole="button">
      <Card className="bg-surface p-4">
        <Card.Body className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <SunHorizon size={14} color={primaryColor as string} weight="fill" />
            <AppText size="sm" weight="medium">
              Tomorrow
            </AppText>
          </View>
          <AppText size="xs" color="muted">
            {label}
          </AppText>
        </Card.Body>
      </Card>
    </Pressable>
  );
};
