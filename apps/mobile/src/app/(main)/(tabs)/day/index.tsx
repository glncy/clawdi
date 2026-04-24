import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { PriorityList } from "@/components/organisms/PriorityList";
import { PomodoroTimer } from "@/components/organisms/PomodoroTimer";
import { QuickList } from "@/components/organisms/QuickList";
import { TonightCard } from "@/components/molecules/TonightCard";
import { DayInsight } from "@/components/organisms/DayInsight";
import { AddPrioritySheet } from "@/components/organisms/AddPrioritySheet";
import { EditPrioritySheet } from "@/components/organisms/EditPrioritySheet";
import { TonightPlannerSheet } from "@/components/organisms/TonightPlannerSheet";
import { RolloverPromptSheet } from "@/components/organisms/RolloverPromptSheet";

export default function DayScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "" }} />

      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pt-5 pb-32 gap-5"
      >
        <AppText size="sm" color="muted">
          {new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }).format(new Date())}
        </AppText>

        <DayInsight />

        <PriorityList />

        <PomodoroTimer />

        <QuickList />

        <TonightCard />
      </ScrollView>

      <RolloverPromptSheet />
      <AddPrioritySheet />
      <EditPrioritySheet />
      <TonightPlannerSheet />
    </>
  );
}
