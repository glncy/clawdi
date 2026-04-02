import { useCallback, useEffect, useRef, useState } from "react";
import * as Updates from "expo-updates";

const TAP_THRESHOLD = 5;
const TAP_WINDOW_MS = 3000;
const ACTIVE_CHANNEL_PARAM_KEY = "expo-up-active-channel";

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "error" | "success";
}

interface ChannelSurfingState {
  isVisible: boolean;
  isSwitching: boolean;
  activeChannel: string;
  logs: LogEntry[];
}

function createLog(
  message: string,
  type: LogEntry["type"] = "info"
): LogEntry {
  return {
    timestamp: new Date().toLocaleTimeString(),
    message,
    type,
  };
}

export function useChannelSurfing() {
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const [state, setState] = useState<ChannelSurfingState>({
    isVisible: false,
    isSwitching: false,
    activeChannel: "main",
    logs: [],
  });

  // Load persisted channel on mount
  useEffect(() => {
    if (__DEV__) return;

    let mounted = true;
    const loadChannel = async () => {
      try {
        // If the app is recovering from a fatal crash (like a missing native module),
        // we must clear the channel override so it doesn't get stuck in a crash loop
        // attempting to redownload the broken update.
        if (Updates.isEmergencyLaunch) {
          Updates.setUpdateRequestHeadersOverride(null);
          await Updates.setExtraParamAsync(ACTIVE_CHANNEL_PARAM_KEY, "");
          if (mounted) {
            setState((prev) => ({
              ...prev,
              activeChannel: "main",
              isVisible: true, // Show the panel so the user knows what happened
            }));
            addLog("Emergency launch detected. Reverted channel to 'main'.", "error");
          }
          return;
        }

        const extraParams = await Updates.getExtraParamsAsync();
        const persisted = extraParams[ACTIVE_CHANNEL_PARAM_KEY];
        if (mounted && persisted) {
          setState((prev) => ({ ...prev, activeChannel: persisted }));
        }
      } catch {
        // Ignore — keep default "main"
      }
    };
    void loadChannel();
    return () => {
      mounted = false;
    };
  }, [addLog]);

  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      setState((prev) => ({
        ...prev,
        logs: [createLog(message, type), ...prev.logs].slice(0, 50),
      }));
    },
    []
  );

  const handleVersionTap = useCallback(() => {
    const now = Date.now();

    if (now - lastTapRef.current > TAP_WINDOW_MS) {
      tapCountRef.current = 0;
    }

    lastTapRef.current = now;
    tapCountRef.current += 1;

    if (tapCountRef.current >= TAP_THRESHOLD) {
      tapCountRef.current = 0;
      setState((prev) => ({ ...prev, isVisible: !prev.isVisible }));
    }
  }, []);

  const switchChannel = useCallback(
    async (channelName: string) => {
      const trimmed = channelName.trim();

      if (__DEV__) {
        addLog(
          `[DEV] Would switch to "${trimmed || "main"}" — only works in release builds.`,
          "error"
        );
        return;
      }

      setState((prev) => ({ ...prev, isSwitching: true }));
      const isReset = !trimmed || trimmed.toLowerCase() === "main";
      const targetChannel = isReset ? "main" : trimmed;

      addLog(`Switching to channel "${targetChannel}"...`);

      try {
        if (isReset) {
          // Reset to default channel
          Updates.setUpdateRequestHeadersOverride(null);
          await Updates.setExtraParamAsync(ACTIVE_CHANNEL_PARAM_KEY, "");
          addLog("Cleared channel override (back to main).", "info");
        } else {
          // Set channel override + persist it
          Updates.setUpdateRequestHeadersOverride({
            "expo-channel-name": targetChannel,
          });
          await Updates.setExtraParamAsync(
            ACTIVE_CHANNEL_PARAM_KEY,
            targetChannel
          );
          addLog(`Channel header set to "${targetChannel}".`, "info");
        }

        setState((prev) => ({ ...prev, activeChannel: targetChannel }));

        // Check for updates on the new channel
        const { isAvailable } = await Updates.checkForUpdateAsync();
        addLog(
          isAvailable
            ? "Update found. Downloading..."
            : "No update on this channel.",
          isAvailable ? "info" : "info"
        );

        if (isAvailable) {
          await Updates.fetchUpdateAsync();
          addLog("Update downloaded. Reloading...", "success");
          await Updates.reloadAsync({
            reloadScreenOptions: {
              backgroundColor: "#FAFAF9",
              spinner: { enabled: true, size: "large" },
              fade: true,
            },
          });
        } else {
          addLog("No reload needed — already up to date.", "info");
          setState((prev) => ({ ...prev, isSwitching: false }));
        }
      } catch (e) {
        const errorMsg =
          e instanceof Error ? e.message : "Unknown error occurred.";
        addLog(`Failed: ${errorMsg}`, "error");
        setState((prev) => ({ ...prev, isSwitching: false }));
      }
    },
    [addLog]
  );

  const checkForUpdate = useCallback(async () => {
    if (__DEV__) {
      addLog("[DEV] Update check only works in release builds.", "error");
      return;
    }

    setState((prev) => ({ ...prev, isSwitching: true }));
    addLog("Checking for updates on current channel...");

    try {
      const { isAvailable } = await Updates.checkForUpdateAsync();

      if (isAvailable) {
        addLog("Update available. Downloading...", "info");
        await Updates.fetchUpdateAsync();
        addLog("Downloaded. Reloading...", "success");
        await Updates.reloadAsync();
      } else {
        addLog("Already on the latest version.", "success");
      }
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "Unknown error occurred.";
      addLog(`Update check failed: ${errorMsg}`, "error");
    } finally {
      setState((prev) => ({ ...prev, isSwitching: false }));
    }
  }, [addLog]);

  const hidePanel = useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const clearLogs = useCallback(() => {
    setState((prev) => ({ ...prev, logs: [] }));
  }, []);

  return {
    ...state,
    handleVersionTap,
    switchChannel,
    checkForUpdate,
    hidePanel,
    clearLogs,
  };
}
