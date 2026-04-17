import { useState, useRef } from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  type TextInput as TextInputType,
} from "react-native";
import { Checkbox } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";
import { useCSSVariable } from "uniwind";
import { Trash } from "phosphor-react-native";
import type { QuickListItem } from "@/types";

interface QuickItemRowProps {
  item: QuickListItem;
  onToggle: () => void;
  onDelete: () => void;
}

const QuickItemRow = ({ item, onToggle, onDelete }: QuickItemRowProps) => {
  const [dangersColor] = useCSSVariable(["--color-danger"]);

  return (
    <View className="flex-row items-center gap-3 py-2">
      <Checkbox isSelected={item.isCompleted} onChange={(_: boolean) => onToggle()} />
      <Text
        className={`flex-1 text-sm ${item.isCompleted ? "text-muted line-through" : "text-foreground"}`}
        onPress={onToggle}
      >
        {item.text}
      </Text>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Trash size={16} color={dangersColor as string} />
      </Pressable>
    </View>
  );
};

export const QuickList = () => {
  const { quickList } = useDayData();
  const addQuickItem = useDayStore((s) => s.addQuickItem);
  const toggleQuickItem = useDayStore((s) => s.toggleQuickItem);
  const deleteQuickItem = useDayStore((s) => s.deleteQuickItem);
  const { db } = useDatabase();

  const [newText, setNewText] = useState("");
  const inputRef = useRef<TextInputType>(null);

  const [mutedColor] = useCSSVariable(["--color-muted"]);

  const handleAdd = async () => {
    if (!newText.trim() || !db) return;
    await addQuickItem(db, newText.trim());
    setNewText("");
    inputRef.current?.focus();
  };

  const handleToggle = async (id: string) => {
    if (!db) return;
    await toggleQuickItem(db, id);
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    await deleteQuickItem(db, id);
  };

  return (
    <View className="gap-2">
      <AppText size="sm" weight="semibold" color="muted">
        Quick List
      </AppText>

      {quickList.map((item) => (
        <QuickItemRow
          key={item.id}
          item={item}
          onToggle={() => handleToggle(item.id)}
          onDelete={() => handleDelete(item.id)}
        />
      ))}

      <View className="flex-row items-center gap-3 py-1">
        <View className="size-5 rounded-sm border border-default" />
        <TextInput
          ref={inputRef}
          value={newText}
          onChangeText={setNewText}
          placeholder="Add item…"
          placeholderTextColor={mutedColor as string}
          className="flex-1 text-sm text-foreground"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
          blurOnSubmit={false}
        />
      </View>
    </View>
  );
};
