import { create } from "zustand";
import { eq } from "drizzle-orm";
import type { Database } from "../db/client";
import { contacts as contactsTable } from "../db/schema";
import type { Contact, Interaction } from "../types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToContact(row: typeof contactsTable.$inferSelect): Contact {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    notes: row.notes ?? undefined,
    nudgeFrequencyDays: row.nudgeFrequencyDays,
    source: row.source,
    deviceContactId: row.deviceContactId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type AddContactInput = Omit<
  Contact,
  "id" | "createdAt" | "updatedAt" | "lastInteractionAt" | "lastInteractionType"
>;

interface PeopleState {
  contacts: Contact[];
  isLoaded: boolean;
  loadAll: (db: Database) => Promise<void>;
  addContact: (db: Database, input: AddContactInput) => Promise<Contact>;
  updateContact: (
    db: Database,
    id: string,
    patch: Partial<AddContactInput>,
  ) => Promise<void>;
  removeContact: (db: Database, id: string) => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
  patchContactMeta: (
    id: string,
    meta: { lastInteractionAt: string; lastInteractionType: Interaction["type"] },
  ) => void;
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
  contacts: [],
  isLoaded: false,

  loadAll: async (db) => {
    const rows = await db.select().from(contactsTable);
    set({ contacts: rows.map(rowToContact), isLoaded: true });
  },

  addContact: async (db, input) => {
    const now = new Date().toISOString();
    const contact: Contact = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    await db.insert(contactsTable).values({
      id: contact.id,
      name: contact.name,
      phone: contact.phone ?? null,
      notes: contact.notes ?? null,
      nudgeFrequencyDays: contact.nudgeFrequencyDays,
      source: contact.source,
      deviceContactId: contact.deviceContactId ?? null,
    });

    set((state) => ({ contacts: [...state.contacts, contact] }));
    return contact;
  },

  updateContact: async (db, id, patch) => {
    const now = new Date().toISOString();
    const dbPatch: Partial<typeof contactsTable.$inferInsert> = {
      updatedAt: now,
    };
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone ?? null;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes ?? null;
    if (patch.nudgeFrequencyDays !== undefined) {
      dbPatch.nudgeFrequencyDays = patch.nudgeFrequencyDays;
    }
    if (patch.source !== undefined) dbPatch.source = patch.source;
    if (patch.deviceContactId !== undefined) {
      dbPatch.deviceContactId = patch.deviceContactId ?? null;
    }

    await db.update(contactsTable).set(dbPatch).where(eq(contactsTable.id, id));

    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: now } : c,
      ),
    }));
  },

  removeContact: async (db, id) => {
    await db.delete(contactsTable).where(eq(contactsTable.id, id));
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    }));
  },

  getContactById: (id) => get().contacts.find((c) => c.id === id),

  patchContactMeta: (id, meta) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id
          ? { ...c, lastInteractionAt: meta.lastInteractionAt, lastInteractionType: meta.lastInteractionType }
          : c,
      ),
    })),
}));
