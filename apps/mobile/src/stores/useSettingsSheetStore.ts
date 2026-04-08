import { create } from "zustand";

type TabName = "home" | "money" | "day" | "life";

interface SettingsSheetState {
  isOpen: boolean;
  activeTab: TabName | null;
  toggle: (tab?: TabName) => void;
  close: () => void;
}

export const useSettingsSheetStore = create<SettingsSheetState>((set) => ({
  isOpen: false,
  activeTab: null,
  toggle: (tab) =>
    set((state) => ({
      isOpen: !state.isOpen,
      activeTab: !state.isOpen ? (tab ?? null) : null,
    })),
  close: () => set({ isOpen: false, activeTab: null }),
}));
