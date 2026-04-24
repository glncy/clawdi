import { useState, useEffect } from "react";
import { View, TextInput, Pressable } from "react-native";
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
import { useTonightPlannerSheetStore } from "@/stores/useTonightPlannerSheetStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";
import { CopySimple } from "phosphor-react-native";

export const TonightPlannerSheet = () => {
  const { isOpen, close } = useTonightPlannerSheetStore();
  const { tonight } = useDayData();
  const setTonight = useDayStore((s) => s.setTonight);
  const getYesterdayTonight = useDayStore((s) => s.getYesterdayTonight);
  const { db } = useDatabase();

  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [yesterdayTonight, setYesterdayTonight] = useState<string | null>(null);

  const [mutedColor, primaryColor] = useCSSVariable([
    "--color-muted",
    "--color-primary",
  ]);

  useEffect(() => {
    if (isOpen) {
      setText(tonight);
      if (!tonight && db) {
        getYesterdayTonight(db).then(setYesterdayTonight);
      }
    } else {
      setText("");
      setYesterdayTonight(null);
      setIsSaving(false);
    }
  }, [isOpen, tonight, db, getYesterdayTonight]);

  const handleCopyYesterday = () => {
    if (yesterdayTonight) setText(yesterdayTonight);
  };

  const handleSave = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setTonight(db, text.trim());
    } finally {
      setIsSaving(false);
    }
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
            presentationDetents(["medium"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
            <View className="px-5 py-6 gap-5">
              <AppText size="xl" weight="bold" family="headline">
                Tonight
              </AppText>

              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Cook dinner → Read → Sleep by 11 PM"
                multiline
                numberOfLines={4}
                className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                placeholderTextColor={mutedColor as string}
                style={{ minHeight: 100, textAlignVertical: "top" }}
                autoFocus
              />

              {!tonight && yesterdayTonight && (
                <Pressable
                  className="flex-row items-center gap-2"
                  onPress={handleCopyYesterday}
                >
                  <CopySimple size={14} color={primaryColor as string} />
                  <AppText size="sm" color="primary">
                    Copy from yesterday
                  </AppText>
                </Pressable>
              )}

              <View className="flex-row gap-3">
                <Button variant="tertiary" className="flex-1" onPress={close}>
                  <Button.Label>Cancel</Button.Label>
                </Button>
                <Button
                  className="flex-1"
                  onPress={handleSave}
                  isDisabled={isSaving}
                >
                  <Button.Label>{isSaving ? "Saving…" : "Save"}</Button.Label>
                </Button>
              </View>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
