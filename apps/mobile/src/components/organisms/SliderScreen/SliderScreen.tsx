import React, { type ComponentType } from "react";
import { View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { Button, Slider as HeroSlider } from "heroui-native";
import { useOnboarding } from "@/app/(main)/onboarding/_layout";
import { useActiveColorScheme } from "@/providers/ActiveColorSchemeProvider";
import { Host, Slider as ExpoSlider } from "@expo/ui/swift-ui";
import { AIDownloadStatus } from "@/components/molecules/AIDownloadStatus";
import type { IconProps } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";

interface SliderScreenProps {
  /** Index in the sliderValues array (0-4) */
  index: number;
  /** Phosphor icon component for the domain chip */
  icon: ComponentType<IconProps>;
  /** Domain label shown in the chip */
  label: string;
  /** Question text */
  question: string;
  /** Label at slider minimum */
  minLabel: string;
  /** Label at slider maximum */
  maxLabel: string;
  /** Total number of slider steps */
  total: number;
  /** Route to push on "Next", or undefined for last step */
  nextRoute?: string;
  /** Route for "See Results" on last step */
  resultsRoute?: string;
}

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

/**
 * Reusable slider screen for onboarding domain questions.
 * Each domain gets its own route file that renders this component.
 *
 * @level Organism
 */
export function SliderScreen({
  index,
  icon,
  label,
  question,
  minLabel,
  maxLabel,
  total,
  nextRoute,
  resultsRoute,
}: SliderScreenProps) {
  const router = useRouter();
  const { sliderValues, setSliderValues } = useOnboarding();
  const { activeColorScheme } = useActiveColorScheme();
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  const currentValue = sliderValues[index];

  const updateValue = (val: number) => {
    const newValues = [...sliderValues];
    newValues[index] = val;
    setSliderValues(newValues);
  };

  const handleNext = () => {
    if (nextRoute) {
      router.push(nextRoute as any);
    } else if (resultsRoute) {
      router.push(resultsRoute as any);
    }
  };

  return (
    <View className="flex-1 bg-background px-6 justify-between">
      {/* Top content */}
      <View className="flex-1 pt-16">
        {/* Step dots */}
        <StepDots current={index} total={total} />

        {/* Domain chip */}
        <View className="items-center mt-8 mb-6">
          <View className="flex-row items-center gap-2 bg-primary/10 rounded-full px-5 py-2.5">
            <PhosphorIcon icon={icon} size={18} color={primaryColor as string} />
            <AppText size="sm" weight="semibold" color="primary">
              {label}
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
            {question}
          </AppText>

          {/* Slider area */}
          <View className="bg-surface rounded-2xl mx-2 p-6" style={{ overflow: "hidden" }}>
            {/* Current value */}
            <View className="items-center mb-4">
              <AppText size="3xl" weight="bold" family="mono" color="primary">
                {Math.round(currentValue)}
              </AppText>
            </View>

            {/* Slider */}
            <View className="mb-4">
              {Platform.OS === "ios" ? (
                <Host matchContents colorScheme={activeColorScheme}>
                  <ExpoSlider
                    value={currentValue}
                    min={0}
                    max={100}
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
            </View>

            {/* Min/Max labels */}
            <View className="flex-row justify-between">
              <AppText size="sm" weight="medium" color="muted">
                {minLabel}
              </AppText>
              <AppText size="sm" weight="medium" color="muted">
                {maxLabel}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom section — pinned */}
      <View className="w-full pb-8 pt-4 gap-3">
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
