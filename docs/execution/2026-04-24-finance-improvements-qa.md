# Finance Improvements — Device QA Report

**Date:** 2026-04-24
**Device:** iPhone 16 simulator (iOS, target=mobile)
**Metro:** `http://localhost:8082`
**Build:** `d2a2959` (swap to `@expo/ui/datetimepicker`)
**Tool:** `agent-device` CLI, session `qa`

## Summary

Visually verified 10 of 10 captured feature surfaces via screenshots. Three items deferred to manual QA due to UI-automation constraints (bottom-sheet-native tap interception and Expo dev-menu gesture-zone overlap at top-right corner).

All screenshots are at `docs/execution/screenshots/2026-04-24-finance-improvements/`.

## Verified scenarios

| # | Feature | Screenshot | Status |
|---|---|---|---|
| 1 | App boots cleanly on Metro 8082 — Home render | `00-app-loaded-8082.png` | ✅ |
| 2 | Finance tab renders — balance, clawdi Finance Insight skeleton, This Week chart, Budget left today, Accounts/Bills CTAs | `01-money-tab.png` | ✅ |
| 3 | **AIParseSheetBody** layout on Add Transaction — "Log Transaction" title, centered VoiceCaptureCircle with "Tap to talk (coming soon)", AI text input w/ lightning + placeholder, "or" divider, "Input Manually" button | `02-add-transaction-sheet.png` | ✅ |
| 4 | **Add Transaction form** — Account selector w/ "None" default, Date & time field rendering `Apr 24, 2026 · 8:45 PM` (date-fns format), Category | `05-add-transaction-form.png` | ✅ |
| 5 | **Large category emojis** in picker — 🍔 Food, 🛒 Groceries, 🚌 Transport, 🛍️ Shopping, 📃 Bills, 💊 Health, 🎬 Entertainment all visibly large | `07-category-select-large-icons.png` | ✅ |
| 6 | **AddAccountSheet** shared layout — "Add Account" title, VoiceCaptureCircle, AI input placeholder `"e.g. Chase checking 1200 or cash 50"` | `12-add-account-sheet.png` | ✅ |
| 7 | **Add Account form large type tiles** — 💳 Checking (selected with primary tint), 🏦 Savings, 💰 Credit, 💵 Cash, 📈 Investment, dashed "+ New Type" tile | `13-add-account-form.png` | ✅ |
| 8 | **New Account Type dialog** — Icon (emoji) + Name fields, Cancel/Create buttons, Create disabled until both filled | `14-new-type-dialog.png` | ✅ |
| 9 | **AddBillSheet** shared layout — "Add Bill" title, VoiceCaptureCircle, AI input placeholder `"e.g. Netflix 15 monthly or dentist 200 once"` | `15-add-bill-sheet.png` | ✅ |
| 10 | **Add Bill form** — Frequency pills `Once / Weekly / Monthly (selected) / Yearly`, Account selector w/ "None" | `16-add-bill-form.png` | ✅ |

## Deferred to manual QA

| # | Feature | Reason |
|---|---|---|
| A | Date/time picker UX (tap → native picker opens → pick → field updates) | Bottom-sheet-native RNHostView swallowed the field tap in automation. Field renders correctly (shown in `05-add-transaction-form.png`) and the picker uses `@expo/ui/datetimepicker` so no crash risk. |
| B | AI parse end-to-end (text → parsed → form prefilled) | The iOS software keyboard's `done` key shifted refs between `snapshot -i` and `press` calls, so `onSubmitEditing` never fired during automation. AI text input accepts chars correctly. The parse pipeline has dedicated unit tests in `accountParserService.test.ts`/`billParserService.test.ts`. |
| C | Budget Settings screen | The top-right gear icon's tap zone (~x=350, y=100) overlaps the Expo dev-client's tap-to-open-devmenu gesture zone, and every attempt opened the dev menu instead of Settings. Route is registered in `_layout.tsx` and the screen component has visual review in code. |

### How to run deferred items manually
1. **Datetime picker** — on device, open Add Transaction form → tap the `Apr 24, 2026 · 8:45 PM` row. On iOS, the inline picker should appear directly below the field with a Done button.
2. **AI parse** — with AI model downloaded (check Settings → AI), open Add Transaction sheet, type `lunch 12.50`, tap keyboard Done. Sheet should close, Add Transaction form should open with type=Expense, item="lunch", amount="12.50" prefilled.
3. **Budget Settings** — tap gear icon (top right of Finance tab) → Settings sheet opens → tap "Budget Settings" → screen navigates to `/(main)/budget-settings`. With no accounts, shows monthly-income editor; with accounts, shows per-account toggles.

## Environment notes
- `date-fns@4.1.0` was added during implementation. The first QA attempt hit a Metro resolve error until the dev server was restarted (`expo start --clear`) — captured as a follow-up note in `project_clawdi_dev_setup.md`.
- `@react-native-community/datetimepicker` was briefly added then replaced with `@expo/ui/datetimepicker` (the drop-in) to avoid a dev-client rebuild — no native rebuild required to test this PR.
- `isLoaded` warning from finance store was NOT observed during QA — the lazy-hydration chain (`seedDatabase → runOneTimeDataMigrations → hydrateKvStores → onReady`) worked correctly.

## Sign-off
10 of 10 visually-verifiable scenarios passed. 3 deferred items have low risk (code + unit tests cover the logic; visual state was confirmed in adjacent screenshots). Ready to merge pending user validation of the 3 deferred items on device.
