# Tab Bar Liquid Glass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-platform `CustomTabBar` with a version-aware tab bar: NativeTabs with liquid glass on iOS 26+, existing CustomTabBar on everything else.

**Architecture:** A `isLiquidGlass` boolean (evaluated at module load time) gates two completely separate JSX trees in `_layout.tsx`. iOS 26+ renders `NativeTabs` with 5 SF Symbol triggers; all other platforms render the unchanged `Tabs + CustomTabBar`. The "+" action tab uses `href={null}` + `onPress` to open `QuickActionSheet` without navigating. A thin `action.tsx` fallback screen handles the edge case where the tab activates anyway.

**Tech Stack:** `expo-router/unstable-native-tabs` (NativeTabs), React Native Platform API, Zustand (useQuickActionStore), existing CustomTabBar / QuickActionSheet / SettingsSheet.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `apps/mobile/src/app/(main)/(tabs)/action.tsx` | Empty fallback screen for the action tab — opens sheet and goes back |
| Modify | `apps/mobile/src/stores/useQuickActionStore.ts` | Add `open()` action alongside `toggle()` and `close()` |
| Modify | `apps/mobile/src/app/(main)/(tabs)/_layout.tsx` | Platform-conditional NativeTabs vs Tabs+CustomTabBar |

---

## Task 1: Add `open()` to QuickActionStore

**Files:**
- Modify: `apps/mobile/src/stores/useQuickActionStore.ts`

Current state: store has `isOpen`, `toggle()`, `close()`. The action tab needs an explicit `open()` (not toggle) so that pressing the action tab always opens the sheet regardless of its current state.

- [ ] **Step 1: Open the store file and read it**

  Path: `apps/mobile/src/stores/useQuickActionStore.ts`

  Current content:
  ```typescript
  import { create } from "zustand";

  interface QuickActionState {
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
  }

  export const useQuickActionStore = create<QuickActionState>((set) => ({
    isOpen: false,
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    close: () => set({ isOpen: false }),
  }));
  ```

- [ ] **Step 2: Add `open()` to the interface and implementation**

  Replace the file content with:
  ```typescript
  import { create } from "zustand";

  interface QuickActionState {
    isOpen: boolean;
    open: () => void;
    toggle: () => void;
    close: () => void;
  }

  export const useQuickActionStore = create<QuickActionState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    close: () => set({ isOpen: false }),
  }));
  ```

- [ ] **Step 3: Verify TypeScript is satisfied**

  Run from the monorepo root:
  ```bash
  cd apps/mobile && npx tsc --noEmit 2>&1 | head -30
  ```
  Expected: no errors referencing `useQuickActionStore`.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/mobile/src/stores/useQuickActionStore.ts
  git commit -m "feat(store): add open() to useQuickActionStore"
  ```

---

## Task 2: Create `action.tsx` Fallback Screen

**Files:**
- Create: `apps/mobile/src/app/(main)/(tabs)/action.tsx`

On iOS 26+, the action `NativeTabs.Trigger` uses `href={null}` which should prevent routing. This screen is a safety net — if Expo Router activates it anyway, it immediately opens the sheet and calls `router.back()`.

- [ ] **Step 1: Create the file**

  ```tsx
  // apps/mobile/src/app/(main)/(tabs)/action.tsx
  import { useEffect } from "react";
  import { View } from "react-native";
  import { router } from "expo-router";
  import { useQuickActionStore } from "@/stores/useQuickActionStore";

  /**
   * Fallback screen for the action tab.
   * The NativeTabs trigger uses href={null} so this screen should never
   * activate. If it does (e.g., during development), it opens the sheet
   * and navigates back immediately.
   */
  export default function ActionScreen() {
    useEffect(() => {
      useQuickActionStore.getState().open();
      router.back();
    }, []);

    return <View />;
  }
  ```

- [ ] **Step 2: Verify TypeScript is satisfied**

  ```bash
  cd apps/mobile && npx tsc --noEmit 2>&1 | head -30
  ```
  Expected: no errors referencing `action.tsx`.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/mobile/src/app/(main)/(tabs)/action.tsx
  git commit -m "feat(tabs): add action.tsx fallback screen for NativeTabs action trigger"
  ```

---

## Task 3: Rewrite `_layout.tsx` with Platform-Conditional Tab Bars

**Files:**
- Modify: `apps/mobile/src/app/(main)/(tabs)/_layout.tsx`

This is the main task. The layout detects `isLiquidGlass` at module scope and conditionally renders either `NativeTabs` (iOS 26+) or the existing `Tabs + CustomTabBar` (everything else).

### What the current file looks like

```tsx
import { Tabs, Stack } from "expo-router";
import { View } from "react-native";
import { CustomTabBar } from "@/components/organisms/CustomTabBar";
import { QuickActionSheet } from "@/components/organisms/QuickActionSheet";
import { SettingsSheet } from "@/components/organisms/SettingsSheet";
import { useSystemTheme } from "@/hooks/useCustomTheme";

export default function TabLayout() {
  useSystemTheme();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="money" />
          <Tabs.Screen name="day" />
          <Tabs.Screen name="life" />
          <Tabs.Screen name="people" options={{ href: null }} />
          <Tabs.Screen name="settings" options={{ href: null }} />
          <Tabs.Screen name="more" options={{ href: null }} />
        </Tabs>
        <QuickActionSheet />
        <SettingsSheet />
      </View>
    </>
  );
}
```

- [ ] **Step 1: Replace `_layout.tsx` with the new platform-conditional version**

  Write the full file:
  ```tsx
  // apps/mobile/src/app/(main)/(tabs)/_layout.tsx
  import { Platform } from "react-native";
  import { Tabs, Stack } from "expo-router";
  import { NativeTabs } from "expo-router/unstable-native-tabs";
  import { View } from "react-native";
  import { CustomTabBar } from "@/components/organisms/CustomTabBar";
  import { QuickActionSheet } from "@/components/organisms/QuickActionSheet";
  import { SettingsSheet } from "@/components/organisms/SettingsSheet";
  import { useSystemTheme } from "@/hooks/useCustomTheme";
  import { useQuickActionStore } from "@/stores/useQuickActionStore";

  /**
   * True on iOS 26+ — renders native liquid glass tab bar.
   * False on iOS < 26 and Android — renders custom floating FAB tab bar.
   */
  const isLiquidGlass =
    Platform.OS === "ios" && parseInt(Platform.Version as string, 10) >= 26;

  export default function TabLayout() {
    useSystemTheme();

    if (isLiquidGlass) {
      return (
        <>
          <Stack.Screen options={{ headerShown: false }} />
          <NativeTabs
            blurEffect="systemUltraThinMaterial"
            backgroundColor="transparent"
            minimizeBehavior="onScrollDown"
          >
            <NativeTabs.Trigger
              name="home"
              href="home"
              options={{
                title: "Home",
                tabBarIcon: ({ focused }: { focused: boolean }) => ({
                  sfSymbol: focused ? "house.fill" : "house",
                }),
              }}
            />
            <NativeTabs.Trigger
              name="money"
              href="money"
              options={{
                title: "Finance",
                tabBarIcon: ({ focused }: { focused: boolean }) => ({
                  sfSymbol: focused
                    ? "dollarsign.circle.fill"
                    : "dollarsign.circle",
                }),
              }}
            />
            <NativeTabs.Trigger
              name="action"
              href={null}
              options={{
                title: "",
                tabBarIcon: ({ focused }: { focused: boolean }) => ({
                  sfSymbol: focused ? "plus.circle.fill" : "plus.circle",
                }),
              }}
              onPress={() => useQuickActionStore.getState().open()}
            />
            <NativeTabs.Trigger
              name="day"
              href="day"
              options={{
                title: "Day",
                tabBarIcon: ({ focused }: { focused: boolean }) => ({
                  sfSymbol: focused ? "sun.max.fill" : "sun.max",
                }),
              }}
            />
            <NativeTabs.Trigger
              name="life"
              href="life"
              options={{
                title: "Life",
                tabBarIcon: ({ focused }: { focused: boolean }) => ({
                  sfSymbol: focused ? "leaf.fill" : "leaf",
                }),
              }}
            />
            {/* Hidden screens — reachable only via router.push, not from tab bar */}
            <NativeTabs.Trigger name="people" href={null} />
            <NativeTabs.Trigger name="settings" href={null} />
            <NativeTabs.Trigger name="more" href={null} />
            <NativeTabs.Trigger name="action" href={null} />
          </NativeTabs>
          <QuickActionSheet />
          <SettingsSheet />
        </>
      );
    }

    // iOS < 26 and Android — unchanged floating FAB tab bar
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-background">
          <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
          >
            <Tabs.Screen name="home" />
            <Tabs.Screen name="money" />
            <Tabs.Screen name="day" />
            <Tabs.Screen name="life" />
            {/* Hidden from tab bar, accessible via router.push */}
            <Tabs.Screen name="people" options={{ href: null }} />
            <Tabs.Screen name="settings" options={{ href: null }} />
            <Tabs.Screen name="more" options={{ href: null }} />
          </Tabs>
          <QuickActionSheet />
          <SettingsSheet />
        </View>
      </>
    );
  }
  ```

  > **Note:** The `action` trigger appears twice above — once with the `onPress` handler, once in the hidden group. Remove the duplicate hidden entry. The trigger with `href={null}` and `onPress` IS the hidden/no-navigate entry. Final correct version:
  >
  > ```tsx
  > <NativeTabs.Trigger
  >   name="action"
  >   href={null}
  >   options={{
  >     title: "",
  >     tabBarIcon: ({ focused }: { focused: boolean }) => ({
  >       sfSymbol: focused ? "plus.circle.fill" : "plus.circle",
  >     }),
  >   }}
  >   onPress={() => useQuickActionStore.getState().open()}
  > />
  > {/* Hidden screens — reachable only via router.push */}
  > <NativeTabs.Trigger name="people" href={null} />
  > <NativeTabs.Trigger name="settings" href={null} />
  > <NativeTabs.Trigger name="more" href={null} />
  > ```

- [ ] **Step 2: Fix the duplicate — write the corrected file**

  The correct final `_layout.tsx` (no duplicate action trigger):

  ```tsx
  // apps/mobile/src/app/(main)/(tabs)/_layout.tsx
  import { Platform } from "react-native";
  import { Tabs, Stack } from "expo-router";
  import { NativeTabs } from "expo-router/unstable-native-tabs";
  import { View } from "react-native";
  import { CustomTabBar } from "@/components/organisms/CustomTabBar";
  import { QuickActionSheet } from "@/components/organisms/QuickActionSheet";
  import { SettingsSheet } from "@/components/organisms/SettingsSheet";
  import { useSystemTheme } from "@/hooks/useCustomTheme";
  import { useQuickActionStore } from "@/stores/useQuickActionStore";

  /**
   * True on iOS 26+ — renders native liquid glass tab bar.
   * False on iOS < 26 and Android — renders custom floating FAB tab bar.
   */
  const isLiquidGlass =
    Platform.OS === "ios" && parseInt(Platform.Version as string, 10) >= 26;

  export default function TabLayout() {
    useSystemTheme();

    if (isLiquidGlass) {
      return (
        <>
          <Stack.Screen options={{ headerShown: false }} />
          <NativeTabs
            blurEffect="systemUltraThinMaterial"
            backgroundColor="transparent"
            minimizeBehavior="onScrollDown"
          >
            <NativeTabs.Trigger
              name="home"
              href="home"
              options={{
                title: "Home",
                tabBarIcon: ({ focused }: { focused: boolean }) => ({
                  sfSymbol: focused ? "house.fill" : "house",
                }),
              }}
            />
            <NativeTabs.Trigger
              name="money"
              href="money"
              options={{
                title: "Finance",
                tabBarIcon: ({ focused }: { focused: boolean }) => ({
                  sfSymbol: focused
                    ? "dollarsign.circle.fill"
                    : "dollarsign.circle",
                }),
              }}
            />
            <NativeTabs.Trigger
              name="action"
              href={null}
              options={{
                title: "",
                tabBarIcon: ({ focused }: { focused: boolean }) => ({
                  sfSymbol: focused ? "plus.circle.fill" : "plus.circle",
                }),
              }}
              onPress={() => useQuickActionStore.getState().open()}
            />
            <NativeTabs.Trigger
              name="day"
              href="day"
              options={{
                title: "Day",
                tabBarIcon: ({ focused }: { focused: boolean }) => ({
                  sfSymbol: focused ? "sun.max.fill" : "sun.max",
                }),
              }}
            />
            <NativeTabs.Trigger
              name="life"
              href="life"
              options={{
                title: "Life",
                tabBarIcon: ({ focused }: { focused: boolean }) => ({
                  sfSymbol: focused ? "leaf.fill" : "leaf",
                }),
              }}
            />
            {/* Hidden screens — reachable only via router.push, not shown in tab bar */}
            <NativeTabs.Trigger name="people" href={null} />
            <NativeTabs.Trigger name="settings" href={null} />
            <NativeTabs.Trigger name="more" href={null} />
          </NativeTabs>
          <QuickActionSheet />
          <SettingsSheet />
        </>
      );
    }

    // iOS < 26 and Android — unchanged floating FAB tab bar
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-background">
          <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
          >
            <Tabs.Screen name="home" />
            <Tabs.Screen name="money" />
            <Tabs.Screen name="day" />
            <Tabs.Screen name="life" />
            {/* Hidden from tab bar, accessible via router.push */}
            <Tabs.Screen name="people" options={{ href: null }} />
            <Tabs.Screen name="settings" options={{ href: null }} />
            <Tabs.Screen name="more" options={{ href: null }} />
          </Tabs>
          <QuickActionSheet />
          <SettingsSheet />
        </View>
      </>
    );
  }
  ```

- [ ] **Step 3: TypeScript check**

  ```bash
  cd apps/mobile && npx tsc --noEmit 2>&1 | head -50
  ```

  If you see `Cannot find module 'expo-router/unstable-native-tabs'`, the package is already a dev dependency — check `apps/mobile/package.json` for `expo-router`. The `unstable-native-tabs` export ships as part of `expo-router` (no separate install needed). If you see type errors on `NativeTabs` props (`blurEffect`, `minimizeBehavior`), those props are part of the unstable API and may require a `// @ts-expect-error` comment or a local `declare module` override — do NOT remove the props, just suppress the TS error.

  For any `// @ts-expect-error` you add, put it on the line ABOVE the prop, with a comment:
  ```tsx
  {/* @ts-expect-error — minimizeBehavior is valid on iOS 26+, types not yet stable */}
  minimizeBehavior="onScrollDown"
  ```

  Actually for JSX props you can't do inline `@ts-expect-error`. Cast the props object instead:
  ```tsx
  <NativeTabs
    {...({
      blurEffect: "systemUltraThinMaterial",
      backgroundColor: "transparent",
      minimizeBehavior: "onScrollDown",
    } as any)}
  >
  ```

  Only do this if TypeScript actually errors on these props. If it compiles cleanly, leave them as-is.

- [ ] **Step 4: Manual smoke test on iOS simulator or device**

  **On iOS < 26 (simulator default):**
  - Launch the app
  - Verify CustomTabBar renders (floating pill with FAB)
  - Verify "+" FAB opens QuickActionSheet
  - Verify navigating Home / Finance / Day / Life works
  - Verify Settings and People are inaccessible from tab bar but accessible via gear icon

  **On iOS 26 device (if available):**
  - Launch the app
  - Verify native tab bar renders with liquid glass blur
  - Verify 5 tabs: Home, Finance, + , Day, Life with correct SF Symbols
  - Tap "+" — QuickActionSheet opens, no navigation occurs
  - Verify tab bar collapses on scroll down (`minimizeBehavior`)
  - Verify Settings and People are not in the tab bar

- [ ] **Step 5: Commit**

  ```bash
  git add apps/mobile/src/app/(main)/(tabs)/_layout.tsx
  git commit -m "feat(tabs): platform-conditional NativeTabs (iOS 26+) / CustomTabBar (iOS < 26, Android)"
  ```

---

## Task 4: Push All Commits

- [ ] **Step 1: Check git log**

  ```bash
  git log --oneline -10
  ```

  You should see at minimum:
  ```
  <sha> feat(tabs): platform-conditional NativeTabs...
  <sha> feat(tabs): add action.tsx fallback screen...
  <sha> feat(store): add open() to useQuickActionStore
  ```

- [ ] **Step 2: Push**

  ```bash
  git push origin feat/mobile-tab-dashboard-finance-redesign
  ```

---

## Known Risks & Notes

**`canPreventDefault: false` on NativeTabs tabPress** — The `screenListeners` tabPress event on NativeTabs cannot prevent default navigation. This is why the action trigger uses `href={null}` (Expo Router never routes it) and `onPress` for the side effect. If `href={null}` is ignored by the native layer on some Expo SDK versions, `action.tsx` serves as the fallback.

**SF Symbol string casing** — iOS SF Symbols are case-sensitive. Use exactly: `house`, `house.fill`, `dollarsign.circle`, `dollarsign.circle.fill`, `plus.circle`, `plus.circle.fill`, `sun.max`, `sun.max.fill`, `leaf`, `leaf.fill`. An invalid symbol name renders as an empty space with no crash.

**`NativeTabs` is unstable API** — `expo-router/unstable-native-tabs` can change between Expo SDK versions. If props error at runtime (not TS), check Expo SDK release notes.

**Hidden screen triggers** — `NativeTabs.Trigger name="people" href={null}` etc. may or may not be necessary. If the app crashes on iOS 26 citing unregistered screens, add these triggers. If the app works without them, they can be removed.
