import { useCallback } from "react";
import { streamText } from "ai";
import {
  llama,
  type LlamaLanguageModel,
} from "@react-native-ai/llama";
import { MODEL } from "@/services/localAI";
import { useAIStore } from "@/stores/useAIStore";
import {
  downloadModelResumable,
  pauseModelDownload,
  clearResumeData,
  getLocalModelPath,
  isLocalModelDownloaded,
  deleteLocalModel,
} from "@/services/modelDownloader";

/**
 * Singleton model instance — shared across all hook consumers.
 * Prevents OOM from multiple components each loading a ~900MB model.
 */
let sharedModel: LlamaLanguageModel | null = null;

/**
 * Stream filter that strips thinking blocks from text chunks.
 * Gemma 4 always emits thinking tokens in the raw text stream as large
 * chunks (not single tokens), so the ai-sdk.js switch statement never
 * catches them. We filter here instead.
 *
 * Handles: <|channel>...</channel|> (Gemma 4), <think>...</think> (DeepSeek)
 */
function makeThinkingFilter() {
  const STARTS = ["<|channel>", "<think>"] as const;
  const ENDS: Record<string, string> = {
    "<|channel>": "<channel|>",
    "<think>": "</think>",
  };
  const MAX_LOOKAHEAD = Math.max(...STARTS.map((s) => s.length)) - 1;

  let buf = "";
  let activeEnd: string | null = null; // which end-marker are we looking for

  function process(chunk: string): string {
    buf += chunk;
    let out = "";

    while (buf.length > 0) {
      if (activeEnd) {
        // Inside a thinking block — scan for the end marker
        const idx = buf.indexOf(activeEnd);
        if (idx !== -1) {
          buf = buf.slice(idx + activeEnd.length);
          activeEnd = null;
        } else {
          // Keep last N chars in buffer in case the end marker is split
          const safe = buf.length - activeEnd.length + 1;
          if (safe > 0) buf = buf.slice(safe);
          break;
        }
      } else {
        // Outside a thinking block — find the earliest start marker
        let earliest = -1;
        let earliestStart = "";
        for (const start of STARTS) {
          const idx = buf.indexOf(start);
          if (idx !== -1 && (earliest === -1 || idx < earliest)) {
            earliest = idx;
            earliestStart = start;
          }
        }

        if (earliest !== -1) {
          out += buf.slice(0, earliest);
          buf = buf.slice(earliest + earliestStart.length);
          activeEnd = ENDS[earliestStart];
        } else {
          // No start found — output everything except the lookahead tail
          const safe = buf.length - MAX_LOOKAHEAD;
          if (safe > 0) {
            out += buf.slice(0, safe);
            buf = buf.slice(safe);
          }
          break;
        }
      }
    }

    return out;
  }

  // Call after stream ends to flush remaining lookahead buffer
  function flush(): string {
    const remaining = activeEnd ? "" : buf;
    buf = "";
    return remaining;
  }

  return { filter: process, flush };
}

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
    const exists = await isLocalModelDownloaded(MODEL.id);
    setModelDownloaded(exists);
    return exists;
  }, [setModelDownloaded]);

  const downloadModel = useCallback(async () => {
    // Guard against concurrent downloads
    if (useAIStore.getState().status === "downloading") return;

    setStatus("downloading");
    setDownloadProgress(0, 0, 0);
    setError(null);

    try {
      await downloadModelResumable(MODEL.id, {
        onProgress: (downloaded, total) => {
          const progress = total > 0 ? downloaded / total : 0;
          setDownloadProgress(progress, downloaded, total);
        },
        onComplete: () => {
          const { downloadedBytes } = useAIStore.getState();
          setDownloadProgress(1, downloadedBytes, downloadedBytes);
          setModelDownloaded(true);
          setStatus("idle");
        },
        onError: (msg) => {
          setStatus("idle");
          setError(msg);
        },
      });
    } catch (e) {
      // Only set error if not already handled by onError callback
      if (useAIStore.getState().status === "downloading") {
        const msg = e instanceof Error ? e.message : "Download failed.";
        setStatus("idle");
        setError(msg);
      }
    }
  }, [setStatus, setDownloadProgress, setModelDownloaded, setError]);

  const pauseDownload = useCallback(async () => {
    await pauseModelDownload();
    setStatus("idle");
  }, [setStatus]);

  const loadModel = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      // Unload existing model to prevent memory leaks
      if (sharedModel) {
        console.debug("[useLocalAI.loadModel] Unloading existing model...");
        await sharedModel.unload();
        sharedModel = null;
      }

      const modelPath = getLocalModelPath(MODEL.id);
      console.debug("[useLocalAI.loadModel] Loading model from path:", modelPath);

      const model = llama.languageModel(modelPath, {
        contextParams: {
          // Keep GPU layers low to avoid OOM on larger models.
          // 0 = CPU only (safe for all devices).
          // Increase for high-end devices once confirmed stable.
          n_gpu_layers: 0,
        },
      });

      console.debug("[useLocalAI.loadModel] Calling model.prepare()...");

      // Race prepare() against a 60s timeout so we fail loudly
      // instead of hanging forever on OOM or unsupported arch.
      await Promise.race([
        model.prepare(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("model.prepare() timed out after 60s")),
            60_000
          )
        ),
      ]);

      console.debug("[useLocalAI.loadModel] Model ready.");
      sharedModel = model;
      setStatus("ready");
    } catch (e) {
      const msg = e instanceof Error
        ? `Load failed: ${e.message}`
        : `Load failed: ${String(e)}`;
      console.error("[useLocalAI.loadModel] Load failed:", msg);
      setStatus("idle");
      setError(msg);
    }
  }, [setStatus, setError]);

  const complete = useCallback(
    async (userMessage: string, systemPrompt?: string, filterThinking = true) => {
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
          temperature: 0.7,
        });

        // Strip thinking blocks (e.g. <|channel>...</channel|> for Gemma 4)
        // from the raw text stream. Enabled by default.
        const thinkingFilter = filterThinking ? makeThinkingFilter() : null;

        let fullText = "";
        for await (const chunk of textStream) {
          const text = thinkingFilter ? thinkingFilter.filter(chunk) : chunk;
          fullText += text;
          if (text) appendResponse(text);
        }

        // Flush lookahead buffer — prevents last ~9 chars being silently dropped
        if (thinkingFilter) {
          const tail = thinkingFilter.flush();
          if (tail) {
            fullText += tail;
            appendResponse(tail);
          }
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
      systemPrompt: string,
      filterThinking = true
    ): Promise<T | null> => {
      const result = await complete(userMessage, systemPrompt, filterThinking);
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
    deleteLocalModel(MODEL.id);
    clearResumeData();
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
    pauseDownload,
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
