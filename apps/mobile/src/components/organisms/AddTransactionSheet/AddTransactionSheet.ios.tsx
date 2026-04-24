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
import { useAddTransactionSheetStore } from "@/stores/useAddTransactionSheetStore";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useLocalAI } from "@/hooks/useLocalAI";
import { useIsAIAvailable } from "@/hooks/useIsAIAvailable";
import { parseTransactionText } from "@/services/transactionParserService";

export const AddTransactionSheet = () => {
  const { isOpen, close } = useAddTransactionSheetStore();
  const { categories } = useFinanceData();
  const { completeJSON } = useLocalAI();
  const isAIAvailable = useIsAIAvailable();

  const [aiText, setAiText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryNames = categories.map((c) => c.name);

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

    const result = await parseTransactionText(aiText, completeJSON);
    setIsLoading(false);

    if (!result) {
      setError("Couldn't understand that. Try again or input manually.");
      return;
    }

    const matchedCategory = categoryNames.includes(result.category)
      ? result.category
      : "Other";

    useAddTransactionSheetStore.getState().setPrefill({
      type: result.type,
      item: result.item,
      amount: result.amount,
      category: matchedCategory,
    });
    handleClose();
    router.push("/(main)/add-transaction");
  };

  const handleManual = () => {
    handleClose();
    router.push("/(main)/add-transaction");
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
              title="Log Transaction"
              aiPlaceholder="e.g. coffee 4.50 or salary 3000"
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
