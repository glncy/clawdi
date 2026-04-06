import { CurrencyDollar } from "phosphor-react-native";
import { AssessmentScreen } from "@/components/organisms/AssessmentScreen";
import { useOnboarding } from "../_layout";
import { MONEY_SCORE } from "@/types/onboarding";

export default function OnboardingStepMoney() {
  const { moneyScore, setMoneyScore } = useOnboarding();

  return (
    <AssessmentScreen
      index={0}
      value={moneyScore}
      onChange={(val) => setMoneyScore(val as any)}
      icon={CurrencyDollar}
      label="Finances"
      question="How do you feel about your finances right now?"
      choices={Object.values(MONEY_SCORE)}
      total={5}
      nextRoute="/(main)/onboarding/step-assessment/time"
    />
  );
}
