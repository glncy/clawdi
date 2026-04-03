import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Stack } from "expo-router";
import { useSystemTheme } from "@/hooks/useCustomTheme";

// --- Onboarding Context ---

interface OnboardingData {
  sliderValues: number[];
  setSliderValues: (values: number[]) => void;
  income: string;
  setIncome: (v: string) => void;
  savingGoal: string;
  setSavingGoal: (v: string) => void;
  struggle: string;
  setStruggle: (v: string) => void;
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
  const [sliderValues, setSliderValues] = useState<number[]>([
    50, 50, 50, 50, 50,
  ]);
  const [income, setIncome] = useState("");
  const [savingGoal, setSavingGoal] = useState("");
  const [struggle, setStruggle] = useState("");
  const [name, setName] = useState("");

  return (
    <OnboardingContext.Provider
      value={{
        sliderValues,
        setSliderValues,
        income,
        setIncome,
        savingGoal,
        setSavingGoal,
        struggle,
        setStruggle,
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
        <Stack.Screen name="step-slider/money" />
        <Stack.Screen name="step-slider/time" />
        <Stack.Screen name="step-slider/health" />
        <Stack.Screen name="step-slider/people" />
        <Stack.Screen name="step-slider/mind" />
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
