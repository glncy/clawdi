/**
 * Unified AI hook — routes inference to the correct provider:
 *   - "apple"  → Apple Foundation Models (iOS 26+, Apple Intelligence)
 *   - "gemma"  → Gemma 4 E2B via llama.cpp (all other devices)
 *
 * Both providers expose the same interface so callers are provider-agnostic.
 * Apple Foundation Models support requires @react-native-ai/apple to be
 * installed. Until then, the hook always resolves to the Gemma provider.
 */

import { useAIProvider } from "./useAIProvider";
import { useLocalAI } from "./useLocalAI";

export type { AIProvider } from "./useAIProvider";

export function useAI() {
  const { provider, isChecking: isCheckingProvider } = useAIProvider();
  const gemma = useLocalAI();

  // Apple Foundation Models branch — add implementation here once
  // @react-native-ai/apple is installed. For now provider always
  // resolves to "gemma" because the package is absent.
  if (provider === "apple") {
    // TODO: return apple implementation when package is installed
    // For now fall through to gemma as safe default
  }

  return {
    ...gemma,
    provider,
    isCheckingProvider,
  };
}
