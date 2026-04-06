import { Storage as storage } from "expo-sqlite/kv-store";

/**
 * Loads a string from storage.
 *
 * @param key The key to fetch.
 */
export async function loadString(key: string): Promise<string | null> {
  try {
    const data = await storage.getItem(key);
    if (!data) return null;
    return data;
  } catch {
    // not sure why this would fail... even reading the RN docs I'm unclear
    return null;
  }
}

/**
 * Saves a string to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export async function saveString(key: string, value: string): Promise<boolean> {
  try {
    await storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads something from storage and runs it thru JSON.parse.
 *
 * @param key The key to fetch.
 */
export async function load<T>(key: string): Promise<T | null> {
  try {
    const data = await loadString(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Saves an object to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export async function save<T>(key: string, value: T): Promise<boolean> {
  try {
    const data = JSON.stringify(value);
    return await saveString(key, data);
  } catch {
    return false;
  }
}

/**
 * Removes something from storage.
 *
 * @param key The key to kill.
 */
export async function remove(key: string): Promise<boolean> {
  try {
    await storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Burn it all to the ground.
 */
export async function clear(): Promise<boolean> {
  try {
    await storage.clear();
    return true;
  } catch {
    return false;
  }
}
