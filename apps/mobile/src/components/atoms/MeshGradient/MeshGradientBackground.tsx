import { StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle as SvgCircle,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { useCSSVariable, useUniwind } from "uniwind";
import { useEffect } from "react";
import {
  resolveMeshGradientConfig,
  type MeshGradientAnimationOptions,
  type MeshGradientColorOverrides,
} from "./MeshGradientConfig";

const GradientOrb = ({
  color,
  size,
  gradientId,
}: {
  color: string;
  size: number;
  gradientId: string;
}) => (
  <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <Defs>
      <RadialGradient
        id={gradientId}
        cx="50%"
        cy="50%"
        rx="50%"
        ry="50%"
        fx="50%"
        fy="50%"
      >
        <Stop offset="0%" stopColor={color} stopOpacity="1" />
        <Stop offset="50%" stopColor={color} stopOpacity="0.6" />
        <Stop offset="80%" stopColor={color} stopOpacity="0.2" />
        <Stop offset="100%" stopColor={color} stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <SvgCircle
      cx={size / 2}
      cy={size / 2}
      r={size / 2}
      fill={`url(#${gradientId})`}
      pointerEvents="none"
    />
  </Svg>
);

export type MeshGradientBackgroundProps = {
  colors?: MeshGradientColorOverrides;
  animation?: MeshGradientAnimationOptions;
};

export function MeshGradientBackground({
  colors,
  animation,
}: MeshGradientBackgroundProps = {}) {
  const { theme } = useUniwind();
  const isDark = theme === "dark";

  const [primaryColor, secondaryColor, accentColor, dangerColor] =
    useCSSVariable([
      "--color-primary",
      "--color-secondary",
      "--color-accent",
      "--color-danger",
    ]);

  const meshConfig = resolveMeshGradientConfig({
    cssVars: {
      primary: primaryColor as string | undefined,
      secondary: secondaryColor as string | undefined,
      accent: accentColor as string | undefined,
      danger: dangerColor as string | undefined,
    },
    colors,
    animation,
  });

  const durationMultiplier = meshConfig.animation.durationMultiplier;
  const distanceMultiplier = meshConfig.animation.distanceMultiplier;
  const animationEnabled = meshConfig.animation.enabled;

  // Mesh Gradient Orb Animation Values
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb3X = useSharedValue(0);
  const orb3Y = useSharedValue(0);
  const orb4X = useSharedValue(0);
  const orb4Y = useSharedValue(0);

  useEffect(() => {
    if (!animationEnabled) {
      orb1X.value = 0;
      orb1Y.value = 0;
      orb2X.value = 0;
      orb2Y.value = 0;
      orb3X.value = 0;
      orb3Y.value = 0;
      orb4X.value = 0;
      orb4Y.value = 0;
      return;
    }

    const distance = (value: number) => value * distanceMultiplier;
    const duration = (value: number) =>
      Math.round(value * durationMultiplier);

    orb1X.value = withRepeat(
      withSequence(
        withTiming(distance(40), {
          duration: duration(4500),
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration(5000),
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(distance(50), {
          duration: duration(5500),
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration(4000),
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );

    orb2X.value = withRepeat(
      withSequence(
        withTiming(distance(-50), {
          duration: duration(6000),
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration(5000),
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(distance(40), {
          duration: duration(4500),
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration(6000),
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );

    orb3X.value = withRepeat(
      withSequence(
        withTiming(distance(60), {
          duration: duration(5000),
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration(5500),
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
    orb3Y.value = withRepeat(
      withSequence(
        withTiming(distance(-40), {
          duration: duration(6500),
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration(4500),
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );

    orb4X.value = withRepeat(
      withSequence(
        withTiming(distance(-40), {
          duration: duration(5500),
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration(6000),
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
    orb4Y.value = withRepeat(
      withSequence(
        withTiming(distance(-60), {
          duration: duration(4500),
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration(5000),
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationEnabled, durationMultiplier, distanceMultiplier]);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }, { translateX: orb1X.value }],
  }));
  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2Y.value }, { translateX: orb2X.value }],
  }));
  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb3Y.value }, { translateX: orb3X.value }],
  }));
  const orb4Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb4Y.value }, { translateX: orb4X.value }],
  }));

  return (
    <View
      style={StyleSheet.absoluteFill}
      className="overflow-hidden bg-background"
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={[
            orb1Style,
            {
              position: "absolute",
              top: "-15%",
              left: "-20%",
              opacity: isDark ? 0.7 : 0.9,
            },
          ]}
        >
          <GradientOrb
            color={meshConfig.colors.primary}
            size={700}
            gradientId="mesh-primary-gradient"
          />
        </Animated.View>

        <Animated.View
          style={[
            orb2Style,
            {
              position: "absolute",
              top: "-10%",
              right: "-30%",
              opacity: isDark ? 0.6 : 0.8,
            },
          ]}
        >
          <GradientOrb
            color={meshConfig.colors.secondary}
            size={750}
            gradientId="mesh-secondary-gradient"
          />
        </Animated.View>

        <Animated.View
          style={[
            orb3Style,
            {
              position: "absolute",
              bottom: "-5%",
              left: "-30%",
              opacity: isDark ? 0.6 : 0.7,
            },
          ]}
        >
          <GradientOrb
            color={meshConfig.colors.accent}
            size={800}
            gradientId="mesh-accent-gradient"
          />
        </Animated.View>

        <Animated.View
          style={[
            orb4Style,
            {
              position: "absolute",
              bottom: "-20%",
              right: "-20%",
              opacity: isDark ? 0.5 : 0.6,
            },
          ]}
        >
          <GradientOrb
            color={meshConfig.colors.danger}
            size={700}
            gradientId="mesh-danger-gradient"
          />
        </Animated.View>
      </View>
    </View>
  );
}
