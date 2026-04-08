import { create } from "zustand";

interface GoalPrefill {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
}

interface AddGoalSheetState {
  isOpen: boolean;
  prefillData: GoalPrefill | null;
  open: () => void;
  close: () => void;
  setPrefill: (data: GoalPrefill) => void;
  clearModalData: () => void;
}

export const useAddGoalSheetStore = create<AddGoalSheetState>((set) => ({
  isOpen: false,
  prefillData: null,
  open: () => set({ isOpen: true, prefillData: null }),
  close: () => set({ isOpen: false }),
  setPrefill: (data) => set({ prefillData: data }),
  clearModalData: () => set({ prefillData: null }),
}));
