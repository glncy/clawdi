import { create } from "zustand";

interface TimerState {
  /** Remaining seconds to display */
  seconds: number;
  isRunning: boolean;
  sessionLength: number;
  /** Timestamp (ms) when timer was started/resumed — used to calculate drift-free remaining time */
  startedAt: number | null;
  /** Seconds remaining when timer was started/resumed */
  secondsAtStart: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  seconds: 50 * 60,
  isRunning: false,
  sessionLength: 50 * 60,
  startedAt: null,
  secondsAtStart: 50 * 60,
  start: () =>
    set((state) => ({
      isRunning: true,
      startedAt: Date.now(),
      secondsAtStart: state.seconds,
    })),
  pause: () => {
    // Snapshot current remaining time before pausing
    const state = get();
    const elapsed = state.startedAt
      ? Math.floor((Date.now() - state.startedAt) / 1000)
      : 0;
    const remaining = Math.max(0, state.secondsAtStart - elapsed);
    set({ isRunning: false, seconds: remaining, startedAt: null });
  },
  reset: () =>
    set((state) => ({
      seconds: state.sessionLength,
      isRunning: false,
      startedAt: null,
      secondsAtStart: state.sessionLength,
    })),
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
}));
