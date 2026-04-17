import { useState, useEffect } from "react";
import { View } from "react-native";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useDayStore } from "@/stores/useDayStore";
import { useDatabase } from "@/hooks/useDatabase";
import { ArrowCounterClockwise } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";

export const RolloverPromptSheet = () => {
  const { hasCheckedRollover, checkRollover, rollover, markRolloverChecked } =
    useDayStore();
  const { db } = useDatabase();

  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [isRolling, setIsRolling] = useState(false);

  const [primaryColor] = useCSSVariable(["--color-primary"]);

  useEffect(() => {
    if (hasCheckedRollover || !db) return;

    checkRollover(db).then((n) => {
      if (n > 0) {
        setCount(n);
        setIsOpen(true);
      } else {
        markRolloverChecked();
      }
    });
  }, [hasCheckedRollover, db, checkRollover, markRolloverChecked]);

  const handleRollover = async () => {
    if (!db) return;
    setIsRolling(true);
    try {
      await rollover(db);
    } finally {
      setIsRolling(false);
    }
    markRolloverChecked();
    setIsOpen(false);
  };

  const handleDismiss = () => {
    markRolloverChecked();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
      <ModalBottomSheet onDismissRequest={handleDismiss} showDragHandle>
        <RNHostView matchContents>
          <View className="px-5 py-6 gap-5">
            <View className="items-center gap-3">
              <ArrowCounterClockwise
                size={32}
                color={primaryColor as string}
                weight="bold"
              />
              <AppText size="xl" weight="bold" family="headline">
                New Day
              </AppText>
              <AppText size="sm" color="muted" className="text-center">
                You had {count} unfinished{" "}
                {count === 1 ? "priority" : "priorities"} yesterday. Roll them
                over to today?
              </AppText>
            </View>

            <View className="flex-row gap-3">
              <Button
                variant="tertiary"
                className="flex-1"
                onPress={handleDismiss}
              >
                <Button.Label>Start Fresh</Button.Label>
              </Button>
              <Button
                className="flex-1"
                onPress={handleRollover}
                isDisabled={isRolling}
              >
                <Button.Label>
                  {isRolling
                    ? "Rolling…"
                    : `Roll Over ${count === 1 ? "1 Priority" : `${count} Priorities`}`}
                </Button.Label>
              </Button>
            </View>
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
};
