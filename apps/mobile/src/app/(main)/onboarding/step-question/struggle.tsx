import { Lightning } from "phosphor-react-native";
import { QuestionScreen } from "@/components/organisms/QuestionScreen";
import { useOnboarding } from "../_layout";

const STRUGGLES = [
  { label: "Saving money", emoji: "💸" },
  { label: "Sleeping well", emoji: "😴" },
  { label: "Staying focused", emoji: "🎯" },
  { label: "Finding time", emoji: "⏰" },
  { label: "Eating healthy", emoji: "🥗" },
  { label: "Exercising", emoji: "🏃" },
];

export default function QuestionStruggle() {
  const { struggles, setStruggles } = useOnboarding();

  return (
    <QuestionScreen
      index={2}
      total={3}
      icon={Lightning}
      label="Daily Life"
      question="What are your biggest daily struggles?"
      values={struggles}
      onValuesChange={setStruggles}
      multiSelect
      showOther
      nextRoute="/(main)/onboarding/step-focus"
      isLast
      options={STRUGGLES}
    />
  );
}
