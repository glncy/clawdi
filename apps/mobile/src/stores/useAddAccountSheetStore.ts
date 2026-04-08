import { create } from "zustand";

interface AccountPrefill {
  name?: string;
  type?: "checking" | "savings" | "credit" | "cash" | "investment";
  balance?: number;
}

interface AddAccountSheetState {
  isOpen: boolean;
  prefillData: AccountPrefill | null;
  open: () => void;
  close: () => void;
  setPrefill: (data: AccountPrefill) => void;
  clearModalData: () => void;
}

export const useAddAccountSheetStore = create<AddAccountSheetState>(
  (set) => ({
    isOpen: false,
    prefillData: null,
    open: () => set({ isOpen: true, prefillData: null }),
    close: () => set({ isOpen: false }),
    setPrefill: (data) => set({ prefillData: data }),
    clearModalData: () => set({ prefillData: null }),
  })
);
