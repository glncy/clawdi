# Design Spec: Tabs Completion Sprint
**Date:** 2026-04-15  
**Branch:** `feat/tabs-completion-sprint`  
**Timeline:** 4 days  
**Scope:** Life, Day, People, Settings — full DB integration, AI-assisted voice entry, local notifications, unit + E2E testing

---

## 1. Context & Goal

Dashboard (Home) and Finance (Money) are ~95% complete with real Drizzle/SQLite integration. The remaining three tabs — Life, Day, People — have UI shells but no database integration (all mock data). Settings is missing entirely.

**Goal:** Ship all remaining tabs with full CRUD, real DB persistence, AI-assisted voice entry on every tab, local notifications for engagement, and a comprehensive test suite (Jest + Detox).

### Current Tab Status

| Tab | Status | Blocker |
|-----|--------|---------|
| Home | ~70% | Habits, priorities, contacts still mock |
| Money | ~95% | Account types hardcoded; transactions don't require account |
| Life | ~20% | UI shell only, no DB, no add/edit |
| Day | ~20% | UI shell only, no DB, no add/edit |
| People | ~15% | UI shell only, no DB, no add/edit |
| Settings | ~10% | No income/currency/notification settings |

---

## 2. Architecture & DB Schemas

### 2.1 New Drizzle Schemas

All tables added to `apps/mobile/src/db/schema/`:

```typescript
// --- Life Pillar ---

export const moods = sqliteTable('moods', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['morning', 'night'] }).notNull(),
  emoji: text('emoji').notNull(),          // e.g. "😊"
  rating: integer('rating').notNull(),     // 1–5
  note: text('note'),
  date: text('date').notNull(),            // YYYY-MM-DD
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  reminderTime: text('reminder_time'),     // "HH:MM" or null
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),            // YYYY-MM-DD
  completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
});

export const sleepLogs = sqliteTable('sleep_logs', {
  id: text('id').primaryKey(),
  sleepAt: integer('sleep_at', { mode: 'timestamp' }).notNull(),
  wakeAt: integer('wake_at', { mode: 'timestamp' }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  quality: integer('quality'),             // 1–5, optional
  date: text('date').notNull(),            // YYYY-MM-DD (the wake date)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const stressLogs = sqliteTable('stress_logs', {
  id: text('id').primaryKey(),
  level: integer('level').notNull(),       // 1–10
  date: text('date').notNull(),            // YYYY-MM-DD
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
// Note: one entry per day — store uses upsert (delete existing by date then insert)
// moods also uses upsert pattern per (date, type) pair

export const waterLogs = sqliteTable('water_logs', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(),   // YYYY-MM-DD, one per day
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// --- Day Pillar ---

export const priorities = sqliteTable('priorities', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  type: text('type', { enum: ['must', 'win', 'overdue'] }).notNull(),
  date: text('date').notNull(),            // YYYY-MM-DD
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  sortOrder: integer('sort_order').notNull().default(0),
  rolledOverFrom: text('rolled_over_from'), // original date if rolled over
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const quickList = sqliteTable('quick_list', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// --- People Pillar ---

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  relationship: text('relationship'),      // friend, family, colleague, etc.
  birthday: text('birthday'),              // MM-DD (no year)
  photoUri: text('photo_uri'),
  lastTalkedAt: integer('last_talked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const contactNotes = sqliteTable('contact_notes', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['gift_idea', 'things_they_love', 'conversation', 'general']
  }).notNull(),
  text: text('text').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// --- Settings ---

export const accountTypes = sqliteTable('account_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  icon: text('icon').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
// Seeds: Checking, Savings, Credit, Cash, Investment (isDefault: true)
```

### 2.2 Existing `metadata` Table

Already defined in the codebase as a key-value store (`key TEXT PRIMARY KEY, value TEXT`). Used by this sprint for:
- `tonight_YYYY-MM-DD` — Tonight Planner free text per day
- `pomodoro_count_YYYY-MM-DD` — Pomodoro session count per day
- `notification_settings` — JSON blob of toggle states + times
- `last_used_account_id` — pre-selects account on transaction add

### 2.3 Changes to Existing Schemas

**`transactions`:** `accountId` becomes `NOT NULL`. Every transaction must reference an account.

```typescript
accountId: text('account_id')
  .notNull()                                         // was optional
  .references(() => accounts.id, { onDelete: 'restrict' }),
```

**`accounts`:** `type` references `account_types.name` instead of a hardcoded enum.

```typescript
type: text('type').notNull(),  // was: text('type', { enum: [...] })
// UI reads available types from account_types table
```

### 2.3 New Zustand Stores

| Store | File | Manages |
|-------|------|---------|
| `useLifeStore` | `stores/useLifeStore.ts` | moods, habits, habitLogs, sleepLogs, stressLogs, waterLogs |
| `useDayStore` | `stores/useDayStore.ts` | priorities, quickList |
| `usePeopleStore` | `stores/usePeopleStore.ts` | contacts, contactNotes |

Pattern matches `useFinanceStore`: `loadAll()` on mount, typed CRUD actions, optimistic UI, sync to SQLite.

---

## 3. Life Tab — Full Spec

**File:** `apps/mobile/src/app/(main)/(tabs)/life/index.tsx`

### 3.1 Components

**New Sheets (bottom sheets):**
- `AddHabitSheet` — name text input, icon picker (grid), optional reminder time picker
- `EditHabitSheet` — same as Add, pre-filled, with delete action
- `SleepEntrySheet` — sleep time picker + wake time picker, auto-computes duration
- `MoodSheet` — already exists, wire `onSelect` to `useLifeStore.logMood()`
- `StressEntrySheet` — 1–10 slider + optional note, one entry per day (overwrites)

**Updated organisms:**
- `HabitList` — real habits from store, add/reorder/swipe-delete, max 10
- `SleepCard` — shows today's log if exists, "Log Sleep" button if not, weekly avg from last 7 entries
- Stress card — shows today's level if logged, slider to update

### 3.2 Feature Details

**Habits:**
- Max 10 active habits
- One-tap complete: `habit_logs` entry for today's date
- Flexible streak: 6/7 days counts as "almost perfect" (not broken)
- Completion resets at midnight (by date, not 24h window)
- Swipe-left to delete (with confirmation)
- Hold-to-reorder

**Mood:**
- Morning check-in + night check-in (separate entries per `type`)
- If already logged today: shows logged emoji, tap to update
- 5 emoji options: 😔 😟 😐 😊 😄

**Sleep:**
- One log per day (the wake date)
- Duration auto-computed: `wakeAt - sleepAt`
- Weekly average shown in `SleepCard` from last 7 `sleep_logs`
- If no log today: shows yesterday's duration with "Log tonight" prompt

**Water:**
- Single checkbox per day (upsert on `water_logs` by date)
- Resets midnight (fresh row next day)

**Stress:**
- One entry per day (upsert by date)
- Shows weekly trend: last 7 days as sparkline dots

### 3.3 Voice Entry

Mic button in screen header. Context system prompt instructs model to parse life-related speech:

| Example utterance | Parsed action |
|---|---|
| "I slept 7.5 hours" | `{ action: "sleep_log", durationMinutes: 450 }` |
| "Slept at 11 woke at 6:30" | `{ action: "sleep_log", sleepAt: "23:00", wakeAt: "06:30" }` |
| "Feeling anxious today" | `{ action: "mood_log", emoji: "😟", rating: 2, note: "anxious" }` |
| "Done with gym" | `{ action: "complete_habit", habitName: "gym" }` |
| "I drank water" | `{ action: "water_log", completed: true }` |
| "Stress level 8 today" | `{ action: "stress_log", level: 8 }` |

All parsed results shown in a **confirmation card** before saving. User can edit fields before confirming.

---

## 4. Day Tab — Full Spec

**File:** `apps/mobile/src/app/(main)/(tabs)/day/index.tsx`

### 4.1 Components

**New Sheets:**
- `AddPrioritySheet` — 3-question guided flow (one question per step):
  1. "What must happen today?" → `type: must`
  2. "What would feel like a win?" → `type: win`
  3. "What's long overdue?" → `type: overdue`
  - Each question optional (skip to not add that type)
  - Voice input available on each question field
- `EditPrioritySheet` — edit text, change type, delete
- `TonightPlannerSheet` — free-text multi-line input, saved by date key to `metadata` table

**Updated organisms:**
- `PriorityList` — real priorities from store, check-off, swipe-delete, reorder within type group
- `QuickList` — full CRUD: add inline (text field at bottom), tap-to-check, swipe-delete

### 4.2 Feature Details

**Priorities:**
- Grouped by type: must → win → overdue (in that order)
- Check-off: marks `completed: true`, `completedAt` timestamp, moves to bottom of group
- **Rollover:** On first open of a new day, if yesterday had incomplete priorities → prompt "Roll over X incomplete priorities to today?" → creates new priority rows with `date: today`, `rolledOverFrom: yesterday`
- Max 3 must priorities enforced (UI disables add when 3 exist)

**Quick List:**
- Unlimited items
- Inline add: text field always visible at bottom of list
- Swipe-left: delete (no confirmation — it's a scratch list)
- Tap checkbox: toggle `completed`
- Completed items appear below active with strikethrough

**Tonight Planner:**
- Free-text card, persisted per date in `metadata` table as `tonight_YYYY-MM-DD`
- Pre-fills with yesterday's content if today is empty and yesterday had content (prompt: "Copy from yesterday?")

**Pomodoro:**
- Session count persisted per day in `metadata` as `pomodoro_count_YYYY-MM-DD`
- Break randomizer on each break: stretch / drink water / step outside / look away from screen (random from pool)

### 4.3 Voice Entry

| Example utterance | Parsed action |
|---|---|
| "Add priority: submit the proposal" | `{ action: "add_priority", type: "must", text: "submit the proposal" }` |
| "Add win: clean the kitchen" | `{ action: "add_priority", type: "win", text: "clean the kitchen" }` |
| "Done with my must" | `{ action: "complete_priority", type: "must", index: 0 }` |
| "Add to list: buy milk" | `{ action: "add_quick_list", text: "buy milk" }` |
| "Tonight I'll read and sleep by 11" | `{ action: "tonight_planner", text: "Read → Sleep by 11 PM" }` |

---

## 5. People Tab — Full Spec

**File:** `apps/mobile/src/app/(main)/(tabs)/people/index.tsx`

### 5.1 Components

**New Sheets:**
- `AddContactSheet` — name (required), relationship (picker: friend/family/colleague/other), birthday (optional date picker), photo (camera roll, optional)
- `ContactDetailSheet` — full contact view with:
  - "I talked to [name] today" button → updates `lastTalkedAt` to now
  - Notes list grouped by type
  - "Add note" → `AddContactNoteSheet`
  - Edit / delete contact actions
- `AddContactNoteSheet` — type picker (gift idea / things they love / conversation / general) + text input + voice

**Updated organisms:**
- `ContactList` — real contacts from store, sorted by `lastTalkedAt` ascending (longest overdue first), tap to open `ContactDetailSheet`
- `NudgeCard` — real data from store (first contact where `lastTalkedAt` > 4 days or null)

### 5.2 Feature Details

**Contacts:**
- No limit on contacts
- Sorted: overdue first (most days since last talked), then by name
- `lastTalkedAt: null` treated as "never talked" → always shows in nudge

**Nudge logic:**
- Contact overdue if `daysSince(lastTalkedAt) >= 4` or `lastTalkedAt === null`
- `NudgeCard` on both People tab and Home tab shows first overdue contact

**Birthday reminders:**
- Stored as `MM-DD` (no year — repeats annually)
- Notification: 3 days before + day of, at 9 AM
- `upcomingBirthdays`: contacts with birthday in next 7 days, shown in People tab

**Notes:**
- `gift_idea` — shows with 🎁 label
- `things_they_love` — shows with ❤️ label
- `conversation` — shows with 💬 label, timestamped
- `general` — shows with 📝 label

### 5.3 Voice Entry

| Example utterance | Parsed action |
|---|---|
| "I talked to Marco yesterday" | `{ action: "log_talked", contactName: "Marco", when: "yesterday" }` |
| "Add gift idea for Sarah: cookbook" | `{ action: "add_note", contactName: "Sarah", type: "gift_idea", text: "cookbook" }` |
| "Add contact: Juan, brother, birthday March 5" | `{ action: "add_contact", name: "Juan", relationship: "family", birthday: "03-05" }` |
| "Marco loves hiking" | `{ action: "add_note", contactName: "Marco", type: "things_they_love", text: "hiking" }` |

---

## 6. Settings / More Sheet

Accessible via ⚙️ gear icon on all screen headers. Implemented as a tall bottom sheet (not a tab).

**File:** `apps/mobile/src/components/organisms/SettingsSheet.tsx`

### Sections

**Profile & Finance**
- Display name
- Monthly income (number input + currency picker)
- Currency (auto-detected from locale, overridable)
- Default account (for new transactions)

**Account Types**
- List of types (default + custom), each with icon and name
- Add custom type: name + icon picker
- Default types (Checking, Savings, Credit, Cash, Investment) can have icon changed but not deleted
- Custom types: editable and deletable (blocked if any account uses that type)

**Notifications**
- Toggle per notification type (see Section 8)
- Morning briefing time picker (default 7:30 AM)
- Habit reminder time picker (default 8:00 PM)
- Quiet hours: shown as fixed 10 PM – 7 AM (not configurable in v1)

**Data**
- Export all data (CSV, one file per table, zipped, shared via system share sheet)
- Delete Everything: requires typing "DELETE", wipes all tables, resets app to onboarding

**App**
- Theme: Light / Dark / System
- Trial status: shows days remaining or "Purchase" CTA
- Version number

---

## 7. AI-Assisted Voice Entry (Cross-Tab)

### 7.1 Architecture

**`useVoiceEntry(context: VoiceContext)` hook** wraps `@jamsch/expo-speech-recognition`:

```typescript
type VoiceContext = 'life' | 'day' | 'people' | 'money'

interface VoiceEntryResult {
  transcript: string
  parsed: ParsedVoiceAction | null
  confidence: 'high' | 'low'    // low = show editable form, high = show confirm card
}

interface ParsedVoiceAction {
  action: string
  fields: Record<string, unknown>
}
```

**Flow:**
1. User taps mic button → `startRecording()`
2. STT streams transcript in real-time (shown as caption below mic)
3. On stop: transcript sent to local AI via `streamText()` (Gemma 4 / Apple Foundation Models via `useAI()`)
4. System prompt is context-specific (see 7.2)
5. Model returns JSON `ParsedVoiceAction`
6. `confidence: high` → show compact confirm card ("Save this?")
7. `confidence: low` → show editable form pre-filled with parsed fields
8. User confirms → store action called → data saved

### 7.2 Context-Specific System Prompts

Each context has its own system prompt instructing the model to return a specific JSON schema. Prompts follow the pattern:

```
You are a voice input parser for [context]. 
Extract structured data from the user's speech.
Return ONLY valid JSON matching this schema: [schema]
If you cannot parse the input, return { "action": "unknown" }.
Do not include any explanation, only JSON.

Examples:
[3-5 examples covering common inputs]
```

Prompts live in:
- `services/voicePrompts/lifeVoicePrompt.ts`
- `services/voicePrompts/dayVoicePrompt.ts`
- `services/voicePrompts/peopleVoicePrompt.ts`
- `services/voicePrompts/moneyVoicePrompt.ts` (refactored from `transactionParserService.ts`)

### 7.3 UI Pattern

- **Mic FAB** floating bottom-right on each tab screen (above tab bar, left of any existing FAB)
- Tap to record → pulsing animation + live transcript caption
- Tap again to stop → spinner while AI parses
- Result shown as bottom card: parsed summary + Confirm / Edit / Cancel
- On confirm: haptic feedback + success toast

---

## 8. Local Notifications

### 8.1 Notification Types

| ID | Name | Trigger | Default Time | Toggleable |
|----|------|---------|-------------|------------|
| `morning_nudge` | Morning nudge | Daily | 7:30 AM | Yes |
| `habit_reminder` | Habit reminder | Daily, if any incomplete by end of day | 8:00 PM | Yes |
| `spending_recap` | Daily spending recap | Daily | 9:00 PM | Yes |
| `bill_due` | Bill due soon | 3 days before `nextDueDate` | 9:00 AM | Yes |
| `budget_shield` | Budget Shield | Category spending hits 80% of budget | Immediate | Yes |
| `reach_out_nudge` | Reach-out nudge | Contact `lastTalkedAt` crosses 4-day threshold | 10:00 AM | Yes |
| `birthday_soon` | Birthday (3 days) | 3 days before contact birthday | 9:00 AM | Yes |
| `birthday_today` | Birthday (today) | Day of contact birthday | 9:00 AM | Yes |

### 8.2 Rules

- **Max 3 non-urgent** notifications per day (excludes `budget_shield` which is event-driven)
- **Quiet hours:** 10 PM – 7 AM — no notifications scheduled in this window
- **Priority order** (if hitting max 3): bill_due > birthday_today > birthday_soon > reach_out_nudge > habit_reminder > spending_recap > morning_nudge
- All settings stored in `metadata` table as JSON under key `notification_settings`

### 8.3 Implementation

**`notificationScheduler.ts`** service:
- `scheduleAll()` — called on app foreground, reschedules next 7 days of local notifications
- `cancelAll()` — called when user disables a type or deletes data
- Uses `expo-notifications` local trigger API
- `budget_shield` triggered in `useFinanceStore` when category spending is updated

---

## 9. Home Tab Wiring (Day 4)

Remove all mock imports. Wire to real stores:

| Element | Mock removed | Real source |
|---------|-------------|-------------|
| Habits ring | `MOCK_HABITS` | `useLifeStore` → today's `habit_logs` |
| Today's priority | `MOCK_PRIORITIES` | `useDayStore` → first incomplete `must` for today |
| Nudge card | `MOCK_CONTACTS` | `usePeopleStore` → first contact with `lastTalkedAt` > 4 days |
| AI Briefing context | Hardcoded strings | All stores → rich `LifeContext` object |

**Updated briefing prompt** uses real data from all stores: today's mood, sleep hours, habit completion, priority count, budget status, and overdue contacts woven into one narrative.

---

## 10. Money Tab Additions

### Account Required on Transactions

`AddTransactionSheet` changes:
- Account picker becomes **required** (not optional)
- Pre-selects last used account (stored in `metadata` as `last_used_account_id`)
- If user has no accounts → prompt to add one before logging transaction

### Custom Account Types

`AddAccountSheet` changes:
- `type` picker now reads from `account_types` table (not hardcoded enum)
- Picker shows icon + name for each type

---

## 11. Testing Strategy

### 11.1 Setup (pre-Day 1, ~2 hours)

```bash
# Unit testing
npx expo install jest-expo @testing-library/react-native

# E2E testing
npm install --save-dev detox @types/detox
detox init
```

**Jest config** (`jest.config.js`): preset `jest-expo`, mock `expo-sqlite` with in-memory adapter, mock `expo-notifications`.

**Detox config** (`detox.config.js`): iOS simulator (iPhone 15) + Android emulator (Pixel 7), build from dev client.

### 11.2 Unit Test Coverage

Co-located as `*.test.ts` files next to the module they test:

| Module | Tests |
|--------|-------|
| `useLifeStore` | addHabit, completeHabit, logMood, logSleep, logStress, waterToggle, streak calculation |
| `useDayStore` | addPriority, completePriority, rolloverLogic, quickList CRUD |
| `usePeopleStore` | addContact, logTalked, addNote, nudgeFilter, birthdayFilter |
| `notificationScheduler` | scheduling rules, max-3 limit, quiet hours enforcement |
| `voicePrompts/*` | Given transcript string → expected parsed JSON (deterministic examples) |
| `budgetCalculator` | existing tests extended for streak, bill intelligence |
| `sleepUtils` | duration from timestamps, weekly average, sleep debt |
| `streakUtils` | consecutive days, flexible streak (6/7), reset logic |

### 11.3 E2E Test Specs (Detox)

```
__e2e__/
  life.e2e.ts
    ✓ Add a habit → appears in list
    ✓ Complete a habit → updates completion ring
    ✓ Log sleep via sheet → SleepCard updates
    ✓ Voice: "I slept 7 hours" → confirmation card shown → confirm → sleep log created
    ✓ Log mood → shows on Life tab

  day.e2e.ts
    ✓ Add must-priority → appears at top of list
    ✓ Check off priority → moves to completed section
    ✓ New day with incomplete priorities → rollover prompt shown
    ✓ Voice: "Add priority: send invoice" → priority created after confirm
    ✓ Add quick list item → appears + checkable

  people.e2e.ts
    ✓ Add contact with birthday
    ✓ Log talked → lastTalkedAt updates → nudge disappears
    ✓ Add gift idea note → appears in contact detail
    ✓ Voice: "I talked to Marco" → Marco's lastTalkedAt updated

  money.e2e.ts  (extends existing)
    ✓ Add transaction without account → blocked, account picker highlighted
    ✓ Add custom account type in Settings → visible in account picker
    ✓ Add account with custom type → type shown correctly

  settings.e2e.ts
    ✓ Add custom account type → appears in Money account type picker
    ✓ Toggle notification off → notification not rescheduled
    ✓ Export → system share sheet opens
    ✓ Delete Everything with "DELETE" → all tabs show empty state

  home.e2e.ts
    ✓ Complete habit on Life tab → Home habits ring updates
    ✓ Check priority on Day tab → Home priority card updates
    ✓ Log talked on People tab → Home nudge card updates
```

---

## 12. 4-Day Phase Map

### Day 1 — Life Tab

**Setup (30 min):**
- Jest + Detox configured
- `account_types` migration + seeds (Checking, Savings, Credit, Cash, Investment)

**DB & Store:**
- Drizzle schemas: `moods`, `habits`, `habit_logs`, `sleep_logs`, `stress_logs`, `water_logs`
- `useLifeStore` with full CRUD

**Components:**
- Wire `MoodSelector` → `useLifeStore.logMood()`
- `AddHabitSheet`, `EditHabitSheet`
- Wire `HabitList` → real habits, real logs
- `SleepEntrySheet`, wire `SleepCard`
- Wire stress slider → `stressLogs`
- Wire water checkbox → `waterLogs`
- Voice entry: `lifeVoicePrompt.ts` + mic FAB

**Tests:**
- `useLifeStore.test.ts`
- `sleepUtils.test.ts`, `streakUtils.test.ts`
- `life.e2e.ts`

---

### Day 2 — Day Tab

**DB & Store:**
- Drizzle schemas: `priorities`, `quick_list`
- `useDayStore` with full CRUD + rollover logic

**Components:**
- `AddPrioritySheet` (3-question guided flow)
- `EditPrioritySheet`
- Wire `PriorityList` → real priorities, check-off, reorder
- Wire `QuickList` → inline add, toggle, delete
- `TonightPlannerSheet`
- Pomodoro: persist session count in `metadata`
- Voice entry: `dayVoicePrompt.ts` + mic FAB

**Tests:**
- `useDayStore.test.ts` (rollover logic critical)
- `day.e2e.ts`

---

### Day 3 — People Tab + Settings

**DB & Store:**
- Drizzle schemas: `contacts`, `contact_notes`
- `usePeopleStore` with full CRUD

**Components:**
- `AddContactSheet`, `ContactDetailSheet`, `AddContactNoteSheet`
- Wire `ContactList` → real contacts
- Wire `NudgeCard` → real overdue contact
- Birthday upcoming section from real data
- Voice entry: `peopleVoicePrompt.ts` + mic FAB

**Settings Sheet:**
- `SettingsSheet.tsx` — all sections
- `account_types` CRUD UI
- Notification toggles + time pickers (saved to `metadata`)
- Export CSV, Delete Everything

**Tests:**
- `usePeopleStore.test.ts`
- `notificationScheduler.test.ts`
- `people.e2e.ts`, `settings.e2e.ts`

---

### Day 4 — Home Wiring + Notifications + Polish

**Home Tab:**
- Remove all `MOCK_*` imports
- Wire habits ring, priority card, nudge card to real stores
- Upgrade briefing prompt to use real `LifeContext`

**Money Tab:**
- Make `accountId` required in `AddTransactionSheet`
- `type` picker reads from `account_types` table

**Voice:**
- Refactor `transactionParserService.ts` → `moneyVoicePrompt.ts` (consistent pattern)
- Polish: loading states, error handling, "unknown" action fallback

**Notifications:**
- `notificationScheduler.ts` — `scheduleAll()` wired to app foreground event
- Budget Shield trigger in `useFinanceStore`
- Birthday + reach-out notifications scheduled from contacts + `usePeopleStore`
- Settings toggles wired to cancel/reschedule

**Polish:**
- Empty states with personality for Life, Day, People tabs
- Confirm all voice entry flows end-to-end

**Tests:**
- `money.e2e.ts` additions
- `home.e2e.ts`
- Full daily loop smoke test

---

## 13. Out of Scope (This Sprint)

- AI cross-domain "The Why" correlations (future sprint)
- AI chat FAB / conversational interface (future sprint)
- Periodic AI reports (future sprint)
- Finance AI superpowers: forecast, anomaly detection, what-if, etc. (future sprint)
- Onboarding flow (future sprint)
- IAP / trial enforcement (future sprint)
- Shareable cards (future sprint)
- clawdi Score / Focus Areas (future sprint)

---

*Spec written 2026-04-15. Ready for implementation via `writing-plans`.*
