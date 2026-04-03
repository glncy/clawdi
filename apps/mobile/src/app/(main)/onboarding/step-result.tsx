import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import {
  MagnifyingGlass,
  CurrencyDollar,
  Clock,
  Heartbeat,
  UsersThree,
  Brain,
} from "phosphor-react-native";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { AIDownloadStatus } from "@/components/molecules/AIDownloadStatus";
import { useOnboarding } from "./_layout";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import type { ComponentType } from "react";
import type { IconProps } from "phosphor-react-native";

// --- Domain phrase mapping ---

interface DomainConfig {
  icon: ComponentType<IconProps>;
  phrases: { threshold: number; text: string }[];
}

const DOMAINS: DomainConfig[] = [
  {
    icon: CurrencyDollar,
    phrases: [
      { threshold: 30, text: "Your finances feel stressful" },
      { threshold: 50, text: "Your finances need attention" },
      { threshold: 70, text: "Your finances are okay" },
      { threshold: 101, text: "Your finances feel secure" },
    ],
  },
  {
    icon: Clock,
    phrases: [
      { threshold: 30, text: "Your time feels out of control" },
      { threshold: 50, text: "Time is slipping away" },
      { threshold: 70, text: "You manage your time okay" },
      { threshold: 101, text: "You control your time well" },
    ],
  },
  {
    icon: Heartbeat,
    phrases: [
      { threshold: 30, text: "Your energy is running low" },
      { threshold: 50, text: "Your health needs care" },
      { threshold: 70, text: "Your health is decent" },
      { threshold: 101, text: "Your energy is strong" },
    ],
  },
  {
    icon: UsersThree,
    phrases: [
      { threshold: 30, text: "You feel disconnected from people" },
      { threshold: 50, text: "Your relationships need nurturing" },
      { threshold: 70, text: "Your connections are okay" },
      { threshold: 101, text: "You feel close to people you love" },
    ],
  },
  {
    icon: Brain,
    phrases: [
      { threshold: 30, text: "Growth feels stagnant" },
      { threshold: 50, text: "You want to grow more" },
      { threshold: 70, text: "You're learning at your own pace" },
      { threshold: 101, text: "You're actively growing" },
    ],
  },
];

function getDomainPhrase(domainIndex: number, value: number): string {
  const domain = DOMAINS[domainIndex];
  for (const p of domain.phrases) {
    if (value < p.threshold) return p.text;
  }
  return domain.phrases[domain.phrases.length - 1].text;
}

// --- Animation hooks ---

function useFadeIn(delay: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );
  }, [delay, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

function useFadeInScale(delay: number) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.back(2)) })
    );
  }, [delay, opacity, scale]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
}

// --- Screen ---

export default function OnboardingStepResult() {
  const router = useRouter();
  const { sliderValues } = useOnboarding();
  const [primaryColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
  ]);

  // Determine weak and strong domains
  const weakDomains = DOMAINS.map((d, i) => ({ ...d, index: i, value: sliderValues[i] }))
    .filter((d) => d.value < 50);
  const strongCount = 5 - weakDomains.length;

  // Dynamic headline + subtext
  let headline: string;
  let subtext: string;
  let pivotText: string;

  if (weakDomains.length >= 3) {
    headline = "Here\u2019s what you told us.";
    subtext = weakDomains.map((d) => getDomainPhrase(d.index, d.value)).join(". ") + ".";
    pivotText = "But that changes today.";
  } else if (weakDomains.length >= 1) {
    headline = "Most things are going well.";
    subtext = weakDomains.map((d) => getDomainPhrase(d.index, d.value)).join(". ") + ".";
    pivotText = "Let\u2019s strengthen what\u2019s left.";
  } else {
    headline = "You\u2019re doing great.";
    subtext = "All your domains look healthy. That\u2019s rare.";
    pivotText = "Let\u2019s keep the momentum.";
  }

  // Pulsing icon
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    iconOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    iconScale.value = withDelay(
      300,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(2)) })
    );
    pulseScale.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, [iconOpacity, iconScale, pulseScale]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value * pulseScale.value }],
  }));

  const headlineStyle = useFadeIn(700);
  const domainsStyle = useFadeIn(1200);
  const pivotStyle = useFadeInScale(1800);
  const buttonStyle = useFadeIn(2200);

  return (
    <View className="flex-1 bg-background px-6 justify-between">
      <View className="flex-1 justify-center items-center">
        {/* Mirror icon */}
        <Animated.View
          style={iconStyle}
          className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-8"
        >
          <PhosphorIcon
            icon={MagnifyingGlass}
            size={40}
            weight="duotone"
            color={primaryColor as string}
          />
        </Animated.View>

        {/* Headline */}
        <Animated.View style={headlineStyle} className="mb-6">
          <AppText size="2xl" weight="bold" family="headline" align="center">
            {headline}
          </AppText>
        </Animated.View>

        {/* Domain callouts */}
        <Animated.View style={domainsStyle} className="mb-8 gap-3 w-full px-2">
          {weakDomains.length > 0 ? (
            weakDomains.map((d) => (
              <View key={d.index} className="flex-row items-center gap-3">
                <PhosphorIcon
                  icon={d.icon}
                  size={18}
                  weight="duotone"
                  color={primaryColor as string}
                />
                <AppText size="sm" color="muted">
                  {getDomainPhrase(d.index, d.value)}
                </AppText>
              </View>
            ))
          ) : (
            <AppText align="center" color="muted">
              {subtext}
            </AppText>
          )}
          {strongCount > 0 && weakDomains.length > 0 && (
            <AppText size="xs" color="muted" align="center" className="mt-2">
              {strongCount} {strongCount === 1 ? "area" : "areas"} looking good
            </AppText>
          )}
        </Animated.View>

        {/* Pivot text — bounce */}
        <Animated.View style={pivotStyle}>
          <AppText size="xl" weight="bold" family="headline" align="center" color="primary">
            {pivotText}
          </AppText>
        </Animated.View>
      </View>

      <Animated.View style={buttonStyle} className="w-full pb-8 pt-4 gap-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-2xl"
          onPress={() => router.push("/(main)/onboarding/step-question/income")}
        >
          <Button.Label>Continue</Button.Label>
        </Button>
        <AIDownloadStatus />
      </Animated.View>
    </View>
  );
}
