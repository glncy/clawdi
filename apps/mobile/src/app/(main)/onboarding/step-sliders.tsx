import React, { useState } from "react";
import { View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/atoms/Text";
import { Button, Slider as HeroSlider } from "heroui-native";
import { Host, Slider as ExpoSlider } from "@expo/ui/swift-ui";

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
          {Platform.OS === "ios" ? (
            <Host style={{ height: 40, width: "100%" }}>
              <ExpoSlider
                value={values[currentSlideIndex]}
                onValueChange={(val) => {
                  const newValues = [...values];
                  newValues[currentSlideIndex] = val;
                  setValues(newValues);
                }}
              />
            </Host>
          ) : (
            <HeroSlider
              value={values[currentSlideIndex]}
              onChange={(val) => {
                const newValues = [...values];
                newValues[currentSlideIndex] = Array.isArray(val) ? val[0] : val;
                setValues(newValues);
              }}
            />
          )}
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
