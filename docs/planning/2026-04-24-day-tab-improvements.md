# Day Tab Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the Day tab by removing duplicate add affordances, shift the "Tonight" card into a next-day planning ritual that seeds tomorrow's priorities, deepen the Focus Session (linked priorities, session goals, break cycles, daily totals), and add an end-of-day reflection that feeds the planner.

**Architecture:**
- Keep existing atomic/molecule/organism boundaries. Local-only data via Drizzle + SQLite. Zustand stores for all transient/UI state. Expo Router for the Day route.
- New persistence: one Drizzle migration (`0003`) adds `focus_sessions` and `reflections` tables; existing `priorities` table gains no columns — tomorrow's priorities are just rows with `date = tomorrowISO`.
- Evening trigger uses the same pattern as `RolloverPromptSheet` — in-app detection on mount, gated by a metadata key so we don't re-prompt on app restart. No new native deps.

**Tech Stack:** Expo Router 55, React Native 0.83, Zustand, Drizzle ORM (SQLite), heroui-native, phosphor-react-native, `@expo/ui/swift-ui` + `@expo/ui/jetpack-compose` bottom sheets, Jest + @testing-library/react-native, **`agent-device` skill** for on-device UI verification (taps, typing, screenshots on a running iOS/Android simulator).

**On-device testing policy:** Every phase ends with an `agent-device` verification task instead of plain manual testing. The agent takes labelled screenshots, stores them under `docs/execution/screenshots/2026-04-24-day-tab-improvements/<phase>/<step>.png`, and asserts expected UI state (element hierarchy lookup + visual diff). The executor MUST activate the `agent-device` skill before each verification task and use `mobile-ui-tester` patterns for structured reporting.

---

## Scope Check

This plan covers the Day tab only. It touches four sub-areas that share the same stores/routes and must land together to avoid broken flows (e.g. removing inline Quick List adder requires the FAB quick-add path to exist). Within that constraint, phases are commit-separable — stop after any phase and the app is still shippable.

---

## File Structure

### Files to create

| Path | Responsibility |
|---|---|
| `apps/mobile/src/db/schema/focusSessions.ts` | `focus_sessions` Drizzle table (id, priorityId, goal, startedAt, endedAt, plannedSec, actualSec, completedNaturally, createdAt) |
| `apps/mobile/src/db/schema/reflections.ts` | `reflections` Drizzle table (date PK, wins JSON, improve, createdAt) |
| `apps/mobile/src/db/drizzle/0003_day_tab_improvements.sql` | Migration adding the two new tables |
| `apps/mobile/src/db/drizzle/meta/0003_snapshot.json` | Drizzle meta snapshot (generated) |
| `apps/mobile/src/stores/useAddQuickItemSheetStore.ts` | Open/close state for the new keyboard-first quick-add sheet |
| `apps/mobile/src/stores/usePlanTomorrowSheetStore.ts` | Open/close state for the Plan Tomorrow sheet |
| `apps/mobile/src/stores/useReflectionSheetStore.ts` | Open/close state for the reflection sheet |
| `apps/mobile/src/components/organisms/AddQuickItemSheet/AddQuickItemSheet.ios.tsx` | iOS bottom sheet: single autofocused input → calls `addQuickItem` |
| `apps/mobile/src/components/organisms/AddQuickItemSheet/AddQuickItemSheet.android.tsx` | Android equivalent |
| `apps/mobile/src/components/organisms/AddQuickItemSheet/index.ts` | Platform export |
| `apps/mobile/src/components/organisms/PlanTomorrowSheet/PlanTomorrowSheet.ios.tsx` | iOS sheet — seeds tomorrow's priorities + optional evening note |
| `apps/mobile/src/components/organisms/PlanTomorrowSheet/PlanTomorrowSheet.android.tsx` | Android equivalent |
| `apps/mobile/src/components/organisms/PlanTomorrowSheet/index.ts` | Platform export |
| `apps/mobile/src/components/organisms/EveningPromptSheet/EveningPromptSheet.ios.tsx` | Auto-appears after 8pm; nudge → opens PlanTomorrowSheet |
| `apps/mobile/src/components/organisms/EveningPromptSheet/EveningPromptSheet.android.tsx` | Android equivalent |
| `apps/mobile/src/components/organisms/EveningPromptSheet/index.ts` | Platform export |
| `apps/mobile/src/components/organisms/ReflectionSheet/ReflectionSheet.ios.tsx` | Evening reflection (wins + one improvement) |
| `apps/mobile/src/components/organisms/ReflectionSheet/ReflectionSheet.android.tsx` | Android equivalent |
| `apps/mobile/src/components/organisms/ReflectionSheet/index.ts` | Platform export |
| `apps/mobile/src/components/molecules/PlanTomorrowCard/PlanTomorrowCard.tsx` | Replacement for `TonightCard` — shows tomorrow's count |
| `apps/mobile/src/components/molecules/PlanTomorrowCard/index.ts` | Export |
| `apps/mobile/src/components/organisms/FocusSessionSettingsSheet/FocusSessionSettingsSheet.ios.tsx` | Pick linked priority + enter session goal before Start |
| `apps/mobile/src/components/organisms/FocusSessionSettingsSheet/FocusSessionSettingsSheet.android.tsx` | Android equivalent |
| `apps/mobile/src/components/organisms/FocusSessionSettingsSheet/index.ts` | Platform export |
| `apps/mobile/src/stores/useFocusSessionSettingsSheetStore.ts` | Open/close state |

### Files to modify

| Path | Change |
|---|---|
| `apps/mobile/src/db/schema/index.ts` | Export new tables |
| `apps/mobile/src/db/drizzle/migrations.js` | Register new migration |
| `apps/mobile/src/db/drizzle/meta/_journal.json` | Append journal entry for migration 0003 |
| `apps/mobile/src/app/(main)/(tabs)/day/index.tsx` | Set header title to "Day"; replace `TonightCard` with `PlanTomorrowCard`; render new sheets; add `ReflectionPromptSheet` + `EveningPromptSheet` |
| `apps/mobile/src/stores/useDayStore.ts` | Add `tomorrowPriorities`, `addTomorrowPriority`, `deleteTomorrowPriority`, `loadTomorrow`, `reflection`, `saveReflection`, `loadTodayReflection` |
| `apps/mobile/src/types/index.ts` | Add `FocusSession`, `Reflection` interfaces |
| `apps/mobile/src/stores/useTimerStore.ts` | Add `phase` (`"focus" \| "break"`), `cycleCount`, `breakLength`, `linkedPriorityId`, `sessionGoal`, `currentSessionId`, `setLinkedPriority`, `setSessionGoal`, `startBreak`, `completeSession` |
| `apps/mobile/src/components/organisms/PomodoroTimer/PomodoroTimer.tsx` | Show linked priority + goal chip; "Set up" opens `FocusSessionSettingsSheet`; show daily focus total (minutes); auto-break cycle UI |
| `apps/mobile/src/components/organisms/PriorityList/PriorityList.tsx` | Remove inline "Add priority" Pressable; tweak empty-state copy |
| `apps/mobile/src/components/organisms/QuickList/QuickList.tsx` | Remove inline "Add item…" TextInput row |
| `apps/mobile/src/components/organisms/QuickActionSheet/QuickActionSheet.ios.tsx` | Add new action "Add to Quick List" that opens `AddQuickItemSheet`; wire Sleep/Mood/Habit placeholders stay as-is |
| `apps/mobile/src/components/organisms/QuickActionSheet/QuickActionSheet.android.tsx` | Same changes for Android variant (mirror structure) |
| `apps/mobile/src/components/molecules/TonightCard/TonightCard.tsx` | Delete (replaced by PlanTomorrowCard) — remove file |
| `apps/mobile/src/hooks/useDayData.ts` | Expose `tomorrowPriorities`, `tomorrowPriorityCount`, `todayReflection`, `todayFocusMinutes` |
| `apps/mobile/src/stores/__tests__/useDayStore.test.ts` | Add tests for tomorrow priorities, reflection, focus session persistence |

### Files to delete

| Path | Reason |
|---|---|
| `apps/mobile/src/components/molecules/TonightCard/` (entire directory) | Replaced by `PlanTomorrowCard`. Also remove `TonightPlannerSheet` organism and `useTonightPlannerSheetStore` since Plan Tomorrow fully supersedes the free-text "Tonight" field. |
| `apps/mobile/src/components/organisms/TonightPlannerSheet/` | Superseded |
| `apps/mobile/src/stores/useTonightPlannerSheetStore.ts` | Superseded |

> **Note:** The `tonight_<date>` metadata keys and `useDayStore.tonight` / `setTonight` / `getYesterdayTonight` methods become dead code. Remove them in the same commit as the TonightCard deletion to avoid drift.

---

## Phase 1 — Small Wins (Header + Removing Duplicate Adders)

**Commit strategy:** One commit per task. After this phase the FAB is the only add path for priorities and quick items; header has a title.

### Task 1: Set Day screen header title

**Files:**
- Modify: `apps/mobile/src/app/(main)/(tabs)/day/index.tsx:17`

- [ ] **Step 1: Change the `Stack.Screen` title**

Replace line 17 with:

```tsx
<Stack.Screen options={{ title: "Day" }} />
```

- [ ] **Step 2: Manually verify in running dev client**

Run: `bun --cwd apps/mobile start` (if not already running). Navigate to the Day tab. Expected: header shows "Day".

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/app/\(main\)/\(tabs\)/day/index.tsx
git commit -m "fix(mobile): add \"Day\" header title on Day tab"
```

---

### Task 2: New AddQuickItemSheet organism (iOS)

**Files:**
- Create: `apps/mobile/src/stores/useAddQuickItemSheetStore.ts`
- Create: `apps/mobile/src/components/organisms/AddQuickItemSheet/AddQuickItemSheet.ios.tsx`
- Create: `apps/mobile/src/components/organisms/AddQuickItemSheet/AddQuickItemSheet.android.tsx`
- Create: `apps/mobile/src/components/organisms/AddQuickItemSheet/index.ts`

- [ ] **Step 1: Write the store**

Create `useAddQuickItemSheetStore.ts`:

```ts
import { create } from "zustand";

interface AddQuickItemSheetState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useAddQuickItemSheetStore = create<AddQuickItemSheetState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
```

- [ ] **Step 2: Write iOS sheet**

Create `AddQuickItemSheet.ios.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { View, TextInput, type TextInput as TextInputType } from "react-native";
import {
  BottomSheet,
  Group,
  Host,
  RNHostView,
} from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useAddQuickItemSheetStore } from "@/stores/useAddQuickItemSheetStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDatabase } from "@/hooks/useDatabase";

export const AddQuickItemSheet = () => {
  const { isOpen, close } = useAddQuickItemSheetStore();
  const addQuickItem = useDayStore((s) => s.addQuickItem);
  const { db } = useDatabase();
  const inputRef = useRef<TextInputType>(null);

  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mutedColor] = useCSSVariable(["--color-muted"]);

  useEffect(() => {
    if (!isOpen) {
      setText("");
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || !db) return;
    setIsSaving(true);
    try {
      await addQuickItem(db, trimmed);
      setText("");
      // Stay open for rapid capture; refocus input
      inputRef.current?.focus();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(presented) => {
          if (!presented) close();
        }}
      >
        <Group
          modifiers={[
            presentationDetents(["medium"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
            <View className="px-5 py-6 gap-5">
              <AppText size="xl" weight="bold" family="headline">
                Add to Quick List
              </AppText>

              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder="Buy milk, call plumber…"
                className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                placeholderTextColor={mutedColor as string}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAdd}
                blurOnSubmit={false}
              />

              <View className="flex-row gap-3">
                <Button variant="tertiary" className="flex-1" onPress={close}>
                  <Button.Label>Done</Button.Label>
                </Button>
                <Button
                  className="flex-1"
                  onPress={handleAdd}
                  isDisabled={!text.trim() || isSaving}
                >
                  <Button.Label>{isSaving ? "Adding…" : "Add"}</Button.Label>
                </Button>
              </View>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
```

- [ ] **Step 3: Write Android sheet**

Create `AddQuickItemSheet.android.tsx` — same body but using `ModalBottomSheet`:

```tsx
import { useEffect, useRef, useState } from "react";
import { View, TextInput, type TextInput as TextInputType } from "react-native";
import { ModalBottomSheet, Host, RNHostView } from "@expo/ui/jetpack-compose";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useAddQuickItemSheetStore } from "@/stores/useAddQuickItemSheetStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDatabase } from "@/hooks/useDatabase";

export const AddQuickItemSheet = () => {
  const { isOpen, close } = useAddQuickItemSheetStore();
  const addQuickItem = useDayStore((s) => s.addQuickItem);
  const { db } = useDatabase();
  const inputRef = useRef<TextInputType>(null);

  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mutedColor] = useCSSVariable(["--color-muted"]);

  useEffect(() => {
    if (!isOpen) {
      setText("");
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || !db) return;
    setIsSaving(true);
    try {
      await addQuickItem(db, trimmed);
      setText("");
      inputRef.current?.focus();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
      <ModalBottomSheet onDismissRequest={close} showDragHandle>
        <RNHostView matchContents>
          <View className="px-5 py-6 gap-5">
            <AppText size="xl" weight="bold" family="headline">
              Add to Quick List
            </AppText>

            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder="Buy milk, call plumber…"
              className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
              placeholderTextColor={mutedColor as string}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              blurOnSubmit={false}
            />

            <View className="flex-row gap-3">
              <Button variant="tertiary" className="flex-1" onPress={close}>
                <Button.Label>Done</Button.Label>
              </Button>
              <Button
                className="flex-1"
                onPress={handleAdd}
                isDisabled={!text.trim() || isSaving}
              >
                <Button.Label>{isSaving ? "Adding…" : "Add"}</Button.Label>
              </Button>
            </View>
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
};
```

- [ ] **Step 4: Platform export**

Create `index.ts`:

```ts
export { AddQuickItemSheet } from "./AddQuickItemSheet";
```

(Metro picks the `.ios`/`.android` variant automatically.)

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/stores/useAddQuickItemSheetStore.ts \
  apps/mobile/src/components/organisms/AddQuickItemSheet/
git commit -m "feat(mobile): add keyboard-first AddQuickItemSheet for Quick List capture"
```

---

### Task 3: Wire FAB → AddQuickItemSheet

**Files:**
- Modify: `apps/mobile/src/components/organisms/QuickActionSheet/QuickActionSheet.ios.tsx`
- Modify: `apps/mobile/src/components/organisms/QuickActionSheet/QuickActionSheet.android.tsx`
- Modify: `apps/mobile/src/app/(main)/(tabs)/day/index.tsx`

- [ ] **Step 1: Add "Add to Quick List" action in iOS QuickActionSheet**

In `QuickActionSheet.ios.tsx`, add the import:

```tsx
import { useAddQuickItemSheetStore } from "@/stores/useAddQuickItemSheetStore";
```

Inside the `actions` array, **replace** the existing "Tick a habit" placeholder entry with:

```tsx
{
  icon: CheckSquare,
  label: "Add to Quick List",
  onPress: () => {
    close();
    useAddQuickItemSheetStore.getState().open();
  },
},
```

(Keep Mood/Sleep/Habit-tick placeholders for future phases — only replace one to make room; CheckSquare repurposed since Quick List is the checkbox concept.)

- [ ] **Step 2: Mirror change in `QuickActionSheet.android.tsx`**

Apply the same diff. (Even though this task is editing the Android file, list the exact code — do not say "same as iOS": if the Android file already diverged, copy the replacement entry literally.)

- [ ] **Step 3: Mount AddQuickItemSheet in Day screen**

In `apps/mobile/src/app/(main)/(tabs)/day/index.tsx`, add the import:

```tsx
import { AddQuickItemSheet } from "@/components/organisms/AddQuickItemSheet";
```

Add `<AddQuickItemSheet />` to the bottom of the fragment, next to the other sheets (after `<TonightPlannerSheet />` — we delete TonightPlanner in Phase 2):

```tsx
<AddQuickItemSheet />
```

- [ ] **Step 4: Manual test**

Run the app. Open the FAB. Tap "Add to Quick List". Expected: sheet opens with autofocused input. Type "Buy milk", press return. Expected: item appears in Quick List, input clears and refocuses for rapid capture. Tap "Done" to close.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/organisms/QuickActionSheet/ \
  apps/mobile/src/app/\(main\)/\(tabs\)/day/index.tsx
git commit -m "feat(mobile): route FAB quick-add to new AddQuickItemSheet"
```

---

### Task 4: Remove inline "Add priority" row from PriorityList

**Files:**
- Modify: `apps/mobile/src/components/organisms/PriorityList/PriorityList.tsx`

- [ ] **Step 1: Delete the inline adder**

In `PriorityList.tsx`, remove the entire trailing `<Pressable>` block (currently lines 88-96) including the `Plus` icon and "Add priority" label. Also remove now-unused imports: `Pressable`, `useAddPrioritySheetStore`, `Plus`, `useCSSVariable`, and `primaryColor` destructuring.

Replace the component body's empty state and footer so the final file ends with:

```tsx
      {totalToday === 0 && (
        <AppText size="sm" color="muted">
          No priorities yet. Tap + to start your day.
        </AppText>
      )}
    </View>
  );
};
```

Final imports should be:

```tsx
import { View, Pressable } from "react-native";
import { Checkbox } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useDayData } from "@/hooks/useDayData";
import { useDayStore } from "@/stores/useDayStore";
import { useEditPrioritySheetStore } from "@/stores/useEditPrioritySheetStore";
import { useDatabase } from "@/hooks/useDatabase";
import type { Priority } from "@/types";
```

(Keep `Pressable` — still used for the priority rows.)

- [ ] **Step 2: Manual test**

Run app → Day tab. Expected: no "Add priority" row under the list. Empty state reads "No priorities yet. Tap + to start your day." FAB still opens AddPrioritySheet.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/organisms/PriorityList/PriorityList.tsx
git commit -m "refactor(mobile): remove inline Add priority row — FAB is sole entry point"
```

---

### Task 5: Remove inline "Add item…" row from QuickList

**Files:**
- Modify: `apps/mobile/src/components/organisms/QuickList/QuickList.tsx`

- [ ] **Step 1: Delete the inline adder and its state**

Rewrite `QuickList.tsx` as:

```tsx
import { View, Pressable, Text } from "react-native";
import { Checkbox } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";
import { useCSSVariable } from "uniwind";
import { Trash } from "phosphor-react-native";
import type { QuickListItem } from "@/types";

interface QuickItemRowProps {
  item: QuickListItem;
  onToggle: () => void;
  onDelete: () => void;
}

const QuickItemRow = ({ item, onToggle, onDelete }: QuickItemRowProps) => {
  const [dangersColor] = useCSSVariable(["--color-danger"]);

  return (
    <View className="flex-row items-center gap-3 py-2">
      <Checkbox isSelected={item.isCompleted} onChange={(_: boolean) => onToggle()} />
      <Text
        className={`flex-1 text-sm ${item.isCompleted ? "text-muted line-through" : "text-foreground"}`}
        onPress={onToggle}
      >
        {item.text}
      </Text>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Trash size={16} color={dangersColor as string} />
      </Pressable>
    </View>
  );
};

export const QuickList = () => {
  const { quickList } = useDayData();
  const toggleQuickItem = useDayStore((s) => s.toggleQuickItem);
  const deleteQuickItem = useDayStore((s) => s.deleteQuickItem);
  const { db } = useDatabase();

  const handleToggle = async (id: string) => {
    if (!db) return;
    await toggleQuickItem(db, id);
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    await deleteQuickItem(db, id);
  };

  if (quickList.length === 0) {
    return (
      <View className="gap-2">
        <AppText size="sm" weight="semibold" color="muted">
          Quick List
        </AppText>
        <AppText size="sm" color="muted">
          Nothing here yet. Tap + to jot something.
        </AppText>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <AppText size="sm" weight="semibold" color="muted">
        Quick List
      </AppText>

      {quickList.map((item) => (
        <QuickItemRow
          key={item.id}
          item={item}
          onToggle={() => handleToggle(item.id)}
          onDelete={() => handleDelete(item.id)}
        />
      ))}
    </View>
  );
};
```

- [ ] **Step 2: Manual test**

Expected: No inline "Add item…" row. Empty state: "Nothing here yet. Tap + to jot something." Adding via FAB still works end-to-end.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/organisms/QuickList/QuickList.tsx
git commit -m "refactor(mobile): remove inline Quick List adder — FAB is sole entry point"
```

---

### Phase 1 Checkpoint

Run the test suite before proceeding:

- [ ] **Step 1: Lint + tests green**

```bash
bun --cwd apps/mobile lint
bun --cwd apps/mobile test
```

Expected: All pass. If `useDayStore` tests reference removed fields, they still pass (this phase didn't touch the store).

---

### Task 5b: Phase 1 UI verification with `agent-device`

**Prerequisites:** Dev client running on an iOS simulator booted (`bun --cwd apps/mobile ios`). The `agent-device` skill MUST be activated before this task.

**Screenshot target directory:** `docs/execution/screenshots/2026-04-24-day-tab-improvements/phase1/`

- [ ] **Step 1: Activate agent-device skill**

Use the Skill tool to launch `agent-device`. Ask it to: "List available devices, select the running iOS simulator, take a baseline snapshot of the Day tab."

- [ ] **Step 2: Snapshot 1 — Day tab header**

Drive agent-device to navigate to the Day tab, then call `mobile_take_screenshot` and save the output as `phase1/01-header-title.png`. Use `mobile_list_elements_on_screen` and assert that an element with text "Day" appears at the top (header area).

- [ ] **Step 3: Snapshot 2 — PriorityList empty state**

With no priorities created, verify the PriorityList region shows "No priorities yet. Tap + to start your day." and that NO element with label "Add priority" appears.

Save as `phase1/02-prioritylist-empty.png`.

- [ ] **Step 4: Snapshot 3 — QuickList empty state**

Verify QuickList region shows "Nothing here yet. Tap + to jot something." and NO `TextInput` with placeholder "Add item…" is present.

Save as `phase1/03-quicklist-empty.png`.

- [ ] **Step 5: Interaction test — FAB → AddQuickItemSheet**

- Tap the FAB using `mobile_click_on_screen_at_coordinates` (first read coordinates via `mobile_list_elements_on_screen`, look for the `+` button).
- Tap the "Add to Quick List" action in the QuickActionSheet.
- Assert a BottomSheet appears with title "Add to Quick List" and an autofocused input.
- `mobile_type_keys` "Buy milk" then press return.
- Assert "Buy milk" appears in the Quick List below.
- Save screenshots at each step: `phase1/04-fab-open.png`, `phase1/05-addquickitemsheet.png`, `phase1/06-quicklist-with-item.png`.

- [ ] **Step 6: Interaction test — FAB → AddPrioritySheet**

- Tap FAB → "Add priority".
- Walk through the 3-step wizard entering "Ship v2" as a must-do, skip the rest.
- Assert "Ship v2" appears under "Must-do" in PriorityList.
- Save: `phase1/07-addprioritysheet-must.png`, `phase1/08-prioritylist-populated.png`.

- [ ] **Step 7: Write verification report**

Create `docs/execution/2026-04-24-day-tab-improvements-phase1-report.md` summarising: which assertions passed, any unexpected UI (layout shifts, stray buttons, off-brand colors). Reference screenshots by relative path.

- [ ] **Step 8: Commit screenshots + report**

```bash
git add docs/execution/
git commit -m "test(mobile): phase 1 on-device verification (agent-device screenshots)"
```

---

## Phase 2 — Plan Tomorrow (Replaces Tonight + Evening Trigger + Morning Seed)

**Commit strategy:** Schema + store first (testable), then UI, then evening trigger.

### Task 6: Add `tomorrowPriorities` + loaders to useDayStore

**Files:**
- Modify: `apps/mobile/src/stores/useDayStore.ts`

- [ ] **Step 1: Add helpers and state fields**

At the top of the file, after `yesterdayISO`, add:

```ts
function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA");
}
```

In `DayState` interface, add (keep existing members):

```ts
  tomorrowPriorities: Priority[];
  loadTomorrow: (db: Database) => Promise<void>;
  addTomorrowPriority: (
    db: Database,
    input: { text: string; type: Priority["type"] },
  ) => Promise<void>;
  deleteTomorrowPriority: (db: Database, id: string) => Promise<void>;
```

In the initial state object add:

```ts
tomorrowPriorities: [],
```

- [ ] **Step 2: Implement loadTomorrow**

Inside the store body, add:

```ts
loadTomorrow: async (db) => {
  const rows = await db
    .select()
    .from(prioritiesTable)
    .where(eq(prioritiesTable.date, tomorrowISO()));
  set({ tomorrowPriorities: (rows as PriorityRow[]).map(rowToPriority) });
},
```

- [ ] **Step 3: Implement addTomorrowPriority**

```ts
addTomorrowPriority: async (db, { text, type }) => {
  if (type === "must") {
    const { tomorrowPriorities } = get();
    const activeMust = tomorrowPriorities.filter(
      (p) => p.type === "must" && !p.isCompleted,
    );
    if (activeMust.length >= 3) {
      throw new MaxMustPrioritiesError();
    }
  }

  const tomorrow = tomorrowISO();
  const { tomorrowPriorities } = get();
  const typePriorities = tomorrowPriorities.filter((p) => p.type === type);
  const sortOrder =
    typePriorities.length > 0
      ? Math.max(...typePriorities.map((p) => p.sortOrder)) + 1
      : 0;
  const now = new Date().toISOString();

  const newPriority: Priority = {
    id: generateId(),
    text,
    type,
    isCompleted: false,
    date: tomorrow,
    completedAt: null,
    sortOrder,
    rolledOverFrom: null,
    createdAt: now,
  };

  await db.insert(prioritiesTable).values({
    id: newPriority.id,
    text: newPriority.text,
    type: newPriority.type,
    date: newPriority.date,
    completed: 0,
    completedAt: null,
    sortOrder: newPriority.sortOrder,
    rolledOverFrom: null,
  });

  set((state) => ({
    tomorrowPriorities: [...state.tomorrowPriorities, newPriority],
  }));
},
```

- [ ] **Step 4: Implement deleteTomorrowPriority**

```ts
deleteTomorrowPriority: async (db, id) => {
  await db.delete(prioritiesTable).where(eq(prioritiesTable.id, id));
  set((state) => ({
    tomorrowPriorities: state.tomorrowPriorities.filter((p) => p.id !== id),
  }));
},
```

- [ ] **Step 5: Load tomorrow in `loadToday`**

Inside `loadToday`, after the `set({...})` that populates today state, append at the end of the `try` block (before the `finally`):

```ts
      // Preload tomorrow's pre-seeded rows for the Plan Tomorrow card count
      const tRows = await db
        .select()
        .from(prioritiesTable)
        .where(eq(prioritiesTable.date, tomorrowISO()));
      set({
        tomorrowPriorities: (tRows as PriorityRow[]).map(rowToPriority),
      });
```

- [ ] **Step 6: Write failing tests**

Append to `apps/mobile/src/stores/__tests__/useDayStore.test.ts`, inside the `describe`:

```ts
  // --- tomorrow priorities ---

  it("addTomorrowPriority inserts with date = tomorrow", async () => {
    const { db, pRows } = makeFakeDb();

    await useDayStore
      .getState()
      .addTomorrowPriority(db, { text: "Deploy", type: "must" });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString("en-CA");

    expect(pRows).toHaveLength(1);
    expect(pRows[0]?.date).toBe(tomorrowStr);

    const { tomorrowPriorities } = useDayStore.getState();
    expect(tomorrowPriorities).toHaveLength(1);
    expect(tomorrowPriorities[0]?.text).toBe("Deploy");
  });

  it("addTomorrowPriority enforces 3 must-do cap on the tomorrow set", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().addTomorrowPriority(db, { text: "A", type: "must" });
    await useDayStore.getState().addTomorrowPriority(db, { text: "B", type: "must" });
    await useDayStore.getState().addTomorrowPriority(db, { text: "C", type: "must" });

    await expect(
      useDayStore.getState().addTomorrowPriority(db, { text: "D", type: "must" }),
    ).rejects.toThrow();
  });

  it("deleteTomorrowPriority removes it from tomorrowPriorities", async () => {
    const { db } = makeFakeDb();
    await useDayStore.getState().addTomorrowPriority(db, { text: "X", type: "win" });
    const id = useDayStore.getState().tomorrowPriorities[0]!.id;
    await useDayStore.getState().deleteTomorrowPriority(db, id);
    expect(useDayStore.getState().tomorrowPriorities).toHaveLength(0);
  });
```

Also update `reset()` in that file to include `tomorrowPriorities: []`.

- [ ] **Step 7: Run tests**

```bash
bun --cwd apps/mobile test -- useDayStore
```

Expected: new tests pass. Existing tests still pass.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/stores/useDayStore.ts \
  apps/mobile/src/stores/__tests__/useDayStore.test.ts
git commit -m "feat(mobile): persist tomorrow priorities in useDayStore"
```

---

### Task 7: Remove Tonight data path (TonightCard, sheet, store, store methods)

**Files:**
- Delete: `apps/mobile/src/components/molecules/TonightCard/` (directory)
- Delete: `apps/mobile/src/components/organisms/TonightPlannerSheet/` (directory)
- Delete: `apps/mobile/src/stores/useTonightPlannerSheetStore.ts`
- Modify: `apps/mobile/src/stores/useDayStore.ts` — remove `tonight`, `setTonight`, `getYesterdayTonight`, `tonightKey`
- Modify: `apps/mobile/src/app/(main)/(tabs)/day/index.tsx` — remove `<TonightCard />`, `<TonightPlannerSheet />`, imports
- Modify: `apps/mobile/src/hooks/useDayData.ts` — remove `tonight` from selector + return
- Modify: `apps/mobile/src/stores/__tests__/useDayStore.test.ts` — remove `setTonight` test

- [ ] **Step 1: Delete directories**

```bash
rm -rf apps/mobile/src/components/molecules/TonightCard \
  apps/mobile/src/components/organisms/TonightPlannerSheet \
  apps/mobile/src/stores/useTonightPlannerSheetStore.ts
```

- [ ] **Step 2: Strip `tonight` from useDayStore**

In `apps/mobile/src/stores/useDayStore.ts`:
- Delete the `tonightKey` helper.
- Remove `tonight: string;`, `setTonight: (...)`, `getYesterdayTonight: (...)` from `DayState`.
- Remove `tonight: ""` from initial state.
- In `loadToday`, drop the `tonightRow` query from the `Promise.all` and the `tonight:` line from the `set()` call.
- Delete the `setTonight` and `getYesterdayTonight` method bodies.

- [ ] **Step 3: Strip from useDayData**

In `apps/mobile/src/hooks/useDayData.ts`, remove `tonight` subscription and its return key.

- [ ] **Step 4: Strip from day screen**

In `apps/mobile/src/app/(main)/(tabs)/day/index.tsx`, remove the `TonightCard` and `TonightPlannerSheet` imports and JSX usages.

- [ ] **Step 5: Strip from store tests**

In `useDayStore.test.ts`, delete the `setTonight updates tonight in state` block and remove `tonight: ""` from `reset()`.

- [ ] **Step 6: Run tests + typecheck**

```bash
bun --cwd apps/mobile test
bun --cwd apps/mobile typecheck
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -u
git commit -m "refactor(mobile): remove Tonight card + free-text evening note (superseded by Plan Tomorrow)"
```

---

### Task 8: PlanTomorrowCard molecule

**Files:**
- Create: `apps/mobile/src/components/molecules/PlanTomorrowCard/PlanTomorrowCard.tsx`
- Create: `apps/mobile/src/components/molecules/PlanTomorrowCard/index.ts`
- Create: `apps/mobile/src/stores/usePlanTomorrowSheetStore.ts`
- Modify: `apps/mobile/src/hooks/useDayData.ts` — expose `tomorrowPriorityCount`

- [ ] **Step 1: Write the sheet store**

Create `usePlanTomorrowSheetStore.ts`:

```ts
import { create } from "zustand";

interface PlanTomorrowSheetState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const usePlanTomorrowSheetStore = create<PlanTomorrowSheetState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
```

- [ ] **Step 2: Expose count from useDayData**

Add to `useDayData.ts`:

```ts
const tomorrowPriorities = useDayStore((s) => s.tomorrowPriorities);
const tomorrowPriorityCount = tomorrowPriorities.length;
```

Return `tomorrowPriorities` and `tomorrowPriorityCount` in the hook's object.

- [ ] **Step 3: Write the card**

Create `PlanTomorrowCard.tsx`:

```tsx
import { Pressable, View } from "react-native";
import { Card } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useDayData } from "@/hooks/useDayData";
import { usePlanTomorrowSheetStore } from "@/stores/usePlanTomorrowSheetStore";
import { Sunrise } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";

export const PlanTomorrowCard = () => {
  const { tomorrowPriorityCount } = useDayData();
  const { open } = usePlanTomorrowSheetStore();
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  return (
    <Pressable onPress={open}>
      <Card className="bg-primary/10 p-4">
        <Card.Body className="gap-1">
          <View className="flex-row items-center gap-2">
            <Sunrise size={14} color={primaryColor as string} weight="fill" />
            <AppText size="sm" weight="semibold" color="primary">
              Plan Tomorrow
            </AppText>
          </View>
          {tomorrowPriorityCount > 0 ? (
            <AppText size="sm">
              {tomorrowPriorityCount}{" "}
              {tomorrowPriorityCount === 1 ? "priority" : "priorities"} queued for tomorrow
            </AppText>
          ) : (
            <AppText size="sm" color="muted">
              Tap to seed tomorrow's priorities
            </AppText>
          )}
        </Card.Body>
      </Card>
    </Pressable>
  );
};
```

Create `index.ts`:

```ts
export { PlanTomorrowCard } from "./PlanTomorrowCard";
```

- [ ] **Step 4: Mount in Day screen** (done alongside Task 10 sheet — leave commented out if you prefer to land atomically)

For now, swap `<TonightCard />` for `<PlanTomorrowCard />` in `apps/mobile/src/app/(main)/(tabs)/day/index.tsx`:

```tsx
import { PlanTomorrowCard } from "@/components/molecules/PlanTomorrowCard";
// ...
<PlanTomorrowCard />
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/stores/usePlanTomorrowSheetStore.ts \
  apps/mobile/src/hooks/useDayData.ts \
  apps/mobile/src/components/molecules/PlanTomorrowCard/ \
  apps/mobile/src/app/\(main\)/\(tabs\)/day/index.tsx
git commit -m "feat(mobile): add PlanTomorrowCard molecule replacing TonightCard"
```

---

### Task 9: PlanTomorrowSheet organism (iOS + Android)

**Files:**
- Create: `apps/mobile/src/components/organisms/PlanTomorrowSheet/PlanTomorrowSheet.ios.tsx`
- Create: `apps/mobile/src/components/organisms/PlanTomorrowSheet/PlanTomorrowSheet.android.tsx`
- Create: `apps/mobile/src/components/organisms/PlanTomorrowSheet/index.ts`
- Modify: `apps/mobile/src/app/(main)/(tabs)/day/index.tsx` — mount sheet

- [ ] **Step 1: Write iOS sheet**

Create `PlanTomorrowSheet.ios.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  type TextInput as TextInputType,
} from "react-native";
import {
  BottomSheet,
  Group,
  Host,
  RNHostView,
} from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { AppText } from "@/components/atoms/Text";
import { Button, Checkbox } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { Trash } from "phosphor-react-native";
import { usePlanTomorrowSheetStore } from "@/stores/usePlanTomorrowSheetStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";
import type { Priority } from "@/types";

const TYPE_OPTIONS: { key: Priority["type"]; label: string }[] = [
  { key: "must", label: "Must" },
  { key: "win", label: "Win" },
  { key: "overdue", label: "Overdue" },
];

export const PlanTomorrowSheet = () => {
  const { isOpen, close } = usePlanTomorrowSheetStore();
  const { tomorrowPriorities } = useDayData();
  const addTomorrowPriority = useDayStore((s) => s.addTomorrowPriority);
  const deleteTomorrowPriority = useDayStore((s) => s.deleteTomorrowPriority);
  const { db } = useDatabase();

  const [text, setText] = useState("");
  const [type, setType] = useState<Priority["type"]>("must");
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<TextInputType>(null);

  const [mutedColor, dangersColor, primaryColor] = useCSSVariable([
    "--color-muted",
    "--color-danger",
    "--color-primary",
  ]);

  useEffect(() => {
    if (!isOpen) {
      setText("");
      setType("must");
      setError(null);
    }
  }, [isOpen]);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || !db) return;
    setIsAdding(true);
    setError(null);
    try {
      await addTomorrowPriority(db, { text: trimmed, type });
      setText("");
      inputRef.current?.focus();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't save. Please try again.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    await deleteTomorrowPriority(db, id);
  };

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(presented) => {
          if (!presented) close();
        }}
      >
        <Group
          modifiers={[
            presentationDetents(["large"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
            <View className="px-5 py-6 gap-5">
              <AppText size="xl" weight="bold" family="headline">
                Plan Tomorrow
              </AppText>
              <AppText size="sm" color="muted">
                Seed up to 3 must-dos plus wins and overdue items. They become
                tomorrow's Top Priorities automatically.
              </AppText>

              <View className="flex-row gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setType(opt.key)}
                    className={`rounded-full px-3 py-1.5 ${type === opt.key ? "bg-primary" : "bg-surface"}`}
                  >
                    <AppText
                      size="xs"
                      weight="semibold"
                      color={type === opt.key ? "primaryForeground" : "muted"}
                    >
                      {opt.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder="What will matter tomorrow?"
                className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                placeholderTextColor={mutedColor as string}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAdd}
                blurOnSubmit={false}
              />

              {error && (
                <AppText size="xs" color="danger">
                  {error}
                </AppText>
              )}

              <Button
                onPress={handleAdd}
                isDisabled={!text.trim() || isAdding}
              >
                <Button.Label>{isAdding ? "Adding…" : "Add"}</Button.Label>
              </Button>

              <View className="gap-1">
                <AppText
                  size="xs"
                  weight="semibold"
                  color="muted"
                  className="uppercase tracking-wide"
                >
                  Queued for Tomorrow ({tomorrowPriorities.length})
                </AppText>
                {tomorrowPriorities.length === 0 && (
                  <AppText size="sm" color="muted">
                    Nothing queued yet.
                  </AppText>
                )}
                {tomorrowPriorities.map((p) => (
                  <View
                    key={p.id}
                    className="flex-row items-center gap-3 py-2"
                  >
                    <Checkbox isSelected={false} isDisabled />
                    <AppText size="sm" className="flex-1">
                      {p.text}
                    </AppText>
                    <AppText size="xs" color="muted">
                      {p.type}
                    </AppText>
                    <Pressable onPress={() => handleDelete(p.id)} hitSlop={8}>
                      <Trash size={14} color={dangersColor as string} />
                    </Pressable>
                  </View>
                ))}
              </View>

              <Button variant="tertiary" onPress={close}>
                <Button.Label>Done</Button.Label>
              </Button>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
```

- [ ] **Step 2: Write Android variant**

Create `PlanTomorrowSheet.android.tsx` — identical to above but replace the `Host`/`BottomSheet`/`Group`/`RNHostView` block with:

```tsx
import { ModalBottomSheet, Host, RNHostView } from "@expo/ui/jetpack-compose";
// ...
if (!isOpen) return null;

return (
  <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
    <ModalBottomSheet onDismissRequest={close} showDragHandle>
      <RNHostView matchContents>
        {/* same inner View + body as iOS */}
      </RNHostView>
    </ModalBottomSheet>
  </Host>
);
```

Copy the whole inner `<View className="px-5 py-6 gap-5">` block verbatim from the iOS file.

- [ ] **Step 3: Platform export**

Create `index.ts`:

```ts
export { PlanTomorrowSheet } from "./PlanTomorrowSheet";
```

- [ ] **Step 4: Mount in Day screen**

In `apps/mobile/src/app/(main)/(tabs)/day/index.tsx`, add:

```tsx
import { PlanTomorrowSheet } from "@/components/organisms/PlanTomorrowSheet";
// ...
<PlanTomorrowSheet />
```

- [ ] **Step 5: Manual verification**

Tap `PlanTomorrowCard`. Expected: sheet opens. Add "Write PRD" as must — chip appears in "Queued for Tomorrow". Close sheet. Card updates to "1 priority queued for tomorrow". Kill and relaunch the app. Expected: count persists. Advance date (or wait until next day) and confirm "Write PRD" shows up in today's PriorityList.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/components/organisms/PlanTomorrowSheet/ \
  apps/mobile/src/app/\(main\)/\(tabs\)/day/index.tsx
git commit -m "feat(mobile): add PlanTomorrowSheet to seed tomorrow's priorities"
```

---

### Task 10: EveningPromptSheet (in-app nudge after 8pm)

**Files:**
- Create: `apps/mobile/src/components/organisms/EveningPromptSheet/EveningPromptSheet.ios.tsx`
- Create: `apps/mobile/src/components/organisms/EveningPromptSheet/EveningPromptSheet.android.tsx`
- Create: `apps/mobile/src/components/organisms/EveningPromptSheet/index.ts`
- Modify: `apps/mobile/src/app/(main)/(tabs)/day/index.tsx` — mount
- Modify: `apps/mobile/src/stores/useDayStore.ts` — add `eveningPromptKey` persistence helpers

**Trigger logic:** On Day tab mount, if local time is ≥ 20:00 AND there are no `tomorrowPriorities` AND metadata key `evening_prompt_dismissed_{todayISO}` is not set → show the sheet.

- [ ] **Step 1: Add dismiss helper in useDayStore**

Add to `DayState`:

```ts
  hasCheckedEveningPrompt: boolean;
  checkEveningPromptShouldShow: (db: Database) => Promise<boolean>;
  dismissEveningPrompt: (db: Database) => Promise<void>;
  markEveningPromptChecked: () => void;
```

Initial state: `hasCheckedEveningPrompt: false`.

Helper (top of file alongside other key fns):

```ts
function eveningPromptKey(date: string) {
  return `evening_prompt_dismissed_${date}`;
}
```

Implementations:

```ts
checkEveningPromptShouldShow: async (db) => {
  const now = new Date();
  if (now.getHours() < 20) return false;

  const { tomorrowPriorities } = get();
  if (tomorrowPriorities.length > 0) return false;

  const today = todayISO();
  const rows = await db
    .select()
    .from(metadataTable)
    .where(eq(metadataTable.key, eveningPromptKey(today)));
  return (rows as { key?: string }[]).length === 0;
},

dismissEveningPrompt: async (db) => {
  const today = todayISO();
  const now = new Date().toISOString();
  await db
    .insert(metadataTable)
    .values({
      key: eveningPromptKey(today),
      value: "dismissed",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: metadataTable.key,
      set: { value: "dismissed", updatedAt: now },
    });
  set({ hasCheckedEveningPrompt: true });
},

markEveningPromptChecked: () => set({ hasCheckedEveningPrompt: true }),
```

- [ ] **Step 2: Write iOS sheet**

Create `EveningPromptSheet.ios.tsx`:

```tsx
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Group,
  Host,
  RNHostView,
} from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { MoonStars } from "phosphor-react-native";
import { useDayStore } from "@/stores/useDayStore";
import { useDatabase } from "@/hooks/useDatabase";
import { usePlanTomorrowSheetStore } from "@/stores/usePlanTomorrowSheetStore";

export const EveningPromptSheet = () => {
  const hasChecked = useDayStore((s) => s.hasCheckedEveningPrompt);
  const check = useDayStore((s) => s.checkEveningPromptShouldShow);
  const dismiss = useDayStore((s) => s.dismissEveningPrompt);
  const markChecked = useDayStore((s) => s.markEveningPromptChecked);
  const openPlanner = usePlanTomorrowSheetStore((s) => s.open);
  const { db } = useDatabase();

  const [isOpen, setIsOpen] = useState(false);
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  useEffect(() => {
    if (hasChecked || !db) return;
    void check(db).then((shouldShow) => {
      if (shouldShow) setIsOpen(true);
      else markChecked();
    });
  }, [hasChecked, db, check, markChecked]);

  const handlePlan = () => {
    setIsOpen(false);
    markChecked();
    openPlanner();
  };

  const handleSkip = async () => {
    if (db) await dismiss(db);
    else markChecked();
    setIsOpen(false);
  };

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(presented) => {
          if (!presented) void handleSkip();
        }}
      >
        <Group
          modifiers={[
            presentationDetents(["medium"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
            <View className="px-5 py-6 gap-5">
              <View className="items-center gap-3">
                <MoonStars
                  size={32}
                  color={primaryColor as string}
                  weight="fill"
                />
                <AppText size="xl" weight="bold" family="headline">
                  Wind-down
                </AppText>
                <AppText size="sm" color="muted" className="text-center">
                  Set tomorrow up for success. Takes under a minute.
                </AppText>
              </View>

              <View className="flex-row gap-3">
                <Button
                  variant="tertiary"
                  className="flex-1"
                  onPress={handleSkip}
                >
                  <Button.Label>Not tonight</Button.Label>
                </Button>
                <Button className="flex-1" onPress={handlePlan}>
                  <Button.Label>Plan Tomorrow</Button.Label>
                </Button>
              </View>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
```

- [ ] **Step 3: Write Android sheet**

Create `EveningPromptSheet.android.tsx` — same body, using `ModalBottomSheet` + `if (!isOpen) return null;` at render time, following the `RolloverPromptSheet.android.tsx` pattern already in the codebase.

- [ ] **Step 4: Platform export**

```ts
export { EveningPromptSheet } from "./EveningPromptSheet";
```

- [ ] **Step 5: Mount in Day screen**

Add to `apps/mobile/src/app/(main)/(tabs)/day/index.tsx`:

```tsx
import { EveningPromptSheet } from "@/components/organisms/EveningPromptSheet";
// ...
<EveningPromptSheet />
```

- [ ] **Step 6: Manual test**

Temporarily mock `Date` or set device clock to 20:30 (or edit `check` to `now.getHours() < 9` during dev). Open app. Expected: EveningPromptSheet auto-appears. "Not tonight" dismisses for rest of day. Revert time.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/stores/useDayStore.ts \
  apps/mobile/src/components/organisms/EveningPromptSheet/ \
  apps/mobile/src/app/\(main\)/\(tabs\)/day/index.tsx
git commit -m "feat(mobile): evening nudge after 8pm to plan tomorrow"
```

---

### Task 10b: Phase 2 UI verification with `agent-device`

**Prerequisites:** Dev client running. Activate `agent-device` skill.
**Screenshot target:** `docs/execution/screenshots/2026-04-24-day-tab-improvements/phase2/`

- [ ] **Step 1: Snapshot — PlanTomorrowCard empty state**

Day tab → verify `PlanTomorrowCard` replaces the old Tonight card. Label reads "Plan Tomorrow", subtitle "Tap to seed tomorrow's priorities". Save `phase2/01-plan-tomorrow-card-empty.png`.

- [ ] **Step 2: Interaction — seed tomorrow priorities**

Tap card → PlanTomorrowSheet opens. Select "Must" chip, type "Ship RC build" → Add. Select "Win" chip, type "Review PRs" → Add. Assert both appear in the "Queued for Tomorrow" section with the correct type tag. Save `phase2/02-plantomorrowsheet-two-items.png`.

- [ ] **Step 3: Verify card count updates**

Close sheet. Card should now read "2 priorities queued for tomorrow". Save `phase2/03-card-shows-count.png`.

- [ ] **Step 4: Verify persistence**

Use `mobile_terminate_app` then `mobile_launch_app`. Navigate back to Day tab. Count still reads "2 priorities queued". Save `phase2/04-persisted-after-relaunch.png`.

- [ ] **Step 5: Interaction — evening trigger (simulated clock)**

Two options for triggering the 8pm detection:
- (a) Use `mobile_open_url` to open the OS Settings URL and set the simulator clock to 20:30 — device-specific, may not work on all simulators.
- (b) Temporarily hardcode `now.getHours() < 9` (inverted) in `checkEveningPromptShouldShow` to force-fire. **If using this approach, add a `git stash` step before testing and a `git stash pop` + retest before commit. Do not commit the hack.**

Verify `EveningPromptSheet` appears on launch. Tap "Plan Tomorrow". Assert `PlanTomorrowSheet` opens. Save `phase2/05-evening-prompt.png`, `phase2/06-evening-to-planner.png`.

- [ ] **Step 6: Next-day seeding verification**

If feasible on the simulator: advance the device date by one day, relaunch, verify the priorities queued as "tomorrow" now appear under today's PriorityList "Must-do" section (for "Ship RC build") and "Win" section (for "Review PRs"). Save `phase2/07-next-day-seeded.png`.

If simulator date-travel is impractical, document this as a manual follow-up and run it against a real device before PR merge.

- [ ] **Step 7: Report + commit**

Write `docs/execution/2026-04-24-day-tab-improvements-phase2-report.md`. Commit screenshots + report:

```bash
git add docs/execution/
git commit -m "test(mobile): phase 2 on-device verification"
```

---

## Phase 3 — Focus Session Upgrade

### Task 11: Drizzle migration for focus_sessions + reflections

**Files:**
- Create: `apps/mobile/src/db/schema/focusSessions.ts`
- Create: `apps/mobile/src/db/schema/reflections.ts`
- Modify: `apps/mobile/src/db/schema/index.ts` — export
- Create: `apps/mobile/src/db/drizzle/0003_day_tab_improvements.sql`
- Create: `apps/mobile/src/db/drizzle/meta/0003_snapshot.json`
- Modify: `apps/mobile/src/db/drizzle/meta/_journal.json`
- Modify: `apps/mobile/src/db/drizzle/migrations.js`
- Modify: `apps/mobile/src/types/index.ts` — add `FocusSession`, `Reflection`

- [ ] **Step 1: Write schemas**

`focusSessions.ts`:

```ts
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const focusSessions = sqliteTable("focus_sessions", {
  id: text("id").primaryKey(),
  priorityId: text("priority_id"),
  goal: text("goal"),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  plannedSec: int("planned_sec").notNull(),
  actualSec: int("actual_sec").notNull().default(0),
  completedNaturally: int("completed_naturally").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type FocusSessionRow = typeof focusSessions.$inferSelect;
export type NewFocusSession = typeof focusSessions.$inferInsert;
```

`reflections.ts`:

```ts
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// One reflection per day. `wins` is a JSON-encoded string[] (2-3 entries typical).
export const reflections = sqliteTable("reflections", {
  date: text("date").primaryKey(),
  wins: text("wins").notNull().default("[]"),
  improve: text("improve").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type ReflectionRow = typeof reflections.$inferSelect;
export type NewReflection = typeof reflections.$inferInsert;
```

- [ ] **Step 2: Export from index**

Add to `apps/mobile/src/db/schema/index.ts`:

```ts
import { focusSessions } from "./focusSessions";
import { reflections } from "./reflections";
export { focusSessions } from "./focusSessions";
export { reflections } from "./reflections";
export type { FocusSessionRow, NewFocusSession } from "./focusSessions";
export type { ReflectionRow, NewReflection } from "./reflections";
```

Add both to the `schema` object.

- [ ] **Step 3: Types**

Add to `apps/mobile/src/types/index.ts`:

```ts
export interface FocusSession {
  id: string;
  priorityId: string | null;
  goal: string | null;
  startedAt: string;
  endedAt: string | null;
  plannedSec: number;
  actualSec: number;
  completedNaturally: boolean;
  createdAt: string;
}

export interface Reflection {
  date: string;
  wins: string[];
  improve: string;
  createdAt: string;
}
```

- [ ] **Step 4: Generate migration**

Run:

```bash
bun --cwd apps/mobile drizzle-kit generate --name day_tab_improvements
```

Expected output: `apps/mobile/src/db/drizzle/0003_day_tab_improvements.sql` and updated `meta/_journal.json` + `meta/0003_snapshot.json`. Inspect the SQL — it should contain two `CREATE TABLE` statements matching the schema files above. If the generator chose a different filename, rename it to `0003_day_tab_improvements.sql` and update `_journal.json` accordingly.

- [ ] **Step 5: Register in migrations.js**

Confirm `migrations.js` exports the new migration. Drizzle normally regenerates this — verify it includes `0003_day_tab_improvements` in its journal array.

- [ ] **Step 6: Run tests**

```bash
bun --cwd apps/mobile test
```

Expected: pass (schema tests in `__tests__/daySchema.test.ts` may need adjustment — if they exist and reference a hard-coded table list, add focus_sessions/reflections).

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/db/schema/ apps/mobile/src/db/drizzle/ \
  apps/mobile/src/types/index.ts
git commit -m "feat(db): add focus_sessions + reflections tables (migration 0003)"
```

---

### Task 12: FocusSessionSettingsSheet + store wiring

**Files:**
- Create: `apps/mobile/src/stores/useFocusSessionSettingsSheetStore.ts`
- Create: `apps/mobile/src/components/organisms/FocusSessionSettingsSheet/FocusSessionSettingsSheet.ios.tsx`
- Create: `apps/mobile/src/components/organisms/FocusSessionSettingsSheet/FocusSessionSettingsSheet.android.tsx`
- Create: `apps/mobile/src/components/organisms/FocusSessionSettingsSheet/index.ts`
- Modify: `apps/mobile/src/stores/useTimerStore.ts`

- [ ] **Step 1: Extend useTimerStore**

Rewrite `apps/mobile/src/stores/useTimerStore.ts`:

```ts
import { create } from "zustand";

type Phase = "focus" | "break";

interface TimerState {
  seconds: number;
  isRunning: boolean;
  sessionLength: number;
  breakLength: number;
  phase: Phase;
  cycleCount: number;
  startedAt: number | null;
  secondsAtStart: number;

  linkedPriorityId: string | null;
  sessionGoal: string;
  currentSessionId: string | null;

  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;

  setLinkedPriority: (id: string | null) => void;
  setSessionGoal: (goal: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  beginBreak: () => void;
  beginNextFocus: () => void;
  clearSessionContext: () => void;
}

const FOCUS_LEN = 50 * 60;
const BREAK_LEN = 10 * 60;

export const useTimerStore = create<TimerState>((set) => ({
  seconds: FOCUS_LEN,
  isRunning: false,
  sessionLength: FOCUS_LEN,
  breakLength: BREAK_LEN,
  phase: "focus",
  cycleCount: 0,
  startedAt: null,
  secondsAtStart: FOCUS_LEN,

  linkedPriorityId: null,
  sessionGoal: "",
  currentSessionId: null,

  start: () =>
    set((state) => ({
      isRunning: true,
      startedAt: Date.now(),
      secondsAtStart: state.seconds,
    })),

  pause: () =>
    set((state) => {
      const elapsed = state.startedAt
        ? Math.floor((Date.now() - state.startedAt) / 1000)
        : 0;
      const remaining = Math.max(0, state.secondsAtStart - elapsed);
      return { isRunning: false, seconds: remaining, startedAt: null };
    }),

  reset: () =>
    set((state) => {
      const base = state.phase === "focus" ? state.sessionLength : state.breakLength;
      return {
        seconds: base,
        isRunning: false,
        startedAt: null,
        secondsAtStart: base,
      };
    }),

  tick: () =>
    set((state) => {
      if (!state.startedAt) return {};
      const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      const remaining = Math.max(0, state.secondsAtStart - elapsed);
      if (remaining <= 0) {
        return { seconds: 0, isRunning: false, startedAt: null };
      }
      return { seconds: remaining };
    }),

  setLinkedPriority: (id) => set({ linkedPriorityId: id }),
  setSessionGoal: (goal) => set({ sessionGoal: goal }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),

  beginBreak: () =>
    set((state) => ({
      phase: "break",
      seconds: state.breakLength,
      secondsAtStart: state.breakLength,
      isRunning: false,
      startedAt: null,
      cycleCount: state.cycleCount + 1,
    })),

  beginNextFocus: () =>
    set((state) => ({
      phase: "focus",
      seconds: state.sessionLength,
      secondsAtStart: state.sessionLength,
      isRunning: false,
      startedAt: null,
    })),

  clearSessionContext: () =>
    set({
      linkedPriorityId: null,
      sessionGoal: "",
      currentSessionId: null,
      cycleCount: 0,
      phase: "focus",
      seconds: FOCUS_LEN,
      secondsAtStart: FOCUS_LEN,
      isRunning: false,
      startedAt: null,
    }),
}));
```

- [ ] **Step 2: Create the settings-sheet store**

`useFocusSessionSettingsSheetStore.ts`:

```ts
import { create } from "zustand";

interface State {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useFocusSessionSettingsSheetStore = create<State>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
```

- [ ] **Step 3: Write iOS sheet**

`FocusSessionSettingsSheet.ios.tsx`:

```tsx
import { useEffect, useState } from "react";
import { View, TextInput, Pressable, ScrollView } from "react-native";
import {
  BottomSheet,
  Group,
  Host,
  RNHostView,
} from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useFocusSessionSettingsSheetStore } from "@/stores/useFocusSessionSettingsSheetStore";
import { useTimerStore } from "@/stores/useTimerStore";
import { useDayData } from "@/hooks/useDayData";

export const FocusSessionSettingsSheet = () => {
  const { isOpen, close } = useFocusSessionSettingsSheetStore();
  const linkedPriorityId = useTimerStore((s) => s.linkedPriorityId);
  const sessionGoal = useTimerStore((s) => s.sessionGoal);
  const setLinkedPriority = useTimerStore((s) => s.setLinkedPriority);
  const setSessionGoal = useTimerStore((s) => s.setSessionGoal);
  const { priorities } = useDayData();

  const [localGoal, setLocalGoal] = useState(sessionGoal);
  const [localPriority, setLocalPriority] = useState<string | null>(linkedPriorityId);
  const [mutedColor] = useCSSVariable(["--color-muted"]);

  const activePriorities = priorities.filter((p) => !p.isCompleted);

  useEffect(() => {
    if (isOpen) {
      setLocalGoal(sessionGoal);
      setLocalPriority(linkedPriorityId);
    }
  }, [isOpen, sessionGoal, linkedPriorityId]);

  const handleSave = () => {
    setSessionGoal(localGoal.trim());
    setLinkedPriority(localPriority);
    close();
  };

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(presented) => {
          if (!presented) close();
        }}
      >
        <Group
          modifiers={[
            presentationDetents(["medium", "large"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
            <View className="px-5 py-6 gap-5">
              <AppText size="xl" weight="bold" family="headline">
                Set Focus Intent
              </AppText>

              <View className="gap-2">
                <AppText size="sm" weight="semibold" color="muted">
                  What will you finish?
                </AppText>
                <TextInput
                  value={localGoal}
                  onChangeText={setLocalGoal}
                  placeholder="Draft the PRD intro"
                  className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                  placeholderTextColor={mutedColor as string}
                  autoFocus
                />
              </View>

              <View className="gap-2">
                <AppText size="sm" weight="semibold" color="muted">
                  Link to priority (optional)
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  <Pressable
                    onPress={() => setLocalPriority(null)}
                    className={`rounded-full px-3 py-1.5 ${localPriority === null ? "bg-primary" : "bg-surface"}`}
                  >
                    <AppText
                      size="xs"
                      weight="semibold"
                      color={localPriority === null ? "primaryForeground" : "muted"}
                    >
                      None
                    </AppText>
                  </Pressable>
                  {activePriorities.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => setLocalPriority(p.id)}
                      className={`rounded-full px-3 py-1.5 ${localPriority === p.id ? "bg-primary" : "bg-surface"}`}
                    >
                      <AppText
                        size="xs"
                        weight="semibold"
                        color={localPriority === p.id ? "primaryForeground" : "muted"}
                      >
                        {p.text}
                      </AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View className="flex-row gap-3">
                <Button variant="tertiary" className="flex-1" onPress={close}>
                  <Button.Label>Cancel</Button.Label>
                </Button>
                <Button className="flex-1" onPress={handleSave}>
                  <Button.Label>Save</Button.Label>
                </Button>
              </View>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
```

- [ ] **Step 4: Android variant**

Create `FocusSessionSettingsSheet.android.tsx` — same body, using `ModalBottomSheet` + early-return pattern.

- [ ] **Step 5: Platform export**

```ts
export { FocusSessionSettingsSheet } from "./FocusSessionSettingsSheet";
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/stores/useTimerStore.ts \
  apps/mobile/src/stores/useFocusSessionSettingsSheetStore.ts \
  apps/mobile/src/components/organisms/FocusSessionSettingsSheet/
git commit -m "feat(mobile): focus session settings — link priority + session goal"
```

---

### Task 13: PomodoroTimer upgrade (goal chip, break cycles, daily total)

**Files:**
- Modify: `apps/mobile/src/components/organisms/PomodoroTimer/PomodoroTimer.tsx`
- Modify: `apps/mobile/src/stores/useDayStore.ts` — add `todayFocusMinutes` + `logFocusSession`
- Modify: `apps/mobile/src/hooks/useDayData.ts` — expose `todayFocusMinutes`
- Modify: `apps/mobile/src/app/(main)/(tabs)/day/index.tsx` — mount `FocusSessionSettingsSheet`

- [ ] **Step 1: Add focus session log + daily total to useDayStore**

Add to `DayState`:

```ts
  todayFocusMinutes: number;
  loadTodayFocusMinutes: (db: Database) => Promise<void>;
  logFocusSession: (
    db: Database,
    input: {
      priorityId: string | null;
      goal: string | null;
      plannedSec: number;
      actualSec: number;
      completedNaturally: boolean;
      startedAt: string;
    },
  ) => Promise<void>;
```

Initial state: `todayFocusMinutes: 0`.

Import `focusSessions as focusSessionsTable` at top.

Implementations:

```ts
loadTodayFocusMinutes: async (db) => {
  const today = todayISO();
  const rows = await db
    .select()
    .from(focusSessionsTable)
    .where(eq(focusSessionsTable.startedAt, today)); // placeholder
  // Replace the above `where` at runtime with a date-range filter in raw SQL
  // because startedAt is a full ISO timestamp. Use:
  //   .where(sql`date(started_at) = ${today}`)
  // (Import { sql } from "drizzle-orm" at top of file.)
  const total = (rows as { actualSec: number }[]).reduce(
    (acc, r) => acc + (r.actualSec ?? 0),
    0,
  );
  set({ todayFocusMinutes: Math.floor(total / 60) });
},

logFocusSession: async (db, input) => {
  const now = new Date().toISOString();
  await db.insert(focusSessionsTable).values({
    id: generateId(),
    priorityId: input.priorityId,
    goal: input.goal,
    startedAt: input.startedAt,
    endedAt: now,
    plannedSec: input.plannedSec,
    actualSec: input.actualSec,
    completedNaturally: input.completedNaturally ? 1 : 0,
  });
  const { todayFocusMinutes } = get();
  set({ todayFocusMinutes: todayFocusMinutes + Math.floor(input.actualSec / 60) });
},
```

**Note:** The Drizzle `.where()` stub above is a placeholder. Replace with:

```ts
import { sql } from "drizzle-orm";
// ...
.where(sql`date(${focusSessionsTable.startedAt}) = ${today}`)
```

- [ ] **Step 2: Call `loadTodayFocusMinutes` in `loadToday`**

Inside `loadToday`, after the tomorrow-priorities load, add:

```ts
await get().loadTodayFocusMinutes(db);
```

- [ ] **Step 3: Expose in useDayData**

Add `todayFocusMinutes = useDayStore((s) => s.todayFocusMinutes);` and include in return.

- [ ] **Step 4: Rewrite PomodoroTimer**

Replace `PomodoroTimer.tsx`:

```tsx
import { View, Alert, Pressable } from "react-native";
import { useEffect, useCallback, useRef } from "react";
import { Button } from "heroui-native";
import { ProgressRing } from "@/components/atoms/ProgressRing";
import { AppText } from "@/components/atoms/Text";
import { Gear, Target } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useTimerStore } from "@/stores/useTimerStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";
import { useFocusSessionSettingsSheetStore } from "@/stores/useFocusSessionSettingsSheetStore";

const BREAK_SUGGESTIONS = [
  "Stretch for 2 minutes",
  "Drink a glass of water",
  "Step outside for fresh air",
  "Look away from the screen",
];

function randomBreakSuggestion(): string {
  return BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)]!;
}

export const PomodoroTimer = () => {
  const seconds = useTimerStore((s) => s.seconds);
  const isRunning = useTimerStore((s) => s.isRunning);
  const sessionLength = useTimerStore((s) => s.sessionLength);
  const breakLength = useTimerStore((s) => s.breakLength);
  const phase = useTimerStore((s) => s.phase);
  const cycleCount = useTimerStore((s) => s.cycleCount);
  const linkedPriorityId = useTimerStore((s) => s.linkedPriorityId);
  const sessionGoal = useTimerStore((s) => s.sessionGoal);
  const start = useTimerStore((s) => s.start);
  const pause = useTimerStore((s) => s.pause);
  const reset = useTimerStore((s) => s.reset);
  const tick = useTimerStore((s) => s.tick);
  const beginBreak = useTimerStore((s) => s.beginBreak);
  const beginNextFocus = useTimerStore((s) => s.beginNextFocus);
  const clearSessionContext = useTimerStore((s) => s.clearSessionContext);

  const incrementPomodoro = useDayStore((s) => s.incrementPomodoro);
  const logFocusSession = useDayStore((s) => s.logFocusSession);
  const pomodoroCount = useDayStore((s) => s.pomodoroCount);
  const { priorities, todayFocusMinutes } = useDayData();
  const { db } = useDatabase();
  const openSettings = useFocusSessionSettingsSheetStore((s) => s.open);

  const [primaryColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
  ]);

  const sessionStartRef = useRef<string | null>(null);

  // Snapshot start time when session begins
  useEffect(() => {
    if (isRunning && phase === "focus" && !sessionStartRef.current) {
      sessionStartRef.current = new Date().toISOString();
    }
  }, [isRunning, phase]);

  const dbRef = useRef(db);
  dbRef.current = db;

  const handleFocusComplete = useCallback(async () => {
    if (!dbRef.current) return;
    await incrementPomodoro(dbRef.current);
    await logFocusSession(dbRef.current, {
      priorityId: linkedPriorityId,
      goal: sessionGoal || null,
      plannedSec: sessionLength,
      actualSec: sessionLength,
      completedNaturally: true,
      startedAt: sessionStartRef.current ?? new Date().toISOString(),
    });
    sessionStartRef.current = null;

    Alert.alert(
      "Focus complete!",
      `${randomBreakSuggestion()}\n\nReady for a ${Math.floor(breakLength / 60)}-min break?`,
      [
        { text: "Skip break", onPress: () => reset(), style: "cancel" },
        { text: "Start break", onPress: () => { beginBreak(); start(); } },
      ],
    );
  }, [
    incrementPomodoro,
    logFocusSession,
    linkedPriorityId,
    sessionGoal,
    sessionLength,
    breakLength,
    beginBreak,
    reset,
    start,
  ]);

  const handleBreakComplete = useCallback(() => {
    Alert.alert("Break's up", "Back at it?", [
      { text: "Later", style: "cancel", onPress: () => clearSessionContext() },
      { text: "Next session", onPress: () => { beginNextFocus(); } },
    ]);
  }, [beginNextFocus, clearSessionContext]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  useEffect(() => {
    const unsub = useTimerStore.subscribe((state, prevState) => {
      if (prevState.isRunning && !state.isRunning && state.seconds === 0) {
        if (prevState.phase === "focus") void handleFocusComplete();
        else handleBreakComplete();
      }
    });
    return unsub;
  }, [handleFocusComplete, handleBreakComplete]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const base = phase === "focus" ? sessionLength : breakLength;
  const progress = 1 - seconds / base;
  const linkedPriority = priorities.find((p) => p.id === linkedPriorityId);

  return (
    <View className="items-center gap-4">
      <View className="flex-row items-center gap-2">
        <AppText size="sm" color="muted" weight="semibold">
          {phase === "focus" ? "Focus Session" : "Break"}
        </AppText>
        <Pressable onPress={openSettings} hitSlop={8}>
          <Gear size={14} color={mutedColor as string} />
        </Pressable>
      </View>

      {phase === "focus" && (sessionGoal || linkedPriority) && (
        <View className="items-center gap-1">
          {sessionGoal ? (
            <View className="flex-row items-center gap-1">
              <Target size={12} color={primaryColor as string} />
              <AppText size="xs" color="primary" weight="semibold">
                {sessionGoal}
              </AppText>
            </View>
          ) : null}
          {linkedPriority ? (
            <AppText size="xs" color="muted">
              on "{linkedPriority.text}"
            </AppText>
          ) : null}
        </View>
      )}

      <ProgressRing progress={progress} size={160} strokeWidth={8}>
        <AppText size="4xl" weight="bold" family="mono">
          {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </AppText>
      </ProgressRing>

      <View className="flex-row gap-3">
        <Button
          variant={isRunning ? "secondary" : "primary"}
          onPress={isRunning ? pause : start}
        >
          <Button.Label>{isRunning ? "Pause" : "Start"}</Button.Label>
        </Button>
        <Button variant="tertiary" onPress={reset}>
          <Button.Label>Reset</Button.Label>
        </Button>
      </View>

      <View className="items-center gap-0.5">
        {pomodoroCount > 0 && (
          <AppText size="xs" color="muted">
            {pomodoroCount} {pomodoroCount === 1 ? "session" : "sessions"} · {todayFocusMinutes}m focused today
          </AppText>
        )}
        {cycleCount > 0 && (
          <AppText size="xs" color="muted">
            Cycle {cycleCount}
          </AppText>
        )}
      </View>
    </View>
  );
};
```

- [ ] **Step 5: Mount FocusSessionSettingsSheet in day screen**

Add to `apps/mobile/src/app/(main)/(tabs)/day/index.tsx`:

```tsx
import { FocusSessionSettingsSheet } from "@/components/organisms/FocusSessionSettingsSheet";
// ...
<FocusSessionSettingsSheet />
```

- [ ] **Step 6: Manual test**

Run app. Day tab → tap gear icon next to "Focus Session". Sheet opens. Type "Draft spec", tap a priority chip. Save. Expected: chip shows beneath "Focus Session" header. Start timer, fast-forward (or temporarily set `FOCUS_LEN = 10` in dev). Expected: alert asks to start break. Accept → phase becomes "Break", timer shows break length. Dismiss break → clears cycle. Check `todayFocusMinutes` increments.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/components/organisms/PomodoroTimer/PomodoroTimer.tsx \
  apps/mobile/src/stores/useDayStore.ts \
  apps/mobile/src/hooks/useDayData.ts \
  apps/mobile/src/app/\(main\)/\(tabs\)/day/index.tsx
git commit -m "feat(mobile): Focus Session — priority link, session goal, break cycles, daily total"
```

---

### Task 13b: Phase 3 UI verification with `agent-device`

**Screenshot target:** `docs/execution/screenshots/2026-04-24-day-tab-improvements/phase3/`

- [ ] **Step 1: Snapshot — Focus Session header + gear**

Verify the gear icon appears beside "Focus Session" label. Save `phase3/01-focus-gear-visible.png`.

- [ ] **Step 2: Open settings sheet**

Tap gear → `FocusSessionSettingsSheet` opens. Input goal "Draft spec". Scroll priority chips, tap one. Save sequence: `phase3/02-settings-open.png`, `phase3/03-goal-typed.png`, `phase3/04-priority-selected.png`.

- [ ] **Step 3: Verify chip beneath header**

Save → sheet closes. Below "Focus Session" the goal text + linked-priority line appear. Save `phase3/05-goal-chip-visible.png`.

- [ ] **Step 4: Interaction — shortened focus cycle**

To verify break cycle behavior without waiting 50 minutes: temporarily set `FOCUS_LEN = 10` and `BREAK_LEN = 5` in `useTimerStore.ts`. Start timer, wait 10s, observe completion Alert. Tap "Start break" → phase switches to "Break". Wait 5s, observe second alert. Tap "Next session".

**Critical:** Revert `FOCUS_LEN`/`BREAK_LEN` to `50 * 60` / `10 * 60` before the Phase 3 commit. Confirm via `git diff apps/mobile/src/stores/useTimerStore.ts`.

Save screenshots: `phase3/06-focus-complete-alert.png`, `phase3/07-break-phase.png`, `phase3/08-break-complete-alert.png`.

- [ ] **Step 5: Verify daily focus total**

After completing one shortened cycle, the timer footer should read something like "1 session · Xm focused today". Save `phase3/09-daily-focus-total.png`.

- [ ] **Step 6: Report + commit**

Write `docs/execution/2026-04-24-day-tab-improvements-phase3-report.md`. Commit:

```bash
git add docs/execution/
git commit -m "test(mobile): phase 3 on-device verification"
```

---

## Phase 4 — End-of-Day Reflection

### Task 14: Reflection store + loader

**Files:**
- Modify: `apps/mobile/src/stores/useDayStore.ts`
- Modify: `apps/mobile/src/hooks/useDayData.ts`

- [ ] **Step 1: Add state to useDayStore**

Import `reflections as reflectionsTable` at top. Add to `DayState`:

```ts
  todayReflection: Reflection | null;
  loadTodayReflection: (db: Database) => Promise<void>;
  saveReflection: (
    db: Database,
    input: { wins: string[]; improve: string },
  ) => Promise<void>;
```

Import `type { Reflection } from "../types"`. Initial: `todayReflection: null`.

Implementations:

```ts
loadTodayReflection: async (db) => {
  const today = todayISO();
  const rows = await db
    .select()
    .from(reflectionsTable)
    .where(eq(reflectionsTable.date, today));
  const row = rows[0] as ReflectionRow | undefined;
  if (!row) {
    set({ todayReflection: null });
    return;
  }
  let wins: string[] = [];
  try {
    wins = JSON.parse(row.wins);
    if (!Array.isArray(wins)) wins = [];
  } catch {
    wins = [];
  }
  set({
    todayReflection: {
      date: row.date,
      wins,
      improve: row.improve,
      createdAt: row.createdAt,
    },
  });
},

saveReflection: async (db, { wins, improve }) => {
  const today = todayISO();
  const now = new Date().toISOString();
  const winsJson = JSON.stringify(wins);

  await db
    .insert(reflectionsTable)
    .values({
      date: today,
      wins: winsJson,
      improve,
    })
    .onConflictDoUpdate({
      target: reflectionsTable.date,
      set: { wins: winsJson, improve },
    });

  set({
    todayReflection: { date: today, wins, improve, createdAt: now },
  });
},
```

Call `loadTodayReflection` at the end of `loadToday` (after focus-minutes load).

- [ ] **Step 2: Expose via useDayData**

Add `todayReflection = useDayStore((s) => s.todayReflection)` and return it.

- [ ] **Step 3: Test coverage**

Append to `useDayStore.test.ts`:

```ts
  it("saveReflection persists wins + improve and updates state", async () => {
    const { db } = makeFakeDb();
    await useDayStore
      .getState()
      .saveReflection(db, { wins: ["Shipped PRD", "Closed 2 bugs"], improve: "Start earlier" });

    const { todayReflection } = useDayStore.getState();
    expect(todayReflection?.wins).toEqual(["Shipped PRD", "Closed 2 bugs"]);
    expect(todayReflection?.improve).toBe("Start earlier");
  });
```

Update `reset()` to include `todayReflection: null`. Update fake DB to handle `reflectionsTable` — since it currently only routes to `pRows`/`qRows`/`mRows`, add a `rRows` array and an additional `else if` branch. Or simpler: route unknown tables to `mRows` already (that is the existing default), which is benign for this test (it stores the row; the `where(eq(...))` in `loadTodayReflection` will find it by resolving `eq`).

Actually — to make the test honest, extend `makeFakeDb`:

```ts
  const rRows: Row[] = [];
  // add `reflectionsTable` to the branches in insert/select/update.
```

For brevity, update the `else` fall-through branches to route to `rRows` when `table === reflectionsTable` — add the import:

```ts
import { reflections as reflectionsTable } from "../../db/schema";
```

- [ ] **Step 4: Run tests**

```bash
bun --cwd apps/mobile test -- useDayStore
```

Expected: new test passes.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/stores/useDayStore.ts \
  apps/mobile/src/hooks/useDayData.ts \
  apps/mobile/src/stores/__tests__/useDayStore.test.ts
git commit -m "feat(mobile): persist daily reflection (wins + improvement)"
```

---

### Task 15: ReflectionSheet organism

**Files:**
- Create: `apps/mobile/src/stores/useReflectionSheetStore.ts`
- Create: `apps/mobile/src/components/organisms/ReflectionSheet/ReflectionSheet.ios.tsx`
- Create: `apps/mobile/src/components/organisms/ReflectionSheet/ReflectionSheet.android.tsx`
- Create: `apps/mobile/src/components/organisms/ReflectionSheet/index.ts`
- Modify: `apps/mobile/src/components/organisms/EveningPromptSheet/EveningPromptSheet.ios.tsx` — extend nudge to include a "Reflect on today" primary action *before* planning tomorrow.

- [ ] **Step 1: Store**

```ts
import { create } from "zustand";

interface State {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useReflectionSheetStore = create<State>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
```

- [ ] **Step 2: iOS sheet**

```tsx
import { useEffect, useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import {
  BottomSheet,
  Group,
  Host,
  RNHostView,
} from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { Trash } from "phosphor-react-native";
import { useReflectionSheetStore } from "@/stores/useReflectionSheetStore";
import { useDayStore } from "@/stores/useDayStore";
import { useDayData } from "@/hooks/useDayData";
import { useDatabase } from "@/hooks/useDatabase";
import { usePlanTomorrowSheetStore } from "@/stores/usePlanTomorrowSheetStore";

export const ReflectionSheet = () => {
  const { isOpen, close } = useReflectionSheetStore();
  const openPlanner = usePlanTomorrowSheetStore((s) => s.open);
  const { todayReflection } = useDayData();
  const saveReflection = useDayStore((s) => s.saveReflection);
  const { db } = useDatabase();

  const [wins, setWins] = useState<string[]>(["", "", ""]);
  const [improve, setImprove] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mutedColor, dangersColor] = useCSSVariable(["--color-muted", "--color-danger"]);

  useEffect(() => {
    if (!isOpen) return;
    const existing = todayReflection?.wins ?? [];
    const padded = [...existing, "", "", ""].slice(0, 3);
    setWins(padded);
    setImprove(todayReflection?.improve ?? "");
  }, [isOpen, todayReflection]);

  const setWinAt = (i: number, v: string) =>
    setWins((cur) => cur.map((w, idx) => (idx === i ? v : w)));

  const handleSave = async (thenPlan: boolean) => {
    if (!db) return;
    setIsSaving(true);
    try {
      const cleanedWins = wins.map((w) => w.trim()).filter(Boolean);
      await saveReflection(db, { wins: cleanedWins, improve: improve.trim() });
      close();
      if (thenPlan) setTimeout(openPlanner, 250);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(presented) => {
          if (!presented) close();
        }}
      >
        <Group
          modifiers={[
            presentationDetents(["large"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
            <View className="px-5 py-6 gap-5">
              <AppText size="xl" weight="bold" family="headline">
                Today's Reflection
              </AppText>

              <View className="gap-2">
                <AppText size="sm" weight="semibold" color="muted">
                  Three wins
                </AppText>
                {wins.map((w, i) => (
                  <View key={i} className="flex-row items-center gap-2">
                    <TextInput
                      value={w}
                      onChangeText={(v) => setWinAt(i, v)}
                      placeholder={`Win ${i + 1}`}
                      className="flex-1 rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                      placeholderTextColor={mutedColor as string}
                    />
                    {w.length > 0 && (
                      <Pressable onPress={() => setWinAt(i, "")} hitSlop={8}>
                        <Trash size={14} color={dangersColor as string} />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>

              <View className="gap-2">
                <AppText size="sm" weight="semibold" color="muted">
                  One thing to improve
                </AppText>
                <TextInput
                  value={improve}
                  onChangeText={setImprove}
                  placeholder="Start earlier, batch Slack, …"
                  multiline
                  className="rounded-xl bg-surface px-4 py-3 text-sm text-foreground"
                  placeholderTextColor={mutedColor as string}
                  style={{ minHeight: 70, textAlignVertical: "top" }}
                />
              </View>

              <View className="flex-row gap-3">
                <Button
                  variant="tertiary"
                  className="flex-1"
                  onPress={() => handleSave(false)}
                  isDisabled={isSaving}
                >
                  <Button.Label>{isSaving ? "Saving…" : "Save"}</Button.Label>
                </Button>
                <Button
                  className="flex-1"
                  onPress={() => handleSave(true)}
                  isDisabled={isSaving}
                >
                  <Button.Label>Save & Plan Tomorrow</Button.Label>
                </Button>
              </View>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
```

- [ ] **Step 3: Android variant**

Create Android file — same body, `ModalBottomSheet` wrapper.

- [ ] **Step 4: Platform export**

```ts
export { ReflectionSheet } from "./ReflectionSheet";
```

- [ ] **Step 5: Chain reflection → planner from the evening nudge**

In `EveningPromptSheet.ios.tsx` and `.android.tsx`, change the primary button to open reflection first:

```tsx
import { useReflectionSheetStore } from "@/stores/useReflectionSheetStore";
// ...
const openReflection = useReflectionSheetStore((s) => s.open);
// ...
const handleReflect = () => {
  setIsOpen(false);
  markChecked();
  openReflection();
};
// Button label text becomes "Reflect & Plan"
```

Swap the handler on the primary button from `handlePlan` to `handleReflect`. Keep label text `Reflect & Plan`.

- [ ] **Step 6: Mount ReflectionSheet in day screen**

Add import and `<ReflectionSheet />` to `apps/mobile/src/app/(main)/(tabs)/day/index.tsx`.

- [ ] **Step 7: Manual test**

After 8pm with no tomorrow priorities queued → evening prompt appears → "Reflect & Plan" → ReflectionSheet opens → fill 2 wins + improvement → "Save & Plan Tomorrow" → PlanTomorrowSheet opens.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/stores/useReflectionSheetStore.ts \
  apps/mobile/src/components/organisms/ReflectionSheet/ \
  apps/mobile/src/components/organisms/EveningPromptSheet/ \
  apps/mobile/src/app/\(main\)/\(tabs\)/day/index.tsx
git commit -m "feat(mobile): end-of-day reflection flow chained to Plan Tomorrow"
```

---

### Task 15b: Phase 4 UI verification with `agent-device`

**Screenshot target:** `docs/execution/screenshots/2026-04-24-day-tab-improvements/phase4/`

- [ ] **Step 1: Trigger evening flow**

Force-trigger EveningPromptSheet (same technique as Task 10b step 5). Primary button now reads "Reflect & Plan". Save `phase4/01-evening-prompt-reflect-label.png`.

- [ ] **Step 2: Fill reflection**

Tap "Reflect & Plan" → ReflectionSheet opens with three win inputs + improvement field. Type "Shipped Day tab bundle" in Win 1, "Cleared backlog" in Win 2, leave Win 3 empty. Type "Start Pomodoros earlier" in improve field. Save `phase4/02-reflection-filled.png`.

- [ ] **Step 3: Save & chain to planner**

Tap "Save & Plan Tomorrow". Assert ReflectionSheet closes and PlanTomorrowSheet opens within ~1 second. Save `phase4/03-chained-to-planner.png`.

- [ ] **Step 4: Verify persistence**

Terminate + relaunch app. Force-trigger evening flow again. Open ReflectionSheet — existing wins + improvement are pre-populated. Save `phase4/04-reflection-persisted.png`.

- [ ] **Step 5: Report + commit**

Write `docs/execution/2026-04-24-day-tab-improvements-phase4-report.md`. Commit:

```bash
git add docs/execution/
git commit -m "test(mobile): phase 4 on-device verification"
```

---

## Final Verification

- [ ] **Step 1: Full test suite**

```bash
bun --cwd apps/mobile lint
bun --cwd apps/mobile typecheck
bun --cwd apps/mobile test
```

Expected: all pass.

- [ ] **Step 2: End-to-end on-device walkthrough with `agent-device` (dogfood)**

Activate the `dogfood` skill. Run a full morning-to-evening session simulation on the booted iOS simulator. Cover the golden path:

1. Day tab header shows "Day".
2. PriorityList has no inline "Add priority" — FAB → Add priority sheet works.
3. QuickList has no inline "Add item…" — FAB → AddQuickItemSheet works.
4. PlanTomorrowCard shows 0 priorities queued initially.
5. Tap PlanTomorrowCard → add 2 tomorrow priorities → close → card shows "2 priorities queued".
6. Focus Session: tap gear → set goal "Write tests" + link to a today priority → goal chip appears under header.
7. Start timer with shortened durations (temporarily). Confirm break transition. **Revert durations before committing.**
8. Force-trigger 8pm detection → EveningPromptSheet auto-appears → "Reflect & Plan" → ReflectionSheet → save → PlanTomorrowSheet opens automatically.
9. Change device clock to next day → relaunch → today's priorities include yesterday's seeded ones.

Produce a final `docs/execution/2026-04-24-day-tab-improvements-e2e-report.md` summarizing the end-to-end flow with screenshots. Commit under `test(mobile): e2e dogfood walkthrough`.

- [ ] **Step 3: Push branch**

```bash
git push -u origin $(git branch --show-current)
```

- [ ] **Step 4: Open PR via pr-creator skill**

---

## Self-Review Notes (author addressed these during planning)

- **Tonight metadata keys orphaned?** Yes — the `tonight_<date>` metadata rows from the old flow stay in the DB but go unread. That's acceptable (local data, small volume). Optional follow-up: a one-shot cleanup in a later migration.
- **Evening trigger uses in-app detection, not push notifications.** Intentional. Adding `expo-notifications` is a separate project (permissions, scheduling, dev client rebuild). Document as a Phase-5 follow-up if evening engagement disappoints.
- **Focus session duration is hardcoded at 50/10.** Future enhancement: user-configurable via Settings. Out of scope here.
- **`loadTodayFocusMinutes` filter uses raw SQL `date(started_at)`** — acknowledged in Task 13 Step 1. Keep the `sql\`` template; don't silently swap to `eq()`.
- **Break cycle alerts use `Alert.alert`** which is mature on both platforms. Good enough for v1; replace with a custom sheet if we want better aesthetics.
