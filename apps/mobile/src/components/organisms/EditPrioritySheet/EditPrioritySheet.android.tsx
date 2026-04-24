import { useState, useEffect } from "react";
import { View, TextInput, Alert } from "react-native";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { AppText } from "@/components/atoms/Text";
import { Button, Chip } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useEditPrioritySheetStore } from "@/stores/useEditPrioritySheetStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDatabase } from "@/hooks/useDatabase";
import type { Priority } from "@/types";

const TYPE_OPTIONS: { value: Priority["type"]; label: string }[] = [
  { value: "must", label: "Must-do" },
  { value: "win", label: "Win" },
  { value: "overdue", label: "Overdue" },
];

export const EditPrioritySheet = () => {
  const { isOpen, priority, close } = useEditPrioritySheetStore();
  const updatePriority = useDayStore((s) => s.updatePriority);
  const deletePriority = useDayStore((s) => s.deletePriority);
  const { db } = useDatabase();

  const [text, setText] = useState("");
  const [type, setType] = useState<Priority["type"]>("must");
  const [isSaving, setIsSaving] = useState(false);

  const [mutedColor] = useCSSVariable(["--color-muted"]);

  useEffect(() => {
    if (isOpen && priority) {
      setText(priority.text);
      setType(priority.type);
    } else if (!isOpen) {
      setText("");
      setType("must");
      setIsSaving(false);
    }
  }, [isOpen, priority]);

  const handleSave = async () => {
    if (!text.trim() || !db || !priority) return;
    setIsSaving(true);
    try {
      await updatePriority(db, priority.id, { text: text.trim(), type });
    } finally {
      setIsSaving(false);
    }
    close();
  };

  const handleDelete = () => {
    if (!db || !priority) return;
    Alert.alert(
      "Delete priority?",
      `"${priority.text}" will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePriority(db, priority.id);
            close();
          },
        },
      ],
    );
  };

  if (!isOpen) return null;

  return (
    <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
      <ModalBottomSheet onDismissRequest={close} showDragHandle>
        <RNHostView matchContents>
          <View className="px-5 py-6 gap-5">
            <AppText size="xl" weight="bold" family="headline">
              Edit Priority
            </AppText>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Priority text…"
              multiline
              numberOfLines={2}
              className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
              placeholderTextColor={mutedColor as string}
              style={{ minHeight: 60, textAlignVertical: "top" }}
              autoFocus
            />

            <View className="gap-2">
              <AppText size="xs" color="muted">
                Type
              </AppText>
              <View className="flex-row gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    variant={type === opt.value ? "primary" : "secondary"}
                    color={type === opt.value ? "accent" : "default"}
                    onPress={() => setType(opt.value)}
                  >
                    <Chip.Label>{opt.label}</Chip.Label>
                  </Chip>
                ))}
              </View>
            </View>

            <View className="flex-row gap-3">
              <Button
                variant="tertiary"
                className="flex-1"
                onPress={handleDelete}
              >
                <Button.Label>Delete</Button.Label>
              </Button>
              <Button
                className="flex-1"
                onPress={handleSave}
                isDisabled={!text.trim() || isSaving}
              >
                <Button.Label>{isSaving ? "Saving…" : "Save"}</Button.Label>
              </Button>
            </View>
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
};
