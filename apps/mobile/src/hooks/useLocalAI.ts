import { useCallback } from "react";
import { streamText } from "ai";
import {
  llama,
  downloadModel as downloadModelFromHF,
  isModelDownloaded as checkModelDownloaded,
  removeModel as deleteModelFromDisk,
  getModelPath,
  type LlamaLanguageModel,
} from "@react-native-ai/llama";
import { MODEL } from "@/services/localAI";
import { useAIStore } from "@/stores/useAIStore";

/**
 * Singleton model instance — shared across all hook consumers.
 * Prevents OOM from multiple components each loading a ~900MB model.
 */
let sharedModel: LlamaLanguageModel | null = null;

export function useLocalAI() {
  const setStatus = useAIStore((s) => s.setStatus);
  const setDownloadProgress = useAIStore((s) => s.setDownloadProgress);
  const setError = useAIStore((s) => s.setError);
  const setModelDownloaded = useAIStore((s) => s.setModelDownloaded);
  const appendResponse = useAIStore((s) => s.appendResponse);
  const clearResponse = useAIStore((s) => s.clearResponse);
  const setResponse = useAIStore((s) => s.setResponse);

  const status = useAIStore((s) => s.status);
  const downloadProgress = useAIStore((s) => s.downloadProgress);
  const downloadedBytes = useAIStore((s) => s.downloadedBytes);
  const totalBytes = useAIStore((s) => s.totalBytes);
  const error = useAIStore((s) => s.error);
  const isModelDownloadedState = useAIStore((s) => s.isModelDownloaded);
  const response = useAIStore((s) => s.response);

  const checkModel = useCallback(async () => {
    const exists = await checkModelDownloaded(MODEL.id);
    setModelDownloaded(exists);
    return exists;
  }, [setModelDownloaded]);

  const downloadModel = useCallback(async () => {
    // Guard against concurrent downloads
    if (useAIStore.getState().status === "downloading") return;

    setStatus("downloading");
    setDownloadProgress(0, 0, MODEL.sizeBytes);
    setError(null);

    try {
      await downloadModelFromHF(MODEL.id, (progress) => {
        const downloaded = Math.round(
          (progress.percentage / 100) * MODEL.sizeBytes
        );
        setDownloadProgress(
          progress.percentage / 100,
          downloaded,
          MODEL.sizeBytes
        );
      });

      setDownloadProgress(1, MODEL.sizeBytes, MODEL.sizeBytes);
      setModelDownloaded(true);
      setStatus("idle");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Download failed.";
      setStatus("idle");
      setError(msg);
    }
  }, [setStatus, setDownloadProgress, setModelDownloaded, setError]);

  const loadModel = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      // Unload existing model to prevent memory leaks
      if (sharedModel) {
        await sharedModel.unload();
        sharedModel = null;
      }

      const modelPath = getModelPath(MODEL.id);
      const model = llama.languageModel(modelPath, {
        contextParams: {
          n_gpu_layers: 99,
        },
      });
      await model.prepare();
      sharedModel = model;
      setStatus("ready");
    } catch (e) {
      const msg = e instanceof Error
        ? `Load failed: ${e.message}`
        : `Load failed: ${String(e)}`;
      setStatus("idle");
      setError(msg);
    }
  }, [setStatus, setError]);

  const complete = useCallback(
    async (userMessage: string, systemPrompt?: string) => {
      // Guard against concurrent inference
      if (useAIStore.getState().status === "inferring") return null;

      if (!sharedModel) {
        setError("Model not loaded.");
        return null;
      }

      setStatus("inferring");
      clearResponse();
      setError(null);

      try {
        const { textStream } = streamText({
          model: sharedModel,
          messages: [
            ...(systemPrompt
              ? [{ role: "system" as const, content: systemPrompt }]
              : []),
            { role: "user" as const, content: userMessage },
          ],
          maxTokens: 512,
          temperature: 0.3,
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

  /**
   * Parse JSON from model's free-text response.
   * Uses system prompt to guide JSON output, then extracts and parses it.
   * Does NOT use response_format/grammar (crashes llama.rn C++ layer).
   */
  const completeJSON = useCallback(
    async <T>(
      userMessage: string,
      systemPrompt: string
    ): Promise<T | null> => {
      const result = await complete(userMessage, systemPrompt);
      if (!result) return null;

      try {
        // Extract first balanced JSON object from response
        const startIdx = result.text.indexOf("{");
        if (startIdx === -1) {
          setError("No JSON found in response.");
          return null;
        }

        // Find matching closing brace (handles nested objects)
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

        const jsonStr = result.text.slice(startIdx, endIdx);
        const parsed = JSON.parse(jsonStr) as T;
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

  const releaseModel = useCallback(async () => {
    if (sharedModel) {
      await sharedModel.unload();
      sharedModel = null;
    }
    setStatus("idle");
  }, [setStatus]);

  const removeModel = useCallback(async () => {
    if (sharedModel) {
      await sharedModel.unload();
      sharedModel = null;
    }
    await deleteModelFromDisk(MODEL.id);
    setModelDownloaded(false);
    setStatus("idle");
    setDownloadProgress(0, 0, 0);
  }, [setStatus, setModelDownloaded, setDownloadProgress]);

  return {
    status,
    downloadProgress,
    downloadedBytes,
    totalBytes,
    error,
    isModelDownloaded: isModelDownloadedState,
    response,
    checkModel,
    downloadModel,
    loadModel,
    complete,
    completeJSON,
    releaseModel,
    removeModel,
    clearResponse,
    isModelLoaded: !!sharedModel,
    MODEL,
  };
}
