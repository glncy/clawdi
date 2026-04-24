import { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  type TextInput as TextInputType,
} from "react-native";
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
import { Button, Checkbox } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { Trash } from "phosphor-react-native";
import { usePlanTomorrowSheetStore } from "@/stores/usePlanTomorrowSheetStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";
import type { Priority } from "@/types";

const TYPE_OPTIONS: { key: Priority["type"]; label: string }[] = [
  { key: "must", label: "Must" },
  { key: "win", label: "Win" },
  { key: "overdue", label: "Overdue" },
];

export const PlanTomorrowSheet = () => {
  const { isOpen, close } = usePlanTomorrowSheetStore();
  const { tomorrowPriorities } = useDayData();
  const addTomorrowPriority = useDayStore((s) => s.addTomorrowPriority);
  const deleteTomorrowPriority = useDayStore((s) => s.deleteTomorrowPriority);
  const { db } = useDatabase();

  const [text, setText] = useState("");
  const [type, setType] = useState<Priority["type"]>("must");
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<TextInputType>(null);

  const [mutedColor, dangersColor] = useCSSVariable([
    "--color-muted",
    "--color-danger",
  ]);

  useEffect(() => {
    if (!isOpen) {
      setText("");
      setType("must");
      setError(null);
    }
  }, [isOpen]);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || !db) return;
    setIsAdding(true);
    setError(null);
    try {
      await addTomorrowPriority(db, { text: trimmed, type });
      setText("");
      inputRef.current?.focus();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't save. Please try again.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    await deleteTomorrowPriority(db, id);
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
            presentationDetents(["large"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
            <View className="px-5 py-6 gap-5">
              <AppText size="xl" weight="bold" family="headline">
                Plan Tomorrow
              </AppText>
              <AppText size="sm" color="muted">
                Seed up to 3 must-dos plus wins and overdue items. They become
                tomorrow&apos;s Top Priorities automatically.
              </AppText>

              <View className="flex-row gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setType(opt.key)}
                    className={`rounded-full px-3 py-1.5 ${type === opt.key ? "bg-primary" : "bg-surface"}`}
                  >
                    <AppText
                      size="xs"
                      weight="semibold"
                      color={type === opt.key ? "primary-foreground" : "muted"}
                    >
                      {opt.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder="What will matter tomorrow?"
                className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                placeholderTextColor={mutedColor as string}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAdd}
                blurOnSubmit={false}
              />

              {error && (
                <AppText size="xs" color="danger">
                  {error}
                </AppText>
              )}

              <Button
                onPress={handleAdd}
                isDisabled={!text.trim() || isAdding}
              >
                <Button.Label>{isAdding ? "Adding…" : "Add"}</Button.Label>
              </Button>

              <View className="gap-1">
                <AppText
                  size="xs"
                  weight="semibold"
                  color="muted"
                  className="uppercase tracking-wide"
                >
                  Queued for Tomorrow ({tomorrowPriorities.length})
                </AppText>
                {tomorrowPriorities.length === 0 && (
                  <AppText size="sm" color="muted">
                    Nothing queued yet.
                  </AppText>
                )}
                {tomorrowPriorities.map((p) => (
                  <View
                    key={p.id}
                    className="flex-row items-center gap-3 py-2"
                  >
                    <Checkbox isSelected={false} isDisabled />
                    <AppText size="sm" className="flex-1">
                      {p.text}
                    </AppText>
                    <AppText size="xs" color="muted">
                      {p.type}
                    </AppText>
                    <Pressable onPress={() => handleDelete(p.id)} hitSlop={8}>
                      <Trash size={14} color={dangersColor as string} />
                    </Pressable>
                  </View>
                ))}
              </View>

              <Button variant="tertiary" onPress={close}>
                <Button.Label>Done</Button.Label>
              </Button>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
