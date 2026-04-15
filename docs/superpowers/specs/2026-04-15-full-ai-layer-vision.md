# Design Spec: Full AI Layer Vision
**Date:** 2026-04-15  
**Status:** Future Sprint (post tabs-completion-sprint)  
**Scope:** Complete AI intelligence layer across all 6 life pillars — conversational chat, proactive nudges, periodic reports, finance superpowers, and cross-life "The Why" correlations

---

## 1. Vision

Clawdi's local AI (Gemma 4 E2B on Gemma-capable devices, Apple Foundation Models on iOS 26+) should feel less like a feature and more like the intelligence woven through the entire app. After the tabs completion sprint, every pillar has real data. This sprint activates that data as a unified AI brain.

**Three AI experiences, layered:**
- **Chat** — on-demand Q&A with your whole life as context ("How much did I spend on food when I was stressed last month?")
- **Proactive Nudges** — AI surfaces the right insight at the right moment, without being asked
- **Periodic Reports** — rich weekly/monthly narrative summaries generated locally

**Not in scope:** cloud sync, external APIs, further model upgrades beyond Gemma 4 E2B / Apple Foundation Models.

---

## 2. Architecture — `AIContextEngine`

### 2.1 Problem

Today each AI feature (briefing, finance insight, transaction parser) builds its own context string independently. With 6 pillars and 20+ features, that becomes unmaintainable and produces inconsistent, redundant prompts.

### 2.2 Solution: `useAIContext()` Hook

A single hook that reads from all stores and produces one typed `LifeContext` object. Every AI feature consumes this instead of wiring stores itself.

```typescript
interface LifeContext {
  meta: {
    userName: string
    date: string            // YYYY-MM-DD
    dayOfWeek: string
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  }
  money: {
    totalBalance: number
    dailyBudget: number
    budgetLeftToday: number
    monthIncome: number
    monthSpent: number
    thisWeekSpending: number[]        // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    categoryBudgets: {
      name: string
      spent: number
      budget: number
      overBudget: boolean
    }[]
    upcomingBills: {
      name: string
      amount: number
      daysUntilDue: number
    }[]
    savingsGoals: {
      name: string
      targetAmount: number
      currentAmount: number
      progressPct: number
      daysUntilTarget: number | null
    }[]
    recentTransactions: {
      item: string
      amount: number
      category: string
      date: string
      type: 'income' | 'expense'
    }[]
    budgetStreak: number              // consecutive days under total budget
  }
  life: {
    todayMood: { emoji: string; rating: number; type: 'morning' | 'night' } | null
    todayEnergy: number | null        // 1-5 derived from mood rating
    sleepLastNight: number | null     // hours
    todayStress: number | null        // 1-10
    habitCompletion: { name: string; done: boolean; streak: number }[]
    waterDone: boolean
  }
  day: {
    priorities: { text: string; type: 'must' | 'win' | 'overdue'; completed: boolean }[]
    completedToday: number
    totalToday: number
    pomodoroSessionsToday: number
  }
  people: {
    overdueContacts: { name: string; daysSince: number }[]   // lastTalkedAt > 4 days
    upcomingBirthdays: { name: string; daysUntil: number }[]
  }
}
```

### 2.3 Context Serializer

`serializeContext(ctx: LifeContext): string` — converts the object to a compact, human-readable string for injection into prompts. Omits null fields. Example output:

```
[Today: Wednesday Apr 15 | Evening | User: Glency]
[Money] Balance: ₱18,400 | Budget left today: ₱320 | Month: ₱24K income, ₱18.2K spent
  Overspent: Food (+₱820), Transport (+₱200)
  Bills due: Meralco in 3 days (₱2,800), Netflix in 8 days (₱649)
  Budget streak: 4 days
[Life] Mood: 😊 (morning) | Sleep: 6.5h | Stress: 5/10
  Habits: gym ✓, reading ✗, vitamins ✓ | Water: done
[Day] Priorities: 2/3 done | Pomodoros today: 3
[People] Overdue: Marco (6 days), Ana (5 days) | Birthday: Sara in 2 days
```

### 2.4 Migration Plan

| Feature | Before | After |
|---------|--------|-------|
| `briefingPrompt.ts` | Manual store access | `serializeContext(useAIContext())` |
| `financeInsightPrompt.ts` | Finance only | Full `LifeContext` |
| Transaction parser | Stateless | Unchanged — parser doesn't need life context |
| All new features | — | `useAIContext()` as input |

---

## 3. Chat Layer

### 3.1 Two Entry Points, One Chat

**Entry A — Floating AI Button (FAB):**
- Persistent on every tab screen (bottom-right, above tab bar)
- Tapping opens the full chat screen
- Available regardless of which tab is active

**Entry B — Dashboard Briefing Card:**
- The existing `DailyBriefing` card on Home tab gains a "Ask me anything…" input row at the bottom
- Tapping the input navigates to the chat screen with focus on the input
- Feels natural: "The briefing told me something → I want to dig in"

Both entry points open the same `ChatScreen`. No separate tab — chat is summoned, not navigated to.

### 3.2 Chat Screen

**File:** `apps/mobile/src/app/(main)/chat/index.tsx` (modal route)

**Layout:**
- Full-screen modal (slides up from bottom)
- Message thread (reverse-scroll FlatList)
- Input bar at bottom: text field + mic button (voice) + send button
- Header: "Clawdi AI" + close button
- Context pill row below header: "Money · Life · Day · People" — shows what pillars the AI can see

**Message types:**
- User bubble (right-aligned, primary color)
- AI bubble (left-aligned, surface color) — streams token by token
- AI can include inline data cards: spending charts, goal progress, bill table (rendered as compact components inside the bubble)

**Multi-turn:**
- Conversation history kept in component state (not persisted — clears on close)
- Last 6 messages included in each new prompt for continuity
- System prompt includes full `LifeContext` on every turn

**Voice in chat:**
- Mic button in input bar → STT → transcript fills input → user reviews → send
- (Different from tab voice entry — chat voice is "dictate message", not "parse action")

### 3.3 Chat System Prompt Pattern

```
You are Clawdi, a personal life companion AI. You have access to the user's real data across money, life, habits, priorities, and relationships. Answer conversationally, be specific with numbers, and keep responses under 100 words unless a detailed breakdown is requested.

[CURRENT LIFE CONTEXT]
{serializeContext(lifeContext)}

[CONVERSATION HISTORY]
{last 6 messages}

[USER MESSAGE]
{userMessage}
```

---

## 4. Finance AI Superpowers

All powered by `LifeContext` (specifically the `money` pillar). Rendered as smart cards on the Money tab or triggered via nudges.

### 4.1 Month-End Forecast

**Where:** Money tab, below Balance Hero card  
**Trigger:** Auto-generated on screen load, refreshes when new transactions added  
**Logic:**
- Current spend pace: `monthSpent / dayOfMonth * daysInMonth`
- Projected end balance: `totalBalance - (projectedMonthSpend - monthSpent)`
- Compares against last month if data available

**AI narrative:** 1–2 sentences. Examples:
> "At your current pace, you'll spend ₱28,400 this month — ₱3,200 over budget. Consider cutting back on food delivery this week."  
> "You're on track to end the month with ₱14,800. 🎯 Well within your savings target."

### 4.2 Spending Anomaly Detection

**Where:** Proactive nudge card on Money tab  
**Trigger:** Computed after each new transaction; shown if anomaly detected  
**Logic:**
- Per-category 4-week rolling average
- Anomaly threshold: current week's category spend > 2× the 4-week average
- Surfaced as a nudge card: "⚠️ Anomaly: [Category] spend is [X]× your usual"

**AI narrative:** 1 sentence. Example:
> "Your Grab spend this week (₱2,400) is 4× your usual average of ₱600. Anything going on?"

### 4.3 "What If" Simulator

**Where:** Chat (primary) + Money tab quick-action button  
**Trigger:** User asks hypothetical in chat OR taps "What If?" on Money tab  
**Logic:** Recalculates `monthSpent`, `budgetLeftToday`, and goal timelines with modified budget values  
**Examples:**
- "What if I cut my food budget by ₱500?" → new projected month-end balance, updated goal timeline
- "What if I add ₱2,000 to my emergency fund?" → updated savings progress %

### 4.4 Smart Budget Rebalancing

**Where:** Proactive nudge card on Money tab, last 3 days of month only  
**Trigger:** Category has ≥ ₱500 unspent with ≤ 3 days left in month  
**AI decision:** Suggests moving surplus to the savings goal closest to completion  
**Example:**
> "You have ₱900 left in Entertainment with 2 days to go. Move it to your Emergency Fund? That puts you at 78% of your goal."  
> Action button: "Move to Emergency Fund" → creates income transaction on goal

### 4.5 Natural Language Goal Setting

**Where:** Chat + "Add Goal" entry in Savings Goals section  
**Trigger:** User types/speaks a goal description  
**Logic:** AI parses → `{ name, targetAmount, targetDate }` → pre-fills `AddGoalSheet`  
**Examples:**
- "I want to save ₱80K for a MacBook by December" → goal name "MacBook", target ₱80,000, date Dec 31
- "Emergency fund of 3 months expenses" → target = `monthSpent * 3`

### 4.6 Natural Language Transaction Search

**Where:** Money tab search bar (new) + chat  
**Trigger:** User types/speaks a search query  
**Logic:** AI converts NL query to SQLite filter params → queries `transactions` table locally  
**Examples:**
- "Show me all Lazada orders above ₱1K last quarter" → `{ category: "Shopping", minAmount: 1000, dateRange: lastQuarter }`
- "When did I last pay my internet bill?" → `{ item: "%internet%", type: "expense", limit: 1, orderBy: "date DESC" }`

**Result:** Filtered transaction list rendered inline (not AI response — raw data query)

### 4.7 Budget Streak & Milestones

**Where:** Dashboard home card + Money tab badge  
**Logic:**
- Streak: consecutive calendar days where total spending < `dailyBudget`
- Resets to 0 the day after a bust day
- Milestones: 3, 7, 14, 30 days — triggers a celebration card + optional shareable

**Display:** "🔥 4-day streak under budget" on Home + compact badge on Money tab

### 4.8 Bill Intelligence

**Where:** Proactive nudge card on Money tab + Home tab  
**Trigger:** Bill due within 5 days AND balance within 30% of bill amount  
**AI narrative:** Example:
> "Your Meralco bill (₱2,800) is due in 3 days. Your balance is ₱3,100 — cutting it close. No non-essential spending until payday?"

**Safe case** (balance is healthy): no card shown — avoid noise when unnecessary.

### 4.9 AI Weekly Challenge

**Where:** Home tab (replaces or joins Spark card), generated every Monday  
**Logic:** AI analyzes last week's spending patterns → picks one behavior to challenge  
**Stored:** `metadata` as `weekly_challenge_YYYY-WW`  
**Examples:**
- "This week: no food delivery orders. Save ₱1,200." (triggered when food delivery is top anomaly)
- "This week: stay under ₱500/day. You hit this 4 of 7 days last week — can you go 7/7?"
- "Challenge: log every expense within 1 hour of spending."

Progress tracked by comparing daily spending vs challenge goal throughout the week.

---

## 5. Cross-Life "The Why" Insights

### 5.1 Correlation Engine

`correlationEngine.ts` — runs as a background computation after data loads. Computes:

```typescript
interface CorrelationResult {
  type: CorrelationType
  strength: 'strong' | 'moderate' | 'weak'
  insight: string           // pre-computed narrative
  dataPoints: number        // n= for credibility
}

type CorrelationType =
  | 'mood_spending'         // stress days → higher spend
  | 'sleep_productivity'    // low sleep → fewer priorities done
  | 'habit_spending'        // gym habit → lower food spend
  | 'social_spending'       // social contact days → higher spend
  | 'stress_budget'         // high stress → impulse nudge
  | 'life_briefing'         // always-on: unified dashboard context
```

Minimum data threshold: 7 data points per correlation (won't show insights until enough history exists).

### 5.2 The Nine Cross-Domain Insights

**1. Mood → Spending**  
Logic: Compare transaction totals on days with mood rating ≤ 2 vs ≥ 4. If ≥ 20% difference → insight active.  
Shown on: Money tab (passive card) + AI chat context  
Example: *"You tend to overspend on stressed days. Last week you spent ₱1,800 on food delivery — all on your high-stress days."*

**2. Sleep → Productivity**  
Logic: Correlate `sleepLogs.durationMinutes` with `priorities` completion rate by date.  
Shown on: Day tab (insight card) + weekly report  
Example: *"When you sleep less than 6 hours, your priority completion drops to 40%. Last week: 5.2h avg, 38% done."*

**3. Habits → Financial Goals**  
Logic: Compare weekly spending in food/entertainment categories on weeks with high habit completion vs low.  
Shown on: Life tab (habit completion card) + Money tab  
Example: *"On weeks you hit your gym habit, your food delivery spend drops 38%. Keep the streak — it's literally saving you money."*

**4. Social → Spending**  
Logic: Compare spending on days with `contact_notes` of type `conversation` logged vs days without.  
Shown on: People tab (insight card) + Home briefing  
Example: *"You spend 2.4× more on days you hang out with friends. This weekend: 2 people overdue for a catch-up. Budget ₱500–₱800 if you meet up."*

**5. Energy / Stress → Budget Decisions (Real-Time Nudge)**  
Logic: If today's `stress_logs.level` ≥ 7 AND historical pattern shows stress days have ≥ 30% higher spending → fire immediate nudge  
Shown on: Home tab (nudge card) immediately after stress is logged  
Example: *"Heads up: you logged high stress today. Based on your patterns, this increases impulse spending by 60%. Consider pausing non-essential purchases."*

**6. Unified Life Briefing (Dashboard Upgrade)**  
Logic: Upgrade the existing `DailyBriefing` component to use all 6 pillars via full `LifeContext`. Current briefing only uses finance + mock habits.  
System prompt updated to weave money, sleep, habits, priorities, and relationships into one cohesive morning narrative.  
Example: *"Good morning. You slept 7.5h — solid night. Budget has ₱2,100 left for today and you're 4 days into a streak. 2 priorities due, and it's been 6 days since you talked to Marco."*

**7. AI Relationship Coach (People Tab)**  
Logic: Surfaces contextual suggestions per contact based on their notes + upcoming dates + spending data  
Shown on: Contact detail sheet + People tab  
Example: *"Marco's birthday is in 9 days. Your usual gift budget is ₱500–₱800. He loves specialty coffee — check out Yardstick or Commune."*  
Features: conversation starters, gift idea generation from notes, "last talked about" summary

**8. AI Day Planner (Day Tab)**  
Logic: Cross-references today's mood/energy + priority count + pomodoro sessions to give planning advice  
Shown on: Day tab top card (above priority list)  
Example: *"You have 5 priorities but logged low energy today. Suggest picking your top 2 must-dos and deferring the rest — you've completed more when focused on fewer tasks."*

**9. AI Wellness Coach (Life Tab)**  
Logic: Pattern detection across sleep, stress, mood, and habit logs over rolling 7-day window  
Shown on: Life tab top card  
Example: *"Your sleep has been under 6h for 4 days and mood has trended down. A 20-min wind-down tonight could help — you've hit habits better the days after good sleep."*

---

## 6. Periodic AI Reports

### 6.1 Weekly Report

**Trigger:** Generated every Sunday evening (8 PM local)  
**Storage:** `metadata` as `weekly_report_YYYY-WW` (JSON blob with sections)  
**Access:** Home tab "This Week" section + notification tap

**Sections:**
1. **Spending summary** — total spent, vs last week, top category
2. **Budget performance** — days under/over budget, streak
3. **Life snapshot** — avg sleep, avg mood, habits completion rate
4. **Win of the week** — auto-detected best achievement (biggest savings day, best habit week, etc.)
5. **"The Why" correlation** — one cross-domain insight with enough data
6. **Next week focus** — one suggestion based on patterns

**Tone:** Conversational, not clinical. 150–250 words total. Generated by local Qwen from a structured prompt with that week's aggregated `LifeContext`.

### 6.2 Monthly Report

**Trigger:** Generated on the last day of the month  
**Storage:** `metadata` as `monthly_report_YYYY-MM`

**Sections:**
1. **Financial health** — net savings, budget adherence %, top 3 categories
2. **Life health** — avg sleep, mood trend, habit streaks
3. **Best week** — week with highest combined performance
4. **Relationships** — contacts you connected with most, any drifting
5. **Month in one sentence** — AI-generated summary ("A financially disciplined month despite high-stress weeks — habits held the line.")
6. **Next month intention** — one personalized goal suggestion

---

## 7. Implementation Approach — Context Engine First (Approach C)

### Phase 1: `AIContextEngine` + Upgraded Briefing
- Build `useAIContext()` hook
- Build `serializeContext()` utility
- Migrate `briefingPrompt.ts` to use full `LifeContext`
- Migrate `financeInsightPrompt.ts` to use full `LifeContext`
- **Visible win:** Dashboard briefing immediately becomes richer (real habits, real priorities, real contacts after tabs sprint)

### Phase 2: Finance AI Superpowers
Built on top of `LifeContext.money`. All are additive to existing Money tab:
1. Month-End Forecast card
2. Spending Anomaly nudge card
3. Budget Streak counter (Home + Money)
4. Bill Intelligence nudge card
5. Smart Budget Rebalancing card (end-of-month only)
6. NL Transaction Search bar
7. NL Goal Setting (wired to existing AddGoalSheet)
8. AI Weekly Challenge (Monday generation)

*"What If" Simulator deferred to Phase 3 — requires chat to be most useful.*

### Phase 3: Chat Layer
- `ChatScreen` (modal route)
- FAB component (persistent, all tabs)
- Dashboard briefing card → chat entry point
- Multi-turn with `LifeContext` + conversation history
- Voice-in-chat (dictation, not action parsing)
- "What If" Simulator wired here

### Phase 4: "The Why" Cross-Domain Correlations
- `correlationEngine.ts` background computation
- Per-insight nudge cards on each tab
- Stress → Budget real-time nudge
- Unified Life Briefing upgrade (uses correlations)

### Phase 5: Per-Tab AI Coaches
- AI Relationship Coach (People tab)
- AI Day Planner (Day tab)
- AI Wellness Coach (Life tab)
- All read from `useAIContext()`

### Phase 6: Periodic Reports
- Weekly report generation + notification
- Monthly report generation + notification
- Report viewer screen

---

## 8. Model Constraints & Prompt Engineering

**Primary model (iOS 26+):** Apple Foundation Models — zero download, native tool calling via `@react-native-ai/apple`  
**Fallback model:** Gemma 4 E2B UD-IQ2_M (~2.29 GB) via `@react-native-ai/llama` (llama.cpp + minja)  
**Provider selection:** `useAIProvider()` hook detects Apple Intelligence at runtime; falls back to Gemma  
**Context window:** ~2048 tokens (Gemma) / varies (Apple)  
**GPU layers:** 99 (full GPU acceleration, Gemma only)

**Key constraints:**
- Serialized `LifeContext` must stay under ~400 tokens — `serializeContext()` is built to omit null fields and compress numbers
- Conversation history: max 6 prior messages to stay within window
- All prompts use: concise system prompt + compressed context + short user message
- Responses capped: briefing < 80 words, insights < 60 words, chat < 100 words (unless user requests more)
- JSON extraction prompts (voice, NL search) use few-shot examples to improve accuracy with small model
- Streaming always enabled — perceived latency is lower even if total time is similar

---

## 9. Out of Scope

- Cloud-based AI models or API calls (local only, always)
- Model upgrades beyond Gemma 4 E2B / Apple Foundation Models
- Social features / sharing AI insights
- Onboarding AI personalization
- Predictive ML models (all inference via LLM prompts)

---

## 10. Dependencies

This sprint **requires** the tabs-completion-sprint to be merged first:
- Life tab must have real `moods`, `habits`, `sleep_logs`, `stress_logs` data
- Day tab must have real `priorities` data
- People tab must have real `contacts`, `contact_notes`, `lastTalkedAt` data
- `useLifeStore`, `useDayStore`, `usePeopleStore` must exist

Without those stores, `useAIContext()` has nothing to read and all cross-domain insights are no-ops.

---

*Spec written 2026-04-15. Implementation begins after tabs-completion-sprint is complete.*
