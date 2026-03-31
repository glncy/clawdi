# ADR 013: AI-First Minimalist Architecture

## Status

Accepted

## Context

The app needs to be unique and transparent in a crowded finance app market. Most finance apps rely on cloud sync, third-party bank aggregators, subscription pricing, and complex multi-screen UIs. Users report broken bank connections, privacy violations, overwhelming complexity, guilt-driven design, and subscription fatigue as their top pain points.

Clawdi's competitive position: open-source, local-only, AI-powered, hyper-minimalist, one-time purchase.

## Decision

We will use a **Local-First, AI-Centric, Minimalist** architecture with the following pillars:

### 1. Local-First Data

All financial records stay in a local SQLite database on the device.

- **ORM:** Drizzle ORM with expo-sqlite driver for type-safe schemas and migrations
- **Schemas:** Transactions, Recurrences, Metadata (key-value)
- **Sync:** None. Zero cloud sync for financial data. Data ownership via Export (CSV/JSON) and Delete Everything.
- **Rationale:** Maximum privacy. Open-source code proves no data leaves the device.

### 2. AI-Centric Input

Interaction is conversational rather than form-based.

- **Local LLM:** `llama.rn` wrapping llama.cpp with Qwen 2.5 0.5B Instruct (Q4_K_M, ~491MB)
- **Grammar-Constrained Decoding:** JSON schema enforced at the decoding level — the model is forced to output valid structured JSON matching our transaction schema. This dramatically improves reliability even with small models.
- **Voice:** `@jamsch/expo-speech-recognition` using native platform STT engines. Works offline via `requiresOnDeviceRecognition: true`.
- **Rationale:** Natural language input removes friction. Grammar constraints solve the "unreliable AI output" problem. Native STT means zero model download for voice.

### 3. Parsing Chain

```
Voice 🎤 → Device STT (offline, native) → Text
                                              ↓
Text Input ⌨️ ──────────────────────────→ Local LLM (Qwen 0.5B)
                                              ↓
                                    Grammar-constrained JSON
                                              ↓
                          { item, amount, currency, category, date }
                                              ↓
                                   User confirms → Drizzle → SQLite
```

### 4. Fallback Chain

```
Phase 1:  Local LLM → Structured Manual Input (forms)
Phase 1.5: Local LLM → Remote LLM (user API key) → Structured Manual Input
```

- **Device capability detection:** `expo-device` checks `Device.totalMemory`. If < 4GB RAM, skip LLM loading entirely and default to structured input.
- **Model download:** Background download on first launch. App is immediately usable with structured input while model downloads.
- **Rationale:** Every user gets a working app from second one. AI enhances but never blocks.

### 5. Forecasting-Led

The primary metric is forward-looking ("Safe to Spend") rather than backward-looking (charts/graphs).

- **Formula:** `(Current Balance - Sum of Upcoming Bills in 30 days) / Days Remaining`
- **Color-as-Data:** Background color maps to financial health state (green → amber → red). A child doesn't need to read numbers to understand "green = good."
- **Rationale:** Users say "just tell me what I can safely spend today." That's the entire hero screen.

### 6. Hyper-Minimalist UI

3 screens + 1 input modal. Daily usage is 1 screen + 1 modal.

| Screen | Purpose |
|--------|---------|
| Home | Financial pulse (forward-looking) |
| History | Financial past (backward-looking) |
| Settings | Control panel (rarely visited) |
| Input Modal | Bottom sheet action — not a screen |

- **"One Thumb" Rule:** Every daily action reachable with one thumb on a phone held in one hand.
- **No onboarding:** App must be intuitive enough for a child or older adult without explanation.
- **Rationale:** Fewer screens is the competitive moat. Every competitor adds screens over time. Clawdi goes the opposite direction.

### 7. Notification System

Local notifications via `expo-notifications` for proactive engagement:

- Daily Safe to Spend reminder (morning)
- Bill countdown alerts (X days before due)
- Hourly expense input reminders (customizable interval)
- Periodic finance tips
- All fully customizable by the user in Settings

### 8. Icons & Design

- **Phosphor Icons** (`phosphor-react-native`) — clean, consistent, minimalist style
- **HeroUI Native** — component library
- **Uniwind** — Tailwind CSS for React Native
- **No Lucide** — removed in favor of Phosphor

## Tech Stack Summary

| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | React Native (Expo 55) | Cross-platform, single codebase |
| Database | expo-sqlite + Drizzle ORM | Type-safe local-first storage |
| Local LLM | llama.rn + Qwen 2.5 0.5B | On-device parsing, grammar constraints |
| Voice | @jamsch/expo-speech-recognition | Native offline STT, zero download |
| Icons | phosphor-react-native | Clean minimalist design |
| Notifications | expo-notifications | Local reminders and alerts |
| State | Zustand | Lightweight, no boilerplate |
| Styling | Uniwind + HeroUI Native | Tailwind ergonomics + component library |
| Device | expo-device | RAM check for LLM capability |
| Build | Fastlane + GitHub Actions | Production CI/CD pipeline |

## Consequences

### Pros

- Maximum privacy — verifiable via open-source code
- Offline-capable — no internet required for core functionality
- High transparency — Audit Mode shows exactly what's stored
- Low friction entry — speak or type naturally
- Reliable AI output — grammar constraints guarantee valid JSON
- Instant value — app works before model downloads
- Cross-platform — iOS and Android from single codebase
- No vendor lock-in — data exportable, app open-source

### Cons

- No cross-device sync without manual export/import
- Local LLM requires ~491MB download and 4GB+ RAM
- Small model may occasionally misparse complex inputs
- No bank connection means all entries are manual

### Mitigations

- Structured manual input fallback for low-spec devices
- Grammar constraints dramatically improve small model reliability
- Voice input reduces manual entry friction
- Future Phase 1.5: remote LLM opt-in for better parsing (user provides API key)
- Future: custom React Native package wrapping VibeVoice-ASR for improved on-device STT
