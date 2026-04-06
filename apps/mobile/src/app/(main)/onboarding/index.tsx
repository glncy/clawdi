import React, { useEffect } from "react";
import { Image, View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { CurrencyDollar, Clock, Heartbeat, UsersThree, Brain, ShieldCheck } from "phosphor-react-native";
import { Button } from "heroui-native";
import { AIDownloadStatus } from "@/components/molecules/AIDownloadStatus";
import { useCSSVariable } from "uniwind";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";

const DOMAINS = [
  { icon: CurrencyDollar, label: "Money" },
  { icon: Clock, label: "Time" },
  { icon: Heartbeat, label: "Health" },
  { icon: UsersThree, label: "People" },
  { icon: Brain, label: "Mind" },
];

// eslint-disable-next-line @typescript-eslint/no-require-imports
const splashIcon = require("@/assets/images/splash-icon.png");

function useFadeInUp(delay: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

export default function OnboardingIndex() {
  const router = useRouter();
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  const style0 = useFadeInUp(0);
  const style1 = useFadeInUp(100);
  const style2 = useFadeInUp(200);
  const style3 = useFadeInUp(300);
  const style4 = useFadeInUp(400);

  return (
    <View className="flex-1 bg-background px-6 justify-between">
      <View className="flex-1 justify-center items-center">
        {/* Brand */}
        <Animated.View style={style0} className="items-center mb-8">
          <Image
            source={splashIcon}
            style={{ width: 48, height: 48, tintColor: "#6EE7B7" }}
            resizeMode="contain"
          />
          <AppText
            size="sm"
            weight="bold"
            family="headline"
            color="primary"
            className="mt-2"
          >
            clawdi
          </AppText>
        </Animated.View>

        {/* Headline */}
        <Animated.View style={style1} className="items-center mb-4">
          <AppText
            size="3xl"
            weight="bold"
            family="headline"
            align="center"
          >
            Be honest with yourself{"\n"}for 60 seconds
          </AppText>
        </Animated.View>

        {/* Subtext */}
        <Animated.View style={style2} className="items-center mb-10">
          <AppText align="center" color="muted">
            Finance is your foundation. Life is your goal.{"\n"}
            We need to know where you stand today.
          </AppText>
        </Animated.View>

        {/* Domain preview chips */}
        <Animated.View style={style3} className="flex-row gap-3 flex-wrap justify-center">
          {DOMAINS.map((d) => (
            <View
              key={d.label}
              className="flex-row items-center gap-1.5 bg-surface rounded-full px-4 py-2"
            >
              <PhosphorIcon icon={d.icon} size={16} color={primaryColor as string} />
              <AppText size="xs" weight="medium" color="muted">
                {d.label}
              </AppText>
            </View>
          ))}
        </Animated.View>

        {/* Privacy notice */}
        <Animated.View style={style3} className="flex-row items-center gap-2 mt-8">
          <PhosphorIcon icon={ShieldCheck} weight="duotone" size={16} color={primaryColor as string} />
          <AppText size="xs" color="muted">
            All your data stays on this device. Nothing is sent online.
          </AppText>
        </Animated.View>
      </View>

      {/* Bottom section */}
      <Animated.View style={style4} className="w-full pb-8 pt-4 gap-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-2xl"
          onPress={() => router.push("/(main)/onboarding/step-assessment/money")}
        >
          <Button.Label>Start</Button.Label>
        </Button>
        <AIDownloadStatus />
      </Animated.View>
    </View>
  );
}
