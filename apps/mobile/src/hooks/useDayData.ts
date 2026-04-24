import { useMemo, useEffect } from "react";
import { useDayStore } from "@/stores/useDayStore";
import { useDatabase } from "@/hooks/useDatabase";
import type { Priority, QuickListItem } from "@/types";

const TYPE_ORDER: Priority["type"][] = ["must", "win", "overdue"];

function sortGroup(items: Priority[]): Priority[] {
  const active = items
    .filter((p) => !p.isCompleted)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const done = items.filter((p) => p.isCompleted).sort((a, b) => {
    if (!a.completedAt || !b.completedAt) return 0;
    return a.completedAt.localeCompare(b.completedAt);
  });
  return [...active, ...done];
}

export function useDayData() {
  const { db, isReady } = useDatabase();
  const priorities = useDayStore((s) => s.priorities);
  const quickList = useDayStore((s) => s.quickList);
  const tonight = useDayStore((s) => s.tonight);
  const pomodoroCount = useDayStore((s) => s.pomodoroCount);
  const hasCheckedRollover = useDayStore((s) => s.hasCheckedRollover);
  const isLoaded = useDayStore((s) => s.isLoaded);
  const loadToday = useDayStore((s) => s.loadToday);

  useEffect(() => {
    if (isReady && db && !isLoaded) {
      void loadToday(db);
    }
  }, [isReady, db, isLoaded, loadToday]);

  const grouped = useMemo(() => {
    const byType: Record<Priority["type"], Priority[]> = {
      must: [],
      win: [],
      overdue: [],
    };
    for (const p of priorities) {
      byType[p.type].push(p);
    }
    return {
      must: sortGroup(byType.must),
      win: sortGroup(byType.win),
      overdue: sortGroup(byType.overdue),
    };
  }, [priorities]);

  const completedToday = useMemo(
    () => priorities.filter((p) => p.isCompleted).length,
    [priorities],
  );
  const totalToday = priorities.length;

  const activeMustCount = useMemo(
    () => priorities.filter((p) => p.type === "must" && !p.isCompleted).length,
    [priorities],
  );

  const sortedQuickList: QuickListItem[] = useMemo(() => {
    const active = quickList
      .filter((q) => !q.isCompleted)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const done = quickList
      .filter((q) => q.isCompleted)
      .sort((a, b) => {
        if (!a.completedAt || !b.completedAt) return 0;
        return a.completedAt.localeCompare(b.completedAt);
      });
    return [...active, ...done];
  }, [quickList]);

  return {
    grouped,
    priorities,
    quickList: sortedQuickList,
    tonight,
    pomodoroCount,
    pomodoroSessionsToday: pomodoroCount,
    completedToday,
    totalToday,
    activeMustCount,
    hasCheckedRollover,
    isLoaded,
    typeOrder: TYPE_ORDER,
  };
}
