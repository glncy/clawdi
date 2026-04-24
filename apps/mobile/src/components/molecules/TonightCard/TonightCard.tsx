import { Pressable, View } from "react-native";
import { Card } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useDayData } from "@/hooks/useDayData";
import { useTonightPlannerSheetStore } from "@/stores/useTonightPlannerSheetStore";
import { Moon } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";

export const TonightCard = () => {
  const { tonight } = useDayData();
  const { open } = useTonightPlannerSheetStore();

  const [primaryColor] = useCSSVariable(["--color-primary"]);

  return (
    <Pressable onPress={open}>
      <Card className="bg-primary/10 p-4">
        <Card.Body className="gap-1">
          <View className="flex-row items-center gap-2">
            <Moon size={14} color={primaryColor as string} weight="fill" />
            <AppText size="sm" weight="semibold" color="primary">
              Tonight
            </AppText>
          </View>
          {tonight ? (
            <AppText size="sm">{tonight}</AppText>
          ) : (
            <AppText size="sm" color="muted">
              Tap to plan your evening…
            </AppText>
          )}
        </Card.Body>
      </Card>
    </Pressable>
  );
};
