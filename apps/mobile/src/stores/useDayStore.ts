import { create } from "zustand";
import { eq, and, sql } from "drizzle-orm";
import type { Database } from "../db/client";
import {
  priorities as prioritiesTable,
  quickList as quickListTable,
  metadata as metadataTable,
  focusSessions as focusSessionsTable,
} from "../db/schema";
import type { Priority, QuickListItem } from "../types";
import type { PriorityRow, QuickListRow } from "../db/schema";

export class MaxMustPrioritiesError extends Error {
  constructor() {
    super("You can only have 3 must-dos per day.");
    this.name = "MaxMustPrioritiesError";
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA");
}

function rowToPriority(row: PriorityRow): Priority {
  return {
    id: row.id,
    text: row.text,
    type: row.type,
    isCompleted: row.completed === 1,
    date: row.date,
    completedAt: row.completedAt ?? null,
    sortOrder: row.sortOrder,
    rolledOverFrom: row.rolledOverFrom ?? null,
    createdAt: row.createdAt,
  };
}

function rowToQuickItem(row: QuickListRow): QuickListItem {
  return {
    id: row.id,
    text: row.text,
    isCompleted: row.completed === 1,
    completedAt: row.completedAt ?? null,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
  };
}

function pomodoroKey(date: string) {
  return `pomodoro_count_${date}`;
}

function eveningPromptKey(date: string) {
  return `evening_prompt_dismissed_${date}`;
}

interface DayState {
  priorities: Priority[];
  quickList: QuickListItem[];
  pomodoroCount: number;
  hasCheckedRollover: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  tomorrowPriorities: Priority[];

  loadToday: (db: Database) => Promise<void>;
  loadTomorrow: (db: Database) => Promise<void>;

  addPriority: (
    db: Database,
    input: { text: string; type: Priority["type"] },
  ) => Promise<void>;
  togglePriority: (db: Database, id: string) => Promise<void>;
  addTomorrowPriority: (
    db: Database,
    input: { text: string; type: Priority["type"] },
  ) => Promise<void>;
  deleteTomorrowPriority: (db: Database, id: string) => Promise<void>;
  updatePriority: (
    db: Database,
    id: string,
    patch: { text?: string; type?: Priority["type"] },
  ) => Promise<void>;
  deletePriority: (db: Database, id: string) => Promise<void>;

  checkRollover: (db: Database) => Promise<number>;
  rollover: (db: Database) => Promise<void>;
  dismissRollover: (db: Database) => Promise<void>;
  markRolloverChecked: () => void;

  hasCheckedEveningPrompt: boolean;
  checkEveningPromptShouldShow: (db: Database) => Promise<boolean>;
  dismissEveningPrompt: (db: Database) => Promise<void>;
  markEveningPromptChecked: () => void;

  addQuickItem: (db: Database, text: string) => Promise<void>;
  toggleQuickItem: (db: Database, id: string) => Promise<void>;
  deleteQuickItem: (db: Database, id: string) => Promise<void>;

  incrementPomodoro: (db: Database) => Promise<void>;

  todayFocusMinutes: number;
  loadTodayFocusMinutes: (db: Database) => Promise<void>;
  logFocusSession: (
    db: Database,
    input: {
      priorityId: string | null;
      goal: string | null;
      plannedSec: number;
      actualSec: number;
      completedNaturally: boolean;
      startedAt: string;
    },
  ) => Promise<void>;
}

export const useDayStore = create<DayState>((set, get) => ({
  priorities: [],
  quickList: [],
  pomodoroCount: 0,
  hasCheckedRollover: false,
  isLoaded: false,
  isLoading: false,
  tomorrowPriorities: [],
  hasCheckedEveningPrompt: false,
  todayFocusMinutes: 0,

  loadToday: async (db) => {
    const { isLoaded, isLoading } = get();
    if (isLoaded || isLoading) return;
    set({ isLoading: true });

    try {
      const today = todayISO();

      const [pRows, qRows, pomodoroRow] = await Promise.all([
        db
          .select()
          .from(prioritiesTable)
          .where(eq(prioritiesTable.date, today)),
        db.select().from(quickListTable),
        db
          .select()
          .from(metadataTable)
          .where(eq(metadataTable.key, pomodoroKey(today))),
      ]);

      set({
        priorities: (pRows as PriorityRow[]).map(rowToPriority),
        quickList: (qRows as QuickListRow[]).map(rowToQuickItem),
        pomodoroCount:
          parseInt(
            (pomodoroRow[0] as { value?: string } | undefined)?.value ?? "0",
            10,
          ) || 0,
        isLoaded: true,
      });

      const tRows = await db
        .select()
        .from(prioritiesTable)
        .where(eq(prioritiesTable.date, tomorrowISO()));
      set({
        tomorrowPriorities: (tRows as PriorityRow[]).map(rowToPriority),
      });

      await get().loadTodayFocusMinutes(db);
    } finally {
      set({ isLoading: false });
    }
  },

  addPriority: async (db, { text, type }) => {
    const { priorities } = get();

    if (type === "must") {
      const activeMust = priorities.filter(
        (p) => p.type === "must" && !p.isCompleted,
      );
      if (activeMust.length >= 3) {
        throw new MaxMustPrioritiesError();
      }
    }

    const today = todayISO();
    const typePriorities = priorities.filter((p) => p.type === type);
    const sortOrder =
      typePriorities.length > 0
        ? Math.max(...typePriorities.map((p) => p.sortOrder)) + 1
        : 0;
    const now = new Date().toISOString();

    const newPriority: Priority = {
      id: generateId(),
      text,
      type,
      isCompleted: false,
      date: today,
      completedAt: null,
      sortOrder,
      rolledOverFrom: null,
      createdAt: now,
    };

    await db.insert(prioritiesTable).values({
      id: newPriority.id,
      text: newPriority.text,
      type: newPriority.type,
      date: newPriority.date,
      completed: 0,
      completedAt: null,
      sortOrder: newPriority.sortOrder,
      rolledOverFrom: null,
    });

    set((state) => ({ priorities: [...state.priorities, newPriority] }));
  },

  togglePriority: async (db, id) => {
    const { priorities } = get();
    const priority = priorities.find((p) => p.id === id);
    if (!priority) return;

    const nowCompleted = !priority.isCompleted;
    const completedAt = nowCompleted ? new Date().toISOString() : null;

    await db
      .update(prioritiesTable)
      .set({ completed: nowCompleted ? 1 : 0, completedAt } as Parameters<
        ReturnType<typeof db.update>["set"]
      >[0])
      .where(eq(prioritiesTable.id, id));

    set((state) => ({
      priorities: state.priorities.map((p) =>
        p.id === id ? { ...p, isCompleted: nowCompleted, completedAt } : p,
      ),
    }));
  },

  updatePriority: async (db, id, patch) => {
    if (patch.type === "must") {
      const { priorities } = get();
      const activeMust = priorities.filter(
        (p) => p.type === "must" && !p.isCompleted && p.id !== id,
      );
      if (activeMust.length >= 3) {
        throw new MaxMustPrioritiesError();
      }
    }

    await db
      .update(prioritiesTable)
      .set(patch as Parameters<ReturnType<typeof db.update>["set"]>[0])
      .where(eq(prioritiesTable.id, id));

    set((state) => ({
      priorities: state.priorities.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      ),
    }));
  },

  deletePriority: async (db, id) => {
    await db.delete(prioritiesTable).where(eq(prioritiesTable.id, id));
    set((state) => ({
      priorities: state.priorities.filter((p) => p.id !== id),
    }));
  },

  loadTomorrow: async (db) => {
    const rows = await db
      .select()
      .from(prioritiesTable)
      .where(eq(prioritiesTable.date, tomorrowISO()));
    set({ tomorrowPriorities: (rows as PriorityRow[]).map(rowToPriority) });
  },

  addTomorrowPriority: async (db, { text, type }) => {
    if (type === "must") {
      const { tomorrowPriorities } = get();
      const activeMust = tomorrowPriorities.filter(
        (p) => p.type === "must" && !p.isCompleted,
      );
      if (activeMust.length >= 3) {
        throw new MaxMustPrioritiesError();
      }
    }

    const tomorrow = tomorrowISO();
    const { tomorrowPriorities } = get();
    const typePriorities = tomorrowPriorities.filter((p) => p.type === type);
    const sortOrder =
      typePriorities.length > 0
        ? Math.max(...typePriorities.map((p) => p.sortOrder)) + 1
        : 0;
    const now = new Date().toISOString();

    const newPriority: Priority = {
      id: generateId(),
      text,
      type,
      isCompleted: false,
      date: tomorrow,
      completedAt: null,
      sortOrder,
      rolledOverFrom: null,
      createdAt: now,
    };

    await db.insert(prioritiesTable).values({
      id: newPriority.id,
      text: newPriority.text,
      type: newPriority.type,
      date: newPriority.date,
      completed: 0,
      completedAt: null,
      sortOrder: newPriority.sortOrder,
      rolledOverFrom: null,
    });

    set((state) => ({
      tomorrowPriorities: [...state.tomorrowPriorities, newPriority],
    }));
  },

  deleteTomorrowPriority: async (db, id) => {
    await db.delete(prioritiesTable).where(eq(prioritiesTable.id, id));
    set((state) => ({
      tomorrowPriorities: state.tomorrowPriorities.filter((p) => p.id !== id),
    }));
  },

  checkRollover: async (db) => {
    const yesterday = yesterdayISO();
    const today = todayISO();
    const rolloverKey = `rollover_done_${today}`;

    // Direct keyed lookup — avoids full table scan as metadata accumulates daily keys.
    // hasCheckedRollover is in-memory and resets on restart, so we persist the done
    // state in metadata to prevent re-prompting on same-day app restart.
    const doneRow = await db
      .select()
      .from(metadataTable)
      .where(eq(metadataTable.key, rolloverKey));
    if ((doneRow as { key?: string }[]).length > 0) return 0;

    const rows = await db
      .select()
      .from(prioritiesTable)
      .where(
        and(
          eq(prioritiesTable.date, yesterday),
          eq(prioritiesTable.completed, 0),
        ),
      );
    return rows.length;
  },

  rollover: async (db) => {
    const yesterday = yesterdayISO();
    const today = todayISO();

    const incompleteRows = await db
      .select()
      .from(prioritiesTable)
      .where(
        and(
          eq(prioritiesTable.date, yesterday),
          eq(prioritiesTable.completed, 0),
        ),
      );

    const now = new Date().toISOString();
    const newRows = (incompleteRows as PriorityRow[]).map((row) => ({
      id: generateId(),
      text: row.text,
      type: row.type,
      date: today,
      completed: 0 as const,
      completedAt: null,
      sortOrder: row.sortOrder,
      rolledOverFrom: yesterday,
    }));

    if (newRows.length > 0) {
      await db.insert(prioritiesTable).values(newRows);
    }

    const rolloverKey = `rollover_done_${today}`;
    await db
      .insert(metadataTable)
      .values({ key: rolloverKey, value: "true", updatedAt: now })
      .onConflictDoUpdate({
        target: metadataTable.key,
        set: { value: "true", updatedAt: now },
      });

    const newPriorities: Priority[] = newRows.map((row) => ({
      id: row.id,
      text: row.text,
      type: row.type,
      isCompleted: false,
      date: today,
      completedAt: null,
      sortOrder: row.sortOrder,
      rolledOverFrom: yesterday,
      createdAt: now,
    }));

    set((state) => ({
      priorities: [...state.priorities, ...newPriorities],
    }));
  },

  markRolloverChecked: () => set({ hasCheckedRollover: true }),

  checkEveningPromptShouldShow: async (db) => {
    const now = new Date();
    if (now.getHours() < 20) return false;

    const { tomorrowPriorities } = get();
    if (tomorrowPriorities.length > 0) return false;

    const today = todayISO();
    const rows = await db
      .select()
      .from(metadataTable)
      .where(eq(metadataTable.key, eveningPromptKey(today)));
    return (rows as { key?: string }[]).length === 0;
  },

  dismissEveningPrompt: async (db) => {
    const today = todayISO();
    const now = new Date().toISOString();
    await db
      .insert(metadataTable)
      .values({
        key: eveningPromptKey(today),
        value: "dismissed",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: metadataTable.key,
        set: { value: "dismissed", updatedAt: now },
      });
    set({ hasCheckedEveningPrompt: true });
  },

  markEveningPromptChecked: () => set({ hasCheckedEveningPrompt: true }),

  dismissRollover: async (db) => {
    const today = todayISO();
    const rolloverKey = `rollover_done_${today}`;
    const now = new Date().toISOString();
    await db
      .insert(metadataTable)
      .values({ key: rolloverKey, value: "dismissed", updatedAt: now })
      .onConflictDoUpdate({
        target: metadataTable.key,
        set: { value: "dismissed", updatedAt: now },
      });
    set({ hasCheckedRollover: true });
  },

  addQuickItem: async (db, text) => {
    const { quickList } = get();
    const now = new Date().toISOString();
    const sortOrder =
      quickList.length > 0
        ? Math.max(...quickList.map((q) => q.sortOrder)) + 1
        : 0;

    const newItem: QuickListItem = {
      id: generateId(),
      text,
      isCompleted: false,
      completedAt: null,
      sortOrder,
      createdAt: now,
    };

    await db.insert(quickListTable).values({
      id: newItem.id,
      text: newItem.text,
      completed: 0,
      completedAt: null,
      sortOrder: newItem.sortOrder,
    });

    set((state) => ({ quickList: [...state.quickList, newItem] }));
  },

  toggleQuickItem: async (db, id) => {
    const { quickList } = get();
    const item = quickList.find((q) => q.id === id);
    if (!item) return;

    const nowCompleted = !item.isCompleted;
    const completedAt = nowCompleted ? new Date().toISOString() : null;

    await db
      .update(quickListTable)
      .set({ completed: nowCompleted ? 1 : 0, completedAt } as Parameters<
        ReturnType<typeof db.update>["set"]
      >[0])
      .where(eq(quickListTable.id, id));

    set((state) => ({
      quickList: state.quickList.map((q) =>
        q.id === id ? { ...q, isCompleted: nowCompleted, completedAt } : q,
      ),
    }));
  },

  deleteQuickItem: async (db, id) => {
    await db.delete(quickListTable).where(eq(quickListTable.id, id));
    set((state) => ({
      quickList: state.quickList.filter((q) => q.id !== id),
    }));
  },

  incrementPomodoro: async (db) => {
    const today = todayISO();
    const key = pomodoroKey(today);
    const now = new Date().toISOString();

    const { pomodoroCount } = get();
    const newCount = pomodoroCount + 1;

    await db
      .insert(metadataTable)
      .values({ key, value: String(newCount), updatedAt: now })
      .onConflictDoUpdate({
        target: metadataTable.key,
        set: { value: String(newCount), updatedAt: now },
      });

    set({ pomodoroCount: newCount });
  },

  loadTodayFocusMinutes: async (db) => {
    const today = todayISO();
    const rows = await db
      .select()
      .from(focusSessionsTable)
      .where(sql`date(${focusSessionsTable.startedAt}) = ${today}`);
    const total = (rows as { actualSec: number }[]).reduce(
      (acc, r) => acc + (r.actualSec ?? 0),
      0,
    );
    set({ todayFocusMinutes: Math.floor(total / 60) });
  },

  logFocusSession: async (db, input) => {
    const now = new Date().toISOString();
    await db.insert(focusSessionsTable).values({
      id: generateId(),
      priorityId: input.priorityId,
      goal: input.goal,
      startedAt: input.startedAt,
      endedAt: now,
      plannedSec: input.plannedSec,
      actualSec: input.actualSec,
      completedNaturally: input.completedNaturally ? 1 : 0,
    });
    const { todayFocusMinutes } = get();
    set({
      todayFocusMinutes:
        todayFocusMinutes + Math.floor(input.actualSec / 60),
    });
  },
}));
