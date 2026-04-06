import { useEffect, useState } from "react";
import { useSystemTheme } from "@/hooks/useCustomTheme";
import { Redirect } from "expo-router";
import { useUserStore } from "@/stores/useUserStore";

export default function Index() {
  useSystemTheme();
  const [isHydrated, setIsHydrated] = useState(false);
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    // Wait for zustand persist to hydrate from async storage
    const unsub = useUserStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If already hydrated (hot reload), set immediately
    if (useUserStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return unsub;
  }, []);

  // Don't redirect until store is hydrated
  if (!isHydrated) return null;

  if (hasCompletedOnboarding) {
    return <Redirect href="/(main)/(tabs)/home" />;
  }

  return <Redirect href="/(main)/onboarding" />;
}
