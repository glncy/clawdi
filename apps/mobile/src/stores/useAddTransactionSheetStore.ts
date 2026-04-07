import { create } from "zustand";

interface AddTransactionSheetState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useAddTransactionSheetStore = create<AddTransactionSheetState>(
  (set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
  })
);
