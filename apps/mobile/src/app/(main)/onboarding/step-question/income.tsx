import React, { useEffect, useMemo, useRef } from "react";
import { View, ScrollView, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppText } from "@/components/atoms/Text";
import { CurrencyDollar } from "phosphor-react-native";
import { Button, Input } from "heroui-native";
import { AIDownloadStatus } from "@/components/molecules/AIDownloadStatus";
import { useOnboarding } from "../_layout";
import {
  KeyboardAvoidingView,
  useKeyboardHandler,
} from "react-native-keyboard-controller";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { OnboardingHeader } from "../components/OnboardingHeader";
import * as Localization from "expo-localization";

// --- Schema ---

const incomeSchema = z.object({
  income: z
    .string()
    .min(1, "Required")
    .regex(/^\d+(\.\d{0,2})?$/, "Enter a valid amount"),
});

type IncomeForm = z.infer<typeof incomeSchema>;

// --- Screen ---

export default function QuestionIncome() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { income, setIncome } = useOnboarding();
  const currencySymbol = useMemo(() => {
    return Localization.getLocales()[0]?.currencySymbol ?? "$";
  }, []);

  // Scroll to top
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { income },
    mode: "onChange",
  });

  const onSubmit = (data: IncomeForm) => {
    Keyboard.dismiss();
    setIncome(data.income);
    router.push("/(main)/onboarding/step-question/saving-goal");
  };

  // Keyboard-driven AI status visibility
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

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <View className="flex-1 bg-background justify-between">
        <View className="flex-1">
          <OnboardingHeader
            phase="Finances & Goals"
            label="Finances"
            icon={CurrencyDollar}
            progress={1 / 3}
            currentStep={1}
            totalSteps={3}
          />

          {/* Fixed Header */}
          <View className="px-6 pb-6">
            <AppText
              size="2xl"
              weight="bold"
              family="headline"
              align="center"
            >
              What is your monthly income?
            </AppText>
          </View>

          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-6"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-6">
              <Controller
                control={control}
                name="income"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={(text: string) => {
                      onChange(text);
                      setIncome(text);
                    }}
                    keyboardType="decimal-pad"
                    placeholder={`${currencySymbol} 0.00`}
                    className="text-center text-lg h-16"
                    isInvalid={!!errors.income}
                  />
                )}
              />
              {errors.income && (
                <AppText
                  size="xs"
                  color="danger"
                  align="center"
                  className="mt-2"
                >
                  {errors.income.message}
                </AppText>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Bottom section */}
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
              onPress={handleSubmit(onSubmit)}
              isDisabled={!isValid}
            >
              <Button.Label>Next</Button.Label>
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
