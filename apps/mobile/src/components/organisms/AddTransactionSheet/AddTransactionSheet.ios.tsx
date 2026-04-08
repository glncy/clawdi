import { useState } from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
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
import { AppText } from "@/components/atoms/Text";
import { Button, Input } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useAddTransactionSheetStore } from "@/stores/useAddTransactionSheetStore";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useLocalAI } from "@/hooks/useLocalAI";
import { useIsAIAvailable } from "@/hooks/useIsAIAvailable";
import { parseTransactionText } from "@/services/transactionParserService";
import { Lightning, PencilSimpleLine, Microphone } from "phosphor-react-native";

export const AddTransactionSheet = () => {
  const { isOpen, close } = useAddTransactionSheetStore();
  const { categories } = useFinanceData();
  const { completeJSON } = useLocalAI();
  const isAIAvailable = useIsAIAvailable();

  const [aiText, setAiText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [primaryColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
  ]);

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
            <View className="px-5 py-6 gap-5">
              <AppText size="xl" weight="bold" family="headline">
                Log Transaction
              </AppText>

              {isLoading ? (
                <View className="items-center gap-3 py-8">
                  <ActivityIndicator size="large" />
                  <AppText size="sm" color="muted">
                    Loading...
                  </AppText>
                </View>
              ) : (
                <>
                  {isAIAvailable && (
                    <View className="gap-3">
                      <AppText size="sm" color="muted">
                        Describe your transaction
                      </AppText>
                      <View className="flex-row items-center">
                        <Input
                          className="flex-1 pl-10"
                          placeholder="e.g. coffee 4.50 or salary 3000"
                          value={aiText}
                          onChangeText={setAiText}
                          onSubmitEditing={handleAISubmit}
                          returnKeyType="done"
                          autoFocus
                        />
                        <Lightning
                          size={16}
                          color={primaryColor as string}
                          weight="fill"
                          style={{ position: "absolute", left: 14 }}
                        />
                      </View>
                      {error && (
                        <AppText size="xs" color="danger">
                          {error}
                        </AppText>
                      )}
                    </View>
                  )}

                  <View className="items-center">
                    <AppText size="xs" color="muted">
                      or
                    </AppText>
                  </View>

                  <View className="gap-3">
                    <Pressable
                      className="flex-row items-center gap-3 rounded-xl bg-surface p-4"
                      onPress={handleManual}
                    >
                      <PencilSimpleLine
                        size={20}
                        color={primaryColor as string}
                        weight="bold"
                      />
                      <AppText size="sm" weight="medium">
                        Input Manually
                      </AppText>
                    </Pressable>
                    <Pressable
                      className="flex-row items-center gap-3 rounded-xl bg-surface p-4 opacity-50"
                      disabled
                    >
                      <Microphone
                        size={20}
                        color={mutedColor as string}
                        weight="bold"
                      />
                      <View>
                        <AppText size="sm" weight="medium" color="muted">
                          Tap to Talk
                        </AppText>
                        <AppText size="xs" color="muted">
                          Coming soon
                        </AppText>
                      </View>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
