import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useLocalAI } from "@/hooks/useLocalAI";

/**
 * Background model download manager.
 * - Starts download on mount if model isn't downloaded
 * - Pauses on app background, resumes on app foreground
 * - Runs at the root level so it persists across all screens
 *
 * UI is handled separately by AIDownloadStatus component placed in individual screens.
 */
export function AIModelDownloadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    downloadModel,
    pauseDownload,
    isModelDownloaded,
    status,
    checkModel,
  } = useLocalAI();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const hasStartedRef = useRef(false);

  // Check model on mount and start download if needed
  useEffect(() => {
    let mounted = true;

    async function init() {
      const exists = await checkModel();
      if (!exists && mounted && !hasStartedRef.current) {
        hasStartedRef.current = true;
        downloadModel();
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [checkModel, downloadModel]);

  // Pause on background, resume on foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const prev = appStateRef.current;
        appStateRef.current = nextState;

        if (prev === "active" && nextState.match(/inactive|background/)) {
          if (status === "downloading") {
            pauseDownload();
          }
        } else if (
          prev.match(/inactive|background/) &&
          nextState === "active"
        ) {
          if (!isModelDownloaded && status !== "downloading") {
            downloadModel();
          }
        }
      }
    );

    return () => subscription.remove();
  }, [status, isModelDownloaded, downloadModel, pauseDownload]);

  return <>{children}</>;
}
