import { StateStorage, createJSONStorage } from "zustand/middleware";
import { loadString, saveString, remove } from "./storage";

export const zustandStorageWrapper: StateStorage = {
  getItem: loadString,
  setItem: saveString,
  removeItem: remove,
};

export const zustandStorage = createJSONStorage(() => zustandStorageWrapper);
