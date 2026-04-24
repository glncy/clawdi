import { useEffect, useRef, useState } from "react";
import { View, TextInput, type TextInput as TextInputType } from "react-native";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useAddQuickItemSheetStore } from "@/stores/useAddQuickItemSheetStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDatabase } from "@/hooks/useDatabase";

export const AddQuickItemSheet = () => {
  const { isOpen, close } = useAddQuickItemSheetStore();
  const addQuickItem = useDayStore((s) => s.addQuickItem);
  const { db } = useDatabase();
  const inputRef = useRef<TextInputType>(null);

  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mutedColor] = useCSSVariable(["--color-muted"]);

  useEffect(() => {
    if (!isOpen) {
      setText("");
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || !db) return;
    setIsSaving(true);
    try {
      await addQuickItem(db, trimmed);
      setText("");
      inputRef.current?.focus();
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
              Add to Quick List
            </AppText>

            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder="Buy milk, call plumber…"
              className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
              placeholderTextColor={mutedColor as string}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              blurOnSubmit={false}
            />

            <View className="flex-row gap-3">
              <Button variant="tertiary" className="flex-1" onPress={close}>
                <Button.Label>Done</Button.Label>
              </Button>
              <Button
                className="flex-1"
                onPress={handleAdd}
                isDisabled={!text.trim() || isSaving}
              >
                <Button.Label>{isSaving ? "Adding…" : "Add"}</Button.Label>
              </Button>
            </View>
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
};
