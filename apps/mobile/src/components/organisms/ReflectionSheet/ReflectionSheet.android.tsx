import { useEffect, useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { Trash } from "phosphor-react-native";
import { useReflectionSheetStore } from "@/stores/useReflectionSheetStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";
import { usePlanTomorrowSheetStore } from "@/stores/usePlanTomorrowSheetStore";

export const ReflectionSheet = () => {
  const { isOpen, close } = useReflectionSheetStore();
  const openPlanner = usePlanTomorrowSheetStore((s) => s.open);
  const { todayReflection } = useDayData();
  const saveReflection = useDayStore((s) => s.saveReflection);
  const { db } = useDatabase();

  const [wins, setWins] = useState<string[]>(["", "", ""]);
  const [improve, setImprove] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mutedColor, dangersColor] = useCSSVariable([
    "--color-muted",
    "--color-danger",
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const existing = todayReflection?.wins ?? [];
    const padded = [...existing, "", "", ""].slice(0, 3);
    setWins(padded);
    setImprove(todayReflection?.improve ?? "");
  }, [isOpen, todayReflection]);

  const setWinAt = (i: number, v: string) =>
    setWins((cur) => cur.map((w, idx) => (idx === i ? v : w)));

  const handleSave = async (thenPlan: boolean) => {
    if (!db) return;
    setIsSaving(true);
    try {
      const cleanedWins = wins.map((w) => w.trim()).filter(Boolean);
      await saveReflection(db, { wins: cleanedWins, improve: improve.trim() });
      close();
      if (thenPlan) {
        setTimeout(() => openPlanner(), 250);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
      <ModalBottomSheet onDismissRequest={close} showDragHandle>
        <RNHostView matchContents>
          <View className="px-5 py-6 gap-5">
            <AppText size="xl" weight="bold" family="headline">
              Today&apos;s Reflection
            </AppText>

            <View className="gap-2">
              <AppText size="sm" weight="semibold" color="muted">
                Three wins
              </AppText>
              {wins.map((w, i) => (
                <View key={i} className="flex-row items-center gap-2">
                  <TextInput
                    value={w}
                    onChangeText={(v) => setWinAt(i, v)}
                    placeholder={`Win ${i + 1}`}
                    className="flex-1 rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                    placeholderTextColor={mutedColor as string}
                  />
                  {w.length > 0 ? (
                    <Pressable onPress={() => setWinAt(i, "")} hitSlop={8}>
                      <Trash size={14} color={dangersColor as string} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>

            <View className="gap-2">
              <AppText size="sm" weight="semibold" color="muted">
                One thing to improve
              </AppText>
              <TextInput
                value={improve}
                onChangeText={setImprove}
                placeholder="Start earlier, batch Slack, …"
                multiline
                className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                placeholderTextColor={mutedColor as string}
                style={{ minHeight: 70, textAlignVertical: "top" }}
              />
            </View>

            <View className="flex-row gap-3">
              <Button
                variant="tertiary"
                className="flex-1"
                onPress={() => handleSave(false)}
                isDisabled={isSaving}
              >
                <Button.Label>{isSaving ? "Saving…" : "Save"}</Button.Label>
              </Button>
              <Button
                className="flex-1"
                onPress={() => handleSave(true)}
                isDisabled={isSaving}
              >
                <Button.Label>Save &amp; Plan Tomorrow</Button.Label>
              </Button>
            </View>
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
};
