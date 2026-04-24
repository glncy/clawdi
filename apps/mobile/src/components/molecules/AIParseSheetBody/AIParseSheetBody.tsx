import { View, Pressable, ActivityIndicator } from "react-native";
import { Input } from "heroui-native";
import { Lightning, PencilSimpleLine } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { AppText } from "@/components/atoms/Text";
import { VoiceCaptureCircle } from "@/components/atoms/VoiceCaptureCircle";

interface AIParseSheetBodyProps {
  title: string;
  aiPlaceholder: string;
  aiText: string;
  onChangeAiText: (v: string) => void;
  onAISubmit: () => void;
  onManual: () => void;
  isAIAvailable: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Shared layout for AI-powered add sheets (Transaction, Bill, Savings Goal).
 * Renders a title, voice capture circle, AI natural-language input, and a
 * manual-entry fallback. Purely presentational — all state is lifted to the
 * owning organism.
 * @level Molecule
 */
export const AIParseSheetBody = ({
  title,
  aiPlaceholder,
  aiText,
  onChangeAiText,
  onAISubmit,
  onManual,
  isAIAvailable,
  isLoading,
  error,
}: AIParseSheetBodyProps) => {
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  return (
    <View className="px-5 py-6 gap-5">
      <AppText size="xl" weight="bold" family="headline">
        {title}
      </AppText>

      {isLoading ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator size="large" />
          <AppText size="sm" color="muted">
            Parsing…
          </AppText>
        </View>
      ) : (
        <>
          <VoiceCaptureCircle disabled />

          {isAIAvailable && (
            <View className="gap-2">
              <View className="flex-row items-center">
                <Input
                  className="flex-1 pl-10"
                  placeholder={aiPlaceholder}
                  value={aiText}
                  onChangeText={onChangeAiText}
                  onSubmitEditing={onAISubmit}
                  returnKeyType="done"
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

          <Pressable
            className="flex-row items-center justify-center gap-3 rounded-xl bg-surface p-4"
            onPress={onManual}
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
        </>
      )}
    </View>
  );
};
