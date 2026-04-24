import { useEffect } from "react";
import { useDatabase } from "./useDatabase";
import {
  usePeopleStore,
  type AddContactInput,
} from "../stores/usePeopleStore";

export function usePeopleData() {
  const { db, isReady } = useDatabase();
  const store = usePeopleStore();

  useEffect(() => {
    if (isReady && db && !store.isLoaded) {
      void store.loadAll(db);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, db, store.isLoaded]);

  return {
    // state
    isLoaded: store.isLoaded,
    contacts: store.contacts,
    getContactById: store.getContactById,

    // actions (forward db automatically)
    addContact: (input: AddContactInput) =>
      db ? store.addContact(db, input) : Promise.resolve(undefined),
    updateContact: (
      id: string,
      patch: Parameters<typeof store.updateContact>[2],
    ) => (db ? store.updateContact(db, id, patch) : Promise.resolve()),
    removeContact: (id: string) =>
      db ? store.removeContact(db, id) : Promise.resolve(),
  };
}
