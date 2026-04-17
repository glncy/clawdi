import { View, Alert } from "react-native";
import { useEffect, useCallback } from "react";
import { Button } from "heroui-native";
import { ProgressRing } from "@/components/atoms/ProgressRing";
import { AppText } from "@/components/atoms/Text";
import { useTimerStore } from "@/stores/useTimerStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";

const BREAK_SUGGESTIONS = [
  "Stretch for 2 minutes",
  "Drink a glass of water",
  "Step outside for fresh air",
  "Look away from the screen",
];

function randomBreakSuggestion(): string {
  return BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)]!;
}

export const PomodoroTimer = () => {
  const seconds = useTimerStore((s) => s.seconds);
  const isRunning = useTimerStore((s) => s.isRunning);
  const sessionLength = useTimerStore((s) => s.sessionLength);
  const start = useTimerStore((s) => s.start);
  const pause = useTimerStore((s) => s.pause);
  const reset = useTimerStore((s) => s.reset);
  const tick = useTimerStore((s) => s.tick);

  const { incrementPomodoro } = useDayStore();
  const { pomodoroCount } = useDayData();
  const { db } = useDatabase();

  const handleSessionComplete = useCallback(async () => {
    if (db) {
      await incrementPomodoro(db);
    }
    Alert.alert(
      "Session Complete! 🎉",
      randomBreakSuggestion(),
      [{ text: "Got it" }],
    );
    reset();
  }, [db, incrementPomodoro, reset]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  useEffect(() => {
    if (seconds === 0 && isRunning === false && useTimerStore.getState().startedAt === null) {
      // Session ended naturally (timer store already stopped it)
    }
  }, [seconds, isRunning]);

  // Watch for session completion (seconds hit 0 while timer was running)
  const prevSecondsRef = { current: seconds };
  useEffect(() => {
    const unsub = useTimerStore.subscribe((state, prevState) => {
      if (prevState.isRunning && !state.isRunning && state.seconds === 0) {
        handleSessionComplete();
      }
    });
    return unsub;
  }, [handleSessionComplete]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - seconds / sessionLength;

  return (
    <View className="items-center gap-4">
      <AppText size="sm" color="muted" weight="semibold">
        Focus Session
      </AppText>
      <ProgressRing progress={progress} size={160} strokeWidth={8}>
        <AppText size="4xl" weight="bold" family="mono">
          {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </AppText>
      </ProgressRing>
      <View className="flex-row gap-3">
        <Button
          variant={isRunning ? "secondary" : "primary"}
          onPress={isRunning ? pause : start}
        >
          <Button.Label>{isRunning ? "Pause" : "Start"}</Button.Label>
        </Button>
        <Button variant="tertiary" onPress={reset}>
          <Button.Label>Reset</Button.Label>
        </Button>
      </View>
      {pomodoroCount > 0 && (
        <AppText size="xs" color="muted">
          {pomodoroCount} {pomodoroCount === 1 ? "session" : "sessions"} completed today
        </AppText>
      )}
    </View>
  );
};
