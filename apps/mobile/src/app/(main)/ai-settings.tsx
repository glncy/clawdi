import React, { useState } from "react";
import { View, ScrollView, TextInput } from "react-native";
import { Stack } from "expo-router";
import { Button, ListGroup, Separator } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { Brain, Cloud, DeviceMobile, CheckCircle, Warning } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useAIProvider } from "@/hooks/useAIProvider";
import {
  useAIPreferenceStore,
  type AIPreference,
} from "@/stores/useAIPreferenceStore";
import { useLocalAI } from "@/hooks/useLocalAI";
import { formatBytes } from "@/services/localAI";
import { isLiquidGlass } from "@/utils/platform";

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

const PROVIDER_ICONS: Record<AIPreference, typeof Brain> = {
  apple: DeviceMobile,
  gemma: Brain,
  gemini: Cloud,
};

export default function AISettingsScreen() {
  const [primaryColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
  ]);

  const { provider: activeProvider, isChecking } = useAIProvider();
  const preferredProvider = useAIPreferenceStore((s) => s.preferredProvider);
  const geminiApiKey = useAIPreferenceStore((s) => s.geminiApiKey);
  const setPreferredProvider = useAIPreferenceStore((s) => s.setPreferredProvider);
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

  // Apple AI only available on iOS 26+ with Apple Intelligence
  const appleUnavailable =
    preferredProvider === "apple" && !isChecking && activeProvider !== "apple";

  const options: AIPreference[] = [
    ...(isLiquidGlass ? (["apple"] as AIPreference[]) : []),
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
      <Stack.Screen options={{ title: "AI", headerShown: true }} />
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pt-5 pb-32 gap-5"
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
        <View className="gap-2">
          <AppText
            size="xs"
            weight="medium"
            color="muted"
            className="px-1 uppercase tracking-wide"
          >
            Provider
          </AppText>
          <ListGroup>
            {options.map((option, i) => {
              const isSelected = preferredProvider === option;
              const isAppleRow = option === "apple";
              const Icon = PROVIDER_ICONS[option];

              return (
                <React.Fragment key={option}>
                  {i > 0 && <Separator className="mx-4" />}
                  <ListGroup.Item onPress={() => setPreferredProvider(option)}>
                    <ListGroup.ItemPrefix>
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
                    </ListGroup.ItemPrefix>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle
                        className={isSelected ? "text-primary font-semibold" : ""}
                      >
                        {PROVIDER_LABELS[option]}
                      </ListGroup.ItemTitle>
                      <ListGroup.ItemDescription>
                        {PROVIDER_DESCRIPTIONS[option]}
                      </ListGroup.ItemDescription>
                      {isAppleRow && appleUnavailable && (
                        <AppText size="xs" color="warning" className="mt-0.5">
                          Requires Apple Intelligence to be enabled
                        </AppText>
                      )}
                    </ListGroup.ItemContent>
                    <ListGroup.ItemSuffix>
                      {isSelected && !appleUnavailable ? (
                        <CheckCircle
                          size={18}
                          weight="fill"
                          color={primaryColor as string}
                        />
                      ) : isAppleRow && appleUnavailable ? (
                        <Warning size={18} weight="fill" color={mutedColor as string} />
                      ) : null}
                    </ListGroup.ItemSuffix>
                  </ListGroup.Item>
                </React.Fragment>
              );
            })}
          </ListGroup>
        </View>

        {/* Local AI section */}
        <View className="gap-2">
          <AppText
            size="xs"
            weight="medium"
            color="muted"
            className="px-1 uppercase tracking-wide"
          >
            Local AI — {MODEL.name}
          </AppText>
          <ListGroup>
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Status</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <AppText size="sm" weight="medium">
                  {isModelLoaded
                    ? "Loaded"
                    : isModelDownloaded
                    ? "Downloaded"
                    : status === "downloading"
                    ? `Downloading ${progressPercent}%`
                    : "Not downloaded"}
                </AppText>
              </ListGroup.ItemSuffix>
            </ListGroup.Item>

            {totalBytes > 0 && (
              <>
                <Separator className="mx-4" />
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Size</ListGroup.ItemTitle>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    <AppText size="sm" weight="medium">
                      {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
                    </AppText>
                  </ListGroup.ItemSuffix>
                </ListGroup.Item>
              </>
            )}
          </ListGroup>

          <View className="flex-row gap-2">
            {!isModelDownloaded ? (
              <Button
                variant="primary"
                className="flex-1"
                isDisabled={status === "downloading"}
                onPress={downloadModel}
              >
                <Button.Label>
                  {status === "downloading" ? `${progressPercent}%` : "Download"}
                </Button.Label>
              </Button>
            ) : (
              <>
                {isModelLoaded ? (
                  <Button variant="secondary" className="flex-1" onPress={releaseModel}>
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
                <Button variant="danger" className="flex-1" onPress={removeModel}>
                  <Button.Label>Remove</Button.Label>
                </Button>
              </>
            )}
          </View>
        </View>

        {/* Cloud AI section */}
        <View className="gap-2">
          <AppText
            size="xs"
            weight="medium"
            color="muted"
            className="px-1 uppercase tracking-wide"
          >
            Cloud AI — Gemini 3 Flash
          </AppText>
          <ListGroup>
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemDescription>
                  Get a free API key at aistudio.google.com. Queries are sent to
                  Google servers.
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          </ListGroup>

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
            className="rounded-xl bg-surface px-3 py-3 text-sm text-foreground"
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
              <Button variant="danger" className="flex-1" onPress={handleRemoveApiKey}>
                <Button.Label>Remove</Button.Label>
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
