# AI Provider Strategy Design

**Date:** 2026-04-16  
**Branch:** `docs/sprint-design-specs`  
**Status:** Approved

---

## Overview

Implement a multi-provider AI strategy with user-controlled preference. The app
auto-selects the best available provider on first launch and allows the user to
switch in Settings > AI.

---

## Providers

| Provider | Platform | Condition |
|---|---|---|
| Apple AI | iOS only | `apple.isAvailable()` returns `true` (iOS 26+, Apple Intelligence enabled) |
| Local AI (Gemma) | iOS + Android | Always available after model download (~2.3 GB) |
| Cloud AI (Gemini) | iOS + Android | Available when user stores a Gemini API key |

---

## Provider Selection Logic

### Options shown in Settings > AI

| Option | iOS (Apple AI on) | iOS (Apple AI off) | Android |
|---|---|---|---|
| Apple AI | ✓ | — | — |
| Local AI | ✓ | ✓ | ✓ |
| Cloud AI | ✓ | ✓ | ✓ |

- Apple AI row is hidden entirely when `apple.isAvailable()` is `false`.
- Cloud AI row is always visible but shows an "Add API key" action when no key is stored.

### Default on first launch

- iOS with Apple AI available → `'apple'`
- iOS without Apple AI → `'gemma'`
- Android → `'gemma'`

---

## Data Layer

### `stores/useAIPreferenceStore.ts`

New Zustand store with `@react-native-async-storage/async-storage` persist
middleware. Isolated from inference state (`useAIStore`).

```ts
type AIPreference = 'apple' | 'gemma' | 'gemini'

interface AIPreferenceState {
  preferredProvider: AIPreference
  geminiApiKey: string | null

  setPreferredProvider(p: AIPreference): void
  setGeminiApiKey(key: string | null): void
}
```

Both `preferredProvider` and `geminiApiKey` are persisted via AsyncStorage.
`geminiApiKey` is stored in plain AsyncStorage (not SecureStore) for now;
can be upgraded to SecureStore later without API changes.

---

## Hooks

### `hooks/useAIProvider.ts` (updated)

Reads `preferredProvider` from `useAIPreferenceStore` and `apple.isAvailable()`
(synchronous) to resolve the active provider.

```
Resolution order:
  preferredProvider === 'apple'  → apple.isAvailable() ? 'apple' : 'gemma'
  preferredProvider === 'gemma'  → 'gemma'
  preferredProvider === 'gemini' → geminiApiKey set? 'gemini' : 'gemma'
```

If the preferred provider cannot be used (Apple not available, no Gemini key),
it falls back silently to `'gemma'` — no error state, no user-facing notice.

`isChecking` is `true` only during the AsyncStorage hydration window (< 50 ms).

### `hooks/useAppleAI.ts` (new)

Thin wrapper around `streamText` with `apple()` from `@react-native-ai/apple`.
Exposes the same interface as `useLocalAI` so `useAI` can swap providers
transparently.

| Property | Value |
|---|---|
| `status` | `"ready"` always |
| `isModelDownloaded` | `true` always |
| `isModelLoaded` | `true` always |
| `downloadModel` | no-op |
| `loadModel` | no-op |
| `complete(msg, sys?, filterThinking?)` | `streamText` with `apple()` |
| `completeJSON<T>(msg, sys?)` | same JSON extraction as `useLocalAI` |

No thinking-token filtering needed — Apple Foundation Models do not emit
reasoning blocks.

### `hooks/useGeminiAI.ts` (new)

Wrapper around `generateText` / `streamText` using `@ai-sdk/google` with model
`"gemini-3-flash-preview"`. Same interface as `useLocalAI`.

| Property | Value |
|---|---|
| `status` | `"ready"` when API key present, `"idle"` otherwise |
| `isModelDownloaded` | `true` always (cloud model) |
| `isModelLoaded` | `true` always |
| `complete(msg, sys?, filterThinking?)` | `streamText` with google model |
| `completeJSON<T>(msg, sys?)` | same JSON extraction as `useLocalAI` |

Reads `geminiApiKey` from `useAIPreferenceStore`.

### `hooks/useAI.ts` (updated)

Routes to the resolved provider:

```
provider === 'apple'  → useAppleAI()
provider === 'gemma'  → useLocalAI()
provider === 'gemini' → useGeminiAI()
```

All three return the same interface. Callers (`DailyBriefing`, finance screens,
etc.) are provider-agnostic.

---

## Settings > AI Screen

### Route

New screen at `app/(main)/(tabs)/settings/ai.tsx`.  
The existing "Local AI" row in `settings/index.tsx` is renamed to "AI" and
navigates to this new screen.

### Layout

```
Active provider badge  (Apple AI / Local AI / Cloud AI — what's running now)

Provider section
  [ Apple AI    ]  — hidden if apple.isAvailable() === false
  [ Local AI    ]
  [ Cloud AI    ]  — shows "Add API key" sub-label if no key stored

--- (only visible when Local AI is selected or downloaded) ---
Local AI section
  Model name, file size
  Download / Remove button
  Load / Unload button

--- (only visible when Cloud AI is selected) ---
Cloud AI section
  Gemini API key input (masked)
  Save / Remove key button
  Privacy notice: "Queries are sent to Google servers"
```

Selecting a provider row updates `preferredProvider` immediately. The active
provider badge updates in real time via the store.

---

## Installation

```
bun add @react-native-ai/apple   (in apps/mobile)
npx expo prebuild --clean        (native rebuild required — new TurboModule)
```

The `AppleLLM.podspec` uses `min_ios_version_supported` from the Expo config,
which already meets the requirement.

---

## Out of Scope

- Apple Foundation Models tool calling (future)
- Gemini tool calling / multi-step (future)
- SecureStore upgrade for API key (future)
- RAM eligibility warning for Local AI (future)
