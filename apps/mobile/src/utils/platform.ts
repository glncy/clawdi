import { Platform } from "react-native";

/**
 * True on iOS 26+ — enables liquid glass tab bar and Apple AI provider.
 * Evaluated once at module load; does not change at runtime.
 */
export const isLiquidGlass =
  Platform.OS === "ios" && parseInt(Platform.Version as string, 10) >= 26;

/** Fallback when the --color-primary CSS variable hasn't resolved yet. */
export const DEFAULT_PRIMARY_COLOR = "#4ae2ac";
