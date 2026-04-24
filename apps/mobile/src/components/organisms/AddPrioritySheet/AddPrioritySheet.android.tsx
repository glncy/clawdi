import { useState, useEffect } from "react";
import { View, TextInput } from "react-native";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useAddPrioritySheetStore } from "@/stores/useAddPrioritySheetStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";
import type { Priority } from "@/types";

type Step = "must" | "win" | "overdue";

const STEPS: { key: Step; question: string; label: string }[] = [
  { key: "must", question: "What must happen today?", label: "Must-do" },
  { key: "win", question: "What would feel like a win?", label: "Win" },
  { key: "overdue", question: "What's long overdue?", label: "Overdue" },
];

export const AddPrioritySheet = () => {
  const { isOpen, close } = useAddPrioritySheetStore();
  const { activeMustCount } = useDayData();
  const addPriority = useDayStore((s) => s.addPriority);
  const { db } = useDatabase();

  const [stepIndex, setStepIndex] = useState(0);
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mutedColor] = useCSSVariable(["--color-muted"]);

  const currentStep = STEPS[stepIndex]!;
  const isLastStep = stepIndex === STEPS.length - 1;
  const isMustAtMax = currentStep.key === "must" && activeMustCount >= 3;

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      setText("");
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!text.trim() || !db || isMustAtMax) return;
    setIsSaving(true);
    setError(null);
    try {
      await addPriority(db, {
        text: text.trim(),
        type: currentStep.key as Priority["type"],
      });
      setText("");
      if (isLastStep) {
        close();
      } else {
        setStepIndex((i) => i + 1);
      }
    } catch {
      setError("Couldn't save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    setText("");
    setError(null);
    if (isLastStep) {
      close();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
      <ModalBottomSheet onDismissRequest={close} showDragHandle>
        <RNHostView matchContents>
          <View className="px-5 py-6 gap-5">
            <View className="flex-row items-center justify-between">
              <AppText size="xl" weight="bold" family="headline">
                Add Priority
              </AppText>
              <AppText size="xs" color="muted">
                {stepIndex + 1} / {STEPS.length}
              </AppText>
            </View>

            <View className="gap-2">
              <AppText size="sm" weight="semibold" color="muted">
                {currentStep.label}
              </AppText>
              <AppText size="base">{currentStep.question}</AppText>
            </View>

            {isMustAtMax ? (
              <View className="rounded-xl bg-warning/10 px-4 py-3">
                <AppText size="sm" color="warning">
                  {"You already have 3 must-dos. That\u2019s the daily limit."}
                </AppText>
              </View>
            ) : (
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={`Type your ${currentStep.label.toLowerCase()}…`}
                multiline
                numberOfLines={2}
                className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                placeholderTextColor={mutedColor as string}
                style={{ minHeight: 60, textAlignVertical: "top" }}
                autoFocus
                onSubmitEditing={handleAdd}
              />
            )}

            {error && (
              <AppText size="xs" color="danger">
                {error}
              </AppText>
            )}

            <View className="flex-row gap-3">
              <Button variant="tertiary" className="flex-1" onPress={handleSkip}>
                <Button.Label>Skip</Button.Label>
              </Button>
              <Button
                className="flex-1"
                onPress={handleAdd}
                isDisabled={!text.trim() || isSaving || isMustAtMax}
              >
                <Button.Label>
                  {isSaving ? "Saving…" : isLastStep ? "Done" : "Add"}
                </Button.Label>
              </Button>
            </View>
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
};
