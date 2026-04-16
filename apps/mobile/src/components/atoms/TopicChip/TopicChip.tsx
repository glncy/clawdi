import { Pressable, View } from "react-native";
import { Check, X } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { AppText } from "@/components/atoms/Text";
import type { NextTopic } from "@/types";

interface TopicChipProps {
  topic: NextTopic;
  onToggle: () => void;
  onRemove?: () => void;
}

export const TopicChip = ({ topic, onToggle, onRemove }: TopicChipProps) => {
  const [mutedColor] = useCSSVariable(["--color-muted"]);

  return (
    <View
      className={`flex-row items-center gap-1 rounded-full border px-3 py-1.5 ${
        topic.isDone
          ? "border-muted/40 bg-muted/10"
          : "border-primary/40 bg-primary/10"
      }`}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: topic.isDone }}
        className="flex-row items-center gap-1.5"
      >
        {topic.isDone && (
          <Check size={11} weight="bold" color={mutedColor as string} />
        )}
        <AppText
          size="xs"
          weight="medium"
          color={topic.isDone ? "muted" : "primary"}
          style={topic.isDone ? { textDecorationLine: "line-through" } : undefined}
        >
          {topic.topic}
        </AppText>
      </Pressable>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel="Remove topic">
          <X size={10} weight="bold" color={mutedColor as string} />
        </Pressable>
      )}
    </View>
  );
};
