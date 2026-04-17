import { create } from "zustand";

interface AddPrioritySheetState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useAddPrioritySheetStore = create<AddPrioritySheetState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
