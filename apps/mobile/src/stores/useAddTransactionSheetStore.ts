import { create } from "zustand";
import type { Transaction } from "@/types";

interface TransactionPrefill {
  type?: "income" | "expense";
  item?: string;
  amount?: number;
  category?: string;
}

interface AddTransactionSheetState {
  isOpen: boolean;
  prefillData: TransactionPrefill | null;
  editingTransaction: Transaction | null;
  open: () => void;
  close: () => void;
  setPrefill: (data: TransactionPrefill) => void;
  setEdit: (transaction: Transaction) => void;
  clearModalData: () => void;
}

export const useAddTransactionSheetStore = create<AddTransactionSheetState>(
  (set) => ({
    isOpen: false,
    prefillData: null,
    editingTransaction: null,
    open: () => set({ isOpen: true, editingTransaction: null, prefillData: null }),
    close: () => set({ isOpen: false }),
    setPrefill: (data) => set({ prefillData: data }),
    setEdit: (transaction) => set({ editingTransaction: transaction }),
    clearModalData: () => set({ prefillData: null, editingTransaction: null }),
  })
);
