import React, { useEffect, useMemo } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { CurrencyDollar } from "phosphor-react-native";
import { Button, Input } from "heroui-native";
import { useCSSVariable } from "uniwind";
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

// --- Locale currency detection ---

// Map common locale regions to their currency codes
const REGION_CURRENCY: Record<string, string> = {
  PH: "PHP", US: "USD", GB: "GBP", EU: "EUR", JP: "JPY", KR: "KRW",
  CN: "CNY", IN: "INR", AU: "AUD", CA: "CAD", SG: "SGD", MY: "MYR",
  TH: "THB", ID: "IDR", VN: "VND", BR: "BRL", MX: "MXN", AE: "AED",
  SA: "SAR", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  NZ: "NZD", HK: "HKD", TW: "TWD", ZA: "ZAR", NG: "NGN", KE: "KES",
};

function getCurrencySymbol(): string {
  try {
    // Intl.DateTimeFormat().resolvedOptions().locale gives the actual device locale in Hermes
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split("-").pop()?.toUpperCase() ?? "";
    const currency = REGION_CURRENCY[region] ?? "USD";

    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);

    return parts.find((p) => p.type === "currency")?.value ?? "$";
  } catch {
    return "$";
  }
}

// --- Schema ---

const incomeSchema = z.object({
  income: z
    .string()
    .min(1, "Required")
    .regex(/^\d+(\.\d{0,2})?$/, "Enter a valid amount"),
});

type IncomeForm = z.infer<typeof incomeSchema>;

// --- Step dots ---

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

// --- Screen ---

export default function QuestionIncome() {
  const router = useRouter();
  const { income, setIncome } = useOnboarding();
  const [primaryColor] = useCSSVariable(["--color-primary"]);
  const currencySymbol = useMemo(() => getCurrencySymbol(), []);

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
      <View className="flex-1 bg-background px-6 justify-between">
        <View className="flex-1 pt-16">
          {/* Step dots */}
          <StepDots current={0} total={3} />

          {/* Domain chip */}
          <View className="items-center mt-8 mb-6">
            <View className="flex-row items-center gap-2 bg-primary/10 rounded-full px-5 py-2.5">
              <PhosphorIcon
                icon={CurrencyDollar}
                size={18}
                color={primaryColor as string}
              />
              <AppText size="sm" weight="semibold" color="primary">
                Finances
              </AppText>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingBottom: 40,
            }}
          >
            <View className="gap-6">
              <AppText
                size="2xl"
                weight="bold"
                family="headline"
                align="center"
              >
                What is your monthly income?
              </AppText>

              <View className="bg-surface rounded-2xl mx-2 p-5">
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
                      autoFocus
                      className="text-center"
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
            </View>
          </ScrollView>
        </View>

        {/* Bottom section */}
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
