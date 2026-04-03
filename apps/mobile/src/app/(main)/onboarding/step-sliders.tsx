import React, { useState } from "react";
import { View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { Button, Card, Slider as HeroSlider } from "heroui-native";
import { useOnboarding } from "./_layout";
import { Host, Slider as ExpoSlider } from "@expo/ui/swift-ui";

const SLIDES = [
  { id: "money", emoji: "💰", label: "Finances", question: "How do you feel about your finances right now?", min: "Stressed", max: "Secure" },
  { id: "time", emoji: "⏰", label: "Time", question: "Do you feel like you control your own time?", min: "Overwhelmed", max: "In control" },
  { id: "health", emoji: "💪", label: "Health", question: "How is your daily energy and health?", min: "Exhausted", max: "Vibrant" },
  { id: "people", emoji: "👥", label: "Relationships", question: "Are you connected to the people you care about?", min: "Disconnected", max: "Close" },
  { id: "mind", emoji: "🧠", label: "Growth", question: "Are you growing and learning?", min: "Stagnant", max: "Thriving" },
];

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row items-center justify-center gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`rounded-full ${
            i < current
              ? "w-3 h-3 bg-primary"
              : i === current
                ? "w-3.5 h-3.5 bg-primary"
                : "w-3 h-3 border-2 border-border"
          }`}
        />
      ))}
    </View>
  );
}

export default function OnboardingStepSliders() {
  const router = useRouter();
  const { sliderValues, setSliderValues } = useOnboarding();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const currentSlide = SLIDES[currentSlideIndex];
  const currentValue = sliderValues[currentSlideIndex];

  const updateValue = (val: number) => {
    const newValues = [...sliderValues];
    newValues[currentSlideIndex] = val;
    setSliderValues(newValues);
  };

  const handleNext = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      router.push("/(main)/onboarding/step-result");
    }
  };

  const handleBack = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-background px-6 pt-16 pb-12">
      {/* Step dots */}
      <StepDots current={currentSlideIndex} total={SLIDES.length} />

      {/* Domain chip */}
      <View className="items-center mt-8 mb-6">
        <View className="flex-row items-center gap-2 bg-primary/10 rounded-full px-5 py-2.5">
          <AppText size="base">{currentSlide.emoji}</AppText>
          <AppText size="sm" weight="semibold" color="primary">
            {currentSlide.label}
          </AppText>
        </View>
      </View>

      {/* Question */}
      <View className="flex-1 justify-center">
        <AppText
          size="2xl"
          weight="bold"
          family="headline"
          align="center"
          className="mb-10"
        >
          {currentSlide.question}
        </AppText>

        {/* Slider card */}
        <Card className="bg-surface rounded-2xl mx-2">
          <Card.Body className="p-6 gap-4">
            {/* Current value */}
            <View className="items-center">
              <AppText size="3xl" weight="bold" family="mono" color="primary">
                {Math.round(currentValue)}
              </AppText>
            </View>

            {/* Slider — native SwiftUI on iOS, HeroUI on Android */}
            {Platform.OS === "ios" ? (
              <Host
                matchContents
                style={{ minHeight: 44, width: "100%" }}
              >
                <ExpoSlider
                  value={currentValue}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val: number) => updateValue(val)}
                />
              </Host>
            ) : (
              <HeroSlider
                value={currentValue}
                onChange={(val: number | number[]) => {
                  updateValue(Array.isArray(val) ? val[0] : val);
                }}
              />
            )}

            {/* Min/Max labels */}
            <View className="flex-row justify-between">
              <AppText size="sm" weight="medium" color="muted">
                {currentSlide.min}
              </AppText>
              <AppText size="sm" weight="medium" color="muted">
                {currentSlide.max}
              </AppText>
            </View>
          </Card.Body>
        </Card>
      </View>

      {/* Navigation */}
      <View className="flex-row justify-between gap-4 mt-6">
        <Button
          variant="tertiary"
          className="flex-1 h-14 rounded-2xl"
          onPress={handleBack}
        >
          <Button.Label>Back</Button.Label>
        </Button>
        <Button
          variant="primary"
          className="flex-1 h-14 rounded-2xl"
          onPress={handleNext}
        >
          <Button.Label>
            {currentSlideIndex === SLIDES.length - 1 ? "See Results" : "Next"}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
