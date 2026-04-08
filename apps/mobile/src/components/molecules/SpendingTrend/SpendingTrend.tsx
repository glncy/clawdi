import { View } from "react-native";
import { AppText } from "@/components/atoms/Text";
import { useCSSVariable } from "uniwind";
import type { DailySpending } from "@/types";

interface SpendingTrendProps {
  data: DailySpending[];
  dailyBudget: number;
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3);
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

/**
 * 7-day spending bar chart using pure RN Views.
 * Current day highlighted with primary color.
 * @level Molecule
 */
export const SpendingTrend = ({ data, dailyBudget }: SpendingTrendProps) => {
  const [primaryColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
  ]);

  const maxAmount = Math.max(...data.map((d) => d.amount), dailyBudget);
  const chartHeight = 100;

  // Budget threshold line position
  const budgetLineTop =
    chartHeight - (dailyBudget / maxAmount) * chartHeight;

  return (
    <View className="gap-2 rounded-xl bg-surface p-4">
      <AppText size="sm" weight="semibold">
        This Week
      </AppText>

      <View style={{ height: chartHeight, position: "relative" }}>
        {/* Budget threshold line */}
        <View
          className="absolute left-0 right-0 border-t border-dashed border-muted/30"
          style={{ top: budgetLineTop }}
        />

        {/* Bars */}
        <View className="flex-1 flex-row items-end justify-between gap-1.5">
          {data.map((day) => {
            const barHeight = Math.max(
              (day.amount / maxAmount) * chartHeight,
              4
            );
            const today = isToday(day.date);

            return (
              <View key={day.date} className="flex-1 items-center gap-1">
                <View
                  className="w-full rounded-t-md"
                  style={{
                    height: barHeight,
                    backgroundColor: today
                      ? (primaryColor as string)
                      : `${mutedColor}40`,
                    borderRadius: 4,
                  }}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Day labels */}
      <View className="flex-row justify-between">
        {data.map((day) => (
          <View key={day.date} className="flex-1 items-center">
            <AppText
              size="xs"
              color={isToday(day.date) ? "primary" : "muted"}
              weight={isToday(day.date) ? "medium" : undefined}
              style={{ fontSize: 9 }}
            >
              {getDayLabel(day.date)}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
};
