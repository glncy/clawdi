import { UsersThree } from "phosphor-react-native";
import { AssessmentScreen } from "@/components/organisms/AssessmentScreen";
import { useOnboarding } from "../_layout";
import { PEOPLE_SCORE } from "@/types/onboarding";

export default function OnboardingStepPeople() {
  const { peopleScore, setPeopleScore } = useOnboarding();

  return (
    <AssessmentScreen
      index={3}
      value={peopleScore}
      onChange={(val) => setPeopleScore(val as any)}
      icon={UsersThree}
      label="Relationships"
      question="Are you connected to the people you care about?"
      choices={Object.values(PEOPLE_SCORE)}
      total={5}
      nextRoute="/(main)/onboarding/step-assessment/mind"
    />
  );
}
