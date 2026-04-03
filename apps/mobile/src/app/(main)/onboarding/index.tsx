import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { Button, Toast, useToast } from "heroui-native";
import { useLocalAI } from "@/hooks/useLocalAI";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { Brain, CheckCircle } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";

const DOMAINS = [
  { emoji: "💰", label: "Money" },
  { emoji: "⏰", label: "Time" },
  { emoji: "💪", label: "Health" },
  { emoji: "👥", label: "People" },
  { emoji: "🧠", label: "Mind" },
];

const DOWNLOAD_TOAST_ID = "ai-download";

function useFadeInUp(delay: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
    );
  }, [delay, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

function DownloadToast({
  progress,
  id,
  index,
  total,
  heights,
  show,
  hide,
  maxVisibleToasts,
}: {
  progress: number;
} & React.ComponentProps<typeof Toast>) {
  const percentage = Math.round(progress * 100);

  return (
    <Toast
      id={id}
      index={index}
      total={total}
      heights={heights}
      show={show}
      hide={hide}
      maxVisibleToasts={maxVisibleToasts}
      placement="bottom"
      isSwipeable={false}
    >
      <Toast.Title>Setting up on-device AI</Toast.Title>
      <Toast.Description>
        {percentage > 0
          ? `Downloading model... ${percentage}%`
          : "Preparing download..."}
      </Toast.Description>
    </Toast>
  );
}

function DoneToast(
  props: React.ComponentProps<typeof Toast>
) {
  return (
    <Toast
      {...props}
      placement="bottom"
      variant="success"
    >
      <Toast.Title>On-device AI ready</Toast.Title>
      <Toast.Description>No cloud, full privacy.</Toast.Description>
    </Toast>
  );
}

export default function OnboardingIndex() {
  const router = useRouter();
  const { downloadModel, downloadProgress, isModelDownloaded } = useLocalAI();
  const { toast } = useToast();
  const downloadToastShownRef = useRef(false);
  const doneToastShownRef = useRef(false);
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  // Start download
  useEffect(() => {
    if (!isModelDownloaded) {
      downloadModel();
    }
  }, [isModelDownloaded, downloadModel]);

  // Show/update download toast
  useEffect(() => {
    if (isModelDownloaded) {
      // Hide download toast and show done toast
      if (downloadToastShownRef.current) {
        toast.hide(DOWNLOAD_TOAST_ID);
        downloadToastShownRef.current = false;
      }
      if (!doneToastShownRef.current) {
        doneToastShownRef.current = true;
        toast.show({
          id: "ai-done",
          duration: 3000,
          component: (props) => <DoneToast {...props} />,
        });
      }
      return;
    }

    // Show persistent download toast
    if (!downloadToastShownRef.current) {
      downloadToastShownRef.current = true;
      toast.show({
        id: DOWNLOAD_TOAST_ID,
        duration: "persistent",
        component: (props) => (
          <DownloadToast {...props} progress={downloadProgress} />
        ),
      });
    } else {
      // Update: hide and re-show with new progress
      toast.hide(DOWNLOAD_TOAST_ID);
      toast.show({
        id: DOWNLOAD_TOAST_ID,
        duration: "persistent",
        component: (props) => (
          <DownloadToast {...props} progress={downloadProgress} />
        ),
      });
    }
  }, [isModelDownloaded, downloadProgress, toast]);

  const style0 = useFadeInUp(0);
  const style1 = useFadeInUp(200);
  const style2 = useFadeInUp(400);
  const style3 = useFadeInUp(600);

  return (
    <View className="flex-1 bg-background px-6 justify-between">
      <View className="flex-1 justify-center items-center">
        {/* Icon */}
        <Animated.View style={style0} className="mb-8">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
            {isModelDownloaded ? (
              <PhosphorIcon
                icon={CheckCircle}
                weight="fill"
                size={36}
                color={primaryColor as string}
              />
            ) : (
              <PhosphorIcon
                icon={Brain}
                weight="duotone"
                size={36}
                color={primaryColor as string}
              />
            )}
          </View>
        </Animated.View>

        {/* Headline */}
        <Animated.View style={style1} className="items-center mb-6">
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
        <Animated.View style={style1} className="items-center mb-10">
          <AppText align="center" color="muted" size="lg">
            Finance is your foundation. Life is your goal.{"\n"}
            We need to know where you stand today.
          </AppText>
        </Animated.View>

        {/* Domain preview chips */}
        <Animated.View style={style2} className="flex-row gap-3 flex-wrap justify-center">
          {DOMAINS.map((d) => (
            <View
              key={d.label}
              className="flex-row items-center gap-1.5 bg-surface rounded-full px-4 py-2"
            >
              <AppText size="sm">{d.emoji}</AppText>
              <AppText size="xs" weight="medium" color="muted">
                {d.label}
              </AppText>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom section */}
      <Animated.View style={style3} className="items-center w-full pb-10">
        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-2xl"
          onPress={() => router.push("/(main)/onboarding/step-sliders")}
        >
          <Button.Label>Start the Mirror</Button.Label>
        </Button>
      </Animated.View>
    </View>
  );
}
