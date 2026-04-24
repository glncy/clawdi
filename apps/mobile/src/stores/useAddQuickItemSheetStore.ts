import { create } from "zustand";

interface AddQuickItemSheetState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useAddQuickItemSheetStore = create<AddQuickItemSheetState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
