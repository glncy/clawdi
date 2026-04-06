import { Brain } from "phosphor-react-native";
import { AssessmentScreen } from "@/components/organisms/AssessmentScreen";
import { useOnboarding } from "../_layout";
import { MIND_SCORE } from "@/types/onboarding";

export default function OnboardingStepMind() {
  const { mindScore, setMindScore } = useOnboarding();

  return (
    <AssessmentScreen
      index={4}
      value={mindScore}
      onChange={(val) => setMindScore(val as any)}
      icon={Brain}
      label="Growth"
      question="Are you growing and learning?"
      choices={Object.values(MIND_SCORE)}
      total={5}
      nextRoute="/(main)/onboarding/step-result"
    />
  );
}
