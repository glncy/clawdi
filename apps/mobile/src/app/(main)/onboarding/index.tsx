import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useLocalAI } from "@/hooks/useLocalAI";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { Brain } from "phosphor-react-native";

export default function OnboardingIndex() {
  const router = useRouter();
  const { downloadModel, downloadProgress, isModelDownloaded } = useLocalAI();

  useEffect(() => {
    // Start downloading the model silently in the background
    if (!isModelDownloaded) {
      downloadModel();
    }
  }, [isModelDownloaded, downloadModel]);

  const percentage = Math.round(downloadProgress * 100);

  return (
    <View className="flex-1 bg-background px-6 py-12 justify-between">
      <View className="flex-1 justify-center items-center">
        <AppText size="3xl" weight="bold" family="headline" className="text-center mb-4">
          Be honest with yourself for 60 seconds
        </AppText>
        <AppText className="text-center text-foreground-500 mb-8">
          Finance is your foundation. Life is your goal.
          We need to know where you stand today.
        </AppText>
      </View>

      <View className="items-center w-full pb-8">
        <Button
          variant="primary"
          className="w-full mb-4 h-14 rounded-2xl"
          onPress={() => router.push("/(main)/onboarding/step-sliders")}
        >
          <Button.Label>Start the Mirror</Button.Label>
        </Button>

        {/* Small disclaimer about AI model */}
        <View className="flex-row items-center gap-2 mt-4 px-4 py-3 bg-surface rounded-xl">
          <PhosphorIcon icon={Brain} size={16} />
          <View className="flex-1">
            <AppText size="xs" className="text-foreground-500">
              Setting up your on-device AI. No cloud, full privacy.
            </AppText>
            {!isModelDownloaded && percentage > 0 && (
              <View className="w-full h-1 bg-border rounded-full mt-2 overflow-hidden">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </View>
            )}
            {isModelDownloaded && (
              <AppText size="xs" className="text-primary mt-1">
                Setup complete.
              </AppText>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
