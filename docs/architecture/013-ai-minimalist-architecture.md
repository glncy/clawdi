# ADR 013: Daily Companion Architecture

## Status

Accepted (revised — pivoted from finance-only to daily companion)

## Context

clawdi pivoted from a finance-only app to a daily companion that tracks the 6 things that matter in life: Money, Time, Health, People, Mind, and Growth. The architecture needs to support 5 tabs with cross-domain data insights while maintaining the local-first, privacy-first philosophy.

## Decision

We will use a **Local-First, AI-Enhanced, Domain-Driven** architecture:

### 1. 5-Tab + Center Add Architecture

```
              [+ ADD] ← raised floating button
                 |
[🏠 Home] [💰 Money] [🌿 Life] [☀️ Day] [❤️ People]
```

- **Home** is read-only — aggregates data from all other tabs
- Each tab owns its domain data and screens (max 3 screens per tab)
- The "+" is a floating action button, not a tab — opens a context-aware quick-action bottom sheet
- 10-Second Rule: every core action must complete in under 10 seconds

### 2. The 6 Life Pillars → clawdi Score

| Pillar | Data Source | Score Inputs |
|--------|-----------|-------------|
| 💰 Money | Money tab | Budget adherence, savings progress, spending patterns |
| ⏰ Time | Day tab | Priorities completed, Pomodoro sessions, planning consistency |
| 🏥 Health | Life tab | Sleep quality, water, steps, workout frequency |
| 🧠 Mind | Life tab | Mood trends, stress levels |
| ❤️ People | People tab | Reach-out frequency, relationship maintenance |
| 🎯 Growth | Day tab | Habit completion rate, streaks |

clawdi Score = weighted aggregate of all 6 pillars (0-100), recalculated weekly.

### 3. Local-First Data

- **ORM:** Drizzle ORM with expo-sqlite driver for type-safe schemas and migrations
- **16 tables:** transactions, recurrences, savings_goals, categories, moods, habits, habit_logs, sleep_logs, priorities, contacts, contact_notes, metadata, stress_logs, water_logs, sparks, quick_list
- **Sync:** None. Zero cloud sync. Data ownership via Export (CSV/JSON) and Delete Everything.

### 4. AI-Enhanced Input

- **Local LLM:** `llama.rn` + Qwen 2.5 0.5B Instruct (Q4_K_M, ~491MB) for expense parsing
- **Grammar-Constrained Decoding:** JSON schema enforced at decoding level
- **Voice:** `@jamsch/expo-speech-recognition` using native platform STT, offline
- **Fallback:** Structured manual input on devices with <4GB RAM
- **Future (Phase 5):** Cross-data correlation engine ("The Why") — basic if-statement logic, not ML

### 5. Cross-Domain Insights ("The Why")

The killer feature of a multi-domain app: connecting data across tabs to surface insights no single-purpose app can provide.

```
Every Sunday:
1. Pull mood ratings (Life tab)
2. Pull daily spend totals (Money tab)
3. Pull sleep data (Life tab)
4. Pull habit completion (Life tab)
5. Find correlations (basic arithmetic, no AI needed):
   - Days with mood ≤ 2 AND spend > weekly avg → "stress spending"
   - Weeks with 4+ habits AND avg mood > 4 → "habits protect happiness"
   - Days with sleep < 6h AND spend > avg → "sleep affects wallet"
6. Surface one insight per week as notification
```

### 6. Notification System

11 notification types, max 3 shown per day. Rules:

- Always personal (include name + real number)
- Never guilt ("Quick — what did you spend?" not "You haven't logged")
- Always actionable (one-tap action from lock screen)
- Respect quiet hours (10 PM - 7 AM default)
- Context-aware scheduling based on user patterns

### 7. First-Install Experience

The onboarding creates emotional investment before any data entry:

```
"Mirror" (5 sliders) → Names their reality → 3 setup questions
→ Life Score reveal → Pre-filled dashboard → Instant value
```

Pre-filled from onboarding: budget set, one habit added, savings goal drafted, Spark showing, Quick List populated.

### 8. Icons & Design

- **Phosphor Icons** (`phosphor-react-native`) — clean, consistent
- **HeroUI Native** — component library
- **Uniwind** — Tailwind CSS for React Native
- **Color-as-data** — retained from finance version for the Money tab

## Tech Stack Summary

| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | React Native (Expo 55) | Cross-platform, single codebase |
| Database | expo-sqlite + Drizzle ORM | Type-safe local-first storage |
| Local LLM | llama.rn + Qwen 2.5 0.5B | On-device expense parsing |
| Voice | @jamsch/expo-speech-recognition | Native offline STT |
| Icons | phosphor-react-native | Clean minimalist design |
| Notifications | expo-notifications | Local reminders (max 3/day) |
| State | Zustand | Lightweight, no boilerplate |
| Styling | Uniwind + HeroUI Native | Tailwind ergonomics + components |
| Device | expo-device | RAM check for LLM capability |
| Build | Fastlane + GitHub Actions | Production CI/CD |

## Consequences

### Pros

- Covers 6 life domains in one app — no other app does this
- Cross-domain insights ("The Why") impossible for single-purpose apps
- Local-first = maximum privacy, verifiable via open source
- clawdi Score creates retention loop (users want to improve it)
- Pre-filled onboarding = instant value, no empty screens
- 10-Second Rule keeps every action fast

### Cons

- 5 tabs = more surface area to build and maintain than 3 screens
- More schemas = more migration complexity
- Cross-domain insights require enough data (2+ weeks)
- No cross-device sync

### Mitigations

- 3-Screen Max rule per tab prevents scope creep
- Anti-Bloat Rules (3-Request, 30-Day Wait, Kill Unused)
- Insights surfaced only when sufficient data exists
- Export Everything for manual backup
