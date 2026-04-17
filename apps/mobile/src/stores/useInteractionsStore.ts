import { create } from "zustand";
import { eq, desc } from "drizzle-orm";
import type { Database } from "../db/client";
import {
  interactions as interactionsTable,
  nextTopics as nextTopicsTable,
} from "../db/schema";
import type { Interaction, NextTopic } from "../types";
import { usePeopleStore } from "./usePeopleStore";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToInteraction(row: typeof interactionsTable.$inferSelect): Interaction {
  return {
    id: row.id,
    contactId: row.contactId,
    type: row.type,
    note: row.note ?? undefined,
    aiSummary: row.aiSummary ?? undefined,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

function rowToTopic(row: typeof nextTopicsTable.$inferSelect): NextTopic {
  return {
    id: row.id,
    contactId: row.contactId,
    topic: row.topic,
    isDone: row.isDone === 1,
    createdAt: row.createdAt,
  };
}

export type AddInteractionInput = {
  contactId: string;
  type: Interaction["type"];
  note?: string;
  occurredAt?: string; // ISO string, defaults to now
};

export type AddTopicInput = {
  contactId: string;
  topic: string;
};

interface ContactData {
  interactions: Interaction[];
  topics: NextTopic[];
  isLoaded: boolean;
}

interface InteractionsState {
  byContactId: Record<string, ContactData>;
  loadForContact: (db: Database, contactId: string) => Promise<void>;
  addInteraction: (db: Database, input: AddInteractionInput) => Promise<Interaction>;
  removeInteraction: (db: Database, id: string, contactId: string) => Promise<void>;
  addTopic: (db: Database, input: AddTopicInput) => Promise<NextTopic>;
  toggleTopicDone: (db: Database, id: string, contactId: string, isDone: boolean) => Promise<void>;
  removeTopic: (db: Database, id: string, contactId: string) => Promise<void>;
  getInteractionsFor: (contactId: string) => Interaction[];
  getTopicsFor: (contactId: string) => NextTopic[];
}

export const useInteractionsStore = create<InteractionsState>((set, get) => ({
  byContactId: {},

  loadForContact: async (db, contactId) => {
    try {
      const [iRows, tRows] = await Promise.all([
        db
          .select()
          .from(interactionsTable)
          .where(eq(interactionsTable.contactId, contactId))
          .orderBy(desc(interactionsTable.occurredAt)),
        db
          .select()
          .from(nextTopicsTable)
          .where(eq(nextTopicsTable.contactId, contactId))
          .orderBy(nextTopicsTable.createdAt),
      ]);
      const interactions = iRows.map(rowToInteraction);
      const topics = tRows.map(rowToTopic);
      set((s) => ({
        byContactId: {
          ...s.byContactId,
          [contactId]: { interactions, topics, isLoaded: true },
        },
      }));
      if (interactions.length > 0) {
        const latest = interactions[0]!;
        usePeopleStore.getState().patchContactMeta(contactId, {
          lastInteractionAt: latest.occurredAt,
          lastInteractionType: latest.type,
        });
      }
    } catch (e) {
      console.error("[useInteractionsStore] loadForContact failed:", e);
      set((s) => ({
        byContactId: {
          ...s.byContactId,
          [contactId]: { interactions: [], topics: [], isLoaded: true },
        },
      }));
    }
  },

  addInteraction: async (db, input) => {
    const now = new Date().toISOString();
    const interaction: Interaction = {
      id: generateId(),
      contactId: input.contactId,
      type: input.type,
      note: input.note,
      occurredAt: input.occurredAt ?? now,
      createdAt: now,
    };
    try {
      await db.insert(interactionsTable).values({
        id: interaction.id,
        contactId: interaction.contactId,
        type: interaction.type,
        note: interaction.note ?? null,
        occurredAt: interaction.occurredAt,
      });
    } catch (e) {
      console.error("[useInteractionsStore] addInteraction failed:", e);
      throw e;
    }
    set((s) => {
      const prev = s.byContactId[input.contactId] ?? {
        interactions: [],
        topics: [],
        isLoaded: true,
      };
      return {
        byContactId: {
          ...s.byContactId,
          [input.contactId]: {
            ...prev,
            interactions: [interaction, ...prev.interactions],
          },
        },
      };
    });
    usePeopleStore.getState().patchContactMeta(input.contactId, {
      lastInteractionAt: interaction.occurredAt,
      lastInteractionType: interaction.type,
    });
    return interaction;
  },

  removeInteraction: async (db, id, contactId) => {
    try {
      await db.delete(interactionsTable).where(eq(interactionsTable.id, id));
    } catch (e) {
      console.error("[useInteractionsStore] removeInteraction failed:", e);
      throw e;
    }
    set((s) => {
      const prev = s.byContactId[contactId];
      if (!prev) return s;
      const interactions = prev.interactions.filter((i) => i.id !== id);
      const latest = interactions[0];
      if (latest) {
        usePeopleStore.getState().patchContactMeta(contactId, {
          lastInteractionAt: latest.occurredAt,
          lastInteractionType: latest.type,
        });
      }
      return {
        byContactId: {
          ...s.byContactId,
          [contactId]: {
            ...prev,
            interactions,
          },
        },
      };
    });
  },

  addTopic: async (db, input) => {
    const now = new Date().toISOString();
    const topic: NextTopic = {
      id: generateId(),
      contactId: input.contactId,
      topic: input.topic,
      isDone: false,
      createdAt: now,
    };
    try {
      await db.insert(nextTopicsTable).values({
        id: topic.id,
        contactId: topic.contactId,
        topic: topic.topic,
        isDone: 0,
      });
    } catch (e) {
      console.error("[useInteractionsStore] addTopic failed:", e);
      throw e;
    }
    set((s) => {
      const prev = s.byContactId[input.contactId] ?? {
        interactions: [],
        topics: [],
        isLoaded: true,
      };
      return {
        byContactId: {
          ...s.byContactId,
          [input.contactId]: { ...prev, topics: [...prev.topics, topic] },
        },
      };
    });
    return topic;
  },

  toggleTopicDone: async (db, id, contactId, isDone) => {
    try {
      await db
        .update(nextTopicsTable)
        .set({ isDone: isDone ? 1 : 0 })
        .where(eq(nextTopicsTable.id, id));
    } catch (e) {
      console.error("[useInteractionsStore] toggleTopicDone failed:", e);
      throw e;
    }
    set((s) => {
      const prev = s.byContactId[contactId];
      if (!prev) return s;
      return {
        byContactId: {
          ...s.byContactId,
          [contactId]: {
            ...prev,
            topics: prev.topics.map((t) =>
              t.id === id ? { ...t, isDone } : t,
            ),
          },
        },
      };
    });
  },

  removeTopic: async (db, id, contactId) => {
    try {
      await db.delete(nextTopicsTable).where(eq(nextTopicsTable.id, id));
    } catch (e) {
      console.error("[useInteractionsStore] removeTopic failed:", e);
      throw e;
    }
    set((s) => {
      const prev = s.byContactId[contactId];
      if (!prev) return s;
      return {
        byContactId: {
          ...s.byContactId,
          [contactId]: {
            ...prev,
            topics: prev.topics.filter((t) => t.id !== id),
          },
        },
      };
    });
  },

  getInteractionsFor: (contactId) =>
    get().byContactId[contactId]?.interactions ?? [],

  getTopicsFor: (contactId) =>
    get().byContactId[contactId]?.topics ?? [],
}));
