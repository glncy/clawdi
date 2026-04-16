import { Pressable, View } from "react-native";
import { CaretRight } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { AppText } from "@/components/atoms/Text";
import { WarmthAvatar } from "@/components/atoms/WarmthAvatar";
import type { Contact } from "@/types";
import type { WarmthLevel } from "@/utils/warmth";

interface ContactRowProps {
  contact: Contact;
  warmth: WarmthLevel;
  daysAgo?: number;
  lastTypeLabel?: string;
  onPress?: () => void;
}

const ACCENT_CLASS: Record<WarmthLevel, string> = {
  warm: "border-l-primary",
  cooling: "border-l-warning",
  distant: "border-l-muted",
};

export const ContactRow = ({
  contact,
  warmth,
  daysAgo,
  lastTypeLabel,
  onPress,
}: ContactRowProps) => {
  const [mutedColor] = useCSSVariable(["--color-muted"]);

  const subtitle =
    daysAgo === undefined
      ? "No interactions yet"
      : `${lastTypeLabel ?? "Last chat"} · ${daysAgo}d ago`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={contact.name}
      onPress={onPress}
      className={`flex-row items-center gap-3 border-l-4 pl-3 pr-2 py-3 ${ACCENT_CLASS[warmth]}`}
    >
      <WarmthAvatar name={contact.name} warmth={warmth} size="md" />
      <View className="flex-1">
        <AppText size="sm" weight="medium">
          {contact.name}
        </AppText>
        <AppText size="xs" color="muted">
          {subtitle}
        </AppText>
      </View>
      <CaretRight size={16} color={mutedColor as string} />
    </Pressable>
  );
};
