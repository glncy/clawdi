import { create } from "zustand";
import type { Priority } from "@/types";

interface EditPrioritySheetState {
  isOpen: boolean;
  priority: Priority | null;
  open: (priority: Priority) => void;
  close: () => void;
}

export const useEditPrioritySheetStore = create<EditPrioritySheetState>((set) => ({
  isOpen: false,
  priority: null,
  open: (priority) => set({ isOpen: true, priority }),
  close: () => set({ isOpen: false, priority: null }),
}));
