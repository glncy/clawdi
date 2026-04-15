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
