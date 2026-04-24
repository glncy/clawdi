# Finance Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver 7 user-requested improvements to the Finance tab — working AI parsing (text + voice-placeholder) on all three Add sheets with a new centered-circle layout, a hash+time-bucketed insight cache, missing fields on Add Transaction, a polished Add Account flow with user-managed account types, a "once" option for reminders, a Budget Settings screen, and a larger default category icon.

**Architecture:**
- **UI:** Reuse a single `AIParseSheetBody` molecule across AddTransaction / AddAccount / AddBill so all three sheets share the centered-circle tap-to-talk + text input + manual button layout. Voice circle is a visual placeholder for now (no `expo-speech-recognition` install).
- **Data:** Three SQLite migrations — new `accountTypes` table (CRUD, seeded), `recurringBills` gets `isArchived` + `"once"` frequency, `transactions.date` upgraded to ISO timestamp with backfill from `createdAt`. New `budgetConfig` singleton via `expo-sqlite/kv-store` for per-account budget inclusion.
- **Caching:** Finance insight keyed by `SHA-like hash(canonicalJSON(snapshot)) + dayBucket`, stored in the existing `expo-sqlite/kv-store` utility at `src/utils/storage/storage.ts`. Dead `generatedRef` guard removed.

**Tech Stack:** React Native / Expo Router / HeroUI Native / Uniwind / Zustand / Drizzle ORM on `expo-sqlite` / `expo-sqlite/kv-store` / `@react-native-ai/llama` + local transaction parser.

**Ordering note:** Phases 1 (data foundation) and 2 (insight cache) are independent and can run in parallel. Phase 3 (shared sheet body) is a prerequisite for Phases 4–6 (per-sheet feature work). Phase 7 (Budget Settings) depends on Phase 1's `budgetConfig` store.

---

## Phase 0 — Branch & baseline

### Task 0.1: Verify baseline

- [ ] **Step 1: Confirm branch & clean tree**

Run: `git status && git branch --show-current`
Expected: working tree clean, on the worktree branch (not `main`).

- [ ] **Step 2: Confirm app boots**

Run: `bun run --cwd apps/mobile ios` (or `android`) and verify Money tab renders. Expected: dashboard with accounts, transactions, bills, insight card all visible.

- [ ] **Step 3: Run existing tests as baseline**

Run: `bun run --cwd apps/mobile test`
Expected: green. Record pass count; later phases must not regress it.

---

## Phase 1 — Schema & data foundation

### Task 1.1: Add `accountTypes` table (user-CRUD, same pattern as categories)

**Files:**
- Create: `apps/mobile/src/db/schema/accountTypes.ts`
- Modify: `apps/mobile/src/db/schema/index.ts` (export new table)
- Create: `apps/mobile/drizzle/NNNN_account_types.sql` (generated)
- Modify: `apps/mobile/src/db/seed.ts` (seed 5 built-in types)
- Modify: `apps/mobile/src/db/schema/accounts.ts` (remove `type` enum constraint — store as plain text referencing `accountTypes.id` or `.name`)

- [ ] **Step 1: Write the schema**

```ts
// apps/mobile/src/db/schema/accountTypes.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const accountTypes = sqliteTable("account_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(), // emoji
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type AccountTypeRow = typeof accountTypes.$inferSelect;
export type NewAccountType = typeof accountTypes.$inferInsert;
```

- [ ] **Step 2: Relax `accounts.type` to plain text**

Open `apps/mobile/src/db/schema/accounts.ts` and change the `type` column from the enum form to `text("type").notNull()` with no enum list. Keep everything else.

- [ ] **Step 3: Export from schema index**

Add `export * from "./accountTypes";` to `apps/mobile/src/db/schema/index.ts`.

- [ ] **Step 4: Generate migration**

Run: `bun run --cwd apps/mobile db:generate`
Expected: new `drizzle/NNNN_*.sql` created containing `CREATE TABLE account_types` + column change for `accounts`. Review SQL — it must preserve existing `accounts` rows (Drizzle sqlite handles this via rebuild; verify the generated file does NOT drop data).

- [ ] **Step 5: Seed built-in types**

Modify `apps/mobile/src/db/seed.ts` — add a `seedAccountTypes()` function that inserts these 5 rows if not present (check by `id`):

```ts
const BUILT_IN_ACCOUNT_TYPES = [
  { id: "type-checking", name: "Checking", icon: "💳", isDefault: true, sortOrder: 0 },
  { id: "type-savings", name: "Savings", icon: "🏦", isDefault: true, sortOrder: 1 },
  { id: "type-credit", name: "Credit", icon: "💰", isDefault: true, sortOrder: 2 },
  { id: "type-cash", name: "Cash", icon: "💵", isDefault: true, sortOrder: 3 },
  { id: "type-investment", name: "Investment", icon: "📈", isDefault: true, sortOrder: 4 },
];
```

Call `seedAccountTypes()` from the same init path that seeds categories.

- [ ] **Step 6: Write a unit test for the seed idempotency**

Create `apps/mobile/src/db/__tests__/accountTypes.seed.test.ts` — run seed twice, assert count is still 5.

- [ ] **Step 7: Run tests & migration**

Run: `bun run --cwd apps/mobile test -- accountTypes.seed`
Expected: green.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/db/schema/accountTypes.ts apps/mobile/src/db/schema/index.ts apps/mobile/src/db/schema/accounts.ts apps/mobile/src/db/seed.ts apps/mobile/drizzle apps/mobile/src/db/__tests__/accountTypes.seed.test.ts
git commit -m "feat(db): add accountTypes table with seeded built-ins"
```

### Task 1.2: Extend `useFinanceStore` with `accountTypes` CRUD

**Files:**
- Modify: `apps/mobile/src/stores/useFinanceStore.ts`
- Modify: `apps/mobile/src/types/index.ts` (add `AccountType` interface)

- [ ] **Step 1: Add type**

```ts
// apps/mobile/src/types/index.ts (add near Category)
export interface AccountType {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
  sortOrder: number;
}
```

- [ ] **Step 2: Add store slice**

In `useFinanceStore.ts`, mirror the existing `categories` slice (`addCategory`, `updateCategory`, `deleteCategory`, `loadCategories`) — add `accountTypes: AccountType[]`, `addAccountType`, `updateAccountType`, `deleteAccountType`, `loadAccountTypes`. Each DB op uses `db.insert(accountTypes)` / `.update()` / `.delete()`.

- [ ] **Step 3: Load at app init**

Find where `loadCategories` is called on app boot (likely the same place `useFinanceStore` hydrates). Add `loadAccountTypes()` adjacent to it.

- [ ] **Step 4: Test the slice**

Extend `apps/mobile/src/stores/__tests__/useFinanceStore.test.ts` (or create if absent) — add CRUD round-trip: add → assert list length, update → assert fields, delete a non-default → assert removed. Deleting a default type should be allowed (user may curate), but warn in UI later.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/stores/useFinanceStore.ts apps/mobile/src/types/index.ts apps/mobile/src/stores/__tests__
git commit -m "feat(store): accountTypes CRUD in useFinanceStore"
```

### Task 1.3: `recurringBills` — add `"once"` frequency + `isArchived` flag

**Files:**
- Modify: `apps/mobile/src/db/schema/recurringBills.ts`
- Create: `apps/mobile/drizzle/NNNN_bills_once.sql` (generated)
- Modify: `apps/mobile/src/types/index.ts` (widen `RecurringBill.frequency` union, add `isArchived`)
- Modify: `apps/mobile/src/stores/useFinanceStore.ts` (update bill CRUD + `markBillPaid` auto-archive for `once`)

- [ ] **Step 1: Update schema**

```ts
// apps/mobile/src/db/schema/recurringBills.ts — change these two lines
frequency: text("frequency", { enum: ["once", "weekly", "monthly", "yearly"] }).notNull(),
// add:
isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
```

- [ ] **Step 2: Generate migration**

Run: `bun run --cwd apps/mobile db:generate`
Verify SQL preserves existing rows (sqlite rebuild for enum change is fine; `isArchived` defaults to `false` for existing rows).

- [ ] **Step 3: Update type**

In `apps/mobile/src/types/index.ts`, widen the `RecurringBill` interface: `frequency: "once" | "weekly" | "monthly" | "yearly"` and add `isArchived: boolean`.

- [ ] **Step 4: Auto-archive on mark-paid for `once`**

Find `markBillPaid` (or similar) in `useFinanceStore.ts`. Change it so that if the bill's `frequency === "once"`, set `isArchived: true` instead of advancing `nextDueDate`.

- [ ] **Step 5: Exclude archived from active lists**

Find selectors used by `RecurringBillsSection` and the Finance Dashboard. Filter with `!bill.isArchived`.

- [ ] **Step 6: Test**

Add a unit test: create a `once` bill → `markBillPaid` → assert `isArchived === true` and it's excluded from active bills selector.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/db/schema/recurringBills.ts apps/mobile/drizzle apps/mobile/src/types/index.ts apps/mobile/src/stores/useFinanceStore.ts apps/mobile/src/stores/__tests__
git commit -m "feat(bills): add 'once' frequency with auto-archive on mark-paid"
```

### Task 1.4: `transactions.date` → ISO timestamp (with backfill)

**Files:**
- Modify: `apps/mobile/src/db/schema/transactions.ts`
- Create: `apps/mobile/drizzle/NNNN_tx_timestamp.sql` (generated; MUST include a custom backfill)

- [ ] **Step 1: Update schema comment & spec**

```ts
// apps/mobile/src/db/schema/transactions.ts
date: text("date").notNull(), // ISO 8601 timestamp, e.g. 2026-04-24T14:30:00.000Z
```

No column type change — sqlite `text` already holds both forms. The change is semantic.

- [ ] **Step 2: Write a one-time data migration**

Create `apps/mobile/src/db/migrations/backfillTransactionTimestamp.ts`:

```ts
import { db } from "../client";
import { transactions } from "../schema/transactions";
import { eq } from "drizzle-orm";

// Idempotent: only touches rows whose date is still YYYY-MM-DD (length 10, no 'T')
export async function backfillTransactionTimestamp() {
  const all = await db.select().from(transactions);
  for (const row of all) {
    if (row.date && row.date.length === 10 && !row.date.includes("T")) {
      // Merge YYYY-MM-DD with createdAt's time portion
      const createdAt = row.createdAt; // "YYYY-MM-DD HH:MM:SS"
      const time = createdAt.includes(" ")
        ? createdAt.split(" ")[1]
        : "12:00:00";
      const iso = new Date(`${row.date}T${time}Z`).toISOString();
      await db.update(transactions).set({ date: iso }).where(eq(transactions.id, row.id));
    }
  }
}
```

- [ ] **Step 3: Run on boot (once)**

Find the app-init path that runs migrations / seeds. Add a guarded call — check a `migration:tx-ts-v1` key in `expo-sqlite/kv-store`; if not set, run `backfillTransactionTimestamp()` then set the key.

- [ ] **Step 4: Update all code reading `.date`**

Grep for `\.date` on transactions across the app — places that format or compare must handle ISO. Key landmarks:
- `useFinanceData.ts` — computes today/week spending: use `startOfDay/startOfWeek` from `date-fns` with `new Date(tx.date)` instead of string equality.
- `transactions.tsx` screen — group-by-day: bucket by `format(new Date(tx.date), "yyyy-MM-dd")`.
- `TransactionRow.tsx` — display: use `format(new Date(tx.date), "MMM d, h:mma")`.

- [ ] **Step 5: Test the backfill**

Unit test: insert a row with `date="2026-04-01"` and `createdAt="2026-04-01 09:30:00"` → run backfill → assert the row's date is the ISO `2026-04-01T09:30:00.000Z`.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/db/schema/transactions.ts apps/mobile/src/db/migrations apps/mobile/src/hooks/useFinanceData.ts apps/mobile/src/app/\(main\)/\(tabs\)/money/transactions.tsx apps/mobile/src/components/molecules/TransactionRow
git commit -m "feat(tx): store date as ISO timestamp with one-time backfill"
```

### Task 1.5: `budgetConfig` KV singleton (per-account inclusion + future fields)

**Files:**
- Create: `apps/mobile/src/stores/useBudgetConfigStore.ts`

- [ ] **Step 1: Write the store**

```ts
// apps/mobile/src/stores/useBudgetConfigStore.ts
import { create } from "zustand";
import { load, save } from "@/utils/storage/storage";

const KEY = "budget:config:v1";

interface BudgetConfig {
  includedAccountIds: string[]; // [] means "all accounts"
}

interface BudgetConfigState extends BudgetConfig {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setIncludedAccountIds: (ids: string[]) => Promise<void>;
}

export const useBudgetConfigStore = create<BudgetConfigState>((set, get) => ({
  includedAccountIds: [],
  hydrated: false,
  hydrate: async () => {
    const stored = await load<BudgetConfig>(KEY);
    if (stored) set({ ...stored, hydrated: true });
    else set({ hydrated: true });
  },
  setIncludedAccountIds: async (ids) => {
    set({ includedAccountIds: ids });
    await save(KEY, { includedAccountIds: ids });
  },
}));
```

- [ ] **Step 2: Hydrate on app boot**

In the same init effect that hydrates other stores, call `useBudgetConfigStore.getState().hydrate()`.

- [ ] **Step 3: Use the filter in `useFinanceData`**

In `useFinanceData.ts`, where `totalBalance` / `monthIncome` / `monthSpent` are computed, filter transactions & accounts by `includedAccountIds` when non-empty. Empty = include all.

- [ ] **Step 4: Test the store**

Create `apps/mobile/src/stores/__tests__/useBudgetConfigStore.test.ts` — round-trip: `setIncludedAccountIds(["a","b"])` → re-hydrate → assert same.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/stores/useBudgetConfigStore.ts apps/mobile/src/hooks/useFinanceData.ts apps/mobile/src/stores/__tests__
git commit -m "feat(budget): add budgetConfig KV store for account inclusion"
```

---

## Phase 2 — Finance insight cache

### Task 2.1: Canonical-JSON hash + day-bucket utilities

**Files:**
- Create: `apps/mobile/src/utils/financeInsightCacheKey.ts`
- Create: `apps/mobile/src/utils/__tests__/financeInsightCacheKey.test.ts`

- [ ] **Step 1: Write the test first**

```ts
// apps/mobile/src/utils/__tests__/financeInsightCacheKey.test.ts
import { canonicalHash, dayBucket, buildInsightCacheKey } from "../financeInsightCacheKey";

describe("financeInsightCacheKey", () => {
  it("canonicalHash is stable regardless of key order", () => {
    const a = { x: 1, y: 2 };
    const b = { y: 2, x: 1 };
    expect(canonicalHash(a)).toBe(canonicalHash(b));
  });
  it("dayBucket boundaries", () => {
    expect(dayBucket(new Date("2026-04-24T05:00:00Z"))).toBe("morning");   // 05:00 inclusive
    expect(dayBucket(new Date("2026-04-24T11:59:00Z"))).toBe("morning");   // 11:59
    expect(dayBucket(new Date("2026-04-24T12:00:00Z"))).toBe("afternoon"); // 12:00 inclusive
    expect(dayBucket(new Date("2026-04-24T17:59:00Z"))).toBe("afternoon");
    expect(dayBucket(new Date("2026-04-24T18:00:00Z"))).toBe("evening");   // 18:00 inclusive
    expect(dayBucket(new Date("2026-04-24T04:59:00Z"))).toBe("evening");   // wraps
  });
  it("buildInsightCacheKey combines them", () => {
    const snap = { a: 1 };
    const key = buildInsightCacheKey(snap, new Date("2026-04-24T09:00:00Z"));
    expect(key).toMatch(/^insight:[a-f0-9]+:morning$/);
  });
});
```

- [ ] **Step 2: Run test — expect fail**

Run: `bun run --cwd apps/mobile test -- financeInsightCacheKey`
Expected: module not found.

- [ ] **Step 3: Implement**

```ts
// apps/mobile/src/utils/financeInsightCacheKey.ts
function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify((value as Record<string, unknown>)[k])}`).join(",")}}`;
}

// djb2 — deterministic, no crypto dependency; fine for cache keys (not for security)
function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

export function canonicalHash(value: unknown): string {
  return djb2(canonicalStringify(value));
}

export type DayBucket = "morning" | "afternoon" | "evening";

export function dayBucket(now: Date = new Date()): DayBucket {
  const h = now.getUTCHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}

export function buildInsightCacheKey(snapshot: unknown, now: Date = new Date()): string {
  return `insight:${canonicalHash(snapshot)}:${dayBucket(now)}`;
}
```

**Note:** tests use UTC hours — the app should use the user's local timezone in the real hook; pass `new Date()` to `dayBucket` and let it use local hours. The UTC-based test above is intentional (deterministic); if you switch to local hours in the impl, adjust the test to inject a timezone-safe date.

- [ ] **Step 4: Run tests — expect pass**

Run: `bun run --cwd apps/mobile test -- financeInsightCacheKey`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/utils/financeInsightCacheKey.ts apps/mobile/src/utils/__tests__/financeInsightCacheKey.test.ts
git commit -m "feat(insight): cache-key utility with day buckets"
```

### Task 2.2: Rewrite `useFinanceInsight` to cache via KV store

**Files:**
- Modify: `apps/mobile/src/hooks/useFinanceInsight.ts`
- Modify: `apps/mobile/src/components/organisms/FinanceInsight/FinanceInsight.tsx` (remove `generatedRef`)

- [ ] **Step 1: Hook rewrite**

Replace the body of `useFinanceInsight` with this structure:

```ts
import { useEffect, useRef, useState } from "react";
import { load as kvLoad, save as kvSave } from "@/utils/storage/storage";
import { buildInsightCacheKey } from "@/utils/financeInsightCacheKey";
import { buildFinanceInsightPrompt, FINANCE_INSIGHT_SYSTEM_PROMPT } from "@/services/financeInsightPrompt";
import { useLocalAI } from "./useLocalAI";
import { useIsAIAvailable } from "./useIsAIAvailable";
import { useFinanceData } from "./useFinanceData";

export function useFinanceInsight() {
  const data = useFinanceData();
  const { complete } = useLocalAI();
  const isAIAvailable = useIsAIAvailable();
  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const inFlightKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isAIAvailable) return;

    // Snapshot — keep it small, deterministic, and drop volatile fields like timestamps.
    const snapshot = {
      totalBalance: data.totalBalance,
      dailyBudget: data.dailyBudget,
      budgetLeftToday: data.budgetLeftToday,
      monthIncome: data.monthIncome,
      monthSpent: data.monthSpent,
      todaySpent: data.todaySpent,
      thisWeekSpending: data.thisWeekSpending,
      categoryBudgets: data.categoryBudgets.map((c) => ({ category: c.category, spent: c.spent, budget: c.budget })),
      bills: data.recurringBills.map((b) => ({ id: b.id, amount: b.amount, frequency: b.frequency })),
      goals: data.savingsGoals.map((g) => ({ id: g.id, currentAmount: g.currentAmount, targetAmount: g.targetAmount })),
    };
    const key = buildInsightCacheKey(snapshot);

    if (inFlightKey.current === key) return;
    inFlightKey.current = key;

    (async () => {
      const cached = await kvLoad<{ insight: string }>(key);
      if (cached?.insight) {
        setInsight(cached.insight);
        return;
      }
      setIsGenerating(true);
      try {
        const prompt = buildFinanceInsightPrompt(data);
        const result = await complete(prompt, FINANCE_INSIGHT_SYSTEM_PROMPT);
        if (result) {
          setInsight(result);
          await kvSave(key, { insight: result });
        }
      } finally {
        setIsGenerating(false);
      }
    })();
  }, [
    isAIAvailable,
    data.totalBalance, data.dailyBudget, data.budgetLeftToday,
    data.monthIncome, data.monthSpent, data.todaySpent, data.thisWeekSpending,
    data.categoryBudgets, data.recurringBills, data.savingsGoals,
    complete,
  ]);

  return { insight, isGenerating };
}
```

- [ ] **Step 2: Remove dead `generatedRef` guard**

In `FinanceInsight.tsx`, delete `generatedRef` and the guards that use it (lines ~30, 82-87 per explore report). The hook now handles cache.

- [ ] **Step 3: Write integration test**

`apps/mobile/src/hooks/__tests__/useFinanceInsight.test.tsx` — mock `useLocalAI.complete` to track calls. Render hook twice with identical snapshot in the same day-bucket → assert `complete` called exactly once; change a number → assert second call; stub `Date` to cross into the next bucket → assert third call.

- [ ] **Step 4: Run tests**

Run: `bun run --cwd apps/mobile test -- useFinanceInsight`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/hooks/useFinanceInsight.ts apps/mobile/src/components/organisms/FinanceInsight apps/mobile/src/hooks/__tests__/useFinanceInsight.test.tsx
git commit -m "feat(insight): cache by data-hash + day-bucket via kv store"
```

---

## Phase 3 — Shared AI-parse sheet body

### Task 3.1: Zod schemas + parser services for Account and Bill

**Files:**
- Create: `apps/mobile/src/services/accountSchema.ts`
- Create: `apps/mobile/src/services/accountParserService.ts`
- Create: `apps/mobile/src/services/billSchema.ts`
- Create: `apps/mobile/src/services/billParserService.ts`
- Create test files for each.

- [ ] **Step 1: Write `accountSchema.ts`**

Mirror `transactionSchema.ts` exactly.

```ts
// apps/mobile/src/services/accountSchema.ts
import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1), // matches an accountTypes.name (case-insensitive), or a new one
  balance: z.number(),
});

export type ParsedAccount = z.infer<typeof accountSchema>;

export const ACCOUNT_SYSTEM_PROMPT = `You extract bank account details from short user input.
Return ONLY JSON matching: { "name": string, "type": string, "balance": number }.
"type" should be one of: checking, savings, credit, cash, investment — or a custom single word.
If balance isn't given, return 0. No extra keys, no prose.`;
```

- [ ] **Step 2: Write `accountParserService.ts`**

```ts
// apps/mobile/src/services/accountParserService.ts
import { accountSchema, ACCOUNT_SYSTEM_PROMPT, type ParsedAccount } from "./accountSchema";

type CompleteJSON = (prompt: string, systemPrompt: string) => Promise<unknown>;

export async function parseAccountText(input: string, completeJSON: CompleteJSON): Promise<ParsedAccount | null> {
  try {
    const raw = await completeJSON(input, ACCOUNT_SYSTEM_PROMPT);
    const parsed = accountSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Write `billSchema.ts`**

```ts
// apps/mobile/src/services/billSchema.ts
import { z } from "zod";

export const billSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(["once", "weekly", "monthly", "yearly"]),
  category: z.string().optional(),
});

export type ParsedBill = z.infer<typeof billSchema>;

export const BILL_SYSTEM_PROMPT = `You extract recurring-bill / reminder details from short user input.
Return ONLY JSON matching: { "name": string, "amount": number, "frequency": "once"|"weekly"|"monthly"|"yearly", "category": string? }.
If the user says "one-time" / "just this once" / "tomorrow" / a single specific date → frequency="once".
Default to "monthly" if unclear. No prose.`;
```

- [ ] **Step 4: Write `billParserService.ts`** — mirrors the account version.

- [ ] **Step 5: Write tests for each**

Create `__tests__/accountParserService.test.ts` and `__tests__/billParserService.test.ts`. Stub `completeJSON` to return well-formed and malformed payloads, assert `null` on malformed, typed object on valid.

- [ ] **Step 6: Run tests — expect pass**

Run: `bun run --cwd apps/mobile test -- Parser`
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/services/accountSchema.ts apps/mobile/src/services/accountParserService.ts apps/mobile/src/services/billSchema.ts apps/mobile/src/services/billParserService.ts apps/mobile/src/services/__tests__
git commit -m "feat(ai): parser services for accounts and bills"
```

### Task 3.2: `VoiceCaptureCircle` atom (placeholder)

**Files:**
- Create: `apps/mobile/src/components/atoms/VoiceCaptureCircle/VoiceCaptureCircle.tsx`
- Create: `apps/mobile/src/components/atoms/VoiceCaptureCircle/index.ts`

- [ ] **Step 1: Build the component**

```tsx
// apps/mobile/src/components/atoms/VoiceCaptureCircle/VoiceCaptureCircle.tsx
import { View, Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { Microphone } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { AppText } from "@/components/atoms/Text";

interface Props {
  onPress?: () => void;   // reserved for future; for now shows "coming soon" toast
  transcript?: string;     // live transcript text placeholder
  isListening?: boolean;
  disabled?: boolean;
}

export function VoiceCaptureCircle({ onPress, transcript, isListening, disabled = true }: Props) {
  const [primary, muted] = useCSSVariable(["--color-primary", "--color-muted"]);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      pulse.value = withRepeat(withTiming(1.15, { duration: 700 }), -1, true);
    } else {
      pulse.value = withTiming(1);
    }
  }, [isListening, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View className="items-center gap-3">
      <Pressable onPress={onPress} disabled={disabled}>
        <Animated.View
          style={animatedStyle}
          className={`w-24 h-24 rounded-full items-center justify-center ${disabled ? "bg-surface" : "bg-primary/10"}`}
        >
          <Microphone size={36} color={disabled ? (muted as string) : (primary as string)} weight="fill" />
        </Animated.View>
      </Pressable>
      <AppText size="sm" weight="medium" color={disabled ? "muted" : "default"}>
        {isListening ? "Listening…" : disabled ? "Tap to talk (coming soon)" : "Tap to talk"}
      </AppText>
      <View className="min-h-[24px] px-4">
        <AppText size="xs" color="muted" className="text-center">
          {transcript ?? ""}
        </AppText>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Barrel export**

```ts
// index.ts
export * from "./VoiceCaptureCircle";
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/atoms/VoiceCaptureCircle
git commit -m "feat(ui): VoiceCaptureCircle atom with placeholder pulse animation"
```

### Task 3.3: `AIParseSheetBody` molecule (shared layout)

**Files:**
- Create: `apps/mobile/src/components/molecules/AIParseSheetBody/AIParseSheetBody.tsx`
- Create: `apps/mobile/src/components/molecules/AIParseSheetBody/index.ts`

- [ ] **Step 1: Build**

```tsx
// apps/mobile/src/components/molecules/AIParseSheetBody/AIParseSheetBody.tsx
import { View, Pressable, ActivityIndicator } from "react-native";
import { Input } from "heroui-native";
import { Lightning, PencilSimpleLine } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { AppText } from "@/components/atoms/Text";
import { VoiceCaptureCircle } from "@/components/atoms/VoiceCaptureCircle";

interface Props {
  title: string;
  aiPlaceholder: string;
  aiText: string;
  onChangeAiText: (v: string) => void;
  onAISubmit: () => void;
  onManual: () => void;
  isAIAvailable: boolean;
  isLoading: boolean;
  error: string | null;
}

export function AIParseSheetBody({
  title, aiPlaceholder, aiText, onChangeAiText, onAISubmit, onManual,
  isAIAvailable, isLoading, error,
}: Props) {
  const [primary] = useCSSVariable(["--color-primary"]);

  return (
    <View className="px-5 py-6 gap-5">
      <AppText size="xl" weight="bold" family="headline">{title}</AppText>

      {isLoading ? (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator size="large" />
          <AppText size="sm" color="muted">Parsing…</AppText>
        </View>
      ) : (
        <>
          <VoiceCaptureCircle disabled />

          {isAIAvailable && (
            <View className="gap-2">
              <View className="flex-row items-center">
                <Input
                  className="flex-1 pl-10"
                  placeholder={aiPlaceholder}
                  value={aiText}
                  onChangeText={onChangeAiText}
                  onSubmitEditing={onAISubmit}
                  returnKeyType="done"
                />
                <Lightning size={16} color={primary as string} weight="fill" style={{ position: "absolute", left: 14 }} />
              </View>
              {error && <AppText size="xs" color="danger">{error}</AppText>}
            </View>
          )}

          <Pressable
            className="flex-row items-center justify-center gap-3 rounded-xl bg-surface p-4"
            onPress={onManual}
          >
            <PencilSimpleLine size={20} color={primary as string} weight="bold" />
            <AppText size="sm" weight="medium">Input Manually</AppText>
          </Pressable>
        </>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/components/molecules/AIParseSheetBody
git commit -m "feat(ui): AIParseSheetBody molecule — shared layout for add-sheets"
```

### Task 3.4: Refactor `AddTransactionSheet.ios.tsx` + `.android.tsx` to use `AIParseSheetBody`

**Files:**
- Modify: `apps/mobile/src/components/organisms/AddTransactionSheet/AddTransactionSheet.ios.tsx`
- Modify: `apps/mobile/src/components/organisms/AddTransactionSheet/AddTransactionSheet.android.tsx`

- [ ] **Step 1: Replace the sheet body**

Strip the ~80 lines of inline JSX (lines 100-178 in the current .ios.tsx) and render `<AIParseSheetBody title="Log Transaction" aiPlaceholder="e.g. coffee 4.50 or salary 3000" .../>`. Pass state and `onAISubmit={handleAISubmit}`, `onManual={handleManual}`.

- [ ] **Step 2: Same for Android variant.**

- [ ] **Step 3: Smoke-check**

Reload the app. Tap the Add Transaction FAB. Verify: circle mic at top, AI input in middle, manual button at bottom; typing + submitting AI input still prefills and routes to `/add-transaction`.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/organisms/AddTransactionSheet
git commit -m "refactor(sheet): AddTransactionSheet uses AIParseSheetBody"
```

### Task 3.5: Wire AI parsing on `AddAccountSheet`

**Files:**
- Modify: `apps/mobile/src/components/organisms/AddAccountSheet/AddAccountSheet.ios.tsx`
- Modify: `apps/mobile/src/components/organisms/AddAccountSheet/AddAccountSheet.android.tsx`
- Modify: `apps/mobile/src/stores/useAddAccountSheetStore.ts` — add `prefillData?: Partial<Account> & { type?: string }` and `setPrefill()`.

- [ ] **Step 1: Extend the sheet store with prefill**

Mirror what `useAddTransactionSheetStore` already does for `prefillData`.

- [ ] **Step 2: Add `handleAISubmit` to the sheet**

```ts
const handleAISubmit = async () => {
  if (!aiText.trim()) return;
  setIsLoading(true);
  setError(null);
  const result = await parseAccountText(aiText, completeJSON);
  setIsLoading(false);
  if (!result) {
    setError("Couldn't understand that. Try again or input manually.");
    return;
  }
  useAddAccountSheetStore.getState().setPrefill({
    name: result.name,
    type: result.type.toLowerCase(),
    balance: result.balance,
  });
  handleClose();
  router.push("/(main)/add-account");
};
```

- [ ] **Step 3: Swap the JSX to `<AIParseSheetBody ... />`**

Title = `"Add Account"`, placeholder = `"e.g. Chase checking 1200 or cash 50"`.

- [ ] **Step 4: Consume prefill on `/add-account`**

In `add-account.tsx`, read `useAddAccountSheetStore().prefillData` in a `useEffect([])` and call `setValue` for name / type / balance. Match `type` against the loaded `accountTypes` list; if no match, insert a new type row first (delegating to `addAccountType`) then select it.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/organisms/AddAccountSheet apps/mobile/src/stores/useAddAccountSheetStore.ts apps/mobile/src/app/\(main\)/add-account.tsx
git commit -m "feat(sheet): wire AI parsing on AddAccountSheet with prefill"
```

### Task 3.6: Wire AI parsing on `AddBillSheet`

**Files:**
- Modify: `apps/mobile/src/components/organisms/AddBillSheet/AddBillSheet.ios.tsx`
- Modify: `apps/mobile/src/components/organisms/AddBillSheet/AddBillSheet.android.tsx`
- Modify: `apps/mobile/src/stores/useAddBillSheetStore.ts` — add `prefillData` + `setPrefill`.
- Modify: `apps/mobile/src/app/(main)/add-bill.tsx` — consume prefill.

Mirror Task 3.5 exactly with `parseBillText`, placeholder `"e.g. Netflix 15 monthly or dentist 200 once"`.

- [ ] **Steps 1-5:** same shape as Task 3.5. Commit message: `feat(sheet): wire AI parsing on AddBillSheet`.

---

## Phase 4 — Add Transaction: missing fields + category size

### Task 4.1: Account selector field

**Files:**
- Modify: `apps/mobile/src/app/(main)/add-transaction.tsx`

- [ ] **Step 1: Extend zod schema**

Add `accountId: z.string().optional()` to `manualSchema`.

- [ ] **Step 2: Add a `Select` for accounts**

Placed **above** Category. Read accounts from `useFinanceData()`. Render each as a row with `{account.icon} {account.name}` (ensure icon is comfortably sized — `className="text-xl"`). Include a `None` option. Auto-select when only one account exists.

- [ ] **Step 3: Persist `accountId` on submit**

Add `accountId: data.accountId || undefined` to `addTransaction` / `updateTransaction`.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/\(main\)/add-transaction.tsx
git commit -m "feat(tx): account selector on Add Transaction"
```

### Task 4.2: Date + Time picker

**Files:**
- Modify: `apps/mobile/src/app/(main)/add-transaction.tsx`
- (Confirm `@react-native-community/datetimepicker` is in `package.json`; if not, install.)

- [ ] **Step 1: Install picker if missing**

Run: `bun run --cwd apps/mobile add @react-native-community/datetimepicker`
Expected: added. Commit `package.json` / lockfile only after the picker works.

- [ ] **Step 2: Replace the `date` schema field**

Change `date: z.string().min(1, "Date is required")` to store an ISO timestamp; default to `new Date().toISOString()`.

- [ ] **Step 3: Render a date+time row**

Use HeroUI Native `Pressable` rows that open the native picker in `datetime` mode. Display: `format(new Date(value), "MMM d, yyyy · h:mm a")`.

- [ ] **Step 4: Persist on submit**

Already handled — `data.date` is an ISO string.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/\(main\)/add-transaction.tsx apps/mobile/package.json
git commit -m "feat(tx): date + time picker on Add Transaction"
```

### Task 4.3: Category icon — default LARGE everywhere

**Files:**
- Modify: `apps/mobile/src/app/(main)/add-transaction.tsx` (category select items)
- Modify: `apps/mobile/src/app/(main)/add-bill.tsx` (category select items)
- Modify: any CategoryChip / CategorySpendingRow that renders small — verify and bump.

User context: "it is on transaction/bill screen but some of the screen has that" — referring to category icons starting small inside these forms. Fix: render the emoji with `size="lg"` (HeroUI Native `AppText` supports size prop; fall back to `className="text-2xl"`).

- [ ] **Step 1: Bump size in `add-transaction.tsx`**

Change `<AppText>{cat.icon}</AppText>` to `<AppText size="lg">{cat.icon}</AppText>` in the category select item (line ~316) **and** in the trigger if it renders the icon.

- [ ] **Step 2: Same in `add-bill.tsx`.**

- [ ] **Step 3: Audit other category renderings**

Run: `grep -rn "cat.icon\|category.icon" apps/mobile/src --include='*.tsx'`. For each hit, confirm it's already large (e.g., in `CategorySpendingRow` it may already be fine). Bump any that render at default size.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/\(main\)
git commit -m "fix(ui): category icons render at large size by default"
```

---

## Phase 5 — Add Account polish: larger type pills + "+ New Type"

### Task 5.1: Load types from store; render as large pills; add "+ New Type"

**Files:**
- Modify: `apps/mobile/src/app/(main)/add-account.tsx`

- [ ] **Step 1: Replace hardcoded `ACCOUNT_TYPES` with store data**

```tsx
const { accountTypes, addAccountType } = useFinanceData();
// drop the local ACCOUNT_TYPES array.
```

- [ ] **Step 2: Render types as larger touch targets**

Replace the current `<Chip>` + flex-wrap row with a grid of 2-column cards. Each card: emoji icon (text-3xl) + label. Selected card gets `bg-primary/10` and `border-primary`; unselected `bg-surface`.

```tsx
<View className="gap-1">
  <AppText size="xs" color="muted">Type</AppText>
  <View className="flex-row flex-wrap gap-3">
    {accountTypes
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ id, name, icon }) => (
        <Pressable
          key={id}
          onPress={() => setValue("type", name.toLowerCase())}
          className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border ${
            watch("type") === name.toLowerCase()
              ? "bg-primary/10 border-primary"
              : "bg-surface border-border"
          }`}
        >
          <AppText size="xl">{icon}</AppText>
          <AppText size="sm" weight="medium">{name}</AppText>
        </Pressable>
      ))}
    <Pressable
      onPress={() => setShowNewTypeDialog(true)}
      className="flex-row items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border"
    >
      <PhosphorIcon icon={Plus} size={16} color={primaryColor as string} />
      <AppText size="sm" weight="medium" className="text-primary">New Type</AppText>
    </Pressable>
  </View>
</View>
```

- [ ] **Step 3: Add the "New Type" dialog**

Reuse the exact shape of the existing `showNewCategoryDialog` in `add-transaction.tsx`: emoji input + name input + create button. On create, call `addAccountType({ id: 'type-' + Date.now(), name, icon, isDefault: false, sortOrder: accountTypes.length })` and immediately select it.

- [ ] **Step 4: Remove icon-from-type fallback**

The previous `getIconForType` logic (line ~91) is no longer needed — `accountType.icon` is the source of truth. On save, read from the matched type.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/\(main\)/add-account.tsx
git commit -m "feat(account): larger type tiles + New Type dialog"
```

---

## Phase 6 — Add Bill: "Once" frequency + Account selector

### Task 6.1: Add "Once" pill to the frequency selector

**Files:**
- Modify: `apps/mobile/src/app/(main)/add-bill.tsx`

- [ ] **Step 1: Add to the `FREQUENCIES` local array**

```ts
const FREQUENCIES = [
  { value: "once", label: "Once" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];
```

- [ ] **Step 2: Update `nextDueDate` calculation**

For `frequency === "once"`, set `nextDueDate = data.dueDate ?? new Date().toISOString()` (there should be a due date field; if not, keep today).

- [ ] **Step 3: Extend schema union**

Widen the zod enum to include `"once"`.

- [ ] **Step 4: Smoke-test**

Create a Once bill → mark it paid → verify it disappears from the active bills list (archived) and reappears if you toggle a "show archived" filter, or in a separate archived view if you add one later. For now, verify it's gone.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/\(main\)/add-bill.tsx
git commit -m "feat(bill): add 'Once' frequency option"
```

### Task 6.2: Account selector on Add Bill

**Files:**
- Modify: `apps/mobile/src/app/(main)/add-bill.tsx`

Mirror Task 4.1 for bills: add an account `Select` (accountId optional). `addBill` should receive `accountId`.

- [ ] **Steps 1-4:** same shape as Task 4.1. Commit: `feat(bill): account selector on Add Bill`.

---

## Phase 7 — Budget Settings screen

### Task 7.1: Create the route

**Files:**
- Create: `apps/mobile/src/app/(main)/budget-settings.tsx`
- Modify: `apps/mobile/src/components/organisms/SettingsSheet/SettingsSheet.ios.tsx` — wire the "Budget Settings" item `onPress: () => router.push("/(main)/budget-settings")`.
- Modify: same for `.android.tsx`.

- [ ] **Step 1: Build the screen**

```tsx
// apps/mobile/src/app/(main)/budget-settings.tsx
import { View } from "react-native";
import { Stack } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Controller, useForm } from "react-hook-form";
import { Button, Input, Label, TextField, Switch } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useBudgetConfigStore } from "@/stores/useBudgetConfigStore";
import { useUserStore } from "@/stores/useUserStore";

export default function BudgetSettingsScreen() {
  const { accounts } = useFinanceData();
  const { includedAccountIds, setIncludedAccountIds } = useBudgetConfigStore();
  const { income, setIncome } = useUserStore();
  const hasAccounts = accounts.length > 0;

  const { control, handleSubmit } = useForm<{ income: string }>({
    defaultValues: { income: income || "" },
  });

  const toggleAccount = async (id: string) => {
    const next = includedAccountIds.includes(id)
      ? includedAccountIds.filter((x) => x !== id)
      : [...includedAccountIds, id];
    await setIncludedAccountIds(next);
  };

  const onSaveIncome = (data: { income: string }) => {
    setIncome(data.income);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Budget Settings" }} />
      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 py-6 gap-6">
        {hasAccounts ? (
          <View className="gap-3">
            <AppText size="sm" color="muted">Accounts included in budget</AppText>
            <AppText size="xs" color="muted">Select which accounts should count toward your daily budget and spending trends. Leave all off to include everything.</AppText>
            {accounts.map((a) => {
              const enabled = includedAccountIds.length === 0 || includedAccountIds.includes(a.id);
              return (
                <View key={a.id} className="flex-row items-center justify-between p-4 rounded-xl bg-surface">
                  <View className="flex-row items-center gap-3">
                    <AppText size="xl">{a.icon}</AppText>
                    <AppText size="sm" weight="medium">{a.name}</AppText>
                  </View>
                  <Switch value={enabled} onValueChange={() => toggleAccount(a.id)} />
                </View>
              );
            })}
          </View>
        ) : (
          <View className="gap-3">
            <AppText size="sm" color="muted">Monthly income</AppText>
            <AppText size="xs" color="muted">We use this to calculate your daily budget. Add accounts later to track by balance instead.</AppText>
            <TextField>
              <Label>Monthly income</Label>
              <Controller
                control={control}
                name="income"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </TextField>
            <Button onPress={handleSubmit(onSaveIncome)}>
              <Button.Label>Save</Button.Label>
            </Button>
          </View>
        )}
      </KeyboardAwareScrollView>
    </>
  );
}
```

- [ ] **Step 2: Confirm `useUserStore.setIncome` exists**

If not, add it: `setIncome: (v: string) => set({ income: v })` plus a persist hook.

- [ ] **Step 3: Wire nav**

In both `SettingsSheet.ios.tsx` and `.android.tsx`, add `onPress: () => router.push("/(main)/budget-settings")` to the Budget Settings item (currently missing).

- [ ] **Step 4: Smoke-test**

Run app → Settings → Budget Settings: with zero accounts → shows income field, editable. Add an account → re-open Budget Settings → shows per-account toggles. Flip toggles → Money dashboard recomputes `totalBalance` / `monthSpent` to only include checked accounts.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/\(main\)/budget-settings.tsx apps/mobile/src/components/organisms/SettingsSheet apps/mobile/src/stores/useUserStore.ts
git commit -m "feat(budget): Budget Settings screen with account inclusion + income edit"
```

---

## Phase 8 — End-to-end verification

### Task 8.1: Unit + typecheck pass

- [ ] **Step 1: Run full test suite**

Run: `bun run --cwd apps/mobile test`
Expected: green, no regressions vs baseline from Task 0.1.

- [ ] **Step 2: Run typecheck**

Run: `bun run --cwd apps/mobile typecheck`
Expected: no TS errors.

- [ ] **Step 3: Commit any fixes**

Commit message: `chore(finance): resolve typecheck/test issues from finance improvements`.

### Task 8.2: Device QA via `agent-device` skill

**Prereq:** the Expo dev client must be running on either an iOS Simulator or a physical/emulated Android device. Use `mobile_list_available_devices` first; if the app isn't installed/running, launch it with `mobile_launch_app` (bundle id from `app.json`).

**Invoke the `agent-device` skill** (per CLAUDE.md §7) and use its `mobile-ui-tester` flow. The flow for each scenario below is: `mobile_take_screenshot` → `mobile_list_elements_on_screen` → interact (tap/type) → re-screenshot → assert visual state.

Capture one screenshot per scenario step and save under `docs/execution/screenshots/2026-04-24-finance-improvements/` with a descriptive name. The final report on the PR should link these.

- [ ] **Step 1: Money tab baseline**

Launch app → Money tab. Screenshot the dashboard. Verify: FinanceInsight card renders (either skeleton then text, or cached text immediately). Record time-to-insight.

- [ ] **Step 2: Insight cache — cold then warm**

- Kill and relaunch the app. Money tab → observe insight loads from cache (no skeleton) if the data hash + day-bucket is unchanged. Screenshot.
- Add a transaction (Task 8.2 Step 5 covers this) — return to Money tab — insight should re-generate (skeleton flashes). Screenshot.

- [ ] **Step 3: Add Transaction sheet — AI parse**

- Tap Add Transaction FAB. Screenshot the sheet. Assert: VoiceCaptureCircle visible at top-center; mic icon large; label "Tap to talk (coming soon)"; AI input below with lightning icon; "Input Manually" button below that.
- Tap the circle once — assert it does NOT navigate anywhere (disabled placeholder). No crash.
- Type `lunch 12.50` into the AI input → tap return. Assert loading spinner appears, then Add Transaction screen opens with prefilled fields: type=Expense selected, item="lunch", amount="12.50". Screenshot.

- [ ] **Step 4: Add Transaction — account + datetime**

- On the Add Transaction screen from Step 3, assert the Account selector is present above the Category selector.
- Tap the Account selector → pick an account → back on form: account label reflects selection. Screenshot.
- Tap the date/time field → native picker opens → change both date and time → back on form: text reads `Apr 24, 2026 · 3:45 PM` (or similar). Screenshot.
- Tap Category selector → assert emojis render LARGE in the list (visually compare to pre-change baseline screenshot if needed). Screenshot the list.
- Save the transaction → assert it lands in the Money tab's transaction list with the chosen time (not midnight). Screenshot.

- [ ] **Step 5: Add Account — polished types + New Type**

- Open Add Account sheet (from Accounts section). Screenshot. Assert the shared AIParseSheetBody layout (circle + AI input + Manual).
- Test AI parse: type `Chase checking 2500` → assert form opens with name="Chase", type "Checking" pill selected (case-insensitive match), balance="2500". Screenshot.
- Return to Add Account form manually. Assert type pills are **large 2-column tiles** (not small chips), each with emoji + label.
- Tap "+ New Type" → dialog opens → enter emoji `🪙` and name `Crypto` → Create. Assert new tile appears and is auto-selected. Screenshot.
- Save account. Reopen Add Account → assert `Crypto` tile persists. Screenshot.

- [ ] **Step 6: Add Bill — Once frequency**

- Open Add Bill. Screenshot the sheet layout.
- Test AI parse: type `dentist 200 once` → assert form opens with name="dentist", amount="200", frequency="Once" pill selected. Screenshot.
- Save the bill. From the Money tab Recurring Bills section, tap the new bill → mark paid. Assert it disappears from the active bills list. Screenshot before and after.

- [ ] **Step 7: Budget Settings**

- Open Settings Sheet → tap "Budget Settings" → assert it navigates to `/(main)/budget-settings`. Screenshot.
- If accounts exist: assert per-account toggles render with emoji + name. Toggle one off → go back to Money tab → assert `totalBalance` and `monthSpent` exclude that account. Screenshot.
- If you want to verify the empty-accounts branch, delete all accounts (or reset onboarding in Settings) → reopen Budget Settings → assert monthly-income editor renders. Edit and save → assert Money tab's income figure updates. Screenshot.

- [ ] **Step 8: Category icon size audit**

- Open Add Transaction → Category selector → screenshot list items (emojis should read large).
- Same on Add Bill → Category selector → screenshot.
- Any screen still rendering small icons is a bug — log and fix.

- [ ] **Step 9: Voice placeholder smoke**

- On each of the three sheets (Add Transaction, Add Account, Add Bill), tap the circle → assert nothing crashes, label stays "Tap to talk (coming soon)". Screenshot one instance.

- [ ] **Step 10: Write the QA report**

Create `docs/execution/2026-04-24-finance-improvements-qa.md`:

```markdown
# Finance Improvements — Device QA Report

**Date:** 2026-04-24
**Device:** <model + OS from mobile_list_available_devices>
**Build:** <git rev-parse HEAD>

## Scenarios
- [x] Money tab baseline (screenshot)
- [x] Insight cache cold+warm (2 screenshots)
- [x] Add Transaction AI parse (2 screenshots)
- [x] Add Transaction account + datetime (4 screenshots)
- [x] Add Account polish + New Type (3 screenshots)
- [x] Add Bill Once frequency (3 screenshots)
- [x] Budget Settings both states (2 screenshots)
- [x] Category icon size audit (2 screenshots)
- [x] Voice placeholder smoke (1 screenshot)

## Issues found
<list each with screenshot link and repro steps, or "none">

## Sign-off
All flows green on <device>.
```

- [ ] **Step 11: Commit the QA artifacts**

```bash
git add docs/execution/2026-04-24-finance-improvements-qa.md docs/execution/screenshots
git commit -m "docs(qa): device QA report for finance improvements"
```

### Task 8.3: Create PR

- [ ] **Step 1: Open PR via `pr-creator`**

Use the `pr-creator` skill. Title: `feat(finance): AI-parse sheets, insight cache, budget settings, bill "once", polish`. Body: summarize the 7 user requests, link `docs/planning/2026-04-24-finance-improvements.md` and `docs/execution/2026-04-24-finance-improvements-qa.md`, include 4-6 representative screenshots inline.

---

## Self-review notes

- **Spec coverage:** 7/7 user requests mapped — AI parsing (Phase 3), insight caching (Phase 2), Add Account polish (Phase 5), "Once" reminder (Phase 1.3 + 6.1), category default large (Phase 4.3), Add Transaction missing fields (Phase 4.1 + 4.2), Budget Settings (Phase 7).
- **No placeholders:** every code step contains real code; migration backfill is fully written.
- **Type consistency:** `accountType.name` vs `account.type` — accounts store `type` as a lowercased name string pointing at an `accountTypes.name`. All references use `.toLowerCase()` consistently.
- **Sequencing:** Phase 1 + 2 independent; Phase 3 before 4/5/6; Phase 7 after 1.5.
- **Known deferrals (explicit):** real voice-to-text is a placeholder — wiring `expo-speech-recognition` is a follow-up when the dev client is rebuilt.
