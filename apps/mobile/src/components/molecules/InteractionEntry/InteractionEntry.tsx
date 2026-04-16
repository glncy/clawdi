import { View } from "react-native";
import {
  Phone,
  Coffee,
  ChatCircle,
  Microphone,
  HandWaving,
  type Icon as PhosphorIcon,
} from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { AppText } from "@/components/atoms/Text";
import type { Interaction } from "@/types";

const TYPE_ICON: Record<Interaction["type"], PhosphorIcon> = {
  call: Phone,
  coffee: Coffee,
  text: ChatCircle,
  voicenote: Microphone,
  other: HandWaving,
};

const TYPE_LABEL: Record<Interaction["type"], string> = {
  call: "Call",
  coffee: "Coffee",
  text: "Text",
  voicenote: "Voice note",
  other: "Hangout",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface InteractionEntryProps {
  interaction: Interaction;
}

export const InteractionEntry = ({ interaction }: InteractionEntryProps) => {
  const [mutedColor] = useCSSVariable(["--color-muted"]);
  const Icon = TYPE_ICON[interaction.type];

  return (
    <View className="flex-row gap-3 py-3">
      <View className="w-14 items-center gap-1">
        <Icon size={16} weight="fill" color={mutedColor as string} />
        <AppText size="xs" color="muted">
          {formatDate(interaction.occurredAt)}
        </AppText>
      </View>
      <View className="flex-1 gap-0.5">
        <AppText size="sm" weight="medium">
          {TYPE_LABEL[interaction.type]}
        </AppText>
        {interaction.note ? (
          <AppText size="xs" color="muted" numberOfLines={2}>
            {interaction.note}
          </AppText>
        ) : null}
        {interaction.aiSummary ? (
          <View className="mt-1 rounded-md bg-primary/10 px-2 py-1">
            <AppText size="xs" color="primary" numberOfLines={2}>
              {interaction.aiSummary}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
};
