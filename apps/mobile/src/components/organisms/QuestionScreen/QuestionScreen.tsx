import React, { type ComponentType } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { Button, Card, Input } from "heroui-native";
import { CheckCircle } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { AIDownloadStatus } from "@/components/molecules/AIDownloadStatus";
import { KeyboardAvoidingView, useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { IconProps } from "phosphor-react-native";

interface Option {
  label: string;
  emoji: string;
}

interface QuestionScreenProps {
  /** Step index (0-based) for dots */
  index: number;
  /** Total number of question steps */
  total: number;
  /** Phosphor icon for the domain chip */
  icon: ComponentType<IconProps>;
  /** Domain label */
  label: string;
  /** Question text */
  question: string;
  /** Current selected/input value */
  value: string;
  /** Value change handler */
  onValueChange: (value: string) => void;
  /** Route to push on Next */
  nextRoute: string;
  /** Whether this is the last question */
  isLast?: boolean;
  /** For text input mode */
  inputProps?: {
    keyboardType?: "default" | "decimal-pad" | "numeric";
    placeholder?: string;
  };
  /** For selection mode */
  options?: Option[];
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

function SelectionCard({
  emoji,
  label,
  isSelected,
  onPress,
}: {
  emoji: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  return (
    <Pressable onPress={onPress}>
      <Card className={`rounded-xl ${isSelected ? "bg-primary/10" : "bg-surface"}`}>
        <Card.Body className="flex-row items-center justify-between px-4 py-4">
          <View className="flex-row items-center gap-3">
            <AppText size="lg">{emoji}</AppText>
            <AppText weight="medium">{label}</AppText>
          </View>
          {isSelected && (
            <PhosphorIcon
              icon={CheckCircle}
              weight="fill"
              size={24}
              color={primaryColor as string}
            />
          )}
        </Card.Body>
      </Card>
    </Pressable>
  );
}

/**
 * Reusable question screen for onboarding.
 * Supports text input mode (income) and selection mode (saving goal, struggle).
 *
 * @level Organism
 */
export function QuestionScreen({
  index,
  total,
  icon,
  label,
  question,
  value,
  onValueChange,
  nextRoute,
  isLast,
  inputProps,
  options,
}: QuestionScreenProps) {
  const router = useRouter();
  const [primaryColor] = useCSSVariable(["--color-primary"]);
  const statusOpacity = useSharedValue(1);
  const statusHeight = useSharedValue(48);

  useKeyboardHandler({
    onStart: (e) => {
      "worklet";
      if (e.progress === 1) {
        statusOpacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
        statusHeight.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) });
      }
    },
    onEnd: (e) => {
      "worklet";
      if (e.progress === 0) {
        statusHeight.value = withTiming(48, { duration: 300, easing: Easing.out(Easing.ease) });
        statusOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      }
    },
  });

  const statusAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
    height: statusHeight.value,
    overflow: "hidden" as const,
  }));

  const handleNext = () => {
    router.push(nextRoute as any);
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
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

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 40 }}
          >
            <View className="gap-6">
              <AppText
                size="2xl"
                weight="bold"
                family="headline"
                align="center"
              >
                {question}
              </AppText>

              {/* Input mode */}
              {inputProps && (
                <View className="bg-surface rounded-2xl mx-2 p-5">
                  <Input
                    value={value}
                    onChangeText={(text: string) => onValueChange(text)}
                    keyboardType={inputProps.keyboardType ?? "default"}
                    placeholder={inputProps.placeholder ?? ""}
                    autoFocus
                    className="text-center"
                  />
                </View>
              )}

              {/* Selection mode */}
              {options && (
                <View className="gap-3">
                  {options.map((opt) => (
                    <SelectionCard
                      key={opt.label}
                      emoji={opt.emoji}
                      label={opt.label}
                      isSelected={value === opt.label}
                      onPress={() => onValueChange(opt.label)}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
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
              isDisabled={!value}
            >
              <Button.Label>{isLast ? "Finish" : "Next"}</Button.Label>
            </Button>
          </View>
          <Animated.View style={statusAnimatedStyle}>
            <AIDownloadStatus />
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
