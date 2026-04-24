import { create } from "zustand";
import { load, save } from "@/utils/storage/storage";

/**
 * Per-account inclusion filter for budget/dashboard computations.
 *
 * Stored as a single KV blob (not Zustand's `persist` middleware) so that
 * hydration is explicit and can be ordered after schema migrations & seeds
 * inside `DatabaseProvider`.
 *
 * Semantics:
 *   - `includedAccountIds` is a list of account ids that the user wants
 *     rolled into budget numbers (total balance, month income/spent, etc.).
 *   - An EMPTY list means "include all accounts" — the pre-feature default.
 *     This keeps the store backwards-compatible with users who never open
 *     the filter UI.
 */
const KEY = "budget:config:v1";

interface BudgetConfig {
  /** Empty array = include all accounts. */
  includedAccountIds: string[];
}

interface BudgetConfigState extends BudgetConfig {
  /** True once `hydrate()` has resolved at least once. */
  hydrated: boolean;
  /** Read persisted value from KV into the store. Idempotent. */
  hydrate: () => Promise<void>;
  /** Replace the inclusion list in state and persist it to KV. */
  setIncludedAccountIds: (ids: string[]) => Promise<void>;
}

export const useBudgetConfigStore = create<BudgetConfigState>((set) => ({
  includedAccountIds: [],
  hydrated: false,
  hydrate: async () => {
    const stored = await load<BudgetConfig>(KEY);
    if (stored) {
      set({
        includedAccountIds: stored.includedAccountIds ?? [],
        hydrated: true,
      });
      return;
    }
    set({ hydrated: true });
  },
  setIncludedAccountIds: async (ids) => {
    set({ includedAccountIds: ids });
    await save<BudgetConfig>(KEY, { includedAccountIds: ids });
  },
}));
