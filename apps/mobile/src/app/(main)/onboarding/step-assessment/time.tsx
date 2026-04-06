import { Clock } from "phosphor-react-native";
import { AssessmentScreen } from "@/components/organisms/AssessmentScreen";
import { useOnboarding } from "../_layout";
import { TIME_SCORE } from "@/types/onboarding";

export default function OnboardingStepTime() {
  const { timeScore, setTimeScore } = useOnboarding();

  return (
    <AssessmentScreen
      index={1}
      value={timeScore}
      onChange={(val) => setTimeScore(val as any)}
      icon={Clock}
      label="Time"
      question="Do you feel like you control your own time?"
      choices={Object.values(TIME_SCORE)}
      total={5}
      nextRoute="/(main)/onboarding/step-assessment/health"
    />
  );
}
