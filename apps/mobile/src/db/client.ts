import * as Updates from "expo-updates";
import {
  documentDirectory,
  getInfoAsync,
  copyAsync,
  deleteAsync,
  readDirectoryAsync,
} from "expo-file-system/legacy";
import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { schema } from "./schema";
import { deleteAllModels } from "../services/modelDownloader";

function getDbFileName(): string {
  if (__DEV__) {
    return "clawdi-dev.db";
  }

  const channel = Updates.channel;
  if (!channel) {
    throw new Error(
      "expo-updates channel is not available in production. Cannot determine database file name."
    );
  }

  const sanitized = channel.replace(/\//g, "-");
  return `clawdi-${sanitized}.db`;
}

async function copyMainDbIfNeeded(dbFileName: string): Promise<void> {
  if (dbFileName === "clawdi-main.db") return;

  if (!documentDirectory) return;

  const mainDbPath = `${documentDirectory}SQLite/clawdi-main.db`;
  const channelDbPath = `${documentDirectory}SQLite/${dbFileName}`;

  const [mainDbInfo, channelDbInfo] = await Promise.all([
    getInfoAsync(mainDbPath),
    getInfoAsync(channelDbPath),
  ]);

  if (mainDbInfo.exists && !channelDbInfo.exists) {
    await copyAsync({ from: mainDbPath, to: channelDbPath });
  }
}

export async function createDatabase() {
  const dbFileName = getDbFileName();
  await copyMainDbIfNeeded(dbFileName);
  const expoDb = openDatabaseSync(dbFileName);
  return drizzle(expoDb, { schema });
}

export type Database = Awaited<ReturnType<typeof createDatabase>>;

export async function deleteDatabase(): Promise<void> {
  if (!documentDirectory) return;
  const sqliteDir = `${documentDirectory}SQLite`;
  try {
    const files = await readDirectoryAsync(sqliteDir);
    await Promise.all(
      files
        .filter((f) => f.endsWith(".db") || f.endsWith(".db-shm") || f.endsWith(".db-wal"))
        .map((f) => deleteAsync(`${sqliteDir}/${f}`, { idempotent: true })),
    );
  } catch {
    // SQLite directory may not exist yet — nothing to delete
  }
  deleteAllModels();
  await Updates.reloadAsync();
}
