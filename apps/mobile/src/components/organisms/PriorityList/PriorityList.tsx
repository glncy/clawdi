import { View, Pressable } from "react-native";
import { Checkbox } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useDayData } from "@/hooks/useDayData";
import { useDayStore } from "@/stores/useDayStore";
import { useEditPrioritySheetStore } from "@/stores/useEditPrioritySheetStore";
import { useAddPrioritySheetStore } from "@/stores/useAddPrioritySheetStore";
import { useDatabase } from "@/hooks/useDatabase";
import { Plus } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import type { Priority } from "@/types";

const SECTION_LABELS: Record<Priority["type"], string> = {
  must: "Must-do",
  win: "Win",
  overdue: "Overdue",
};

interface SectionProps {
  type: Priority["type"];
  items: Priority[];
}

const PrioritySection = ({ type, items }: SectionProps) => {
  const togglePriority = useDayStore((s) => s.togglePriority);
  const { open: openEdit } = useEditPrioritySheetStore();
  const { db } = useDatabase();

  if (items.length === 0) return null;

  return (
    <View className="gap-1">
      <AppText size="xs" weight="semibold" color="muted" className="uppercase tracking-wide">
        {SECTION_LABELS[type]}
      </AppText>
      {items.map((p) => (
        <Pressable
          key={p.id}
          className="flex-row items-center gap-3 py-2"
          onPress={() => {
            if (db) togglePriority(db, p.id);
          }}
          onLongPress={() => openEdit(p)}
        >
          <Checkbox isSelected={p.isCompleted} onChange={(_: boolean) => {
            if (db) togglePriority(db, p.id);
          }} />
          <AppText
            size="sm"
            color={p.isCompleted ? "muted" : "foreground"}
            className={`flex-1 ${p.isCompleted ? "line-through" : ""}`}
          >
            {p.text}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
};

export const PriorityList = () => {
  const { grouped, completedToday, totalToday } = useDayData();
  const { open: openAdd } = useAddPrioritySheetStore();

  const [primaryColor] = useCSSVariable(["--color-primary"]);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText size="lg" weight="semibold" family="headline">
          Top Priorities
        </AppText>
        <AppText size="xs" color="muted">
          {completedToday} of {totalToday} done
        </AppText>
      </View>

      <PrioritySection type="must" items={grouped.must} />
      <PrioritySection type="win" items={grouped.win} />
      <PrioritySection type="overdue" items={grouped.overdue} />

      {totalToday === 0 && (
        <AppText size="sm" color="muted">
          No priorities yet. Start your day!
        </AppText>
      )}

      <Pressable
        className="flex-row items-center gap-2 py-1"
        onPress={openAdd}
      >
        <Plus size={14} color={primaryColor as string} />
        <AppText size="sm" color="primary">
          Add priority
        </AppText>
      </Pressable>
    </View>
  );
};
