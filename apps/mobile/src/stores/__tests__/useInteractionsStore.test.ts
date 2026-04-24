import { useInteractionsStore } from "../useInteractionsStore";
import { usePeopleStore } from "../usePeopleStore";
import { interactions as interactionsTable } from "../../db/schema";
import type { Database } from "../../db/client";

type Row = Record<string, unknown>;

function makeFakeDb() {
  const iRows: Row[] = [];  // interaction rows
  const tRows: Row[] = [];  // topic rows

  const db = {
    insert: (_table: unknown) => ({
      values: async (v: Row) => {
        if ("type" in v && "contactId" in v) iRows.push({ ...v });
        else tRows.push({ ...v });
      },
    }),
    update: (_table: unknown) => ({
      set: (patch: Row) => ({
        where: async () => {
          const rows = "isDone" in patch ? tRows : iRows;
          if (rows[0]) Object.assign(rows[0], patch);
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: async () => {
        if (table === interactionsTable) iRows.length = 0;
        else tRows.length = 0;
      },
    }),
    select: () => ({
      from: (_table: unknown) => ({
        where: (_cond: unknown) => ({
          orderBy: async () => [],
        }),
      }),
    }),
  } as unknown as Database;

  return { db, iRows, tRows };
}

function resetAll() {
  useInteractionsStore.setState({ byContactId: {} });
  usePeopleStore.setState({ contacts: [], isLoaded: false });
}

describe("useInteractionsStore", () => {
  beforeEach(resetAll);

  it("addInteraction inserts row and prepends to state", async () => {
    const { db, iRows } = makeFakeDb();

    const result = await useInteractionsStore.getState().addInteraction(db, {
      contactId: "c1",
      type: "call",
      note: "quick catch-up",
    });

    expect(result.id).toBeTruthy();
    expect(result.type).toBe("call");
    expect(iRows).toHaveLength(1);
    expect(iRows[0]).toMatchObject({ contactId: "c1", type: "call" });

    const state = useInteractionsStore.getState().byContactId["c1"];
    expect(state?.interactions).toHaveLength(1);
    expect(state?.interactions[0]?.note).toBe("quick catch-up");
  });

  it("addInteraction calls patchContactMeta on people store", async () => {
    const { db } = makeFakeDb();
    // Seed a contact in people store
    usePeopleStore.setState({
      contacts: [
        { id: "c1", name: "Maria", nudgeFrequencyDays: 14, source: "manual", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
      ],
      isLoaded: true,
    });

    await useInteractionsStore.getState().addInteraction(db, {
      contactId: "c1",
      type: "coffee",
    });

    const contact = usePeopleStore.getState().contacts[0]!;
    expect(contact.lastInteractionAt).toBeTruthy();
    expect(contact.lastInteractionType).toBe("coffee");
  });

  it("removeInteraction removes from state", async () => {
    const { db } = makeFakeDb();
    const i = await useInteractionsStore.getState().addInteraction(db, {
      contactId: "c1",
      type: "text",
    });

    await useInteractionsStore.getState().removeInteraction(db, i.id, "c1");

    const state = useInteractionsStore.getState().byContactId["c1"];
    expect(state?.interactions).toHaveLength(0);
  });

  it("addTopic inserts row and appends to state", async () => {
    const { db, tRows } = makeFakeDb();

    const topic = await useInteractionsStore.getState().addTopic(db, {
      contactId: "c1",
      topic: "ask about new job",
    });

    expect(topic.id).toBeTruthy();
    expect(topic.isDone).toBe(false);
    expect(tRows).toHaveLength(1);

    const state = useInteractionsStore.getState().byContactId["c1"];
    expect(state?.topics[0]?.topic).toBe("ask about new job");
  });

  it("toggleTopicDone flips isDone in state", async () => {
    const { db } = makeFakeDb();
    const topic = await useInteractionsStore.getState().addTopic(db, {
      contactId: "c1",
      topic: "ask about new job",
    });

    await useInteractionsStore.getState().toggleTopicDone(db, topic.id, "c1", true);

    const updated = useInteractionsStore.getState().byContactId["c1"]?.topics[0];
    expect(updated?.isDone).toBe(true);
  });

  it("removeTopic removes from state", async () => {
    const { db } = makeFakeDb();
    const topic = await useInteractionsStore.getState().addTopic(db, {
      contactId: "c1",
      topic: "ask about new job",
    });

    await useInteractionsStore.getState().removeTopic(db, topic.id, "c1");

    const state = useInteractionsStore.getState().byContactId["c1"];
    expect(state?.topics).toHaveLength(0);
  });
});
