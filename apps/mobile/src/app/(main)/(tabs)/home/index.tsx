import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { DailyBriefing } from "@/components/molecules/DailyBriefing";
import { TodayFocus } from "@/components/molecules/TodayFocus";
import { BudgetCard } from "@/components/molecules/BudgetCard";
import { NudgeCard } from "@/components/molecules/NudgeCard";
import { HabitList } from "@/components/organisms/HabitList";
import { useUserStore } from "@/stores/useUserStore";
import { useFinanceData } from "@/hooks/useFinanceData";
import {
  MOCK_HABITS,
  MOCK_PRIORITIES,
  MOCK_CONTACTS,
} from "@/data/mockData";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function HomeScreen() {
  const userName = useUserStore((s) => s.name) || "there";
  const { budgetLeftToday, dailyBudget } = useFinanceData();
  const nudgeContact = MOCK_CONTACTS.find((c) => c.lastTalkedDaysAgo >= 4);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Home",
        }}
      />
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-32 gap-5"
      >
        <View className="gap-1">
          <AppText size="lg" weight="semibold">
            {getGreeting()}, {userName}
          </AppText>
          <AppText size="sm" color="muted">
            {getFormattedDate()}
          </AppText>
        </View>

        <DailyBriefing
          userName={userName}
          budgetLeft={budgetLeftToday}
          dailyBudget={dailyBudget}
          priorities={MOCK_PRIORITIES}
          habits={MOCK_HABITS}
          contacts={MOCK_CONTACTS}
        />

        <TodayFocus priorities={MOCK_PRIORITIES} />

        <BudgetCard
          amountLeft={budgetLeftToday}
          dailyBudget={dailyBudget}
        />

        <HabitList habits={MOCK_HABITS} compact />

        {nudgeContact && (
          <NudgeCard
            name={nudgeContact.name}
            daysAgo={nudgeContact.lastTalkedDaysAgo}
          />
        )}
      </ScrollView>
    </>
  );
}
