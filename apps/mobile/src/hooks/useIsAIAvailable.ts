import { useAIStore } from "@/stores/useAIStore";

/**
 * Returns true when the local AI model is downloaded or in any active state
 * (downloading, loading, ready, inferring).
 * Returns false only when the model has never been downloaded.
 */
export function useIsAIAvailable(): boolean {
  const isModelDownloaded = useAIStore((s) => s.isModelDownloaded);
  const status = useAIStore((s) => s.status);

  return (
    isModelDownloaded ||
    status === "downloading" ||
    status === "loading" ||
    status === "ready" ||
    status === "inferring"
  );
}
