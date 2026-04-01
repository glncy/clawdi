# clawdi Design Reference

## Structure

```
design/
├── v3-daily-companion/   # Current — 5-tab daily companion designs
│   ├── light/            # Light mode screens
│   └── dark/             # Dark mode screens
├── final-reference/      # Legacy — finance-only version (kept for component reference)
├── pegs/                 # Inspiration & mood references
└── README.md
```

## v3 — Daily Companion Designs (Current)

The latest design references for the 5-tab daily companion app. Generated via [Stitch](https://stitch.withgoogle.com/) (Project ID: `9343377030997346216`).

### Light Mode (`v3-daily-companion/light/`)

| File | Screen | Description |
|------|--------|-------------|
| `home-light.png` | 🏠 Home | clawdi Score (74) with circular ring, 6 domain bars, budget left, habits ring, Spark challenge, relationship nudge, personalized greeting |
| `money-light.png` | 💰 Money | Balance $2,450, income/spent summary, quick add amounts ($5-$50), budget left $420, recent activity, Travel Fund savings goal |
| `life-light.png` | 🌿 Life | Mood emoji check-in (3-day streak), habit checklist (2/5), stress level slider (4/10), sleep card (7h 20m) |
| `day-light.png` | ☀️ Day | Top 3 priorities with checkboxes, Pomodoro timer (32:00), Quick List, Tonight planner |
| `people-light.png` | ❤️ People | Reach-out nudge (Mom, 4 days), contact list with status dots, upcoming birthday with gift idea |
| `quick-action.png` | + Add | Bottom sheet with 6 action grid (Log expense, Check in mood, Tick a habit, Add priority, Log sleep, Log a chat) + voice/text input |

### Dark Mode (`v3-daily-companion/dark/`)

| File | Screen | Description |
|------|--------|-------------|
| `home-dark.png` | 🏠 Home | Warm dark (#1C1917), score ring, domain bars, Spark, relationship nudge |
| `money-dark.png` | 💰 Money | Dark elevated cards, balance, quick add, activity list, savings goal |
| `life-dark.png` | 🌿 Life | Habits ring (2/5), mood, sleep, stress. Cozy dark wellness feel |
| `day-dark.png` | ☀️ Day | Priorities, Pomodoro circle timer, Quick List, Tonight planner |
| `people-dark.png` | ❤️ People | Soft rose nudge card, contacts with last-talked, birthday card |

## Design System

| Token | Value |
|-------|-------|
| **Primary** | `#6EE7B7` (soft mint) |
| **Secondary** | `#FCD34D` (warm sand) |
| **Tertiary** | `#FCA5A5` (soft rose) |
| **Neutral** | `#E2E8F0` (cool slate) |
| **Background Light** | `#FAFAF9` (warm off-white) |
| **Background Dark** | `#1C1917` (warm dark) |
| **Headline Font** | Literata (warm serif) |
| **Body Font** | DM Sans (clean sans-serif) |
| **Number Font** | Roboto Mono (monospace for amounts/scores) |
| **Corner Radius** | 12px |
| **Color Mode** | Light (default) + Dark |

### Color-as-Data

| State | Color | Meaning |
|-------|-------|---------|
| Healthy | Soft Mint `#6EE7B7` | On track |
| Caution | Warm Sand `#FCD34D` | Needs attention |
| Tight | Soft Rose `#FCA5A5` | Falling behind |

## Tab Bar

5 tabs + center raised floating add button:

```
              [+ ADD] ← raised above tab bar, floating (~56px mint circle)
                 |
[🏠 Home] [💰 Money] [🌿 Life] [☀️ Day] [❤️ People]
```

The "+" is NOT a tab — it's a standalone floating action button. Opens a context-aware quick-action bottom sheet.

## Legacy References

### `final-reference/` — Finance-Only Version

These were designed for the previous 3-screen finance-only version. Kept for component styling and typography reference only — layouts are outdated.

Generated via Stitch projects `238989896427880178` (mobile) and `2633854475307476228` (web).

### `pegs/` — Inspiration

Mood references, phone bezel mockups, and dark mode exploration from earlier iterations.

## Key Design Principles

1. **10-Second Rule** — every core action must complete in under 10 seconds
2. **One thumb rule** — every daily action reachable with one thumb
3. **No empty screens** — pre-fill from onboarding, show personality in empty states
4. **Give before take** — clawdi gives value before asking for input
5. **Color communicates** — domain health visible at a glance via color
6. **No onboarding tutorial** — the UI must be self-explanatory
7. **Accessibility** — minimum 44x44pt touch targets, high contrast text
8. **3-Screen Max** — each tab has max 3 screens
9. **Peaceful, not clinical** — warm backgrounds, soft shadows, serif headlines, breathing room
