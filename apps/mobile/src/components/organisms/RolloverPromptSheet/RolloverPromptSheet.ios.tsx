import { useState, useEffect } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Group,
  Host,
  RNHostView,
} from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useDayStore } from "@/stores/useDayStore";
import { useDatabase } from "@/hooks/useDatabase";
import { ArrowCounterClockwise } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";

export const RolloverPromptSheet = () => {
  const hasCheckedRollover = useDayStore((s) => s.hasCheckedRollover);
  const checkRollover = useDayStore((s) => s.checkRollover);
  const rollover = useDayStore((s) => s.rollover);
  const dismissRollover = useDayStore((s) => s.dismissRollover);
  const markRolloverChecked = useDayStore((s) => s.markRolloverChecked);
  const { db } = useDatabase();

  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [rolloverError, setRolloverError] = useState<string | null>(null);

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
    setRolloverError(null);
    try {
      await rollover(db);
      markRolloverChecked();
      setIsOpen(false);
    } catch {
      setRolloverError("Couldn't roll over. Please try again.");
    } finally {
      setIsRolling(false);
    }
  };

  const handleDismiss = async () => {
    if (db) await dismissRollover(db);
    else markRolloverChecked();
    setIsOpen(false);
  };

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(presented) => {
          if (!presented) handleDismiss();
        }}
      >
        <Group
          modifiers={[
            presentationDetents(["medium"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
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
                {rolloverError && (
                  <AppText size="sm" color="danger" className="text-center">
                    {rolloverError}
                  </AppText>
                )}
              </View>

              <View className="flex-row gap-3">
                <Button
                  variant="tertiary"
                  className="flex-1"
                  onPress={handleDismiss}
                  isDisabled={isRolling}
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
        </Group>
      </BottomSheet>
    </Host>
  );
};
