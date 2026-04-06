import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Stack } from "expo-router";
import { useSystemTheme } from "@/hooks/useCustomTheme";

import type {
  MoneyScore,
  TimeScore,
  HealthScore,
  PeopleScore,
  MindScore,
} from "@/types/onboarding";

// --- Onboarding Context ---

interface OnboardingData {
  moneyScore: MoneyScore | null;
  setMoneyScore: (v: MoneyScore | null) => void;
  timeScore: TimeScore | null;
  setTimeScore: (v: TimeScore | null) => void;
  healthScore: HealthScore | null;
  setHealthScore: (v: HealthScore | null) => void;
  peopleScore: PeopleScore | null;
  setPeopleScore: (v: PeopleScore | null) => void;
  mindScore: MindScore | null;
  setMindScore: (v: MindScore | null) => void;
  income: string;
  setIncome: (v: string) => void;
  savingGoals: string[];
  setSavingGoals: (v: string[]) => void;
  struggles: string[];
  setStruggles: (v: string[]) => void;
  name: string;
  setName: (v: string) => void;
}

const OnboardingContext = createContext<OnboardingData | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingLayout");
  }
  return ctx;
}

// --- Provider ---

function OnboardingProvider({ children }: { children: ReactNode }) {
  const [moneyScore, setMoneyScore] = useState<MoneyScore | null>(null);
  const [timeScore, setTimeScore] = useState<TimeScore | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [peopleScore, setPeopleScore] = useState<PeopleScore | null>(null);
  const [mindScore, setMindScore] = useState<MindScore | null>(null);
  const [income, setIncome] = useState("");
  const [savingGoals, setSavingGoals] = useState<string[]>([]);
  const [struggles, setStruggles] = useState<string[]>([]);
  const [name, setName] = useState("");

  return (
    <OnboardingContext.Provider
      value={{
        moneyScore,
        setMoneyScore,
        timeScore,
        setTimeScore,
        healthScore,
        setHealthScore,
        peopleScore,
        setPeopleScore,
        mindScore,
        setMindScore,
        income,
        setIncome,
        savingGoals,
        setSavingGoals,
        struggles,
        setStruggles,
        name,
        setName,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

// --- Layout ---

export default function OnboardingLayout() {
  useSystemTheme();

  return (
    <OnboardingProvider>
      <Stack.Screen options={{ headerShown: false }} />
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="step-assessment/money" />
        <Stack.Screen name="step-assessment/time" />
        <Stack.Screen name="step-assessment/health" />
        <Stack.Screen name="step-assessment/people" />
        <Stack.Screen name="step-assessment/mind" />
        <Stack.Screen name="step-result" options={{ gestureEnabled: false }} />
        <Stack.Screen name="step-question/income" />
        <Stack.Screen name="step-question/saving-goal" />
        <Stack.Screen name="step-question/struggle" />
        <Stack.Screen name="step-focus" />
        <Stack.Screen name="step-name" />
      </Stack>
    </OnboardingProvider>
  );
}
