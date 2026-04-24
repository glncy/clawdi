import { create } from "zustand";

type Phase = "focus" | "break";

interface TimerState {
  seconds: number;
  isRunning: boolean;
  sessionLength: number;
  breakLength: number;
  phase: Phase;
  cycleCount: number;
  startedAt: number | null;
  secondsAtStart: number;

  linkedPriorityId: string | null;
  sessionGoal: string;
  currentSessionId: string | null;

  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;

  setLinkedPriority: (id: string | null) => void;
  setSessionGoal: (goal: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  beginBreak: () => void;
  beginNextFocus: () => void;
  clearSessionContext: () => void;
}

const FOCUS_LEN = 50 * 60;
const BREAK_LEN = 10 * 60;

export const useTimerStore = create<TimerState>((set) => ({
  seconds: FOCUS_LEN,
  isRunning: false,
  sessionLength: FOCUS_LEN,
  breakLength: BREAK_LEN,
  phase: "focus",
  cycleCount: 0,
  startedAt: null,
  secondsAtStart: FOCUS_LEN,

  linkedPriorityId: null,
  sessionGoal: "",
  currentSessionId: null,

  start: () =>
    set((state) => ({
      isRunning: true,
      startedAt: Date.now(),
      secondsAtStart: state.seconds,
    })),

  pause: () =>
    set((state) => {
      const elapsed = state.startedAt
        ? Math.floor((Date.now() - state.startedAt) / 1000)
        : 0;
      const remaining = Math.max(0, state.secondsAtStart - elapsed);
      return { isRunning: false, seconds: remaining, startedAt: null };
    }),

  reset: () =>
    set((state) => {
      const base = state.phase === "focus" ? state.sessionLength : state.breakLength;
      return {
        seconds: base,
        isRunning: false,
        startedAt: null,
        secondsAtStart: base,
      };
    }),

  tick: () =>
    set((state) => {
      if (!state.startedAt) return {};
      const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      const remaining = Math.max(0, state.secondsAtStart - elapsed);
      if (remaining <= 0) {
        return { seconds: 0, isRunning: false, startedAt: null };
      }
      return { seconds: remaining };
    }),

  setLinkedPriority: (id) => set({ linkedPriorityId: id }),
  setSessionGoal: (goal) => set({ sessionGoal: goal }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),

  beginBreak: () =>
    set((state) => ({
      phase: "break",
      seconds: state.breakLength,
      secondsAtStart: state.breakLength,
      isRunning: false,
      startedAt: null,
      cycleCount: state.cycleCount + 1,
    })),

  beginNextFocus: () =>
    set((state) => ({
      phase: "focus",
      seconds: state.sessionLength,
      secondsAtStart: state.sessionLength,
      isRunning: false,
      startedAt: null,
    })),

  clearSessionContext: () =>
    set({
      linkedPriorityId: null,
      sessionGoal: "",
      currentSessionId: null,
      cycleCount: 0,
      phase: "focus",
      seconds: FOCUS_LEN,
      secondsAtStart: FOCUS_LEN,
      isRunning: false,
      startedAt: null,
    }),
}));
