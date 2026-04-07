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
import migrations from "../db/drizzle/migrations";

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
        .then(onReady)
        .catch((err) =>
          console.error("[DatabaseProvider] Seed error:", err)
        );
    }
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
