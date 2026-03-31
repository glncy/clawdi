# Roadmap: Clawdi — AI-First Minimalist Finance App

## Phase 1: The Core — "Just Works" (7-Day Ship)

**Objective:** Deliver a fully functional, privacy-first finance app with AI-powered input and a single hero metric.

**Architecture:** 3 screens + 1 input modal.

**Tech Stack:** React Native (Expo 55) + Drizzle ORM + expo-sqlite + llama.rn + Phosphor Icons + Uniwind. Build: Fastlane + GitHub Actions.

### Features

- **Safe to Spend Dashboard**
  - Hero number: `(Current Balance - Upcoming Bills in 30 days) / Days Remaining`
  - Color-as-data background: green (healthy) → amber (caution) → red (tight)
  - 30-day rolling balance projection

- **AI-Powered Transaction Entry**
  - Local LLM: Qwen 2.5 0.5B Instruct (Q4_K_M, ~491MB) via llama.rn
  - JSON schema grammar constraints for guaranteed structured output
  - Parses: item, amount, currency, category, date from natural language
  - Handles complex input: "2 pieces of bread 200 pesos"
  - Background model download on first launch
  - Fallback: structured manual input (amount + description) for low-spec devices (<4GB RAM)
  - Device capability detection via expo-device

- **Voice Input**
  - Native offline STT via @jamsch/expo-speech-recognition
  - Uses platform built-in recognition (Apple SFSpeechRecognizer / Android SpeechRecognizer)
  - Zero model download, works immediately

- **Transaction Management**
  - Full CRUD with swipe actions
  - AI-detected categories
  - Multi-currency support from day 1

- **Recurring Bills & Bill Countdown**
  - Recurring expense entry and tracking
  - Countdown with context: "Electric due in 2 days — you have 3x the amount ready"

- **Local-First Data Layer**
  - Drizzle ORM with expo-sqlite driver
  - Type-safe schemas: Transactions, Recurrences, Metadata
  - Migrations support
  - Zero cloud sync

- **Local Notifications (Customizable)**
  - Daily Safe to Spend morning reminder
  - Bill countdown alerts (X days before due)
  - Hourly expense input reminders ("Any expenses to log?")
  - Periodic finance tips
  - Full user control over each notification type and schedule

- **Data Ownership**
  - Export Everything: one-tap CSV/JSON export of all data
  - Delete Everything: one-tap complete data wipe

- **Monetization**
  - 30-day full premium trial from first app launch
  - One-time lifetime purchase via App Store / Play Store IAP

- **Theme**
  - Light/dark mode (partially implemented)

- **Status:** Planning → Implementation

---

## Phase 1.5: Bring Your Own AI

**Objective:** Give power users control over their AI providers while maintaining privacy.

### Features

- **Remote LLM Opt-In**
  - User provides their own API key (OpenAI, Anthropic, Gemini)
  - Only sends transaction text string — never financial context or history
  - Shows user exactly what gets sent before sending

- **Custom STT/LLM Server URL**
  - Settings option to point to a self-hosted endpoint
  - Supports self-hosted VibeVoice-ASR, Whisper, or any compatible API
  - For power users running their own infrastructure

- **Custom React Native Package for VibeVoice-ASR**
  - Future: build a dedicated RN package wrapping Microsoft VibeVoice-ASR for local on-device use
  - Open-source contribution to the RN ecosystem

---

## Phase 2: Gamification — "Make It Fun"

**Objective:** Improve user retention through positive reinforcement instead of guilt.

### Features

- **Streaks & Budget Levels**
  - Consecutive days of logging
  - Budget levels based on staying within Safe to Spend

- **Spending DNA**
  - Unique visual pattern (fingerprint/waveform) generated from weekly spending behavior
  - See your "DNA" stabilize or shift over time
  - Abstract art from your data — shareable without revealing numbers

- **Stealth Savings**
  - Virtual round-up tracker on every purchase ($4.30 → $5.00 = $0.70 saved)
  - Motivational projection of potential savings

- **Habit Loops**
  - Auto-detect informal recurring patterns ("Coffee 4 Mondays in a row, ~$5 each")
  - Prompt to track as soft recurring expense for better forecasting

- **Emotion/Mood Tagging**
  - Optional mood tag on transactions (impulse, planned, regret, joy)
  - Surface patterns: "You impulse-spend on Fridays" or "Regret-tagged purchases average $47"

- **Ghost Mode**
  - Soft spending friction instead of hard budget warnings
  - "You've been eating well this week" nudge after hitting a threshold — no red warnings, no guilt

- **Zen Mode**
  - Hide ALL numbers, show only color state
  - For users who get anxious seeing exact figures
  - Green = you're okay. That's all they need.

---

## Phase 3: Subscription Sniper — "Save Money Passively"

**Objective:** Deep-dive into recurring costs and help users eliminate waste.

### Features

- **Auto-Detect Recurring Charges**
  - Pattern recognition from transaction history
  - Surface subscriptions the user may have forgotten

- **Trial Expiry Alerts**
  - Track free trials and notify before they convert to paid
  - "Your streaming trial expires in 3 days"

- **Hidden Yearly Cost Visualization**
  - Show the true annual cost of monthly subscriptions
  - "$9.99/mo = $119.88/yr" — often more impactful than the monthly number

- **"What If I Cancel X?" Simulator**
  - Interactive tool: "What if I cancel Service X and Service Y?"
  - Shows projected savings over 3, 6, 12 months
  - Impact on Safe to Spend

- **Price Hike Alerts**
  - Detect when a recurring charge increases
  - "Your music subscription went from $9.99 to $11.99 last month"

---

## Phase 4: Social & Community — "Together, Optionally"

**Objective:** Enable shared financial awareness while preserving privacy.

### Features

- **Privacy-Safe Household Sharing**
  - Share only the Safe to Spend number, not individual transactions
  - "Hey, we have $340 left for the next 12 days"

- **Spending Snapshot for Couples**
  - Minimal shared view — Safe to Spend + bill countdowns
  - No transaction-level visibility unless explicitly shared

- **Anonymous Spending Benchmarks**
  - "People in your area spend ~$X on groceries" (no personal data shared)
  - Opt-in only

- **Open Books Badge**
  - In-app badge linking directly to the GitHub repo
  - Shows latest commit and simplified schema diagram
  - Make transparency a feature, not just a claim

- **Shareable Spending DNA**
  - Share your weekly spending pattern as abstract art
  - No real numbers revealed — just the visual pattern

- **Time Machine**
  - Scroll back to see Safe to Spend on any past date
  - Simple but no app does this well

- **Pay Period Mode**
  - Budget by pay cycle (weekly, bi-weekly) instead of calendar month
  - Serves freelancers and gig workers better
