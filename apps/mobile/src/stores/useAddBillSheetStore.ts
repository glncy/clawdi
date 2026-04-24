import { create } from "zustand";

interface BillPrefill {
  name?: string;
  amount?: number;
  /**
   * Includes `"once"` post-Task 1.3 (underlying `RecurringBill.frequency` type
   * was widened to accept non-recurring bills). The form schema at
   * `/add-bill` still uses a z.enum of the 3 recurring values — Task 6.1 will
   * widen it. Until then, the add-bill screen skips setting frequency when
   * it's `"once"`.
   */
  frequency?: "once" | "weekly" | "monthly" | "yearly";
  category?: string;
}

interface AddBillSheetState {
  isOpen: boolean;
  prefillData: BillPrefill | null;
  open: () => void;
  close: () => void;
  setPrefill: (data: BillPrefill) => void;
  clearPrefill: () => void;
  clearModalData: () => void;
}

export const useAddBillSheetStore = create<AddBillSheetState>((set) => ({
  isOpen: false,
  prefillData: null,
  open: () => set({ isOpen: true, prefillData: null }),
  close: () => set({ isOpen: false }),
  setPrefill: (data) => set({ prefillData: data }),
  clearPrefill: () => set({ prefillData: null }),
  clearModalData: () => set({ prefillData: null }),
}));
