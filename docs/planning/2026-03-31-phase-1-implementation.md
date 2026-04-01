# Implementation Plan: Phase 1 — 7-Day Ship

## Tech Stack

| Component     | Package                           | Purpose                                    |
| ------------- | --------------------------------- | ------------------------------------------ |
| Database      | `expo-sqlite` + `drizzle-orm`     | Local-first storage with type-safe schemas |
| Local LLM     | `llama.rn` + Qwen 2.5 0.5B Q4_K_M | On-device expense parsing                 |
| Voice STT     | `@jamsch/expo-speech-recognition` | Offline speech-to-text                     |
| Icons         | `phosphor-react-native`           | Replace lucide-react-native                |
| Notifications | `expo-notifications`              | Local reminders (max 3/day)                |
| Device Info   | `expo-device`                     | RAM check for LLM capability               |
| State         | `zustand`                         | Global state management                    |
| Styling       | `uniwind` + HeroUI Native         | Tailwind-style + component library         |

## App Architecture

5 tabs + center raised add button (floating, not a tab):

```
              [+ ADD] ← raised above tab bar, floating
                 |
[🏠 Home] [💰 Money] [🌿 Life] [☀️ Day] [❤️ People]
```

The "+" opens a context-aware quick-action bottom sheet.

## Drizzle ORM Schemas

```
transactions: id, type (income/expense), amount, currency, item, category, date, note, createdAt, updatedAt
recurrences: id, name, type (bill/subscription), amount, currency, category, frequency, nextDueDate, createdAt
savings_goals: id, name, targetAmount, currentAmount, currency, targetDate, createdAt
categories: id, name, icon, isDefault, createdAt
moods: id, type (morning/night), rating (1-5), note, createdAt
habits: id, name, icon, isActive, createdAt
habit_logs: id, habitId, completedAt
sleep_logs: id, sleepAt, wakeAt, createdAt
priorities: id, text, type (must/win/overdue), date, completed, createdAt
contacts: id, name, relationship, birthday, photo, lastTalkedAt, createdAt
contact_notes: id, contactId, type (gift_idea/things_they_love/conversation), text, createdAt
metadata: key, value (trialStartDate, income, dream, struggle, lifeCheckupScores)
stress_logs: id, level (1-10), date, createdAt
water_logs: id, date, completed
sparks: id, text, domain, date, completed
quick_list: id, text, completed, createdAt
```

## Day-by-Day Breakdown

### Day 0: Setup

- [ ] Install and configure `drizzle-orm` with `expo-sqlite` driver
- [ ] Define all Drizzle schemas above with migrations
- [ ] Set up 5-tab navigation skeleton with Expo Router
- [ ] Install `phosphor-react-native`, remove `lucide-react-native`
- [ ] Device capability detection (`expo-device` → `Device.totalMemory`)
- [ ] Set up Zustand stores for each domain

### Day 1: 🏠 Home + Onboarding

- [ ] **First-install "Mirror" experience:**
  - 5 slider questions (one per screen, large slider, one tap each)
  - Result screen: names their reality in plain words
  - "Until now." → positions clawdi as the answer
- [ ] **3-question onboarding:**
  - Monthly income (currency auto-detect or picker)
  - What are you saving for? (selection)
  - Biggest daily struggle? (selection)
- [ ] **clawdi Score calculation engine:**
  - Aggregate scores from all 6 domains (0-100)
  - Initial score from Life Checkup sliders
  - Weekly recalculation logic
- [ ] **Home dashboard (read-only):**
  - clawdi Score hero number with 6-domain bars
  - Budget left today
  - Habits progress ring (X/Y)
  - Today's top priority
  - clawdi Spark (daily challenge from weakest domain)
  - Relationship nudge
  - Personalized morning greeting based on user data
- [ ] Pre-fill dashboard from onboarding answers (no empty screens)
- [ ] Generate 30 Spark challenges (categorized by domain)

### Day 2: 💰 Money Tab

- [ ] **Income tracking** — log income sources, payday schedule
- [ ] **Balance tracking** — current balance display
- [ ] Quick expense logger (amount + category + optional note, 3-tap flow)
- [ ] Category system: Food, Transport, Bills, Shopping, Health, Other + **custom categories**
- [ ] Auto-category detect (AI via local LLM or keyword matching)
- [ ] Monthly budget setter per category
- [ ] Budget bar with color indicator (green → yellow → red)
- [ ] **Bill tracking** — due dates + reminder logic (3 days before)
- [ ] **Subscription tracking** — recurring subscriptions with cost
- [ ] 9 PM daily spending recap notification

### Day 3: 💰 Money Tab (Deep)

- [ ] Savings goals with progress bar + target date calculator
- [ ] Payday auto-plan: income → suggested allocation (50/30/20 or custom)
- [ ] Budget Shield alert notification (approaching category limit)
- [ ] Emergency fund meter (months of expenses covered)
- [ ] No-Spend Day challenge toggle (tracks savings at midnight)
- [ ] Monthly spending chart (simple pie or bar)
- [ ] Payday countdown

### Day 4: 🌿 Life Tab

- [ ] Mood check-in (morning + night, 5 emoji scale)
- [ ] clawdi mood reactions (adjusts focus blocks, warns about stress spending)
- [ ] Habit tracker: up to 5 habits, one-tap completion
- [ ] Flexible streaks (6/7 = "almost perfect", not broken)
- [ ] Sleep log: tap sleep / wake, weekly average, sleep debt calculation
- [ ] Water checkbox (single daily check)
- [ ] Medication reminder with push notification
- [ ] Stress level (1-10 daily slider, weekly trend)

### Day 5: ☀️ Day Tab

- [ ] Top 3 Priorities with 3 guided questions:
  - "What must happen today?"
  - "What would feel like a win?"
  - "What's long overdue?"
- [ ] Priority roll-over from previous day (unfinished → auto-suggested)
- [ ] Energy-aware reordering (if morning mood low → easy tasks first)
- [ ] Pomodoro timer (50-min work / 10-min break)
- [ ] Break activity randomizer (stretch / water / step outside / short walk)
- [ ] Tonight planner (time-block builder for evening)
- [ ] Tomorrow planner (fill at night, ready in morning)
- [ ] Quick List (universal brain dump: groceries, errands, thoughts)

### Day 6: ❤️ People Tab

- [ ] Contact cards (name, birthday, relationship, photo)
- [ ] Last-talked tracker (auto-updates when conversation memory is logged)
- [ ] Reach-out reminder notifications ("You haven't talked to [name] in X days")
- [ ] Birthday reminder with full moment (message suggestions + gift ideas)
- [ ] "Things they love" notes per person
- [ ] Conversation memory capture (one text field after interaction)

### Day 7: Polish + Distribution

- [ ] **Center raised "+" button:**
  - Floating above tab bar center
  - Opens quick-action bottom sheet
  - Context-aware options based on time of day
- [ ] **Wire Home dashboard with live data from all 4 other tabs**
- [ ] **Set up all 11 push notifications:**
  - Max 3/day logic
  - Quiet hours (10 PM - 7 AM default)
  - All customizable in settings
- [ ] **Dark mode implementation**
- [ ] **30-day trial tracking:**
  - Store trialStartDate in metadata on first launch
  - Gate premium features after expiry
- [ ] **Export Everything** (CSV/JSON via system share sheet)
- [ ] **Delete Everything** (type "DELETE" to confirm, wipe all tables)
- [ ] **Shareable cards (all 8 types):**
  - Card template engine (generates image from data)
  - Daily Spark Done card
  - Habit Streak Milestone card (Day 7/14/30/60/100)
  - No-Spend Day Win card (midnight trigger)
  - Savings Goal Reached card
  - Weekly Life Score card (Sunday 8 PM)
  - Monthly Wrap card (last day of month)
  - First Week Complete card (Day 7)
  - 7-Day Challenge daily progress card
  - One-tap share to Stories / social / save to camera roll
  - Rule: emotion-based copy, never raw numbers
- [ ] **Empty state messages with personality** for all tabs
- [ ] **App icon + splash screen**
- [ ] **App Store / Play Store config** (description, screenshots, keywords)
- [ ] **IAP setup** — one-time purchase (~$6 USD)
- [ ] **End-to-end testing:**
  - Full daily loop: morning → daytime → evening → night
  - Voice → STT → LLM parse → confirm → save
  - clawdi Score calculation accuracy
  - Notification scheduling (max 3/day)
  - Export/Delete functionality
  - Trial tracking
  - All 4 other tabs with real data flow to Home
