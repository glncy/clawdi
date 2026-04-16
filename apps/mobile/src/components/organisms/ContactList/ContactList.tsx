import { View } from "react-native";
import { router } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { ContactRow } from "@/components/molecules/ContactRow";
import type { Contact } from "@/types";
import { daysSince, warmthLevel } from "@/utils/warmth";

interface ContactListProps {
  contacts: Contact[];
  nowIso?: string;
}

const WARMTH_RANK: Record<"warm" | "cooling" | "distant", number> = {
  warm: 0,
  cooling: 1,
  distant: 2,
};

function typeToLabel(type?: string): string | undefined {
  switch (type) {
    case "call":
      return "Call";
    case "coffee":
      return "Coffee";
    case "text":
      return "Text";
    case "voicenote":
      return "Voice note";
    case "other":
      return "Chat";
    default:
      return undefined;
  }
}

export const ContactList = ({
  contacts,
  nowIso = new Date().toISOString(),
}: ContactListProps) => {
  if (contacts.length === 0) return null;

  const enriched = contacts
    .map((c) => {
      const days = c.lastInteractionAt
        ? daysSince(c.lastInteractionAt, nowIso)
        : undefined;
      const warmth = warmthLevel(days);
      return { contact: c, days, warmth };
    })
    .sort((a, b) => {
      const byWarmth = WARMTH_RANK[a.warmth] - WARMTH_RANK[b.warmth];
      if (byWarmth !== 0) return byWarmth;
      return (a.days ?? Infinity) - (b.days ?? Infinity);
    });

  return (
    <View className="gap-1">
      <AppText
        size="xs"
        weight="medium"
        color="muted"
        className="px-1 uppercase tracking-wide"
      >
        All People
      </AppText>
      <View>
        {enriched.map(({ contact, days, warmth }) => (
          <ContactRow
            key={contact.id}
            contact={contact}
            warmth={warmth}
            daysAgo={days}
            lastTypeLabel={typeToLabel(contact.lastInteractionType)}
            onPress={() =>
              router.push(
                `/(main)/(tabs)/people/${contact.id}` as never,
              )
            }
          />
        ))}
      </View>
    </View>
  );
};
