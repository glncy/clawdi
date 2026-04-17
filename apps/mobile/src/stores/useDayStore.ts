import { create } from "zustand";
import { eq, and } from "drizzle-orm";
import type { Database } from "../db/client";
import {
  priorities as prioritiesTable,
  quickList as quickListTable,
  metadata as metadataTable,
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
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
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

function tonightKey(date: string) {
  return `tonight_${date}`;
}

interface DayState {
  priorities: Priority[];
  quickList: QuickListItem[];
  tonight: string;
  pomodoroCount: number;
  hasCheckedRollover: boolean;
  isLoaded: boolean;

  loadToday: (db: Database) => Promise<void>;

  addPriority: (
    db: Database,
    input: { text: string; type: Priority["type"] },
  ) => Promise<void>;
  togglePriority: (db: Database, id: string) => Promise<void>;
  updatePriority: (
    db: Database,
    id: string,
    patch: { text?: string; type?: Priority["type"] },
  ) => Promise<void>;
  deletePriority: (db: Database, id: string) => Promise<void>;

  checkRollover: (db: Database) => Promise<number>;
  rollover: (db: Database) => Promise<void>;
  markRolloverChecked: () => void;

  addQuickItem: (db: Database, text: string) => Promise<void>;
  toggleQuickItem: (db: Database, id: string) => Promise<void>;
  deleteQuickItem: (db: Database, id: string) => Promise<void>;

  setTonight: (db: Database, text: string) => Promise<void>;
  getYesterdayTonight: (db: Database) => Promise<string | null>;

  incrementPomodoro: (db: Database) => Promise<void>;
}

export const useDayStore = create<DayState>((set, get) => ({
  priorities: [],
  quickList: [],
  tonight: "",
  pomodoroCount: 0,
  hasCheckedRollover: false,
  isLoaded: false,

  loadToday: async (db) => {
    const today = todayISO();

    const [pRows, qRows, tonightRow, pomodoroRow] = await Promise.all([
      db
        .select()
        .from(prioritiesTable)
        .where(eq(prioritiesTable.date, today)),
      db.select().from(quickListTable).where(eq(quickListTable.completed, 0)),
      db
        .select()
        .from(metadataTable)
        .where(eq(metadataTable.key, tonightKey(today))),
      db
        .select()
        .from(metadataTable)
        .where(eq(metadataTable.key, pomodoroKey(today))),
    ]);

    set({
      priorities: (pRows as PriorityRow[]).map(rowToPriority),
      quickList: (qRows as QuickListRow[]).map(rowToQuickItem),
      tonight: (tonightRow[0] as { value?: string } | undefined)?.value ?? "",
      pomodoroCount: parseInt(
        (pomodoroRow[0] as { value?: string } | undefined)?.value ?? "0",
        10,
      ),
      isLoaded: true,
    });
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
    const sortOrder = priorities.filter((p) => p.type === type).length;
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

  checkRollover: async (db) => {
    const yesterday = yesterdayISO();
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
    const newPriorities: Priority[] = [];

    for (const row of incompleteRows as PriorityRow[]) {
      const id = generateId();
      await db.insert(prioritiesTable).values({
        id,
        text: row.text,
        type: row.type,
        date: today,
        completed: 0,
        completedAt: null,
        sortOrder: row.sortOrder,
        rolledOverFrom: yesterday,
      });

      newPriorities.push({
        id,
        text: row.text,
        type: row.type,
        isCompleted: false,
        date: today,
        completedAt: null,
        sortOrder: row.sortOrder,
        rolledOverFrom: yesterday,
        createdAt: now,
      });
    }

    set((state) => ({
      priorities: [...state.priorities, ...newPriorities],
    }));
  },

  markRolloverChecked: () => set({ hasCheckedRollover: true }),

  addQuickItem: async (db, text) => {
    const { quickList } = get();
    const now = new Date().toISOString();

    const newItem: QuickListItem = {
      id: generateId(),
      text,
      isCompleted: false,
      completedAt: null,
      sortOrder: quickList.length,
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

  setTonight: async (db, text) => {
    const today = todayISO();
    const key = tonightKey(today);
    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(metadataTable)
      .where(eq(metadataTable.key, key));

    if (existing.length > 0) {
      await db
        .update(metadataTable)
        .set({ value: text, updatedAt: now } as Parameters<
          ReturnType<typeof db.update>["set"]
        >[0])
        .where(eq(metadataTable.key, key));
    } else {
      await db.insert(metadataTable).values({ key, value: text });
    }

    set({ tonight: text });
  },

  getYesterdayTonight: async (db) => {
    const yesterday = yesterdayISO();
    const key = tonightKey(yesterday);
    const rows = await db
      .select()
      .from(metadataTable)
      .where(eq(metadataTable.key, key));
    return (rows[0] as { value?: string } | undefined)?.value ?? null;
  },

  incrementPomodoro: async (db) => {
    const today = todayISO();
    const key = pomodoroKey(today);
    const now = new Date().toISOString();

    const { pomodoroCount } = get();
    const newCount = pomodoroCount + 1;

    const existing = await db
      .select()
      .from(metadataTable)
      .where(eq(metadataTable.key, key));

    if (existing.length > 0) {
      await db
        .update(metadataTable)
        .set({
          value: String(newCount),
          updatedAt: now,
        } as Parameters<ReturnType<typeof db.update>["set"]>[0])
        .where(eq(metadataTable.key, key));
    } else {
      await db
        .insert(metadataTable)
        .values({ key, value: String(newCount) });
    }

    set({ pomodoroCount: newCount });
  },
}));
