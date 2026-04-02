import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/atoms/Text";
import { Button } from "heroui-native";

export default function OnboardingStepResult() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background px-6 py-12 justify-between">
      <View className="flex-1 justify-center items-center">
        <Text variant="h1" className="text-center mb-6">
          You are surviving, {"\n"}not living.
        </Text>
        <Text variant="body" className="text-center text-foreground-500 mb-8">
          Your finances feel scattered, time is slipping away, and your energy is low.
        </Text>
        <Text variant="h2" className="text-center text-primary mt-8">
          Until now.
        </Text>
      </View>

      <View className="items-center w-full pb-8">
        <Button
          color="primary"
          className="w-full h-14 rounded-2xl"
          onPress={() => router.push("/(main)/onboarding/step-questions")}
        >
          <Text variant="body" className="font-bold text-white">
            Change Everything
          </Text>
        </Button>
      </View>
    </View>
  );
}
