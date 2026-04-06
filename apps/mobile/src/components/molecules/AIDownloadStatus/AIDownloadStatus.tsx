import React from "react";
import { View } from "react-native";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { Brain, CheckCircle } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useLocalAI } from "@/hooks/useLocalAI";

/**
 * Compact AI model download status indicator.
 * Shows a single row with icon, status text, and percentage.
 * Always visible — shows progress during download, "ready" when complete.
 *
 * @level Molecule
 */
export function AIDownloadStatus() {
  const { downloadProgress, isModelDownloaded } = useLocalAI();
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  const percentage = Math.round(downloadProgress * 100);

  return (
    <View className="items-center gap-1 py-2 px-4">
      <View className="flex-row items-center gap-2">
        {isModelDownloaded ? (
          <PhosphorIcon
            icon={CheckCircle}
            weight="fill"
            size={14}
            color={primaryColor as string}
          />
        ) : (
          <PhosphorIcon
            icon={Brain}
            weight="duotone"
            size={14}
            color={primaryColor as string}
          />
        )}
        <AppText size="xs" color="muted">
          {isModelDownloaded
            ? "On-device AI ready"
            : "Setting up on-device AI"}
        </AppText>
        {!isModelDownloaded && percentage > 0 && (
          <AppText size="xs" weight="semibold" family="mono" color="primary">
            {percentage}%
          </AppText>
        )}
      </View>
      {!isModelDownloaded && (
        <AppText size="xs" color="muted" align="center">
          One-time setup, requires internet
        </AppText>
      )}
    </View>
  );
}
