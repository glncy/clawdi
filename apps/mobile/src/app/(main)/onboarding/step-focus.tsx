import React, { useEffect, useRef } from "react";
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
import { OnboardingHeader } from "@/components/molecules/OnboardingHeader";
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
      v < 3
        ? "Your finances feel stressful — we'll build a plan"
        : "Your finances need some attention",
  },
  {
    label: "Time",
    icon: Clock,
    getDescription: (v) =>
      v < 3
        ? "Time feels out of control — let's get intentional"
        : "Your time management could improve",
  },
  {
    label: "Health",
    icon: Heartbeat,
    getDescription: (v) =>
      v < 3
        ? "Your energy is low — small habits will help"
        : "Your health needs a bit more care",
  },
  {
    label: "Relationships",
    icon: UsersThree,
    getDescription: (v) =>
      v < 3
        ? "You feel disconnected — we'll help you stay close"
        : "Your relationships could use more nurturing",
  },
  {
    label: "Growth",
    icon: Brain,
    getDescription: (v) =>
      v < 3
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
      withTiming(1, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// --- Screen ---

export default function OnboardingStepFocus() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { 
    moneyScore, 
    timeScore, 
    healthScore, 
    peopleScore, 
    mindScore, 
    income, 
    savingGoals, 
    struggles 
  } = useOnboarding();
  const [primaryColor, mutedColor, warningColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
    "--color-warning",
  ]);

  // Scroll to top
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const domainValues = [
    { ...DOMAIN_META[0], value: moneyScore ?? 0 },
    { ...DOMAIN_META[1], value: timeScore ?? 0 },
    { ...DOMAIN_META[2], value: healthScore ?? 0 },
    { ...DOMAIN_META[3], value: peopleScore ?? 0 },
    { ...DOMAIN_META[4], value: mindScore ?? 0 },
  ];

  // Domains below 3 are focus areas
  const focusAreas = domainValues.filter((d) => d.value > 0 && d.value < 3);
  const strongAreas = domainValues.filter((d) => d.value >= 3);

  // Action items derived from onboarding answers
  const actionItems = (() => {
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

    if (savingGoals.length > 0) {
      const goals = savingGoals.map((g) =>
        g.startsWith("Other: ") ? g.replace("Other: ", "").trim() : g
      );
      
      let text = "";
      if (goals.length === 1) {
        text = `Save for: ${goals[0]}`;
      } else if (goals.length === 2) {
        text = `Save for: ${goals.join(" and ")}`;
      } else {
        const last = goals.pop();
        text = `Save for: ${goals.join(", ")}, and ${last}`;
      }
      items.push({ icon: PiggyBank, text });
    }

    if (struggles.length > 0) {
      const formattedStruggles = struggles.map((s) => {
        if (s.startsWith("Other: ")) return s.replace("Other: ", "").trim();
        return s.toLowerCase();
      });
      
      let text = "";
      if (formattedStruggles.length === 1) {
        text = `Focus on: ${formattedStruggles[0]}`;
      } else if (formattedStruggles.length === 2) {
        text = `Focus on: ${formattedStruggles.join(" and ")}`;
      } else {
        const last = formattedStruggles.pop();
        text = `Focus on: ${formattedStruggles.join(", ")}, and ${last}`;
      }
      items.push({ icon: Lightning, text });
    }

    return items;
  })();

  const headerStyle = useFadeIn(0);
  const focusStyle = useFadeIn(150);
  const actionsStyle = useFadeIn(300);
  const strongStyle = useFadeIn(450);
  const textStyle = useFadeIn(600);
  const buttonStyle = useFadeIn(750);

  return (
    <View className="flex-1 bg-background justify-between">
      <View className="flex-1">
        <OnboardingHeader
          phase="Your Setup"
          label="Plan"
          icon={Target}
          progress={0.5}
          currentStep={1}
          totalSteps={2}
        />

        {/* Fixed Header */}
        <Animated.View style={headerStyle} className="items-center px-6 pb-6">
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

        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Focus areas */}
          {focusAreas.length > 0 && (
            <Animated.View style={focusStyle} className="mt-2 gap-3">
              <AppText size="xs" color="muted" weight="semibold" className="px-1">
                Focus areas
              </AppText>
              {focusAreas.map((domain) => (
                <View
                  key={domain.label}
                  className="flex-row items-center gap-4 bg-primary/10 rounded-xl px-5 py-4 border border-primary/20"
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
                  className="flex-row items-center gap-4 bg-surface rounded-xl px-5 py-4 border border-border/50"
                >
                  <PhosphorIcon
                    icon={item.icon}
                    weight="duotone"
                    size={24}
                    color={warningColor as string}
                  />
                  <AppText size="sm" className="flex-1">
                    {item.text}
                  </AppText>
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
                  className="flex-row items-center gap-4 bg-surface rounded-xl px-5 py-3 border border-border/50"
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
      </View>

      {/* Bottom section */}
      <Animated.View style={buttonStyle} className="w-full pb-8 pt-4 px-6 gap-3">
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
