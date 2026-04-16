import { useEffect } from "react";
import { useDatabase } from "./useDatabase";
import {
  useInteractionsStore,
  type AddInteractionInput,
} from "../stores/useInteractionsStore";

export function useInteractionsData(contactId: string) {
  const { db, isReady } = useDatabase();
  const contactData = useInteractionsStore((s) => s.byContactId[contactId]);
  const store = useInteractionsStore();

  useEffect(() => {
    if (isReady && db && !contactData?.isLoaded) {
      void store.loadForContact(db, contactId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, db, contactId, contactData?.isLoaded]);

  return {
    isLoaded: contactData?.isLoaded ?? false,
    interactions: contactData?.interactions ?? [],
    topics: contactData?.topics ?? [],
    addInteraction: (input: Omit<AddInteractionInput, "contactId">) =>
      db
        ? store.addInteraction(db, { ...input, contactId })
        : Promise.resolve(undefined as unknown as import("../types").Interaction),
    removeInteraction: (id: string) =>
      db ? store.removeInteraction(db, id, contactId) : Promise.resolve(),
    addTopic: (topic: string) =>
      db
        ? store.addTopic(db, { contactId, topic })
        : Promise.resolve(undefined as unknown as import("../types").NextTopic),
    toggleTopicDone: (id: string, isDone: boolean) =>
      db ? store.toggleTopicDone(db, id, contactId, isDone) : Promise.resolve(),
    removeTopic: (id: string) =>
      db ? store.removeTopic(db, id, contactId) : Promise.resolve(),
  };
}
