// apps/mobile/src/hooks/useGeminiAI.ts
import { useCallback } from "react";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { useAIStore } from "@/stores/useAIStore";
import { useAIPreferenceStore } from "@/stores/useAIPreferenceStore";

/** Satisfies the shared AI hook interface — cloud providers have no local model lifecycle. */
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
        const userMsg = msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")
          ? "Unable to reach Gemini. Check your internet connection and try again."
          : msg;
        setStatus("ready");
        setError(userMsg);
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
