import React, { useState, useEffect, useRef, type ComponentType } from "react";
import { View, ScrollView, Pressable, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { Button, Card, Input } from "heroui-native";
import { CheckCircle, PencilSimple } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { AIDownloadStatus } from "@/components/molecules/AIDownloadStatus";
import { KeyboardAvoidingView, useKeyboardHandler } from "react-native-keyboard-controller";
import { OnboardingHeader } from "@/app/(main)/onboarding/components/OnboardingHeader";
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

interface QuestionScreenBaseProps {
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
  /** Whether to show "Other" option with text input */
  showOther?: boolean;
  /** Current phase of onboarding */
  phase?: string;
}

// Single select mode
interface QuestionScreenSingleProps extends QuestionScreenBaseProps {
  multiSelect?: false;
  value: string;
  onValueChange: (value: string) => void;
  values?: never;
  onValuesChange?: never;
}

// Multi select mode
interface QuestionScreenMultiProps extends QuestionScreenBaseProps {
  multiSelect: true;
  values: string[];
  onValuesChange: (values: string[]) => void;
  value?: never;
  onValueChange?: never;
}

type QuestionScreenProps = QuestionScreenSingleProps | QuestionScreenMultiProps;

function SelectionCard({
  emoji,
  label,
  isSelected,
  onPress,
  icon,
}: {
  emoji?: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: ComponentType<IconProps>;
}) {
  const [primaryColor] = useCSSVariable(["--color-primary"]);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(isSelected ? 1.02 : 1, {
      duration: 200,
      easing: Easing.out(Easing.back(1.5)),
    });
  }, [isSelected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={animatedStyle}>
        <Card
          className={`rounded-xl ${isSelected ? "bg-primary/10 border-primary/20" : "bg-surface border-transparent"}`}
          style={{ borderWidth: 1 }}
        >
          <Card.Body className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-row items-center gap-3">
              {emoji ? (
                <AppText size="lg">{emoji}</AppText>
              ) : icon ? (
                <PhosphorIcon
                  icon={icon}
                  size={20}
                  color={primaryColor as string}
                />
              ) : null}
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
      </Animated.View>
    </Pressable>
  );
}

/**
 * Reusable question screen for onboarding.
 * Supports text input, single-select, and multi-select with optional "Other" input.
 *
 * @level Organism
 */
export function QuestionScreen(props: QuestionScreenProps) {
  const {
    index,
    total,
    icon,
    label,
    question,
    nextRoute,
    isLast,
    inputProps,
    options,
    multiSelect,
    showOther,
    phase = "Finances & Goals",
  } = props;

  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [primaryColor] = useCSSVariable(["--color-primary"]);
  const [otherText, setOtherText] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const statusOpacity = useSharedValue(1);
  const statusHeight = useSharedValue(48);

  // Scroll to top when index changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, [index]);

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

  // Selection handlers
  const handleSelect = (optionLabel: string) => {
    if (multiSelect && props.onValuesChange) {
      const current = props.values;
      if (current.includes(optionLabel)) {
        props.onValuesChange(current.filter((v) => v !== optionLabel));
      } else {
        props.onValuesChange([...current, optionLabel]);
      }
    } else if (!multiSelect && props.onValueChange) {
      props.onValueChange(optionLabel);
      setIsOtherSelected(false);
      setOtherText("");
    }
  };

  const handleOtherToggle = () => {
    if (isOtherSelected) {
      setIsOtherSelected(false);
      if (multiSelect && props.onValuesChange) {
        props.onValuesChange(props.values.filter((v) => !v.startsWith("Other: ")));
      } else if (!multiSelect && props.onValueChange) {
        props.onValueChange("");
      }
      setOtherText("");
    } else {
      setIsOtherSelected(true);
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (multiSelect && props.onValuesChange) {
      const withoutOther = props.values.filter((v) => !v.startsWith("Other: "));
      if (text.trim()) {
        props.onValuesChange([...withoutOther, `Other: ${text}`]);
      } else {
        props.onValuesChange(withoutOther);
      }
    } else if (!multiSelect && props.onValueChange) {
      props.onValueChange(text.trim() ? `Other: ${text}` : "");
    }
  };

  const isSelected = (optionLabel: string) => {
    if (multiSelect) {
      return props.values.includes(optionLabel);
    }
    return props.value === optionLabel;
  };

  const hasValue = multiSelect
    ? props.values.length > 0
    : !!props.value;

  const handleNext = () => {
    Keyboard.dismiss();
    router.push(nextRoute as any);
  };

  const otherInputStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOtherSelected ? 1 : 0, { duration: 250 }),
    maxHeight: withTiming(isOtherSelected ? 120 : 0, { duration: 250 }),
    marginTop: withTiming(isOtherSelected ? 4 : 0, { duration: 250 }),
    transform: [
      { translateY: withTiming(isOtherSelected ? 0 : -10, { duration: 250 }) },
    ],
  }));

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
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

          {/* Fixed Question Header */}
          <View className="px-6 pb-6">
            <AppText
              size="2xl"
              weight="bold"
              family="headline"
              align="center"
            >
              {question}
            </AppText>
            {multiSelect && (
              <AppText size="xs" color="muted" align="center" className="mt-2">
                Select all that apply
              </AppText>
            )}
          </View>

          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-6"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-6">
              {/* Input mode */}
              {inputProps && !multiSelect && (
                <Input
                  value={props.value}
                  onChangeText={(text: string) => props.onValueChange(text)}
                  keyboardType={inputProps.keyboardType ?? "default"}
                  placeholder={inputProps.placeholder ?? ""}
                  size="lg"
                  className="text-center text-lg h-16"
                />
              )}

              {/* Selection mode */}
              {options && (
                <View className="gap-3">
                  {options.map((opt) => (
                    <SelectionCard
                      key={opt.label}
                      emoji={opt.emoji}
                      label={opt.label}
                      isSelected={isSelected(opt.label)}
                      onPress={() => handleSelect(opt.label)}
                    />
                  ))}

                  {/* Other option */}
                  {showOther && (
                    <>
                      <SelectionCard
                        label="Other"
                        isSelected={isOtherSelected}
                        onPress={handleOtherToggle}
                        icon={PencilSimple}
                      />
                      <Animated.View
                        style={[otherInputStyle, { overflow: "hidden" }]}
                      >
                        <Input
                          value={otherText}
                          onChangeText={handleOtherTextChange}
                          placeholder="Type your answer..."
                          size="lg"
                          className="text-base h-14"
                        />
                      </Animated.View>
                    </>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
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
              isDisabled={!hasValue}
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
