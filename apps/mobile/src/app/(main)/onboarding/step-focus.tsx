import React, { useEffect, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import {
  CurrencyDollar,
  Clock,
  Heartbeat,
  UsersThree,
  Brain,
  Target,
  CheckCircle,
  Wallet,
  PiggyBank,
  Lightning,
} from "phosphor-react-native";
import { Button } from "heroui-native";
import { useOnboarding } from "./_layout";
import { AIDownloadStatus } from "@/components/molecules/AIDownloadStatus";
import { useCSSVariable } from "uniwind";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { ComponentType } from "react";
import type { IconProps } from "phosphor-react-native";

// --- Domain config ---

interface DomainMeta {
  label: string;
  icon: ComponentType<IconProps>;
  getDescription: (value: number) => string;
}

const DOMAIN_META: DomainMeta[] = [
  {
    label: "Finances",
    icon: CurrencyDollar,
    getDescription: (v) =>
      v < 30
        ? "Your finances feel stressful — we'll build a plan"
        : "Your finances need some attention",
  },
  {
    label: "Time",
    icon: Clock,
    getDescription: (v) =>
      v < 30
        ? "Time feels out of control — let's get intentional"
        : "Your time management could improve",
  },
  {
    label: "Health",
    icon: Heartbeat,
    getDescription: (v) =>
      v < 30
        ? "Your energy is low — small habits will help"
        : "Your health needs a bit more care",
  },
  {
    label: "Relationships",
    icon: UsersThree,
    getDescription: (v) =>
      v < 30
        ? "You feel disconnected — we'll help you stay close"
        : "Your relationships could use more nurturing",
  },
  {
    label: "Growth",
    icon: Brain,
    getDescription: (v) =>
      v < 30
        ? "Growth feels stagnant — let's change that"
        : "You're ready to grow more",
  },
];

// --- Animation hook ---

function useFadeIn(delay: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }),
    );
  }, [delay, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// --- Saving goal mapping ---

const SAVING_GOAL_LABELS: Record<string, string> = {
  "Emergency Fund": "Build your emergency fund",
  Travel: "Save for your dream trip",
  House: "Work toward your own home",
  "Debt Payoff": "Get out of debt",
};

// --- Struggle mapping ---

const STRUGGLE_LABELS: Record<string, string> = {
  "Saving money": "Get better at saving",
  "Sleeping well": "Improve your sleep routine",
  "Staying focused": "Build focus habits",
  "Finding time": "Take back control of your time",
};

// --- Screen ---

export default function OnboardingStepFocus() {
  const router = useRouter();
  const { sliderValues, income, savingGoal, struggle } = useOnboarding();
  const [primaryColor, mutedColor, warningColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
    "--color-warning",
  ]);

  // Domains below 50 are focus areas
  const focusAreas = useMemo(
    () =>
      DOMAIN_META.map((d, i) => ({
        ...d,
        index: i,
        value: sliderValues[i],
      })).filter((d) => d.value < 50),
    [sliderValues],
  );

  const strongAreas = useMemo(
    () =>
      DOMAIN_META.map((d, i) => ({
        ...d,
        index: i,
        value: sliderValues[i],
      })).filter((d) => d.value >= 50),
    [sliderValues],
  );

  // Action items derived from onboarding answers
  const actionItems = useMemo(() => {
    const items: { icon: ComponentType<IconProps>; text: string }[] = [];

    if (income) {
      const monthlyIncome = parseFloat(income);
      if (!isNaN(monthlyIncome) && monthlyIncome > 0) {
        const dailyBudget = Math.round(monthlyIncome / 30);
        items.push({
          icon: Wallet,
          text: `Daily budget: ~${dailyBudget.toLocaleString()} per day`,
        });
      }
    }

    if (savingGoal && SAVING_GOAL_LABELS[savingGoal]) {
      items.push({
        icon: PiggyBank,
        text: SAVING_GOAL_LABELS[savingGoal],
      });
    }

    if (struggle && STRUGGLE_LABELS[struggle]) {
      items.push({
        icon: Lightning,
        text: STRUGGLE_LABELS[struggle],
      });
    }

    return items;
  }, [income, savingGoal, struggle]);

  const headerStyle = useFadeIn(200);
  const focusStyle = useFadeIn(600);
  const actionsStyle = useFadeIn(1000);
  const strongStyle = useFadeIn(1400);
  const textStyle = useFadeIn(1800);
  const buttonStyle = useFadeIn(2200);

  return (
    <View className="flex-1 bg-background px-6 justify-between">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pt-20 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={headerStyle} className="items-center mb-4">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
            <PhosphorIcon
              icon={Target}
              weight="duotone"
              size={32}
              color={primaryColor as string}
            />
          </View>
          <AppText
            size="2xl"
            weight="bold"
            family="headline"
            align="center"
            className="mb-2"
          >
            {focusAreas.length > 0
              ? "Here\u2019s what we\u2019ll focus on"
              : "You\u2019re in great shape"}
          </AppText>
          <AppText align="center" color="muted" className="px-4">
            {focusAreas.length > 0
              ? "Based on what you told us, these areas need the most attention."
              : "All your domains look healthy. Let\u2019s keep it that way."}
          </AppText>
        </Animated.View>

        {/* Focus areas */}
        {focusAreas.length > 0 && (
          <Animated.View style={focusStyle} className="mt-6 gap-3">
            <AppText size="xs" color="muted" weight="semibold" className="px-1">
              Focus areas
            </AppText>
            {focusAreas.map((domain) => (
              <View
                key={domain.label}
                className="flex-row items-center gap-4 bg-primary/10 rounded-2xl px-5 py-4"
              >
                <PhosphorIcon
                  icon={domain.icon}
                  weight="duotone"
                  size={28}
                  color={primaryColor as string}
                />
                <View className="flex-1">
                  <AppText weight="semibold">{domain.label}</AppText>
                  <AppText size="xs" color="muted">
                    {domain.getDescription(domain.value)}
                  </AppText>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Action items from questions */}
        {actionItems.length > 0 && (
          <Animated.View style={actionsStyle} className="mt-6 gap-3">
            <AppText size="xs" color="muted" weight="semibold" className="px-1">
              Your plan
            </AppText>
            {actionItems.map((item, i) => (
              <View
                key={i}
                className="flex-row items-center gap-4 bg-surface rounded-2xl px-5 py-4"
              >
                <PhosphorIcon
                  icon={item.icon}
                  weight="duotone"
                  size={24}
                  color={warningColor as string}
                />
                <AppText size="sm">{item.text}</AppText>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Strong areas */}
        {strongAreas.length > 0 && (
          <Animated.View style={strongStyle} className="mt-6 gap-3">
            <AppText size="xs" color="muted" weight="semibold" className="px-1">
              {focusAreas.length > 0 ? "Looking good" : "Your strengths"}
            </AppText>
            {strongAreas.map((domain) => (
              <View
                key={domain.label}
                className="flex-row items-center gap-4 bg-surface rounded-2xl px-5 py-3"
              >
                <PhosphorIcon
                  icon={domain.icon}
                  weight="regular"
                  size={22}
                  color={mutedColor as string}
                />
                <AppText size="sm" color="muted" className="flex-1">
                  {domain.label}
                </AppText>
                <PhosphorIcon
                  icon={CheckCircle}
                  weight="fill"
                  size={18}
                  color={primaryColor as string}
                />
              </View>
            ))}
          </Animated.View>
        )}

        {/* Motivational text */}
        <Animated.View style={textStyle} className="mt-8">
          <AppText
            align="center"
            color="muted"
            family="headline"
            className="px-4"
          >
            clawdi will help you build better habits{"\n"}
            one day at a time.
          </AppText>
        </Animated.View>
      </ScrollView>

      {/* Bottom section */}
      <Animated.View style={buttonStyle} className="w-full pb-8 pt-4 gap-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-2xl"
          onPress={() => router.push("/(main)/onboarding/step-name")}
        >
          <Button.Label>Continue</Button.Label>
        </Button>
        <AIDownloadStatus />
      </Animated.View>
    </View>
  );
}
