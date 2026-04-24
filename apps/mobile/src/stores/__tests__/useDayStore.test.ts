import { useDayStore } from "../useDayStore";
import {
  priorities as prioritiesTable,
  quickList as quickListTable,
} from "../../db/schema";
import type { Database } from "../../db/client";

type Row = Record<string, unknown>;

function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
}

function makeFakeDb() {
  const pRows: Row[] = [];
  const qRows: Row[] = [];
  const mRows: Row[] = [];

  let _selectFrom: unknown = null;

  const db = {
    insert: (table: unknown) => ({
      values: (v: Row | Row[]) => {
        const rows = Array.isArray(v) ? v : [v];

        const doInsert = () => {
          if (table === prioritiesTable) rows.forEach((r) => pRows.push({ ...r }));
          else if (table === quickListTable) rows.forEach((r) => qRows.push({ ...r }));
          else rows.forEach((r) => mRows.push({ ...r }));
        };

        return {
          // Thenable so `await db.insert(t).values(v)` works without chaining
          then: (
            resolve: (v: void) => unknown,
            reject: (e: unknown) => unknown,
          ) => {
            try { doInsert(); return Promise.resolve().then(resolve, reject); }
            catch (e) { return Promise.reject(e).then(resolve, reject); }
          },
          onConflictDoUpdate: ({ set: patch }: { target: unknown; set: Row }) => {
            if (table === prioritiesTable || table === quickListTable) {
              doInsert();
            } else {
              // Metadata upsert: update if key exists, otherwise insert
              const key = rows[0]?.key;
              const existing = mRows.find((r) => r.key === key);
              if (existing) Object.assign(existing, patch);
              else doInsert();
            }
            return Promise.resolve();
          },
        };
      },
    }),
    update: (table: unknown) => ({
      set: (patch: Row) => ({
        where: async () => {
          if (table === prioritiesTable) {
            const target = pRows.find((r) => r.id === patch.id) ?? pRows[0];
            if (target) Object.assign(target, patch);
          } else if (table === quickListTable) {
            const target = qRows.find((r) => r.id === patch.id) ?? qRows[0];
            if (target) Object.assign(target, patch);
          } else {
            // metadata upsert by key
            const target = mRows.find((r) => r.key === patch.key);
            if (target) Object.assign(target, patch);
            else mRows.push({ ...patch });
          }
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: async () => {
        if (table === prioritiesTable) pRows.length = 0;
        else if (table === quickListTable) qRows.length = 0;
        else mRows.length = 0;
      },
    }),
    select: () => ({
      from: (table: unknown) => {
        _selectFrom = table;
        const getRows = () => {
          const rows =
            _selectFrom === prioritiesTable
              ? pRows
              : _selectFrom === quickListTable
                ? qRows
                : mRows;
          return [...rows];
        };
        return {
          where: (_cond: unknown) => Promise.resolve(getRows()),
          then: (
            resolve: (v: Row[]) => unknown,
            reject: (e: unknown) => unknown,
          ) => Promise.resolve(getRows()).then(resolve, reject),
        };
      },
    }),
  } as unknown as Database;

  return { db, pRows, qRows, mRows };
}

function reset() {
  useDayStore.setState({
    priorities: [],
    quickList: [],
    tonight: "",
    pomodoroCount: 0,
    hasCheckedRollover: false,
    isLoaded: false,
  });
}

describe("useDayStore", () => {
  beforeEach(reset);

  // --- addPriority ---

  it("addPriority inserts a must priority and appends to state", async () => {
    const { db, pRows } = makeFakeDb();

    await useDayStore.getState().addPriority(db, { text: "Submit report", type: "must" });

    expect(pRows).toHaveLength(1);
    expect(pRows[0]).toMatchObject({ text: "Submit report", type: "must" });

    const { priorities } = useDayStore.getState();
    expect(priorities).toHaveLength(1);
    expect(priorities[0]?.text).toBe("Submit report");
    expect(priorities[0]?.isCompleted).toBe(false);
  });

  it("addPriority enforces max 3 must priorities", async () => {
    const { db } = makeFakeDb();

    await useDayStore.getState().addPriority(db, { text: "Must 1", type: "must" });
    await useDayStore.getState().addPriority(db, { text: "Must 2", type: "must" });
    await useDayStore.getState().addPriority(db, { text: "Must 3", type: "must" });

    await expect(
      useDayStore.getState().addPriority(db, { text: "Must 4", type: "must" }),
    ).rejects.toThrow();
  });

  it("addPriority allows win and overdue even when 3 must entries exist", async () => {
    const { db } = makeFakeDb();

    await useDayStore.getState().addPriority(db, { text: "Must 1", type: "must" });
    await useDayStore.getState().addPriority(db, { text: "Must 2", type: "must" });
    await useDayStore.getState().addPriority(db, { text: "Must 3", type: "must" });
    await useDayStore.getState().addPriority(db, { text: "Win 1", type: "win" });

    const { priorities } = useDayStore.getState();
    expect(priorities).toHaveLength(4);
  });

  // --- togglePriority ---

  it("togglePriority marks priority completed and sets completedAt", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().addPriority(db, { text: "Task", type: "win" });

    const id = useDayStore.getState().priorities[0]!.id;
    await useDayStore.getState().togglePriority(db, id);

    const updated = useDayStore.getState().priorities[0]!;
    expect(updated.isCompleted).toBe(true);
    expect(updated.completedAt).not.toBeNull();
  });

  it("togglePriority unchecks completed priority and clears completedAt", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().addPriority(db, { text: "Task", type: "win" });

    const id = useDayStore.getState().priorities[0]!.id;
    await useDayStore.getState().togglePriority(db, id);
    await useDayStore.getState().togglePriority(db, id);

    const updated = useDayStore.getState().priorities[0]!;
    expect(updated.isCompleted).toBe(false);
    expect(updated.completedAt).toBeNull();
  });

  // --- deletePriority ---

  it("deletePriority removes priority from state", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().addPriority(db, { text: "Task", type: "must" });

    const id = useDayStore.getState().priorities[0]!.id;
    await useDayStore.getState().deletePriority(db, id);

    expect(useDayStore.getState().priorities).toHaveLength(0);
  });

  // --- updatePriority ---

  it("updatePriority changes text in state", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().addPriority(db, { text: "Old text", type: "must" });

    const id = useDayStore.getState().priorities[0]!.id;
    await useDayStore.getState().updatePriority(db, id, { text: "New text" });

    expect(useDayStore.getState().priorities[0]?.text).toBe("New text");
  });

  // --- rollover ---

  it("checkRollover returns count of yesterday incomplete priorities from DB", async () => {
    const { db, pRows } = makeFakeDb();

    // Seed yesterday incomplete rows into the fake DB
    pRows.push(
      { id: "y1", text: "Old task", type: "must", date: yesterdayISO(), completed: 0 },
      { id: "y2", text: "Old win", type: "win", date: yesterdayISO(), completed: 0 },
    );

    const count = await useDayStore.getState().checkRollover(db);
    expect(count).toBe(2);
  });

  it("rollover copies incomplete rows with today date and rolledOverFrom", async () => {
    const { db, pRows } = makeFakeDb();

    // Seed yesterday's incomplete rows
    pRows.push({
      id: "y1",
      text: "Carry forward",
      type: "must",
      date: yesterdayISO(),
      completed: 0,
      completedAt: null,
      sortOrder: 0,
      rolledOverFrom: null,
      createdAt: new Date().toISOString(),
    });

    await useDayStore.getState().rollover(db);

    const todayRow = pRows.find((r) => r.date === todayISO());
    expect(todayRow).toBeDefined();
    expect(todayRow?.rolledOverFrom).toBe(yesterdayISO());
    expect(todayRow?.text).toBe("Carry forward");
    expect(todayRow?.completed).toBe(0);
  });

  it("checkRollover returns 0 after rollover() runs (prevents duplicate prompts on restart)", async () => {
    const { db, pRows } = makeFakeDb();

    pRows.push({
      id: "y1",
      text: "Carry forward",
      type: "must",
      date: yesterdayISO(),
      completed: 0,
      completedAt: null,
      sortOrder: 0,
      rolledOverFrom: null,
      createdAt: new Date().toISOString(),
    });

    // First checkRollover returns 1 (one incomplete yesterday row)
    const before = await useDayStore.getState().checkRollover(db);
    expect(before).toBe(1);

    // After rolling over, checkRollover returns 0 even on simulated app restart
    await useDayStore.getState().rollover(db);
    const after = await useDayStore.getState().checkRollover(db);
    expect(after).toBe(0);
  });

  // --- quickList ---

  it("addQuickItem appends to quickList state", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().addQuickItem(db, "Buy milk");

    const { quickList } = useDayStore.getState();
    expect(quickList).toHaveLength(1);
    expect(quickList[0]?.text).toBe("Buy milk");
    expect(quickList[0]?.isCompleted).toBe(false);
  });

  it("toggleQuickItem flips completed", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().addQuickItem(db, "Buy milk");

    const id = useDayStore.getState().quickList[0]!.id;
    await useDayStore.getState().toggleQuickItem(db, id);

    expect(useDayStore.getState().quickList[0]?.isCompleted).toBe(true);
  });

  it("deleteQuickItem removes item from state", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().addQuickItem(db, "Buy milk");

    const id = useDayStore.getState().quickList[0]!.id;
    await useDayStore.getState().deleteQuickItem(db, id);

    expect(useDayStore.getState().quickList).toHaveLength(0);
  });

  // --- tonight ---

  it("setTonight updates tonight in state", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().setTonight(db, "Read → Sleep by 11");

    expect(useDayStore.getState().tonight).toBe("Read → Sleep by 11");
  });

  // --- pomodoroCount ---

  it("incrementPomodoro increases count by 1", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().incrementPomodoro(db);
    await useDayStore.getState().incrementPomodoro(db);

    expect(useDayStore.getState().pomodoroCount).toBe(2);
  });
});
