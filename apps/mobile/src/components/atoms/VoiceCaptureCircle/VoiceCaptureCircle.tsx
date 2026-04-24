import { View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Microphone } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { AppText } from "@/components/atoms/Text";

interface VoiceCaptureCircleProps {
  onPress?: () => void;
  transcript?: string;
  isListening?: boolean;
  disabled?: boolean;
}

/**
 * Placeholder voice-capture circle. Pulses while "listening" and exposes
 * a transcript slot. Defaults to disabled ("coming soon") for v1.
 * @level Atom
 */
export const VoiceCaptureCircle = ({
  onPress,
  transcript,
  isListening = false,
  disabled = true,
}: VoiceCaptureCircleProps) => {
  const [primaryColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
  ]);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      pulse.value = withRepeat(
        withTiming(1.15, { duration: 700 }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1);
    }
  }, [isListening, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View className="items-center gap-3">
      <Pressable onPress={onPress} disabled={disabled}>
        <Animated.View
          style={animatedStyle}
          className={`w-24 h-24 rounded-full items-center justify-center ${
            disabled ? "bg-surface" : "bg-primary/10"
          }`}
        >
          <Microphone
            size={36}
            color={disabled ? (mutedColor as string) : (primaryColor as string)}
            weight="fill"
          />
        </Animated.View>
      </Pressable>
      <AppText
        size="sm"
        weight="medium"
        color={disabled ? "muted" : "foreground"}
      >
        {isListening
          ? "Listening…"
          : disabled
            ? "Tap to talk (coming soon)"
            : "Tap to talk"}
      </AppText>
      <View className="min-h-[24px] px-4">
        <AppText size="xs" color="muted" align="center">
          {transcript ?? ""}
        </AppText>
      </View>
    </View>
  );
};
