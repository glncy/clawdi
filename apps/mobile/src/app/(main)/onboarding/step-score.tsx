import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from "react-native-reanimated";

export default function OnboardingStepScore() {
  const router = useRouter();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(500, withTiming(1, { duration: 1000 }));
    translateY.value = withDelay(500, withTiming(0, { duration: 1000 }));
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <View className="flex-1 bg-background px-6 py-12 justify-between">
      <View className="flex-1 justify-center items-center">
        <Text variant="h2" className="text-center text-foreground-500 mb-6">
          Your starting clawdi Score is
        </Text>
        <Animated.View style={animatedStyle}>
          <Text style={{ fontSize: 120, fontWeight: "bold" }} className="text-primary text-center">
            42
          </Text>
        </Animated.View>
        <Animated.View style={animatedStyle} className="mt-8">
          <Text variant="body" className="text-center text-foreground-500">
            It&apos;s not about where you start.{"\n"}It&apos;s about where you go from here.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={animatedStyle} className="items-center w-full pb-8">
        <Button
          color="primary"
          className="w-full h-14 rounded-2xl"
          onPress={() => router.replace("/(main)/(tabs)/home")}
        >
          <Text variant="body" className="font-bold text-white">
            Enter Your Dashboard
          </Text>
        </Button>
      </Animated.View>
    </View>
  );
}
