import { Heartbeat } from "phosphor-react-native";
import { AssessmentScreen } from "@/components/organisms/AssessmentScreen";
import { useOnboarding } from "../_layout";
import { HEALTH_SCORE } from "@/types/onboarding";

export default function OnboardingStepHealth() {
  const { healthScore, setHealthScore } = useOnboarding();

  return (
    <AssessmentScreen
      index={2}
      value={healthScore}
      onChange={(val) => setHealthScore(val as any)}
      icon={Heartbeat}
      label="Health"
      question="How is your daily energy and health?"
      choices={Object.values(HEALTH_SCORE)}
      total={5}
      nextRoute="/(main)/onboarding/step-assessment/people"
    />
  );
}
