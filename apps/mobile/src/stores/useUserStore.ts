import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "../utils/storage/zustandStorage";
import type {
  MoneyScore,
  TimeScore,
  HealthScore,
  PeopleScore,
  MindScore,
} from "@/types/onboarding";

export interface UserState {
  name: string;
  income: string;
  currency: string;
  moneyScore: MoneyScore | null;
  timeScore: TimeScore | null;
  healthScore: HealthScore | null;
  peopleScore: PeopleScore | null;
  mindScore: MindScore | null;
  savingGoals: string[];
  struggles: string[];
  hasCompletedOnboarding: boolean;
  setUserData: (data: Partial<Omit<UserState, "setUserData" | "setIncome">>) => void;
  setIncome: (value: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: "",
      income: "",
      currency: "",
      moneyScore: null,
      timeScore: null,
      healthScore: null,
      peopleScore: null,
      mindScore: null,
      savingGoals: [],
      struggles: [],
      hasCompletedOnboarding: false,
      setUserData: (data) => set((state) => ({ ...state, ...data })),
      setIncome: (value) => set({ income: value }),
    }),
    {
      name: "user-storage",
      storage: zustandStorage,
    }
  )
);
