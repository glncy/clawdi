import { useState } from "react";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { router } from "expo-router";
import { AIParseSheetBody } from "@/components/molecules/AIParseSheetBody";
import { useAddAccountSheetStore } from "@/stores/useAddAccountSheetStore";
import { useLocalAI } from "@/hooks/useLocalAI";
import { useIsAIAvailable } from "@/hooks/useIsAIAvailable";
import { parseAccountText } from "@/services/accountParserService";

export const AddAccountSheet = () => {
  const { isOpen, close } = useAddAccountSheetStore();
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

    const result = await parseAccountText(aiText, completeJSON);
    setIsLoading(false);

    if (!result) {
      setError("Couldn't understand that. Try again or input manually.");
      return;
    }

    useAddAccountSheetStore.getState().setPrefill({
      name: result.name,
      type: result.type.toLowerCase(),
      balance: result.balance,
    });
    handleClose();
    router.push("/(main)/add-account");
  };

  const handleManual = () => {
    handleClose();
    router.push("/(main)/add-account");
  };

  if (!isOpen) return null;

  return (
    <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
      <ModalBottomSheet onDismissRequest={handleClose} showDragHandle>
        <RNHostView matchContents>
          <AIParseSheetBody
            title="Add Account"
            aiPlaceholder="e.g. Chase checking 1200 or cash 50"
            aiText={aiText}
            onChangeAiText={setAiText}
            onAISubmit={handleAISubmit}
            onManual={handleManual}
            isAIAvailable={isAIAvailable}
            isLoading={isLoading}
            error={error}
          />
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
};
