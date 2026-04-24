import { useState } from "react";
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
import { router } from "expo-router";
import { AIParseSheetBody } from "@/components/molecules/AIParseSheetBody";
import { useAddBillSheetStore } from "@/stores/useAddBillSheetStore";
import { useLocalAI } from "@/hooks/useLocalAI";
import { useIsAIAvailable } from "@/hooks/useIsAIAvailable";
import { parseBillText } from "@/services/billParserService";

export const AddBillSheet = () => {
  const { isOpen, close } = useAddBillSheetStore();
  const { completeJSON } = useLocalAI();
  const isAIAvailable = useIsAIAvailable();

  const [aiText, setAiText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    close();
    setAiText("");
    setError(null);
    setIsLoading(false);
  };

  const handleAISubmit = async () => {
    if (!aiText.trim()) return;
    setIsLoading(true);
    setError(null);

    const result = await parseBillText(aiText, completeJSON);
    setIsLoading(false);

    if (!result) {
      setError("Couldn't understand that. Try again or input manually.");
      return;
    }

    // `frequency` is already zod-validated to one of the 4 enum values by
    // `parseBillText`. The add-bill screen handles the `"once"` case
    // (Task 6.1 will widen the form's own zod schema to include it).
    useAddBillSheetStore.getState().setPrefill({
      name: result.name,
      amount: result.amount,
      frequency: result.frequency,
      category: result.category,
    });
    handleClose();
    router.push("/(main)/add-bill");
  };

  const handleManual = () => {
    handleClose();
    router.push("/(main)/add-bill");
  };

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(presented) => {
          if (!presented) handleClose();
        }}
      >
        <Group
          modifiers={[
            presentationDetents(["medium"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
            <AIParseSheetBody
              title="Add Bill"
              aiPlaceholder="e.g. Netflix 15 monthly or dentist 200 once"
              aiText={aiText}
              onChangeAiText={setAiText}
              onAISubmit={handleAISubmit}
              onManual={handleManual}
              isAIAvailable={isAIAvailable}
              isLoading={isLoading}
              error={error}
            />
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
