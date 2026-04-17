// apps/mobile/src/hooks/useAppleAI.ts
import { useCallback } from "react";
import { streamText } from "ai";
import { apple } from "@react-native-ai/apple";
import { useAIStore } from "@/stores/useAIStore";

/** Satisfies the shared AI hook interface — Apple Foundation Models have no download/load lifecycle. */
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
