# Tab Bar: Liquid Glass (iOS 26+) / Custom FAB (Android + iOS < 26) Design

**Date:** 2026-04-16
**Branch:** `docs/sprint-design-specs`
**Status:** Approved

---

## Overview

Replace the current single-platform `CustomTabBar` with a version-aware implementation:

- **iOS 26+**: Native `NativeTabs` from `expo-router/unstable-native-tabs` with `systemUltraThinMaterial` blur — renders Apple's liquid glass material.
- **iOS < 26 + Android**: Existing `CustomTabBar` component unchanged (floating FAB, Phosphor icons, Tailwind styling).

The decision is made at runtime via a `isLiquidGlass` boolean:

```ts
const isLiquidGlass =
  Platform.OS === "ios" && parseInt(Platform.Version as string, 10) >= 26;
```

---

## iOS 26+ — NativeTabs (Liquid Glass)

### Tab structure

5 tab triggers in order: **Home · Finance · + · Day · Life**

| Tab | SF Symbol (normal) | SF Symbol (selected) | Navigates |
|---|---|---|---|
| Home | `house` | `house.fill` | `home` screen |
| Finance | `dollarsign.circle` | `dollarsign.circle.fill` | `money` screen |
| + (action) | `plus.circle` | `plus.circle.fill` | — (opens sheet) |
| Day | `sun.max` | `sun.max.fill` | `day` screen |
| Life | `leaf` | `leaf.fill` | `life` screen |

### NativeTabs props

```tsx
<NativeTabs
  blurEffect="systemUltraThinMaterial"
  backgroundColor="transparent"
  minimizeBehavior="onScrollDown"
>
```

- `blurEffect="systemUltraThinMaterial"` — thinnest system material; renders as liquid glass on iOS 26.
- `backgroundColor="transparent"` — required for the blur to render through.
- `minimizeBehavior="onScrollDown"` — tab bar collapses when user scrolls down (iOS 26+).

### Action tab ("+") — QuickActionSheet trigger

The `+` tab uses `href: null` so Expo Router does not navigate when pressed. An `onPress` handler calls `useQuickActionStore.getState().toggle()` to open `QuickActionSheet`.

```tsx
<NativeTabs.Trigger
  name="action"
  href={null}
  options={{
    title: "",
    tabBarIcon: ({ focused }) => ({
      sfSymbol: focused ? "plus.circle.fill" : "plus.circle",
    }),
  }}
  onPress={() => useQuickActionStore.getState().toggle()}
/>
```

A `NativeTabs.Slot` for `"action"` renders an empty `<View />` — never visible to the user.

### Hidden screens

`people`, `settings`, and `more` keep `href: null` — inaccessible from the tab bar, reachable only via `router.push`.

---

## iOS < 26 + Android — CustomTabBar (unchanged)

The existing `CustomTabBar` component (floating FAB, Phosphor icons, Tailwind) is used on all non-iOS-26 devices without modification. This ensures feature parity and visual consistency across the majority of devices.

---

## Layout file (`_layout.tsx`) — platform decision

```
isLiquidGlass (iOS 26+)
  → render NativeTabs tree (5 triggers + hidden screens)
  → QuickActionSheet + SettingsSheet as siblings

!isLiquidGlass (iOS < 26 or Android)
  → render Tabs with tabBar={CustomTabBar} (current implementation)
  → QuickActionSheet + SettingsSheet as siblings (unchanged)
```

Both branches share the same hidden screens (`people`, `settings`, `more` with `href: null`).

---

## Out of Scope

- Animated tab transitions or spring physics
- Custom liquid glass tint colors (use system default)
- Badge counts on tab items
- Android material tab bar changes
