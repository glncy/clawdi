import { View, Alert, Pressable } from "react-native";
import { useEffect, useCallback, useRef } from "react";
import { Button } from "heroui-native";
import { ProgressRing } from "@/components/atoms/ProgressRing";
import { AppText } from "@/components/atoms/Text";
import { Gear, Target } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useTimerStore } from "@/stores/useTimerStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";
import { useFocusSessionSettingsSheetStore } from "@/stores/useFocusSessionSettingsSheetStore";

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
  const breakLength = useTimerStore((s) => s.breakLength);
  const phase = useTimerStore((s) => s.phase);
  const cycleCount = useTimerStore((s) => s.cycleCount);
  const linkedPriorityId = useTimerStore((s) => s.linkedPriorityId);
  const sessionGoal = useTimerStore((s) => s.sessionGoal);
  const start = useTimerStore((s) => s.start);
  const pause = useTimerStore((s) => s.pause);
  const reset = useTimerStore((s) => s.reset);
  const tick = useTimerStore((s) => s.tick);
  const beginBreak = useTimerStore((s) => s.beginBreak);
  const beginNextFocus = useTimerStore((s) => s.beginNextFocus);
  const clearSessionContext = useTimerStore((s) => s.clearSessionContext);

  const incrementPomodoro = useDayStore((s) => s.incrementPomodoro);
  const logFocusSession = useDayStore((s) => s.logFocusSession);
  const pomodoroCount = useDayStore((s) => s.pomodoroCount);
  const { priorities, todayFocusMinutes } = useDayData();
  const { db } = useDatabase();
  const openSettings = useFocusSessionSettingsSheetStore((s) => s.open);

  const [primaryColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
  ]);

  const sessionStartRef = useRef<string | null>(null);

  useEffect(() => {
    if (isRunning && phase === "focus" && !sessionStartRef.current) {
      sessionStartRef.current = new Date().toISOString();
    }
  }, [isRunning, phase]);

  const dbRef = useRef(db);
  dbRef.current = db;

  const handleFocusComplete = useCallback(async () => {
    if (!dbRef.current) return;
    await incrementPomodoro(dbRef.current);
    await logFocusSession(dbRef.current, {
      priorityId: linkedPriorityId,
      goal: sessionGoal || null,
      plannedSec: sessionLength,
      actualSec: sessionLength,
      completedNaturally: true,
      startedAt: sessionStartRef.current ?? new Date().toISOString(),
    });
    sessionStartRef.current = null;

    Alert.alert(
      "Focus complete!",
      `${randomBreakSuggestion()}\n\nReady for a ${Math.floor(breakLength / 60)}-min break?`,
      [
        { text: "Skip break", onPress: () => reset(), style: "cancel" },
        {
          text: "Start break",
          onPress: () => {
            beginBreak();
            start();
          },
        },
      ],
    );
  }, [
    incrementPomodoro,
    logFocusSession,
    linkedPriorityId,
    sessionGoal,
    sessionLength,
    breakLength,
    beginBreak,
    reset,
    start,
  ]);

  const handleBreakComplete = useCallback(() => {
    Alert.alert("Break's up", "Back at it?", [
      {
        text: "Later",
        style: "cancel",
        onPress: () => clearSessionContext(),
      },
      { text: "Next session", onPress: () => beginNextFocus() },
    ]);
  }, [beginNextFocus, clearSessionContext]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  useEffect(() => {
    const unsub = useTimerStore.subscribe((state, prevState) => {
      if (prevState.isRunning && !state.isRunning && state.seconds === 0) {
        if (prevState.phase === "focus") void handleFocusComplete();
        else handleBreakComplete();
      }
    });
    return unsub;
  }, [handleFocusComplete, handleBreakComplete]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const base = phase === "focus" ? sessionLength : breakLength;
  const progress = 1 - seconds / base;
  const linkedPriority = priorities.find((p) => p.id === linkedPriorityId);

  return (
    <View className="items-center gap-4">
      <View className="flex-row items-center gap-2">
        <AppText size="sm" color="muted" weight="semibold">
          {phase === "focus" ? "Focus Session" : "Break"}
        </AppText>
        <Pressable onPress={openSettings} hitSlop={8}>
          <Gear size={14} color={mutedColor as string} />
        </Pressable>
      </View>

      {phase === "focus" && (sessionGoal || linkedPriority) ? (
        <View className="items-center gap-1">
          {sessionGoal ? (
            <View className="flex-row items-center gap-1">
              <Target size={12} color={primaryColor as string} />
              <AppText size="xs" color="primary" weight="semibold">
                {sessionGoal}
              </AppText>
            </View>
          ) : null}
          {linkedPriority ? (
            <AppText size="xs" color="muted">
              on &quot;{linkedPriority.text}&quot;
            </AppText>
          ) : null}
        </View>
      ) : null}

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

      <View className="items-center gap-0.5">
        {pomodoroCount > 0 ? (
          <AppText size="xs" color="muted">
            {pomodoroCount} {pomodoroCount === 1 ? "session" : "sessions"} · {todayFocusMinutes}m focused today
          </AppText>
        ) : null}
        {cycleCount > 0 ? (
          <AppText size="xs" color="muted">
            Cycle {cycleCount}
          </AppText>
        ) : null}
      </View>
    </View>
  );
};
