import { View, Pressable } from "react-native";
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
import { router } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { Input } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useAddGoalSheetStore } from "@/stores/useAddGoalSheetStore";
import { Lightning, PencilSimpleLine, Microphone } from "phosphor-react-native";

export const AddGoalSheet = () => {
  const { isOpen, close } = useAddGoalSheetStore();

  const [primaryColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
  ]);

  const handleClose = () => {
    close();
  };

  const handleManual = () => {
    handleClose();
    router.push("/(main)/add-goal");
  };

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(presented) => {
          if (!presented) handleClose();
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
              <AppText size="xl" weight="bold" family="headline">
                Add Goal
              </AppText>

              <View className="gap-3">
                <AppText size="sm" color="muted">
                  Describe your savings goal
                </AppText>
                <View className="flex-row items-center">
                  <Input
                    className="flex-1 pl-10 opacity-50"
                    placeholder="e.g. emergency fund 10000"
                    editable={false}
                  />
                  <Lightning
                    size={16}
                    color={mutedColor as string}
                    weight="fill"
                    style={{ position: "absolute", left: 14 }}
                  />
                </View>
                <AppText size="xs" color="muted" align="center">
                  AI parsing coming soon
                </AppText>
              </View>

              <View className="items-center">
                <AppText size="xs" color="muted">
                  or
                </AppText>
              </View>

              <View className="gap-3">
                <Pressable
                  className="flex-row items-center gap-3 rounded-xl bg-surface p-4"
                  onPress={handleManual}
                >
                  <PencilSimpleLine
                    size={20}
                    color={primaryColor as string}
                    weight="bold"
                  />
                  <AppText size="sm" weight="medium">
                    Input Manually
                  </AppText>
                </Pressable>
                <Pressable
                  className="flex-row items-center gap-3 rounded-xl bg-surface p-4 opacity-50"
                  disabled
                >
                  <Microphone
                    size={20}
                    color={mutedColor as string}
                    weight="bold"
                  />
                  <View>
                    <AppText size="sm" weight="medium" color="muted">
                      Tap to Talk
                    </AppText>
                    <AppText size="xs" color="muted">
                      Coming soon
                    </AppText>
                  </View>
                </Pressable>
              </View>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
