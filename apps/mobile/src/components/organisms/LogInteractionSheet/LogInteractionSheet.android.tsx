import { useState, useEffect } from "react";
import { View, ScrollView, TextInput } from "react-native";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { AppText } from "@/components/atoms/Text";
import { Button, Chip } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useLogInteractionSheetStore } from "@/stores/useLogInteractionSheetStore";
import { useInteractionsStore } from "@/stores/useInteractionsStore";
import { usePeopleData } from "@/hooks/usePeopleData";
import { useDatabase } from "@/hooks/useDatabase";
import type { Interaction } from "@/types";

const INTERACTION_TYPES: { value: Interaction["type"]; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "coffee", label: "Coffee" },
  { value: "text", label: "Text" },
  { value: "voicenote", label: "Voice Note" },
  { value: "other", label: "Other" },
];

const DATE_OPTIONS = [
  { label: "Today", offset: 0 },
  { label: "Yesterday", offset: 1 },
] as const;

function isoFromOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export const LogInteractionSheet = () => {
  const { isOpen, prefillContactId, close } = useLogInteractionSheetStore();
  const { contacts } = usePeopleData();
  const { db } = useDatabase();
  const store = useInteractionsStore();

  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [type, setType] = useState<Interaction["type"]>("call");
  const [dateOffset, setDateOffset] = useState(0);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [mutedColor] = useCSSVariable(["--color-muted"]);

  const activeContactId = prefillContactId ?? selectedContactId;
  const activeContact = contacts.find((c) => c.id === activeContactId);

  useEffect(() => {
    if (!isOpen) {
      setSelectedContactId(null);
      setType("call");
      setDateOffset(0);
      setNote("");
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    close();
  };

  const handleSave = async () => {
    if (!activeContactId || !db) return;
    setIsSaving(true);
    try {
      await store.addInteraction(db, {
        contactId: activeContactId,
        type,
        note: note.trim() || undefined,
        occurredAt: isoFromOffset(dateOffset),
      });
    } finally {
      setIsSaving(false);
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
      <ModalBottomSheet onDismissRequest={handleClose} showDragHandle>
        <RNHostView matchContents>
          <View className="px-5 py-6 gap-5">
            <AppText size="xl" weight="bold" family="headline">
              Log Interaction
            </AppText>

            {!prefillContactId && (
              <View className="gap-2">
                <AppText size="xs" color="muted">Person</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {contacts.map((c) => (
                      <Chip
                        key={c.id}
                        variant={selectedContactId === c.id ? "primary" : "secondary"}
                        color={selectedContactId === c.id ? "accent" : "default"}
                        onPress={() => setSelectedContactId(c.id)}
                      >
                        <Chip.Label>{c.name}</Chip.Label>
                      </Chip>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {activeContact && prefillContactId && (
              <AppText size="sm" weight="medium" color="muted">
                With: {activeContact.name}
              </AppText>
            )}

            <View className="gap-2">
              <AppText size="xs" color="muted">Type</AppText>
              <View className="flex-row flex-wrap gap-2">
                {INTERACTION_TYPES.map((t) => (
                  <Chip
                    key={t.value}
                    variant={type === t.value ? "primary" : "secondary"}
                    color={type === t.value ? "accent" : "default"}
                    onPress={() => setType(t.value)}
                  >
                    <Chip.Label>{t.label}</Chip.Label>
                  </Chip>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <AppText size="xs" color="muted">When</AppText>
              <View className="flex-row gap-2">
                {DATE_OPTIONS.map((d) => (
                  <Chip
                    key={d.label}
                    variant={dateOffset === d.offset ? "primary" : "secondary"}
                    color={dateOffset === d.offset ? "accent" : "default"}
                    onPress={() => setDateOffset(d.offset)}
                  >
                    <Chip.Label>{d.label}</Chip.Label>
                  </Chip>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <AppText size="xs" color="muted">Note (optional)</AppText>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="How'd it go?"
                multiline
                numberOfLines={3}
                className="rounded-xl bg-surface px-3 py-3 text-sm text-foreground"
                placeholderTextColor={mutedColor as string}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            <View className="flex-row gap-3">
              <Button variant="tertiary" className="flex-1" onPress={handleClose}>
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                className="flex-1"
                onPress={handleSave}
                isDisabled={!activeContactId || isSaving}
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
