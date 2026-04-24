import { useEffect, useState } from "react";
import { View, TextInput, Pressable, ScrollView } from "react-native";
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
import { useCSSVariable } from "uniwind";
import { useFocusSessionSettingsSheetStore } from "@/stores/useFocusSessionSettingsSheetStore";
import { useTimerStore } from "@/stores/useTimerStore";
import { useDayData } from "@/hooks/useDayData";

export const FocusSessionSettingsSheet = () => {
  const { isOpen, close } = useFocusSessionSettingsSheetStore();
  const linkedPriorityId = useTimerStore((s) => s.linkedPriorityId);
  const sessionGoal = useTimerStore((s) => s.sessionGoal);
  const setLinkedPriority = useTimerStore((s) => s.setLinkedPriority);
  const setSessionGoal = useTimerStore((s) => s.setSessionGoal);
  const { priorities } = useDayData();

  const [localGoal, setLocalGoal] = useState(sessionGoal);
  const [localPriority, setLocalPriority] = useState<string | null>(linkedPriorityId);
  const [mutedColor] = useCSSVariable(["--color-muted"]);

  const activePriorities = priorities.filter((p) => !p.isCompleted);

  useEffect(() => {
    if (isOpen) {
      setLocalGoal(sessionGoal);
      setLocalPriority(linkedPriorityId);
    }
  }, [isOpen, sessionGoal, linkedPriorityId]);

  const handleSave = () => {
    setSessionGoal(localGoal.trim());
    setLinkedPriority(localPriority);
    close();
  };

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(presented) => {
          if (!presented) close();
        }}
      >
        <Group
          modifiers={[
            presentationDetents(["medium", "large"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
            <View className="px-5 py-6 gap-5">
              <AppText size="xl" weight="bold" family="headline">
                Set Focus Intent
              </AppText>

              <View className="gap-2">
                <AppText size="sm" weight="semibold" color="muted">
                  What will you finish?
                </AppText>
                <TextInput
                  value={localGoal}
                  onChangeText={setLocalGoal}
                  placeholder="Draft the PRD intro"
                  className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                  placeholderTextColor={mutedColor as string}
                  autoFocus
                />
              </View>

              <View className="gap-2">
                <AppText size="sm" weight="semibold" color="muted">
                  Link to priority (optional)
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  <Pressable
                    onPress={() => setLocalPriority(null)}
                    className={`rounded-full px-3 py-1.5 ${localPriority === null ? "bg-primary" : "bg-surface"}`}
                  >
                    <AppText
                      size="xs"
                      weight="semibold"
                      color={localPriority === null ? "primary-foreground" : "muted"}
                    >
                      None
                    </AppText>
                  </Pressable>
                  {activePriorities.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => setLocalPriority(p.id)}
                      className={`rounded-full px-3 py-1.5 ${localPriority === p.id ? "bg-primary" : "bg-surface"}`}
                    >
                      <AppText
                        size="xs"
                        weight="semibold"
                        color={localPriority === p.id ? "primary-foreground" : "muted"}
                      >
                        {p.text}
                      </AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View className="flex-row gap-3">
                <Button variant="tertiary" className="flex-1" onPress={close}>
                  <Button.Label>Cancel</Button.Label>
                </Button>
                <Button className="flex-1" onPress={handleSave}>
                  <Button.Label>Save</Button.Label>
                </Button>
              </View>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
