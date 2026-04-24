import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { createDatabase, Database } from "../db/client";
import { seedDatabase } from "../db/seed";
import { backfillTransactionTimestamp } from "../db/migrations/backfillTransactionTimestamp";
import migrations from "../db/drizzle/migrations";
import { loadString, saveString } from "../utils/storage/storage";

const TX_TIMESTAMP_BACKFILL_KEY = "migration:tx-ts-v1";

async function runOneTimeDataMigrations(db: Database): Promise<void> {
  const done = await loadString(TX_TIMESTAMP_BACKFILL_KEY);
  if (done === "1") return;
  await backfillTransactionTimestamp(db);
  await saveString(TX_TIMESTAMP_BACKFILL_KEY, "1");
}

interface DatabaseContextValue {
  db: Database | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
});

function MigrationRunner({
  db,
  onReady,
}: {
  db: Database;
  onReady: () => void;
}) {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (error) {
      console.error("[DatabaseProvider] Migration error:", error);
    }
    if (success) {
      seedDatabase(db)
        .then(() => runOneTimeDataMigrations(db))
        .then(onReady)
        .catch((err) =>
          console.error("[DatabaseProvider] Seed/migration error:", err)
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error]);

  return null;
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    createDatabase()
      .then(setDb)
      .catch((err) => console.error("[DatabaseProvider] Init error:", err));
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {db && (
        <MigrationRunner db={db} onReady={() => setIsReady(true)} />
      )}
      {isReady ? children : null}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}
