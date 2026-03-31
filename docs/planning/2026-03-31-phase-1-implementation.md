# Implementation Plan: Phase 1 MVP — 7-Day Ship

## Tech Stack

| Component | Package | Purpose |
|-----------|---------|---------|
| Database | `expo-sqlite` + `drizzle-orm` | Local-first storage with type-safe schemas |
| Local LLM | `llama.rn` + Qwen 2.5 0.5B Q4_K_M | On-device transaction parsing |
| Voice STT | `@jamsch/expo-speech-recognition` | Offline speech-to-text |
| Icons | `phosphor-react-native` | Replace lucide-react-native |
| Notifications | `expo-notifications` | Local reminders and alerts |
| Device Info | `expo-device` | RAM check for LLM capability |
| State | `zustand` | Global state management |
| Styling | `uniwind` + HeroUI Native | Tailwind-style + component library |

## Screen Architecture

3 screens + 1 input modal. Daily usage = 1 screen + 1 modal.

| Screen | Contents |
|--------|----------|
| **Home** | Safe to Spend hero number, color-as-data background (green→amber→red), Bill Countdown list, floating input FAB |
| **History** | Transaction list + recurring bills (tabbed or segmented control), swipe to edit/delete |
| **Settings** | Premium status, notification preferences, export data, delete data, theme toggle, AI provider info |
| **Input Modal** | Bottom sheet overlay from any screen. Text field + voice button → AI parse → confirmation card → save |

## Day-by-Day Breakdown

### Day 1–2: Data Layer + Core Infrastructure

- [ ] Install and configure `drizzle-orm` with `expo-sqlite` driver
- [ ] Define Drizzle schemas:
  - `transactions`: id, amount, currency, item, category, date, createdAt, updatedAt
  - `recurrences`: id, name, amount, currency, category, frequency, nextDueDate, createdAt
  - `metadata`: key-value store (trialStartDate, balance, preferences)
- [ ] Set up Drizzle migrations
- [ ] Implement Safe to Spend calculation engine:
  - `safeToSpend = (currentBalance - sumUpcomingBills30Days) / daysRemaining`
- [ ] Multi-currency support (store currency code per transaction, display in user's preferred currency)
- [ ] Device capability detection:
  - `expo-device` → `Device.totalMemory`
  - If `>= 4GB` → enable local LLM
  - If `< 4GB` → default to structured manual input
- [ ] Install `phosphor-react-native`, remove `lucide-react-native`

### Day 3–4: AI Parsing + Voice

- [ ] Install and configure `llama.rn` with Expo config plugin
- [ ] Implement model download manager:
  - Background download of Qwen 2.5 0.5B Q4_K_M (~491MB) on first launch
  - Download progress UI
  - Store model in app's document directory
  - Skip download if device < 4GB RAM
- [ ] Define JSON schema for transaction parsing output:
  ```json
  {
    "item": "string",
    "amount": "number",
    "currency": "string (ISO 4217)",
    "category": "string",
    "date": "string (ISO 8601)"
  }
  ```
- [ ] Implement grammar-constrained decoding with the JSON schema
- [ ] Build parsing service with system prompt for financial transaction extraction
- [ ] Install and configure `@jamsch/expo-speech-recognition`:
  - Enable `requiresOnDeviceRecognition: true` for offline mode
  - Wire up start/stop/result handlers
- [ ] Build parsing confirmation UI:
  - Show parsed fields (item, amount, currency, category, date)
  - Allow user to edit any field before saving
  - Save to SQLite via Drizzle
- [ ] Build structured manual input fallback:
  - Simple form: amount, description, currency picker, category picker, date picker
  - Used when LLM not available

### Day 5–6: UI Screens

- [ ] **Home Screen:**
  - Safe to Spend hero number (large, centered)
  - Color-as-data background: compute health ratio → map to green/amber/red gradient
  - Bill Countdown section: list upcoming bills with days-until and affordability context
  - Floating Action Button (FAB) for input modal
- [ ] **Input Bottom Sheet Modal:**
  - Text input field with placeholder "What did you spend?"
  - Voice input button (mic icon) → triggers STT → populates text field
  - Submit → run through parsing chain → show confirmation card
  - Confirmation card: editable parsed fields → save button
- [ ] **History Screen:**
  - Tabbed/segmented: "Transactions" | "Recurring"
  - Transaction list: item, amount, currency, category, date — sorted by date desc
  - Recurring bills list: name, amount, frequency, next due date
  - Swipe actions: edit, delete
- [ ] **Settings Screen:**
  - Premium status & trial countdown
  - Notification preferences (toggle each type, set schedules)
  - Export Everything button (CSV/JSON)
  - Delete Everything button (with single confirmation)
  - Theme toggle (light/dark)
  - AI status indicator (LLM downloaded / downloading / not available)

### Day 7: Polish + Distribution

- [ ] **30-Day Trial Tracking:**
  - Store `trialStartDate` in metadata table on first launch
  - Calculate remaining trial days
  - Show trial status in Settings
  - Gate premium features after trial expiry
- [ ] **Export Everything:**
  - Generate CSV file from all transactions and recurrences
  - Generate JSON file with complete database dump
  - Share via system share sheet
- [ ] **Delete Everything:**
  - Single confirmation ("This will permanently delete all your data")
  - Drop all data from SQLite tables
  - Reset metadata
  - Return to fresh state
- [ ] **Local Notifications Setup (expo-notifications):**
  - Request notification permissions on first launch
  - Daily Safe to Spend reminder (configurable time, default 8:00 AM)
  - Bill countdown alerts (3 days, 1 day before due)
  - Hourly expense input reminders ("Any expenses to log?" — configurable interval)
  - Finance tips (weekly rotation from curated list)
  - All toggleable in Settings with custom schedules
- [ ] **App Store / Play Store Config:**
  - App icons and splash screen
  - App Store metadata (description, screenshots, keywords)
  - Bundle ID: `me.ttap.clawdi`
- [ ] **IAP Setup:**
  - Configure one-time purchase product in App Store Connect and Google Play Console
  - Implement purchase flow and receipt validation
  - Unlock premium features on successful purchase
- [ ] **End-to-End Testing:**
  - Voice → STT → LLM parse → confirm → save → see in history
  - Manual input fallback flow
  - Safe to Spend calculation accuracy
  - Export/Delete functionality
  - Notification scheduling
  - Trial tracking
