# Roadmap: clawdi — Your Daily Companion

## Phase 1: Ship — Days 1-7

**Goal:** Ship the V1 app with all 5 tabs functional. 100 downloads.

### What to Build

**Day 0 — Setup**
- Project structure, 5-tab navigation skeleton, local database setup, color palette + fonts

**Day 1 — 🏠 Home + Onboarding**
- First-install "Mirror" experience (5 slider questions → Life Score reveal)
- 3-question onboarding (income, dream, struggle)
- Home dashboard: clawdi Score, budget left, habits ring, top priority, Spark, relationship nudge, greeting
- Pre-filled dashboard from onboarding answers

**Day 2 — 💰 Money Tab**
- Quick expense logger (3-tap flow)
- Category system with auto-detect
- Budget per category with color bars
- Bill due reminders
- Evening spending recap notification

**Day 3 — 💰 Money Tab (Deep)**
- Savings goals with target date calculator
- Payday auto-plan
- Budget Shield alert
- No-Spend Day challenge
- Monthly spending chart

**Day 4 — 🌿 Life Tab**
- Mood check-in (morning + night) with clawdi reactions
- Habit tracker (up to 5, one-tap)
- Flexible streaks
- Sleep log + weekly average
- Water checkbox
- Medication reminder
- Stress level (1-10)

**Day 5 — ☀️ Day Tab**
- Top 3 priorities (guided questions)
- Priority roll-over
- Energy-aware reordering
- Pomodoro timer (50/10)
- Break randomizer
- Tonight/Tomorrow planner
- Quick List

**Day 6 — ❤️ People Tab**
- Contact cards
- Last-talked tracker
- Reach-out reminders
- Birthday reminders with gift ideas
- "Things they love" notes
- Conversation memory

**Day 7 — Polish + Submit**
- Wire Home dashboard with live data from all 4 other tabs
- Set up all 11 push notifications (max 3/day logic)
- Center raised "+" add button with context-aware quick actions
- Dark mode
- App icon + splash screen
- Empty state messages with personality
- Export Everything (CSV/JSON)
- Delete Everything (type DELETE to confirm)
- 30-day trial tracking
- App Store / Play Store submission

### Tech Stack
- React Native (Expo 55) + Drizzle ORM + expo-sqlite
- llama.rn + Qwen 2.5 0.5B for AI expense parsing
- @jamsch/expo-speech-recognition for voice input
- Phosphor Icons
- expo-notifications
- Zustand

---

## Phase 2: Fix — Weeks 2-4

**Goal:** Fix bugs from real users. Reach 1,000 users.

### Features
- Bug fixes from real user feedback
- Weekly Report card (auto-generated every Sunday, shareable)
- Spending pattern insight ("You spend 60% more on weekends")
- Sleep debt tracker with productivity connection
- Payday countdown on Money tab
- Habit shrinking (auto-reduces goal after 3 missed days)
- Priority roll-over polish
- Energy-aware priority reordering based on morning mood
- Steps counter integration (device pedometer)

### Actions
- Update app every 2 weeks (boosts store algorithm ranking)
- Ask first 100 users for reviews
- Share Weekly Report cards on social as download driver

---

## Phase 3: Depth + Premium — Month 2-3

**Goal:** Launch premium. 5,000 users.

### Features
- **Premium unlock** — one-time purchase (~$6 USD): unlimited goals, full history, monthly wrap, unlimited habits, exclusive themes, smart suggestions, AI insights, clawdi Rewind
- Monthly wrap card (Spotify-style, emotion-based not finance-based)
- clawdi Score full reveal on Home (0-100 across 6 domains)
- **"The Why"** — cross-data insights (mood → spending, sleep → habits, people → mood)
- Voice expense logging
- Expense splitting with friends
- Workout log
- Relationship health score (1-5 after each interaction)

---

## Phase 4: Social — Month 4-6

**Goal:** Social layer. 10,000 users.

### Features
- Friends list: compare clawdi Scores, shared habit challenges
- 7-Day No-Spend Challenge (daily shareable progress card)
- Shared to-do lists (partner / family)
- clawdi Letter — weekly personal paragraph (Sunday night)
- "This Time Last Month" progress card
- Proudest Moments badge wall
- Net worth tracker
- Referral program (invite → both get extended trial)

---

## Phase 5: Platform — Month 6+

**Goal:** Intelligence layer. 50,000+ users.

### Features
- **clawdi AI** — personalized insights from 6 months of real data. "You're happiest on Tuesdays when you sleep before 11 PM."
- **clawdi Rewind** — annual cinematic life recap on app anniversary
- Custom STT/LLM server support (VibeVoice-ASR, Whisper self-hosted)
- Custom React Native package for on-device ASR
- Learning tracker
- Book/movie tracker
- Vision board
- Period tracker (opt-in)
- Advanced data correlation engine
