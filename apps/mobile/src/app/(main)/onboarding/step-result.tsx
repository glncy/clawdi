import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";

export default function OnboardingStepResult() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background px-6 py-12 justify-between">
      <View className="flex-1 justify-center items-center">
        <AppText size="3xl" weight="bold" family="headline" className="text-center mb-6">
          You are surviving, {"\n"}not living.
        </AppText>
        <AppText className="text-center text-foreground-500 mb-8">
          Your finances feel scattered, time is slipping away, and your energy is low.
        </AppText>
        <AppText size="2xl" weight="bold" family="headline" className="text-center text-primary mt-8">
          Until now.
        </AppText>
      </View>

      <View className="items-center w-full pb-8">
        <Button
          variant="primary"
          className="w-full h-14 rounded-2xl"
          onPress={() => router.push("/(main)/onboarding/step-questions")}
        >
          <Button.Label>Change Everything</Button.Label>
        </Button>
      </View>
    </View>
  );
}
