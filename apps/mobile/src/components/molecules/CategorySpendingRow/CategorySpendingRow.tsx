import { View, ScrollView } from "react-native";
import { AppText } from "@/components/atoms/Text";
import { ProgressRing } from "@/components/atoms/ProgressRing";
import { useCurrency } from "@/hooks/useCurrency";
import type { CategoryBudget } from "@/types";

interface CategorySpendingRowProps {
  categories: CategoryBudget[];
}

/**
 * Horizontal scroll of category spending chips with mini progress rings.
 * @level Molecule
 */
export const CategorySpendingRow = ({
  categories,
}: CategorySpendingRowProps) => {
  const { format } = useCurrency();

  return (
    <View className="gap-2">
      <AppText size="sm" weight="semibold">
        Spending by Category
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3"
      >
        {categories.map((cat) => {
          const progress =
            cat.budgetAmount > 0
              ? Math.min(cat.spentAmount / cat.budgetAmount, 1)
              : 0;

          return (
            <View
              key={cat.category}
              className="items-center gap-1.5 rounded-xl bg-surface px-4 py-3"
              style={{ minWidth: 90 }}
            >
              <ProgressRing progress={progress} size={40} strokeWidth={3}>
                <AppText size="base">{cat.icon}</AppText>
              </ProgressRing>
              <AppText size="xs" weight="medium">
                {cat.category}
              </AppText>
              <AppText size="xs" color="muted" family="mono">
                {format(cat.spentAmount)}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};
