# AI Provider Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Apple AI and Gemini as selectable providers alongside the existing Gemma Local AI, with a Settings > AI screen for user preference.

**Architecture:** A new `useAIPreferenceStore` persists the user's provider choice and Gemini API key. `useAIProvider` resolves the active provider by combining the preference with availability checks. `useAI` routes to provider-specific hooks (`useAppleAI`, `useGeminiAI`, `useLocalAI`) that all share the same interface.

**Tech Stack:** `@react-native-ai/apple@0.12.0`, `@ai-sdk/google` (already installed), Zustand + expo-sqlite/kv-store persist, Vercel AI SDK `streamText`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `apps/mobile/src/stores/useAIPreferenceStore.ts` | Persisted user preference + Gemini API key |
| Create | `apps/mobile/src/hooks/useAppleAI.ts` | Apple Foundation Models inference hook |
| Create | `apps/mobile/src/hooks/useGeminiAI.ts` | Gemini cloud inference hook |
| Create | `apps/mobile/src/app/(main)/(tabs)/settings/ai.tsx` | Settings > AI screen |
| Modify | `apps/mobile/src/hooks/useAIProvider.ts` | Wire real availability check + preference |
| Modify | `apps/mobile/src/hooks/useAI.ts` | Route all three providers |
| Modify | `apps/mobile/src/app/(main)/(tabs)/settings/index.tsx` | Rename row + update navigation |
| Modify | `apps/mobile/package.json` | Add `@react-native-ai/apple` |

---

## Task 1: Install `@react-native-ai/apple`

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Add the package**

```bash
cd apps/mobile && bun add @react-native-ai/apple@0.12.0
```

Expected output: `@react-native-ai/apple@0.12.0` added to `package.json`.

- [ ] **Step 2: Verify the package resolves**

```bash
ls node_modules/@react-native-ai/apple/lib/commonjs/index.js
```

Expected: file exists (no error).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/package.json bun.lock
git commit -m "chore(mobile/ai): install @react-native-ai/apple"
```

---

## Task 2: Create `useAIPreferenceStore`

**Files:**
- Create: `apps/mobile/src/stores/useAIPreferenceStore.ts`

- [ ] **Step 1: Create the store**

```typescript
// apps/mobile/src/stores/useAIPreferenceStore.ts
import { Platform } from "react-native";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage/zustandStorage";

export type AIPreference = "apple" | "gemma" | "gemini";

interface AIPreferenceState {
  preferredProvider: AIPreference;
  geminiApiKey: string | null;
  setPreferredProvider: (p: AIPreference) => void;
  setGeminiApiKey: (key: string | null) => void;
}

export const useAIPreferenceStore = create<AIPreferenceState>()(
  persist(
    (set) => ({
      // Default: apple on iOS (useAIProvider falls back to gemma if unavailable),
      // gemma on Android.
      preferredProvider: Platform.OS === "ios" ? "apple" : "gemma",
      geminiApiKey: null,
      setPreferredProvider: (p) => set({ preferredProvider: p }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
    }),
    {
      name: "ai-preferences",
      storage: zustandStorage,
    }
  )
);
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile && bunx tsc --noEmit 2>&1 | grep useAIPreferenceStore
```

Expected: no output (no errors for this file).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/stores/useAIPreferenceStore.ts
git commit -m "feat(mobile/ai): add useAIPreferenceStore with persisted provider preference"
```

---

## Task 3: Create `useAppleAI`

**Files:**
- Create: `apps/mobile/src/hooks/useAppleAI.ts`

- [ ] **Step 1: Create the hook**

```typescript
// apps/mobile/src/hooks/useAppleAI.ts
import { useCallback } from "react";
import { streamText } from "ai";
import { apple } from "@react-native-ai/apple";
import { useAIStore } from "@/stores/useAIStore";

const NOOP_ASYNC = async () => {};

/**
 * Apple Foundation Models inference hook.
 * Exposes the same interface as useLocalAI — callers are provider-agnostic.
 * No download or loading step — the model is part of the OS.
 * No thinking-token filtering — Apple does not emit reasoning blocks.
 */
export function useAppleAI() {
  const setStatus = useAIStore((s) => s.setStatus);
  const setError = useAIStore((s) => s.setError);
  const appendResponse = useAIStore((s) => s.appendResponse);
  const clearResponse = useAIStore((s) => s.clearResponse);
  const setResponse = useAIStore((s) => s.setResponse);

  const status = useAIStore((s) => s.status);
  const error = useAIStore((s) => s.error);
  const response = useAIStore((s) => s.response);

  const complete = useCallback(
    async (
      userMessage: string,
      systemPrompt?: string,
      _filterThinking = true
    ) => {
      if (useAIStore.getState().status === "inferring") return null;

      setStatus("inferring");
      clearResponse();
      setError(null);

      try {
        const { textStream } = streamText({
          model: apple(),
          messages: [
            ...(systemPrompt
              ? [{ role: "system" as const, content: systemPrompt }]
              : []),
            { role: "user" as const, content: userMessage },
          ],
          temperature: 0.7,
        });

        let fullText = "";
        for await (const chunk of textStream) {
          fullText += chunk;
          appendResponse(chunk);
        }

        setStatus("ready");
        return { text: fullText };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStatus("ready");
        setError(msg);
        return null;
      }
    },
    [setStatus, setError, clearResponse, appendResponse]
  );

  const completeJSON = useCallback(
    async <T>(
      userMessage: string,
      systemPrompt: string,
      _filterThinking = true
    ): Promise<T | null> => {
      const result = await complete(userMessage, systemPrompt);
      if (!result) return null;

      try {
        const startIdx = result.text.indexOf("{");
        if (startIdx === -1) {
          setError("No JSON found in response.");
          return null;
        }

        let depth = 0;
        let endIdx = -1;
        for (let i = startIdx; i < result.text.length; i++) {
          if (result.text[i] === "{") depth++;
          if (result.text[i] === "}") depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }

        if (endIdx === -1) {
          setError("Incomplete JSON in response.");
          return null;
        }

        const parsed = JSON.parse(result.text.slice(startIdx, endIdx)) as T;
        setResponse(JSON.stringify(parsed, null, 2));
        return parsed;
      } catch (e) {
        setError(
          `JSON parse failed: ${e instanceof Error ? e.message : String(e)}`
        );
        return null;
      }
    },
    [complete, setError, setResponse]
  );

  return {
    status,
    downloadProgress: 1,
    downloadedBytes: 0,
    totalBytes: 0,
    error,
    isModelDownloaded: true,
    response,
    checkModel: async () => true,
    downloadModel: NOOP_ASYNC,
    pauseDownload: NOOP_ASYNC,
    loadModel: NOOP_ASYNC,
    complete,
    completeJSON,
    releaseModel: NOOP_ASYNC,
    removeModel: NOOP_ASYNC,
    clearResponse,
    isModelLoaded: true,
    MODEL: { id: "apple-foundation", name: "Apple AI" } as const,
  };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile && bunx tsc --noEmit 2>&1 | grep useAppleAI
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/hooks/useAppleAI.ts
git commit -m "feat(mobile/ai): add useAppleAI hook wrapping Apple Foundation Models"
```

---

## Task 4: Create `useGeminiAI`

**Files:**
- Create: `apps/mobile/src/hooks/useGeminiAI.ts`

- [ ] **Step 1: Create the hook**

```typescript
// apps/mobile/src/hooks/useGeminiAI.ts
import { useCallback } from "react";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { useAIStore } from "@/stores/useAIStore";
import { useAIPreferenceStore } from "@/stores/useAIPreferenceStore";

const NOOP_ASYNC = async () => {};

/**
 * Gemini 3 Flash cloud inference hook.
 * Exposes the same interface as useLocalAI — callers are provider-agnostic.
 * Requires a Gemini API key stored in useAIPreferenceStore.
 */
export function useGeminiAI() {
  const setStatus = useAIStore((s) => s.setStatus);
  const setError = useAIStore((s) => s.setError);
  const appendResponse = useAIStore((s) => s.appendResponse);
  const clearResponse = useAIStore((s) => s.clearResponse);
  const setResponse = useAIStore((s) => s.setResponse);

  const status = useAIStore((s) => s.status);
  const error = useAIStore((s) => s.error);
  const response = useAIStore((s) => s.response);
  const geminiApiKey = useAIPreferenceStore((s) => s.geminiApiKey);

  const complete = useCallback(
    async (
      userMessage: string,
      systemPrompt?: string,
      _filterThinking = true
    ) => {
      if (useAIStore.getState().status === "inferring") return null;

      if (!geminiApiKey) {
        setError("No Gemini API key set. Add one in Settings > AI.");
        return null;
      }

      setStatus("inferring");
      clearResponse();
      setError(null);

      try {
        const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });

        const { textStream } = streamText({
          model: google("gemini-3-flash-preview"),
          messages: [
            ...(systemPrompt
              ? [{ role: "system" as const, content: systemPrompt }]
              : []),
            { role: "user" as const, content: userMessage },
          ],
          temperature: 0.7,
        });

        let fullText = "";
        for await (const chunk of textStream) {
          fullText += chunk;
          appendResponse(chunk);
        }

        setStatus("ready");
        return { text: fullText };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStatus("ready");
        setError(msg);
        return null;
      }
    },
    [geminiApiKey, setStatus, setError, clearResponse, appendResponse]
  );

  const completeJSON = useCallback(
    async <T>(
      userMessage: string,
      systemPrompt: string,
      _filterThinking = true
    ): Promise<T | null> => {
      const result = await complete(userMessage, systemPrompt);
      if (!result) return null;

      try {
        const startIdx = result.text.indexOf("{");
        if (startIdx === -1) {
          setError("No JSON found in response.");
          return null;
        }

        let depth = 0;
        let endIdx = -1;
        for (let i = startIdx; i < result.text.length; i++) {
          if (result.text[i] === "{") depth++;
          if (result.text[i] === "}") depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }

        if (endIdx === -1) {
          setError("Incomplete JSON in response.");
          return null;
        }

        const parsed = JSON.parse(result.text.slice(startIdx, endIdx)) as T;
        setResponse(JSON.stringify(parsed, null, 2));
        return parsed;
      } catch (e) {
        setError(
          `JSON parse failed: ${e instanceof Error ? e.message : String(e)}`
        );
        return null;
      }
    },
    [complete, setError, setResponse]
  );

  return {
    status,
    downloadProgress: 1,
    downloadedBytes: 0,
    totalBytes: 0,
    error,
    isModelDownloaded: true,
    response,
    checkModel: async () => true,
    downloadModel: NOOP_ASYNC,
    pauseDownload: NOOP_ASYNC,
    loadModel: NOOP_ASYNC,
    complete,
    completeJSON,
    releaseModel: NOOP_ASYNC,
    removeModel: NOOP_ASYNC,
    clearResponse,
    isModelLoaded: !!geminiApiKey,
    MODEL: { id: "gemini-3-flash-preview", name: "Gemini 3 Flash" } as const,
  };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile && bunx tsc --noEmit 2>&1 | grep useGeminiAI
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/hooks/useGeminiAI.ts
git commit -m "feat(mobile/ai): add useGeminiAI hook for Gemini 3 Flash cloud inference"
```

---

## Task 5: Update `useAIProvider`

**Files:**
- Modify: `apps/mobile/src/hooks/useAIProvider.ts`

- [ ] **Step 1: Replace the file**

```typescript
// apps/mobile/src/hooks/useAIProvider.ts
import { Platform } from "react-native";
import { useEffect, useState } from "react";
import {
  useAIPreferenceStore,
  type AIPreference,
} from "@/stores/useAIPreferenceStore";

export type AIProvider = "apple" | "gemma" | "gemini";

/**
 * Resolves the active AI provider:
 *   "apple"  — Apple Foundation Models (iOS 26+, Apple Intelligence enabled)
 *   "gemma"  — Gemma 4 E2B via llama.cpp (local, cross-platform)
 *   "gemini" — Gemini 3 Flash cloud API (requires API key)
 *
 * Fallback rules:
 *   - preferred "apple" but unavailable → "gemma"
 *   - preferred "gemini" but no API key → "gemma"
 */
export function useAIProvider(): { provider: AIProvider; isChecking: boolean } {
  const preferredProvider = useAIPreferenceStore((s) => s.preferredProvider);
  const geminiApiKey = useAIPreferenceStore((s) => s.geminiApiKey);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      setIsChecking(false);
      return;
    }
    // Dynamic import keeps Android from loading the iOS-only TurboModule
    import("@react-native-ai/apple")
      .then(({ apple }) => setIsAppleAvailable(apple.isAvailable()))
      .catch(() => setIsAppleAvailable(false))
      .finally(() => setIsChecking(false));
  }, []);

  let provider: AIProvider = "gemma";
  if (!isChecking) {
    if (preferredProvider === "apple" && isAppleAvailable) {
      provider = "apple";
    } else if (preferredProvider === "gemini" && !!geminiApiKey) {
      provider = "gemini";
    }
    // all other cases → "gemma"
  }

  return { provider, isChecking };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile && bunx tsc --noEmit 2>&1 | grep useAIProvider
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/hooks/useAIProvider.ts
git commit -m "feat(mobile/ai): wire real Apple availability check and preference resolution"
```

---

## Task 6: Update `useAI`

**Files:**
- Modify: `apps/mobile/src/hooks/useAI.ts`

- [ ] **Step 1: Replace the file**

```typescript
// apps/mobile/src/hooks/useAI.ts
/**
 * Unified AI hook — routes inference to the correct provider:
 *   "apple"  → Apple Foundation Models (iOS 26+, Apple Intelligence)
 *   "gemma"  → Gemma 4 E2B via llama.cpp (6+ GB RAM devices)
 *   "gemini" → Gemini 3 Flash cloud API (requires API key)
 *
 * All providers expose the same interface so callers are provider-agnostic.
 */

import { useAIProvider } from "./useAIProvider";
import { useLocalAI } from "./useLocalAI";
import { useAppleAI } from "./useAppleAI";
import { useGeminiAI } from "./useGeminiAI";

export type { AIProvider } from "./useAIProvider";

export function useAI() {
  const { provider, isChecking: isCheckingProvider } = useAIProvider();
  const gemma = useLocalAI();
  const apple = useAppleAI();
  const gemini = useGeminiAI();

  const impl =
    provider === "apple" ? apple : provider === "gemini" ? gemini : gemma;

  return {
    ...impl,
    provider,
    isCheckingProvider,
  };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile && bunx tsc --noEmit 2>&1 | grep "useAI\b"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/hooks/useAI.ts
git commit -m "feat(mobile/ai): route useAI to Apple, Gemma, or Gemini based on resolved provider"
```

---

## Task 7: Create Settings > AI screen

**Files:**
- Create: `apps/mobile/src/app/(main)/(tabs)/settings/ai.tsx`

- [ ] **Step 1: Create the screen**

```typescript
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
                          weight={isSelected ? "semibold" : "regular"}
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile && bunx tsc --noEmit 2>&1 | grep "settings/ai"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/src/app/(main)/(tabs)/settings/ai.tsx"
git commit -m "feat(mobile/ai): add Settings > AI screen with provider picker and model controls"
```

---

## Task 8: Update settings index

**Files:**
- Modify: `apps/mobile/src/app/(main)/(tabs)/settings/index.tsx`

- [ ] **Step 1: Rename the "Local AI" row and update its route**

Find the MAIN_ITEMS array and replace the Local AI entry:

```typescript
// Before:
{
  icon: Brain,
  label: "Local AI",
  description: "Model & inference",
  onPress: () => router.push("/home/ai-test" as never),
},

// After:
{
  icon: Brain,
  label: "AI",
  description: "Provider & model settings",
  onPress: () => router.push("/(main)/(tabs)/settings/ai" as never),
},
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile && bunx tsc --noEmit 2>&1 | grep "settings/index"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/src/app/(main)/(tabs)/settings/index.tsx"
git commit -m "feat(mobile/ai): rename Local AI settings row to AI, link to new settings screen"
```

---

## Task 9: Native rebuild

`@react-native-ai/apple` ships a TurboModule (`NativeAppleLLM`) — a native rebuild is required.

- [ ] **Step 1: Clean and prebuild**

```bash
cd apps/mobile && npx expo prebuild --clean
```

Expected: `ios/` folder regenerated with `AppleLLM` pod included.

- [ ] **Step 2: Verify pod is installed**

```bash
grep -r "AppleLLM" apps/mobile/ios/Podfile.lock
```

Expected: `AppleLLM` appears in the pod list.

- [ ] **Step 3: Open Xcode and build**

```bash
open apps/mobile/ios/*.xcworkspace
```

Build the scheme in Xcode (⌘B). Expected: successful build, no "framework not found" errors.

- [ ] **Step 4: Smoke test on simulator**

Run the app. Navigate to Settings > AI. Verify:
- Provider picker shows Apple AI + Local AI + Cloud AI (on iOS)
- Active provider badge appears
- Switching providers updates the badge
- Local AI download / load buttons work
- Cloud AI: enter a Gemini API key and save

- [ ] **Step 5: Final commit**

```bash
git add apps/mobile/ios/
git commit -m "chore(mobile/ios): regenerate native project with AppleLLM TurboModule"
git push origin docs/sprint-design-specs
```
