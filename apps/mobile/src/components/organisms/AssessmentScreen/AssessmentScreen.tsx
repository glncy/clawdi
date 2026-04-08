import React, { type ComponentType } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { AIDownloadStatus } from "@/components/molecules/AIDownloadStatus";
import { OnboardingHeader } from "@/components/molecules/OnboardingHeader";
import type { IconProps } from "phosphor-react-native";

/** Each choice maps to a numeric score value */
interface Choice {
  label: string;
  value: number;
}

interface AssessmentScreenProps {
  /** Index for progress calculation (0-4) */
  index: number;
  /** Current value for the domain */
  value: number | null;
  /** Callback when choice is selected */
  onChange: (val: number) => void;
  /** Phosphor icon component for the domain chip */
  icon: ComponentType<IconProps>;
  /** Domain label shown in the chip */
  label: string;
  /** Question text */
  question: string;
  /** 5 choices from worst to best */
  choices: Choice[];
  /** Total number of slider steps */
  total: number;
  /** Route to push on "Next", or undefined for last step */
  nextRoute?: string;
  /** Route for "See Results" on last step */
  resultsRoute?: string;
  /** Phase label for the header */
  phase?: string;
}

/**
 * Reusable rating screen for onboarding domain questions.
 * Shows 5 tappable choices instead of a numeric slider.
 *
 * @level Organism
 */
export function AssessmentScreen({
  index,
  value,
  onChange,
  icon,
  label,
  question,
  choices,
  total,
  nextRoute,
  resultsRoute,
  phase = "Your Life",
}: AssessmentScreenProps) {
  const router = useRouter();

  const selectChoice = (val: number) => {
    onChange(val);
  };

  const handleNext = () => {
    if (nextRoute) {
      router.push(nextRoute as any);
    } else if (resultsRoute) {
      router.push(resultsRoute as any);
    }
  };

  // Disable Next if user hasn't selected (still null)
  const hasSelected = value !== null && choices.some((c) => c.value === value);

  return (
    <View className="flex-1 bg-background justify-between">
      {/* Top content */}
      <View className="flex-1">
        <OnboardingHeader
          phase={phase}
          label={label}
          icon={icon}
          progress={(index + 1) / total}
          currentStep={index + 1}
          totalSteps={total}
        />

        {/* Question */}
        <View className="flex-1 justify-center px-6">
          <AppText
            size="2xl"
            weight="bold"
            family="headline"
            align="center"
            className="mb-8"
          >
            {question}
          </AppText>

          {/* Choices */}
          <View className="gap-3">
            {choices.map((choice) => {
              const isSelected = value === choice.value;
              return (
                <Pressable key={choice.value} onPress={() => selectChoice(choice.value)}>
                  <View
                    className={`rounded-2xl px-5 py-4 flex-row items-center justify-between ${
                      isSelected ? "bg-primary/10" : "bg-surface"
                    }`}
                  >
                    <AppText
                      weight={isSelected ? "semibold" : "medium"}
                      color={isSelected ? "primary" : undefined}
                    >
                      {choice.label}
                    </AppText>
                    {isSelected && (
                      <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                        <View className="w-2 h-2 rounded-full bg-background" />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Bottom section — pinned */}
      <View className="w-full pb-8 pt-4 px-6 gap-3">
        <View className="flex-row justify-between gap-4">
          <Button
            variant="tertiary"
            className="flex-1 h-14 rounded-2xl"
            onPress={() => router.back()}
          >
            <Button.Label>Back</Button.Label>
          </Button>
          <Button
            variant="primary"
            className="flex-1 h-14 rounded-2xl"
            onPress={handleNext}
            isDisabled={!hasSelected}
          >
            <Button.Label>
              {resultsRoute && !nextRoute ? "See Results" : "Next"}
            </Button.Label>
          </Button>
        </View>
        <AIDownloadStatus />
      </View>
    </View>
  );
}
