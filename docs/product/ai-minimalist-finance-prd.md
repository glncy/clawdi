# PRD: clawdi — Your Daily Companion

## 1. Objective

Build an open-source, privacy-first mobile app that helps people take control of the 6 things that actually matter in life — money, time, health, people, mind, and growth — all in one place.

clawdi is not a finance app. Not a habit tracker. Not a planner. It's the one app that holds your whole life together.

## 2. Tagline

- "Your daily companion."
- "Finance is your foundation. Life is your goal."
- "The 6 things that actually matter — in one app."

## 3. Target Audience

- **Everyone who feels their life is scattered** — across 10 different apps and still not feeling on top of it.
- **People who want simplicity** — overwhelmed by feature-heavy apps. Want one place, not ten.
- **All ages, all countries** — multi-currency from day 1. No country-specific features. Globally relevant.
- **Privacy-conscious** — open source, local-first, no cloud sync for personal data.

## 4. The 6 Life Pillars

| Pillar | Icon | Core Question | Tab |
|--------|------|--------------|-----|
| Money | 💰 | Am I financially okay? | Money |
| Time | ⏰ | Am I spending my time well? | Day |
| Health | 🏥 | Am I taking care of my body? | Life |
| People | ❤️ | Am I keeping up with people I love? | People |
| Mind | 🧠 | How am I feeling emotionally? | Life |
| Growth | 🎯 | Am I becoming a better person? | Day |

## 5. User Stories

- **Clarity:** "As a user, I want a single score that tells me how my life is going — across money, health, time, and relationships."
- **Easy Logging:** "As a user, I want to log expenses, moods, and habits in under 10 seconds."
- **Awareness:** "As a user, I want the app to show me connections I can't see — like how my sleep affects my spending."
- **Relationships:** "As a user, I want to know when I'm drifting from people I care about — before it's too late."
- **Privacy:** "As a user, I want all my data stored on my device. No cloud. No selling. No ads."
- **Direction:** "As a user, I want to set 3 priorities each day so my time feels intentional, not random."
- **Progress:** "As a user, I want to see how I've improved over time — not just what I did today."
- **No Setup:** "As a user, I want the app to feel useful from the first second — no empty screens, no 10-minute setup."

## 6. App Architecture

### 5 Tabs + Center Raised Add Button

```
              [+ ADD] ← raised above tab bar, floating
                 |
[🏠 Home] [💰 Money] [🌿 Life] [☀️ Day] [❤️ People]
```

The "+" opens a universal quick-action bottom sheet — context-aware based on time of day.

| Tab | Purpose |
|-----|---------|
| **Home** | Read-only dashboard — clawdi Score, daily budget, habits ring, Spark challenge, relationship nudge, personalized greeting |
| **Money** | Financial health — expense log, budget per category, savings goals, bill reminders, payday tools |
| **Life** | Health + Mind — mood check-in, habit tracker, sleep log, water, stress, medication, steps |
| **Day** | Time + Growth — top 3 priorities, Pomodoro, planner, quick list, break randomizer |
| **People** | Relationships — contacts, last-talked tracker, birthday reminders, gift ideas, conversation memory |

### Core Daily Loop

| Time | What Happens |
|------|-------------|
| 🌅 Morning | Home dashboard → Spark challenge → Tick habits → Set 3 priorities |
| ☀️ Daytime | Log expenses → Check budget → Pomodoro focus blocks → Habits |
| 🌙 Evening | Spending recap → Mood log → Habit completion ring |
| 🌃 Night | Rate the day → One win → Sleep time → Plan tomorrow |
| 📅 Weekly | Sunday: Life Score report → shareable card |

## 7. Key Features (V1)

### 🏠 Home Tab (Read-Only Dashboard)
- **Focus Areas** — domains the user wants to improve, identified during onboarding (below 50 threshold). No life score — just awareness of what needs attention.
- 5-domain progress bars (visual health indicators)
- Budget left today
- Habits progress ring (X/Y done)
- Today's top priority
- **clawdi Spark** — daily personalized challenge based on user's weakest domain
- Relationship nudge ("You haven't talked to [name] in X days")
- Morning greeting with user's name + context from their data

### 💰 Money Tab
- **Income tracking** — log income sources, payday schedule
- **Balance tracking** — current balance, net position
- Quick expense logger (3-tap flow, under 10 seconds)
- Auto-category detect (AI-powered)
- **Custom categories** — user-defined spending categories beyond defaults
- Budget per category with color bars (green → yellow → red)
- **Bill tracking** — recurring bills with due dates and reminders (3 days before)
- **Subscription tracking** — recurring subscriptions with cost visibility
- **Budget Shield** alert — notification when approaching limit
- Savings goals with target date calculator
- Payday auto-plan (income → suggested allocation)
- No-Spend Day challenge
- Payday countdown
- Monthly spending chart

### 🌿 Life Tab (Health + Mind)
- Mood check-in (morning + night, emoji-based) with clawdi reactions
- Habit tracker (up to 5 habits, one-tap completion)
- **Flexible streaks** — 6/7 days shows "almost perfect" not "streak broken"
- Sleep log (tap sleep/wake, weekly average, sleep debt)
- Water checkbox (single daily check — no cup counting)
- Medication reminder with push notification
- Stress level (1-10 daily, weekly trend)
- Steps counter (device pedometer)

### ☀️ Day Tab (Time + Growth)
- **Top 3 Priorities** — 3 guided questions: must happen / would feel like a win / long overdue
- Priority roll-over from previous day
- Energy-aware priority reordering (if morning mood is low → easy tasks first)
- Pomodoro timer (50-min work / 10-min break)
- Break activity randomizer (stretch / water / step outside)
- Tonight planner (time-block evening)
- Tomorrow planner (fill at night, unlocks in morning)
- Quick List (brain dump — groceries, errands, random thoughts)

### ❤️ People Tab
- Contact cards (name, birthday, relationship, photo)
- Last-talked tracker
- Reach-out reminder notifications
- Birthday reminders with full moment (message suggestions + gift ideas)
- "Things they love" notes per person
- Conversation memory capture (one field after interaction)

## 8. First-Install Experience ("The Mirror")

No empty screens. No 10-minute setup. Value in 60 seconds.

```
Open clawdi
      ↓
"Be honest with yourself for 60 seconds"
      ↓
5 slider questions about their life (money, time, health, people, mind)
      ↓
"Here's what you just told us." — names their reality
      ↓
3 onboarding questions (income, saving goal, biggest struggle)
      ↓
Focus areas reveal — domains below 50 become focus areas
"We'll help you focus on: Finances, Time"
      ↓
Ask user's name — enables personalized greeting
      ↓
Pre-filled dashboard (no empty screens)
      ↓
Daily budget number — first wow moment
      ↓
First habit pre-ticked — second wow moment
```

**No life scoring.** clawdi does not score your life — it identifies focus areas. Domains where the user rated below 50 on the sliders become suggested focus areas. This feels like a plan, not a grade.

The dashboard is pre-filled from onboarding answers:
- Budget already set (estimated from income)
- One habit already added ("Drink enough water")
- One savings goal draft from their saving goal choice
- Today's Spark already showing
- Quick List has a suggested starter item
- Personalized greeting using the user's name

## 9. Shareable Cards (V1 — Free Marketing Engine)

Rule: share emotions, not data. Never show raw numbers. Every share is a clawdi ad.

| Card | Message Style | Trigger |
|------|--------------|---------|
| Daily Spark Done | "Day 14 of showing up for myself" | Spark completion |
| Habit Streak Milestone | "30 days of choosing myself" | Day 7 / 14 / 30 / 60 / 100 |
| No-Spend Day Win | "Chose myself over spending today" | Midnight after ₱0 spent |
| Savings Goal Reached | "Travel fund complete — I did it" | Goal hits 100% |
| Weekly Life Score | Mood, habits, sleep, reach-outs — emotion-based, no raw currency | Sunday 8 PM auto |
| Monthly Wrap | "April was my most disciplined month" | Last day of month |
| First Week Complete | "Week 1 of my daily companion journey done" | Day 7 milestone |
| 7-Day Challenge | Daily progress card (Day 1 / Day 2 / ...) | During active challenge |

Cards are auto-generated and one-tap shareable to Stories, social, or saved to camera roll.

## 10. Signature Features (V2+)

- **"The Why"** — weekly cross-data insights ("You spend more when stressed", "Your best weeks had 7h+ sleep"). No AI needed — basic correlation logic across the 5 tabs.
- **clawdi Rewind** — annual cinematic recap on app anniversary showing life milestones
- **clawdi Letter** — weekly personal paragraph (Sunday night), not stats
- **"This Time Last Month"** — monthly progress card showing delta across all domains
- **Proudest Moments** — automatic achievement wall that fills without user effort

## 10. Notification Strategy

**Max 3 notifications per day.** Always personal. Never guilt. Always actionable.

| # | Notification | Time | Example |
|---|-------------|------|---------|
| 1 | Morning Spark | 7:00 AM | "Good morning [Name]. Today's challenge is waiting." |
| 2 | Lunch Budget Check | 11:30 AM | "You have $X left for food today." |
| 3 | Habit Midday Nudge | 2:00 PM | "2 habits left today. You've got this." |
| 4 | Evening Recap | 9:00 PM | "You spent $X today — under/over budget by $X." |
| 5 | Night Wind-Down | 9:30 PM | "2-minute wind-down. Rate your day before sleep." |
| 6 | Bill Due Reminder | Custom | "[Bill] is due in 3 days." |
| 7 | Budget Shield | Real-time | "This puts you $X over your [category] budget." |
| 8 | Habit Streak | Real-time | "Day X streak on [habit]!" |
| 9 | Reach Out Nudge | Custom | "You haven't talked to [Name] in X days." |
| 10 | Weekly Report | Sunday 8PM | "Your clawdi Week is ready." |
| 11 | Savings Milestone | Real-time | "You're 50% toward your [goal]!" |

Quiet hours: nothing between 10 PM and 7 AM unless user sets custom time.

## 12. Monetization

**Model:** 30-day full premium trial → one-time purchase (~$6 USD)

| Free (after trial) | Premium (one-time purchase) |
|---------------------|---------------------------|
| 3 savings goals | Unlimited goals |
| 7-day history | Full history forever |
| Basic weekly report | Full monthly wrap card |
| 3 habit slots | Unlimited habits |
| Standard themes | Exclusive themes + icons |
| Manual expense logging | Smart suggestions + auto-log |
| Export data (CSV/JSON) | Export data (CSV/JSON/PDF) |
| Delete Everything | Delete Everything |
| — | clawdi AI insights |
| — | clawdi Rewind (annual recap) |

No subscription. No ads. No data selling. "We practice what we preach."

## 13. Anti-Bloat Rules

- **3-Request Rule** — only build if 3 real users independently asked
- **30-Day Wait** — any idea waits 30 days before building
- **10-Second Rule** — every core action under 10 seconds or it doesn't ship
- **Kill Unused** — remove if <10% of users open after 60 days
- **3-Screen Max** — each tab has max 3 screens
- **Give Before Take** — clawdi gives value before asking for input

## 14. The Golden Rule

> "The best features in clawdi aren't things users DO — they're things clawdi DOES for them."

Logging = the user works. Getting a spending alert = clawdi works.
The more clawdi works, the more indispensable it becomes.

## 15. Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React Native (Expo 55) |
| Navigation | Expo Router |
| Styling | Uniwind (Tailwind for RN) |
| Components | HeroUI Native |
| Icons | Phosphor Icons (`phosphor-react-native`) |
| Database | expo-sqlite + Drizzle ORM |
| State | Zustand |
| Local LLM | @react-native-ai/llama + Qwen 2.5 1.5B Instruct (Q4_K_M, ~900MB) |
| Voice STT | @jamsch/expo-speech-recognition |
| Notifications | expo-notifications |
| Device Info | expo-device (RAM check for LLM capability) |
| Build | Fastlane + GitHub Actions |

## 16. Acceptance Criteria

- App must load in under 2 seconds to the home dashboard.
- Every core action (log expense, tick habit, check mood) must complete in under 10 seconds.
- First-install experience must deliver value in under 60 seconds — no empty screens.
- All data must remain in local SQLite. No network calls for data storage.
- 30-day trial must trigger correctly from first launch.
- clawdi Score must update weekly based on all 6 life domains.
- Notifications max 3 per day, all customizable, respect quiet hours.
- App must be usable without any onboarding tutorial.
- Export must produce valid CSV/JSON with all user data.
- Voice input must work offline using native device STT.
- Local LLM must gracefully fall back to structured input on devices with <6GB RAM.
