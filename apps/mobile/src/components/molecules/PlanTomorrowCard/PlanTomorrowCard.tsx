import { Pressable, View } from "react-native";
import { Card } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useDayData } from "@/hooks/useDayData";
import { usePlanTomorrowSheetStore } from "@/stores/usePlanTomorrowSheetStore";
import { SunHorizon } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";

export const PlanTomorrowCard = () => {
  const { tomorrowPriorityCount } = useDayData();
  const { open } = usePlanTomorrowSheetStore();
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  return (
    <Pressable onPress={open}>
      <Card className="bg-primary/10 p-4">
        <Card.Body className="gap-1">
          <View className="flex-row items-center gap-2">
            <SunHorizon size={14} color={primaryColor as string} weight="fill" />
            <AppText size="sm" weight="semibold" color="primary">
              Plan Tomorrow
            </AppText>
          </View>
          {tomorrowPriorityCount > 0 ? (
            <AppText size="sm">
              {tomorrowPriorityCount}{" "}
              {tomorrowPriorityCount === 1 ? "priority" : "priorities"} queued for tomorrow
            </AppText>
          ) : (
            <AppText size="sm" color="muted">
              Tap to seed tomorrow&apos;s priorities
            </AppText>
          )}
        </Card.Body>
      </Card>
    </Pressable>
  );
};
