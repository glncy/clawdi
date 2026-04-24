import { create } from "zustand";

interface AccountPrefill {
  name?: string;
  /**
   * Free-form string — `accounts.type` is no longer a fixed enum after
   * Task 1.1 (user-managed account types). The `/add-account` screen does a
   * case-insensitive match against the loaded `accountTypes.name` list.
   */
  type?: string;
  balance?: number;
}

interface AddAccountSheetState {
  isOpen: boolean;
  prefillData: AccountPrefill | null;
  open: () => void;
  close: () => void;
  setPrefill: (data: AccountPrefill) => void;
  clearPrefill: () => void;
  clearModalData: () => void;
}

export const useAddAccountSheetStore = create<AddAccountSheetState>(
  (set) => ({
    isOpen: false,
    prefillData: null,
    open: () => set({ isOpen: true, prefillData: null }),
    close: () => set({ isOpen: false }),
    setPrefill: (data) => set({ prefillData: data }),
    clearPrefill: () => set({ prefillData: null }),
    clearModalData: () => set({ prefillData: null }),
  })
);
