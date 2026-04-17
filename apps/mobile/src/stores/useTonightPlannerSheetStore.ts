import { create } from "zustand";

interface TonightPlannerSheetState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useTonightPlannerSheetStore = create<TonightPlannerSheetState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
