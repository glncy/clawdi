# clawdi — Idea Archive

Raw brainstorming documents and explored concepts. Not all ideas here are accepted for implementation — refer to the PRD and roadmap for the current spec.

## Files

| File | Description |
|------|-------------|
| `master-blueprint.xlsx` | 6-sheet product bible: Overview, Features by Tab, 7-Day Plan, 5-Phase Roadmap, Marketing & Monetization, Wow Moments |

## Brainstorm Summary (2026-04-01)

### The Pivot

clawdi started as a finance-only app and pivoted to a **Life OS** — tracking the 6 pillars of life (Money, Time, Health, People, Mind, Growth) instead of just finances. Finance is the foundation, but not the whole product.

### Explored Onboarding Concepts

- **"The Mirror"** — 5 slider questions on first install that name the user's reality before any setup. "Be honest with yourself for 60 seconds." Result screen names what they're feeling ("Your days feel unintentional") then positions clawdi as the answer.
- **"Your Life Checkup"** — 8 one-tap questions (one per life domain) that generate a starting Life Score. Creates a baseline for measuring progress forever.
- **"Your Two Futures"** — side-by-side comparison of life with vs without clawdi (savings projection based on income). Creates stakes via loss aversion.
- **"Your Money Blind Spot"** — shows the mathematical reality of untracked savings (₱60K vs ₱600K over 10 years). Finance-focused version, deferred since pivot to Life OS.

### Explored Retention Features

- **"The Why"** — cross-data insights that connect different life domains (e.g., "You spend more when stressed", "Your best weeks had 7h+ sleep"). Only possible because clawdi holds money, mood, sleep, habits, and relationships in one place. No AI needed — just basic correlation logic.
- **Clawdi Rewind** — annual cinematic recap on app anniversary showing life milestones across all domains.
- **Clawdi Letter** — weekly personal paragraph (Sunday night), written like a note from a friend, not a stats report.
- **"This Time Last Month"** — monthly progress card showing delta across all domains.
- **Proudest Moments** — automatic achievement wall that fills up without user effort.
- **Weekly One Question** — different reflective question each Sunday. Answers saved privately, creates unintentional journal over time.
- **Personalized Daily Opening Line** — morning greeting based on actual user data ("You slept 7 hours — your best this week").

### Explored First-Install Hooks

- Instant daily budget number (before any logging)
- Pre-filled dashboard from onboarding answers (no empty screens)
- First win in 10 seconds (pre-checked water habit)
- 2-hour post-install notification (challenge framed as status)
- 24-hour first report (even if only 1 expense logged)
- Suggested Quick List items based on common needs

### App Personality Ideas

- clawdi has a voice — notifications sound like a friend, not a system
- Haptic feedback on milestones
- Micro-animations on habit completion, budget bar changes
- Empty states with personality ("No expenses logged today. Either you're doing great or you forgot something")
- Auto dark mode at night with calmer UI
- Night mode typography (larger text, more spacing)

### Deferred Ideas (Global Focus)

These were explored for a Philippines-specific version but deferred since clawdi is now fully global:

- OFW Mode (remittance tracking, family wallet, balikbayan reminders)
- Digital Paluwagan (rotating savings group)
- Grocery Budget Mode
- Filipino-specific ASO keywords
- Filipino micro-influencer partnerships
- Adulting Checklist (SSS, Pag-IBIG, PhilHealth)

### Anti-Bloat Rules

- **3-Request Rule** — only build if 3 real users independently asked
- **30-Day Wait** — any idea waits 30 days before building
- **10-Second Rule** — every core action under 10 seconds
- **Kill Unused** — remove if <10% of users open after 60 days
- **3-Screen Max** — each tab has max 3 screens
- **Give Before Take** — clawdi gives value before asking for input

### The Chore Test

Apply before building any feature:

| Question | YES = Keep | NO = |
|----------|-----------|------|
| Under 10 seconds? | Keep | Simplify |
| clawdi does the work? | Keep | Redesign |
| User gets something back? | Keep | Add reaction |
| Works on a lazy day? | Keep | Make smaller |
| Skipping feels okay? | Keep | Remove pressure |
| Tool, not habit? | Launch V1 | Save for V2 |

### The Golden Rule

> "The best features in clawdi aren't things users DO — they're things clawdi DOES for them."

### 3-Day Survival Strategy

If a user opens the app on Day 1, Day 2, AND Day 3 — 30-day retention shoots to 90%.

| Day | Hook |
|-----|------|
| Day 1 | Onboarding wow + instant budget number + first 24-hour report |
| Day 2 | "Day 2. Your streak starts today. What did you spend?" |
| Day 3 | "3 days in a row. You're already in the top 20% of clawdi users." |

### Shareable Cards (8 Types)

Rule: share emotions, not data. Never show raw numbers.

1. Daily Spark Done — "Day 14 of showing up for myself"
2. Habit Streak Milestone — "30 days of choosing myself"
3. No-Spend Day Win — "Chose myself over spending today"
4. Savings Goal Reached — "Palawan, I'm coming"
5. Weekly Life Score — emotion-based, no raw currency
6. Monthly Wrap — "April was my most disciplined month"
7. First Week Complete — "Week 1 of my Life OS journey done"
8. 7-Day Challenge — daily progress card

### 10 Engineered "Wow" Moments

1. Instant Budget Reality Check
2. Savings Goal → Real Date
3. First Weekly Report (Day 7)
4. Spending Pattern Surprise
5. You Haven't Rested Alert
6. Budget Shield In The Moment
7. Relationship Reminder That Lands
8. Personalized Spark
9. Streak Celebration
10. First Life Score Reveal
