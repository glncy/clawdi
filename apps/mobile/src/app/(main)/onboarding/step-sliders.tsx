import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { Slider } from "@react-native-community/slider";
import { useActiveColorScheme } from "@/providers/ActiveColorSchemeProvider";

const SLIDES = [
  {
    id: "money",
    question: "How do you feel about your finances right now?",
    minLabel: "Stressed",
    maxLabel: "Secure",
  },
  {
    id: "time",
    question: "Do you feel like you control your own time?",
    minLabel: "Overwhelmed",
    maxLabel: "In control",
  },
  {
    id: "health",
    question: "How is your daily energy and health?",
    minLabel: "Exhausted",
    maxLabel: "Vibrant",
  },
  {
    id: "people",
    question: "Are you connected to the people you care about?",
    minLabel: "Disconnected",
    maxLabel: "Close",
  },
  {
    id: "mind",
    question: "Are you growing and learning?",
    minLabel: "Stagnant",
    maxLabel: "Thriving",
  },
];

export default function OnboardingStepSliders() {
  const router = useRouter();
  const { activeColorScheme } = useActiveColorScheme();
  const isDark = activeColorScheme === "dark";

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  // Store values between 0 and 100
  const [values, setValues] = useState<number[]>(Array(SLIDES.length).fill(50));

  const currentSlide = SLIDES[currentSlideIndex];

  const handleNext = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      router.push("/(main)/onboarding/step-result");
    }
  };

  const handleBack = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-background px-6 pt-16 pb-12">
      {/* Progress Bar */}
      <View className="w-full h-1 bg-border rounded-full mb-12 overflow-hidden">
        <View
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentSlideIndex + 1) / SLIDES.length) * 100}%` }}
        />
      </View>

      <View className="flex-1 justify-center pb-20">
        <Text variant="h2" className="text-center mb-16">
          {currentSlide.question}
        </Text>

        <View className="px-4">
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={100}
            value={values[currentSlideIndex]}
            onValueChange={(val) => {
              const newValues = [...values];
              newValues[currentSlideIndex] = val;
              setValues(newValues);
            }}
            minimumTrackTintColor={isDark ? "#ffffff" : "#000000"}
            maximumTrackTintColor={isDark ? "#333333" : "#e5e5e5"}
            thumbTintColor={isDark ? "#ffffff" : "#000000"}
          />
          <View className="flex-row justify-between mt-4">
            <Text variant="caption" className="text-foreground-500 font-medium">
              {currentSlide.minLabel}
            </Text>
            <Text variant="caption" className="text-foreground-500 font-medium">
              {currentSlide.maxLabel}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between gap-4">
        <Button
          variant="flat"
          className="flex-1 h-14 rounded-2xl bg-surface"
          onPress={handleBack}
        >
          <Text variant="body" className="font-bold text-foreground">
            Back
          </Text>
        </Button>
        <Button
          color="primary"
          className="flex-1 h-14 rounded-2xl"
          onPress={handleNext}
        >
          <Text variant="body" className="font-bold text-white">
            {currentSlideIndex === SLIDES.length - 1 ? "See Results" : "Next"}
          </Text>
        </Button>
      </View>
    </View>
  );
}
