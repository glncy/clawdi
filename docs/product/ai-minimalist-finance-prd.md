# PRD: clawdi — AI-First Minimalist Finance App

## 1. Objective

Build an open-source, privacy-first mobile finance app that eliminates budgeting friction through natural language input, predictive forecasting, and hyper-minimalist design. clawdi turns every major competitor weakness into a feature.

## 2. Tagline Options

- "Your money. Your phone. That's it."
- "Finance app with nothing to hide."
- "Open source. Closed to the cloud."
- "So simple, it's suspicious."

## 3. Target Audience

- **Kids & Teens:** Hyper-simple UI that requires no financial literacy to start. Color-as-data (green = good) is intuitive without reading numbers.
- **Older Adults:** Large clear numbers, minimal navigation, no jargon. "Safe to Spend" vs "Disposable Income After Fixed Obligations."
- **Tech-Savvy / Privacy-Conscious:** Open-source code, local-only SQLite, no third-party bank aggregators, no cloud sync. Audit Mode shows exactly what's stored.
- **Minimalists:** People overwhelmed by 50-screen finance apps with charts, categories, and analytics dashboards.
- **Variable Income Earners:** Freelancers, gig workers, paycheck-to-paycheck users. Safe to Spend is balance-based, not income-based.

## 4. User Stories

- **Easy Logging:** "As a user, I want to log an expense by typing or saying it so that I don't have to navigate menus."
- **Clarity:** "As a user, I want a single 'Safe to Spend' number so I know exactly my budget at a glance."
- **Privacy:** "As a user, I want my data stored locally on my device so that no one else can access my financial history."
- **Forecasting:** "As a user, I want the app to account for my upcoming bills so I don't overspend today."
- **Voice:** "As a user, I want to speak my expenses naturally — like '2 pieces of bread 200 pesos' — and have the app understand."
- **Multi-Currency:** "As a user, I want to track expenses in my local currency without configuration."
- **Reminders:** "As a user, I want customizable reminders to log expenses so I don't forget."
- **Data Ownership:** "As a user, I want to export all my data or delete everything with one tap."
- **Transparency:** "As a user, I want to see the app's source code so I can verify it doesn't send my data anywhere."

## 5. Problems clawdi Solves

### What's Wrong with Existing Finance Apps

| Problem | Examples | How clawdi Solves It |
|---------|----------|---------------------|
| **Subscription pricing irony** | Brand A: $50→$109/yr. Brand B: $99/yr. Brand C: $18/mo for bank sync. | One-time purchase. "We practice what we preach." |
| **Broken bank sync** | Third-party aggregator connections break weekly. Transactions vanish. Balances wrong. | No bank sync. No third-party aggregators. AI-powered manual entry. |
| **Categorization nightmare** | A big-box retailer tagged as "Groceries" when you bought printer paper. Therapy co-pays marked "Entertainment." | AI understands context from natural language. User confirms before saving. |
| **Overwhelming complexity** | 50+ screens, investment tracking, savings goals, analytics dashboards. | 3 screens + 1 input modal. One number. One button. |
| **Setup fatigue kills retention** | Connect banks, set categories, configure budgets, add goals — before seeing any value. 68% abandon rate. | Open app → see Safe to Spend → tap to log. Zero setup. Value in seconds. |
| **"Rearview mirror" problem** | Apps show what you spent. No forward-looking insight. | Safe to Spend is forward-looking by default. |
| **Guilt-driven design** | Red warnings, overspending alerts, shame-based notifications. | Color-as-data background. Soft nudges. No shame. |
| **Privacy is a lie** | A major aggregator settled a $58M lawsuit. A popular free app monetized user data. | Open source. Local SQLite. Audit Mode. Nothing leaves the phone. |
| **Platform lock-in & data loss** | A major free app shutdown destroyed years of user data. Another popular app is iOS-only. | Export Everything (CSV/JSON). Cross-platform. Open-source = app can never die. |
| **Variable income ignored** | Most apps assume steady monthly paychecks. | Balance-based Safe to Spend. Works regardless of pay schedule. |

### Industry Benchmarks

- 30% day-1 retention, 11.6% by day-30 for finance apps
- 68% of consumers abandon financial apps
- Users literally say: "Just tell me what I can safely spend today" — that's clawdi's entire hero screen

## 6. Competitive Positioning

| Feature | Traditional Finance Apps | clawdi |
|---------|-------------------|--------|
| Data storage | Their servers | Your phone |
| Input method | Forms & bank sync | Talk to it |
| Pricing | Monthly subscription | Buy once |
| Source code | Closed | Open on GitHub |
| Complexity | 50+ screens | 3 screens |
| Bank linking | Required | Never |
| AI | Cloud-only | Local-first (on-device LLM) |
| Voice | Limited/none | Native offline STT |
| Notifications | Generic alerts | Customizable reminders, tips, bill countdowns |

## 7. Key Features (Phase 1 — 7-Day Ship)

### Architecture: 3 Screens + 1 Modal

| Screen | Purpose |
|--------|---------|
| **Home** | Safe to Spend hero number + color-as-data background (green→amber→red) + Bill Countdown + floating input button |
| **History** | Transaction list + recurring bills (tabbed/segmented) + swipe to edit/delete |
| **Settings** | Premium status, export data, delete data, theme, AI provider, notification preferences |
| **Input Modal** | Bottom sheet — text + voice input → AI parse → confirm → save |

### Core Features

- **Safe to Spend Dashboard:** Real-time calculation of disposable income based on future obligations. Color background shifts green→amber→red based on financial health.
- **AI-Driven Entry:** On-device LLM (Qwen 2.5 0.5B via llama.rn) with JSON schema grammar constraints for reliable structured output. Graceful fallback to structured manual input on low-spec devices (<4GB RAM).
- **Voice Input:** Native offline speech-to-text via @jamsch/expo-speech-recognition. Speak naturally in any language.
- **Transaction Management:** Full CRUD with swipe actions. AI-detected categories from natural language.
- **Recurring Bills & Bill Countdown:** Entry and tracking of fixed expenses. "Electric due in 2 days — you have 3x ready."
- **Local-First Storage:** Drizzle ORM with expo-sqlite. Type-safe schemas and migrations. Zero cloud sync.
- **Multi-Currency:** Support for any currency from day 1. AI detects currency from input context.
- **Local Notifications (Customizable):**
  - Daily Safe to Spend morning reminder
  - Bill countdown alerts
  - Hourly expense input reminders ("Any expenses to log?")
  - Periodic finance tips
- **Data Ownership:**
  - Export Everything: one-tap CSV/JSON export
  - Delete Everything: one-tap data wipe. No dark patterns.
- **30-Day Premium Trial:** Triggers on first app launch. One-time lifetime purchase after.
- **Light/Dark Theme:** Already partially implemented.

## 8. Monetization

### Model: 30-Day Trial + One-Time Purchase

- **Free:** App works fully for 30 days from first launch
- **One-Time Purchase:** Lifetime premium via App Store / Play Store IAP
- No subscriptions — "we practice what we preach"

### Future Tiers (Post-Phase 1)

- **Supporter Tier:** Same features at a higher price. Badge in app. Supports open-source development.
- **Family Pack:** One purchase unlocks for household via platform family sharing.
- **"Build in Public" Transparency:** Optionally show revenue numbers publicly to reinforce trust.

### Premium vs Free Split (Post-Trial)

- **Free:** Manual structured input, basic Safe to Spend, transaction history
- **Premium:** AI natural language parsing, voice input, local LLM, advanced notifications, What-If simulator, Spending DNA, export

## 9. Tech Stack

| Component     | Technology                                 |
| ------------- | ------------------------------------------ |
| Framework     | React Native (Expo 55)                     |
| Navigation    | Expo Router                                |
| Styling       | Uniwind (Tailwind for RN)                  |
| Components    | HeroUI Native                              |
| Icons         | Phosphor Icons (`phosphor-react-native`)   |
| Database      | expo-sqlite + Drizzle ORM                  |
| State         | Zustand                                    |
| Local LLM     | llama.rn + Qwen 2.5 0.5B (Q4_K_M, ~491MB)  |
| Voice STT     | @jamsch/expo-speech-recognition            |
| Notifications | expo-notifications                         |
| Device Info   | expo-device (RAM check for LLM capability) |
| Build         | Fastlane + GitHub Actions                  |

## 10. Acceptance Criteria

- App must load in under 2 seconds to the main dashboard.
- Natural language parsing must accurately extract `amount`, `item`, `category`, `currency`, and `date` from conversational input.
- All financial data must remain in the local SQLite database. No network calls for data storage.
- 30-day trial must trigger correctly from the first app launch.
- Voice input must work offline using native device STT.
- Local LLM must gracefully fall back to structured input on devices with <4GB RAM.
- Export must produce valid CSV and JSON files containing all user data.
- Delete Everything must wipe all data immediately with no recovery prompts.
- Notifications must be fully customizable (enable/disable each type, set schedules).
- App must be usable without any onboarding — intuitive enough for a child or older adult.
- Color-as-data background must accurately reflect Safe to Spend health state.
