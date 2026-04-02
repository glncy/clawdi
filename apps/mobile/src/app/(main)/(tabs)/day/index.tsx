import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";
import { Card, Checkbox } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { PriorityList } from "@/components/organisms/PriorityList";
import { PomodoroTimer } from "@/components/organisms/PomodoroTimer";
import { MOCK_PRIORITIES, MOCK_QUICK_LIST } from "@/data/mockData";

export default function DayScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Today" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pt-20 pb-32 gap-5"
      >
        <View>
          <AppText size="2xl" weight="bold" family="headline">
            Today
          </AppText>
          <AppText size="sm" color="muted">
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date())}
          </AppText>
        </View>

        <PriorityList priorities={MOCK_PRIORITIES} />

        <PomodoroTimer />

        {/* Quick List */}
        <View className="gap-2">
          <AppText size="sm" weight="semibold" color="muted">
            Quick List
          </AppText>
          {MOCK_QUICK_LIST.map((item) => (
            <View key={item.id} className="flex-row items-center gap-3 py-1">
              <Checkbox isSelected={item.isCompleted} />
              <AppText
                size="sm"
                color={item.isCompleted ? "muted" : "foreground"}
              >
                {item.text}
              </AppText>
            </View>
          ))}
        </View>

        {/* Tonight */}
        <Card className="bg-primary/10 p-4">
          <Card.Body className="gap-1">
            <AppText size="sm" weight="semibold" color="primary">
              Tonight
            </AppText>
            <AppText size="sm">
              Cook dinner → Read → Sleep by 11 PM
            </AppText>
          </Card.Body>
        </Card>
      </ScrollView>
    </>
  );
}
