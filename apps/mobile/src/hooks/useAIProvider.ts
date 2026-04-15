import { Platform } from "react-native";
import { useEffect, useState } from "react";

export type AIProvider = "apple" | "gemma";

/**
 * Checks if Apple Foundation Models are available on this device.
 * Requires iOS 26+ and Apple Intelligence support.
 *
 * Apple Intelligence is available on:
 *   - iPhone 16 series and later
 *   - iPhone 15 Pro / Pro Max
 *   - iPad with M1 chip or later
 *   - Mac with Apple Silicon
 */
async function checkAppleIntelligenceAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  // TODO: uncomment when @react-native-ai/apple is installed
  // try {
  //   const { isAvailable } = await import("@react-native-ai/apple");
  //   return await isAvailable();
  // } catch {
  //   return false;
  // }
  return false;
}

/**
 * Returns which AI provider to use for this device:
 * - "apple" → Apple Foundation Models (iOS 26+, Apple Intelligence capable devices)
 * - "gemma" → Gemma 4 E2B via llama.cpp (all other devices, Android, older iOS)
 *
 * Apple provider: zero download, native tool calling, single-turn only (no maxSteps)
 * Gemma provider: ~2.3 GB download, full multi-step tool calling, cross-platform
 */
export function useAIProvider(): { provider: AIProvider; isChecking: boolean } {
  const [provider, setProvider] = useState<AIProvider>("gemma");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAppleIntelligenceAvailable()
      .then((available) => setProvider(available ? "apple" : "gemma"))
      .finally(() => setIsChecking(false));
  }, []);

  return { provider, isChecking };
}
