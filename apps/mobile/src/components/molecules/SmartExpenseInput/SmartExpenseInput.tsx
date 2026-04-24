import { useState } from "react";
import { View, Pressable } from "react-native";
import { Card, Input } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { MagnifyingGlass, PaperPlaneRight, Check, X } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useLocalAI } from "@/hooks/useLocalAI";
import { useAIStore } from "@/stores/useAIStore";
import {
  transactionSchema,
  TRANSACTION_SYSTEM_PROMPT,
} from "@/services/transactionSchema";
import { getCategoryIcon } from "@/utils/categoryIcon";

interface ParsedExpense {
  item: string;
  amount: number;
  currency: string;
  category: string;
}

/**
 * AI-powered natural language expense input.
 * Only renders when local AI model is loaded and ready.
 * @level Molecule
 */
export const SmartExpenseInput = () => {
  const aiStatus = useAIStore((s) => s.status);
  const { completeJSON, isModelLoaded } = useLocalAI();
  const [primaryColor, mutedColor, primaryForegroundColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
    "--color-primary-foreground",
  ]);

  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedExpense | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Only show when AI is ready
  if (!isModelLoaded || aiStatus !== "ready") return null;

  const handleSubmit = async () => {
    if (!text.trim() || isParsing) return;
    setIsParsing(true);
    setParsed(null);

    const result = await completeJSON<ParsedExpense>(
      text,
      TRANSACTION_SYSTEM_PROMPT
    );

    if (result) {
      const validated = transactionSchema.safeParse(result);
      if (validated.success) {
        setParsed(validated.data);
      }
    }
    setIsParsing(false);
  };

  const handleConfirm = () => {
    // TODO: Save transaction to store
    setParsed(null);
    setText("");
  };

  const handleCancel = () => {
    setParsed(null);
    setText("");
  };

  return (
    <Card className="bg-surface p-4">
      <Card.Body className="gap-3">
        <AppText size="xs" color="muted" weight="medium">
          Quick log
        </AppText>

        {/* Input row */}
        <View className="flex-row items-center gap-2 rounded-lg bg-default px-3 py-2">
          <MagnifyingGlass
            size={16}
            weight="regular"
            color={mutedColor as string}
          />
          <Input
            className="flex-1 text-sm"
            placeholder="coffee 4.50, groceries 32..."
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            isDisabled={isParsing}
          />
          <Pressable onPress={handleSubmit} hitSlop={8} disabled={isParsing}>
            <PaperPlaneRight
              size={18}
              weight="fill"
              color={
                text.trim()
                  ? (primaryColor as string)
                  : (mutedColor as string)
              }
            />
          </Pressable>
        </View>

        {/* Parsing state */}
        {isParsing && (
          <AppText size="xs" color="primary">
            Parsing...
          </AppText>
        )}

        {/* Parsed result — confirm or cancel */}
        {parsed && (
          <View className="flex-row items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5">
            <View className="flex-row items-center gap-2 flex-1">
              <AppText size="base">
                {getCategoryIcon(parsed.category)}
              </AppText>
              <View>
                <AppText size="sm" weight="medium">
                  {parsed.item}
                </AppText>
                <AppText size="xs" color="muted">
                  {parsed.category} · {parsed.currency}{" "}
                  {parsed.amount.toFixed(2)}
                </AppText>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={handleCancel}
                className="h-8 w-8 items-center justify-center rounded-full bg-default"
              >
                <X size={14} weight="bold" color={mutedColor as string} />
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                className="h-8 w-8 items-center justify-center rounded-full bg-primary"
              >
                <Check
                  size={14}
                  weight="bold"
                  color={primaryForegroundColor as string}
                />
              </Pressable>
            </View>
          </View>
        )}
      </Card.Body>
    </Card>
  );
};
