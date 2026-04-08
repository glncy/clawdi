import { create } from "zustand";

interface BillPrefill {
  name?: string;
  amount?: number;
  frequency?: "weekly" | "monthly" | "yearly";
  category?: string;
}

interface AddBillSheetState {
  isOpen: boolean;
  prefillData: BillPrefill | null;
  open: () => void;
  close: () => void;
  setPrefill: (data: BillPrefill) => void;
  clearModalData: () => void;
}

export const useAddBillSheetStore = create<AddBillSheetState>((set) => ({
  isOpen: false,
  prefillData: null,
  open: () => set({ isOpen: true, prefillData: null }),
  close: () => set({ isOpen: false }),
  setPrefill: (data) => set({ prefillData: data }),
  clearModalData: () => set({ prefillData: null }),
}));
