// apps/mobile/src/app/(main)/(tabs)/settings/ai.tsx
import { useState } from "react";
import { View, ScrollView, Platform, TextInput } from "react-native";
import { Stack } from "expo-router";
import { Button } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { Brain, Cloud, DeviceMobile, CheckCircle } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useAIProvider } from "@/hooks/useAIProvider";
import {
  useAIPreferenceStore,
  type AIPreference,
} from "@/stores/useAIPreferenceStore";
import { useLocalAI } from "@/hooks/useLocalAI";
import { formatBytes } from "@/services/localAI";

const PROVIDER_LABELS: Record<AIPreference, string> = {
  apple: "Apple AI",
  gemma: "Local AI",
  gemini: "Cloud AI",
};

const PROVIDER_DESCRIPTIONS: Record<AIPreference, string> = {
  apple: "Apple Foundation Models — on-device, no download",
  gemma: "Gemma 4 E2B — runs fully on your device",
  gemini: "Gemini 3 Flash — fast cloud model, requires API key",
};

export default function AISettingsScreen() {
  const [primaryColor, mutedColor, successColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
    "--color-success",
  ]);

  const { provider: activeProvider, isChecking } = useAIProvider();
  const preferredProvider = useAIPreferenceStore((s) => s.preferredProvider);
  const geminiApiKey = useAIPreferenceStore((s) => s.geminiApiKey);
  const setPreferredProvider = useAIPreferenceStore(
    (s) => s.setPreferredProvider
  );
  const setGeminiApiKey = useAIPreferenceStore((s) => s.setGeminiApiKey);

  const {
    status,
    isModelDownloaded,
    isModelLoaded,
    downloadProgress,
    downloadedBytes,
    totalBytes,
    downloadModel,
    loadModel,
    releaseModel,
    removeModel,
    MODEL,
  } = useLocalAI();

  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey ?? "");
  const [apiKeyDirty, setApiKeyDirty] = useState(false);

  // Which providers are available to show
  const showApple = Platform.OS === "ios";
  const options: AIPreference[] = [
    ...(showApple ? (["apple"] as AIPreference[]) : []),
    "gemma",
    "gemini",
  ];

  const progressPercent = Math.round(downloadProgress * 100);

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput.trim() || null);
    setApiKeyDirty(false);
  };

  const handleRemoveApiKey = () => {
    setGeminiApiKey(null);
    setApiKeyInput("");
    setApiKeyDirty(false);
    if (preferredProvider === "gemini") setPreferredProvider("gemma");
  };

  return (
    <>
      <Stack.Screen options={{ title: "AI" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-32 gap-5"
      >
        {/* Active provider badge */}
        {!isChecking && (
          <View className="flex-row items-center gap-2 rounded-xl bg-primary/10 px-4 py-3">
            <CheckCircle size={18} weight="fill" color={primaryColor as string} />
            <AppText size="sm" weight="medium" color="primary">
              Active: {PROVIDER_LABELS[activeProvider]}
            </AppText>
          </View>
        )}

        {/* Provider picker */}
        <View>
          <AppText size="xs" weight="medium" color="muted" className="mb-2 px-1 uppercase tracking-wide">
            Provider
          </AppText>
          <View className="overflow-hidden rounded-xl bg-surface">
            {options.map((option, i) => {
              const isSelected = preferredProvider === option;
              const isLast = i === options.length - 1;
              const Icon =
                option === "apple"
                  ? DeviceMobile
                  : option === "gemini"
                  ? Cloud
                  : Brain;

              return (
                <View key={option}>
                  <Button
                    variant="ghost"
                    className="h-auto items-start px-4 py-3.5"
                    onPress={() => setPreferredProvider(option)}
                  >
                    <View className="flex-row items-center gap-3 w-full">
                      <View
                        className={`h-9 w-9 items-center justify-center rounded-lg ${
                          isSelected ? "bg-primary/10" : "bg-default/50"
                        }`}
                      >
                        <Icon
                          size={18}
                          weight="fill"
                          color={
                            isSelected
                              ? (primaryColor as string)
                              : (mutedColor as string)
                          }
                        />
                      </View>
                      <View className="flex-1">
                        <AppText
                          size="base"
                          weight={isSelected ? "semibold" : undefined}
                          color={isSelected ? "primary" : "foreground"}
                        >
                          {PROVIDER_LABELS[option]}
                        </AppText>
                        <AppText size="xs" color="muted">
                          {PROVIDER_DESCRIPTIONS[option]}
                        </AppText>
                      </View>
                      {isSelected && (
                        <CheckCircle
                          size={18}
                          weight="fill"
                          color={primaryColor as string}
                        />
                      )}
                    </View>
                  </Button>
                  {!isLast && <View className="ml-14 h-px bg-default" />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Local AI section */}
        <View>
          <AppText size="xs" weight="medium" color="muted" className="mb-2 px-1 uppercase tracking-wide">
            Local AI — {MODEL.name}
          </AppText>
          <View className="overflow-hidden rounded-xl bg-surface px-4 py-4 gap-3">
            {/* Status row */}
            <View className="flex-row justify-between">
              <AppText size="sm" color="muted">Status</AppText>
              <AppText size="sm" weight="medium" color="foreground">
                {isModelLoaded
                  ? "Loaded"
                  : isModelDownloaded
                  ? "Downloaded"
                  : status === "downloading"
                  ? `Downloading ${progressPercent}%`
                  : "Not downloaded"}
              </AppText>
            </View>

            {/* Size row */}
            {totalBytes > 0 && (
              <View className="flex-row justify-between">
                <AppText size="sm" color="muted">Size</AppText>
                <AppText size="sm" weight="medium" color="foreground">
                  {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
                </AppText>
              </View>
            )}

            {/* Actions */}
            <View className="flex-row gap-2 mt-1">
              {!isModelDownloaded ? (
                <Button
                  variant="primary"
                  className="flex-1"
                  isDisabled={status === "downloading"}
                  onPress={downloadModel}
                >
                  <Button.Label>
                    {status === "downloading"
                      ? `${progressPercent}%`
                      : "Download"}
                  </Button.Label>
                </Button>
              ) : (
                <>
                  {isModelLoaded ? (
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onPress={releaseModel}
                    >
                      <Button.Label>Unload</Button.Label>
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="flex-1"
                      isDisabled={status === "loading"}
                      onPress={loadModel}
                    >
                      <Button.Label>
                        {status === "loading" ? "Loading…" : "Load"}
                      </Button.Label>
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    className="flex-1"
                    onPress={removeModel}
                  >
                    <Button.Label>Remove</Button.Label>
                  </Button>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Cloud AI section */}
        <View>
          <AppText size="xs" weight="medium" color="muted" className="mb-2 px-1 uppercase tracking-wide">
            Cloud AI — Gemini 3 Flash
          </AppText>
          <View className="overflow-hidden rounded-xl bg-surface px-4 py-4 gap-3">
            <AppText size="sm" color="muted">
              Get a free API key at aistudio.google.com. Queries are sent to
              Google servers.
            </AppText>

            <TextInput
              value={apiKeyInput}
              onChangeText={(t) => {
                setApiKeyInput(t);
                setApiKeyDirty(true);
              }}
              placeholder="Paste Gemini API key…"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-lg bg-default/50 px-3 py-2.5 text-sm text-foreground"
              placeholderTextColor={mutedColor as string}
            />

            <View className="flex-row gap-2">
              <Button
                variant="primary"
                className="flex-1"
                isDisabled={!apiKeyDirty || !apiKeyInput.trim()}
                onPress={handleSaveApiKey}
              >
                <Button.Label>Save Key</Button.Label>
              </Button>
              {geminiApiKey && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onPress={handleRemoveApiKey}
                >
                  <Button.Label>Remove</Button.Label>
                </Button>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
