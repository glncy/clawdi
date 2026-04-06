import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { User } from "phosphor-react-native";
import { Button, Input } from "heroui-native";
import { useOnboarding } from "./_layout";
import { AIDownloadStatus } from "@/components/molecules/AIDownloadStatus";
import { useCSSVariable } from "uniwind";
import { OnboardingHeader } from "./components/OnboardingHeader";
import { useUserStore } from "@/stores/useUserStore";
import {
  KeyboardAvoidingView,
  useKeyboardHandler,
} from "react-native-keyboard-controller";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";

function useFadeIn(delay: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

export default function OnboardingStepName() {
  const router = useRouter();
  const {
    name,
    setName,
    income,
    moneyScore,
    timeScore,
    healthScore,
    peopleScore,
    mindScore,
    savingGoals,
    struggles,
  } = useOnboarding();
  const setUserData = useUserStore((s) => s.setUserData);
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  // Keyboard-driven status visibility
  const statusOpacity = useSharedValue(1);
  const statusHeight = useSharedValue(48);

  useKeyboardHandler({
    onStart: (e) => {
      "worklet";
      if (e.progress === 1) {
        statusOpacity.value = withTiming(0, { duration: 200 });
        statusHeight.value = withTiming(0, { duration: 250 });
      }
    },
    onEnd: (e) => {
      "worklet";
      if (e.progress === 0) {
        statusHeight.value = withTiming(48, { duration: 300 });
        statusOpacity.value = withTiming(1, { duration: 300 });
      }
    },
  });

  const statusAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
    height: statusHeight.value,
    overflow: "hidden" as const,
  }));

  const iconStyle = useFadeIn(0);
  const headlineStyle = useFadeIn(100);
  const inputStyle = useFadeIn(200);
  const buttonStyle = useFadeIn(300);

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <View className="flex-1 bg-background justify-between">
        <View className="flex-1">
          <OnboardingHeader
            phase="Your Setup"
            label="Profile"
            icon={User}
            progress={1}
            currentStep={2}
            totalSteps={2}
          />

          {/* Content */}
          <View className="flex-1 justify-center items-center px-6">
            <Animated.View style={iconStyle} className="mb-6">
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
                <PhosphorIcon
                  icon={User}
                  weight="duotone"
                  size={32}
                  color={primaryColor as string}
                />
              </View>
            </Animated.View>

            <Animated.View style={headlineStyle} className="items-center mb-2">
              <AppText
                size="2xl"
                weight="bold"
                family="headline"
                align="center"
              >
                What should we call you?
              </AppText>
            </Animated.View>

            <Animated.View style={headlineStyle} className="items-center mb-8">
              <AppText align="center" color="muted">
                So clawdi can greet you each morning.
              </AppText>
            </Animated.View>

            <Animated.View style={inputStyle} className="w-full">
              <Input
                value={name}
                onChangeText={(text: string) => setName(text)}
                placeholder="Your name"
                autoCapitalize="words"
                className="text-center text-lg h-16"
              />
            </Animated.View>
          </View>
        </View>

        {/* Bottom section */}
        <Animated.View style={buttonStyle} className="w-full pb-8 pt-4 px-6 gap-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full rounded-xl"
            onPress={() => {
              setUserData({
                name,
                income,
                moneyScore,
                timeScore,
                healthScore,
                peopleScore,
                mindScore,
                savingGoals,
                struggles,
                hasCompletedOnboarding: true,
              });
              router.replace("/(main)/(tabs)/home");
            }}
            isDisabled={!name.trim()}
          >
            <Button.Label>Enter Your Dashboard</Button.Label>
          </Button>
          <Animated.View style={statusAnimatedStyle}>
            <AIDownloadStatus />
          </Animated.View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
