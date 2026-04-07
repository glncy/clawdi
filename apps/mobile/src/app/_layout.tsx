import "../polyfills";
import "../global.css";
import { Stack } from "expo-router";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootProviders } from "../providers/RootProviders";
import { StatusBar } from "expo-status-bar";
import {
  Literata_400Regular,
  Literata_700Bold,
} from "@expo-google-fonts/literata";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  RobotoMono_400Regular,
  RobotoMono_700Bold,
} from "@expo-google-fonts/roboto-mono";
import { useFonts } from "expo-font";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  ActiveColorSchemeProvider,
  useActiveColorScheme,
} from "../providers/ActiveColorSchemeProvider";
import React from "react";
import { AIModelDownloadProvider } from "../providers/AIModelDownloadProvider";
import { DatabaseProvider } from "../providers/DatabaseProvider";

function AppNavigationProvider({ children }: { children: React.ReactNode }) {
  const { activeColorScheme } = useActiveColorScheme();
  const isDark = activeColorScheme === "dark";

  const [
    colorPrimary,
    colorBackground,
    colorSurface,
    colorForeground,
    colorBorder,
    colorDanger,
  ] = useThemeColor([
    "accent",
    "background",
    "surface",
    "foreground",
    "border",
    "danger",
  ]);

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colorPrimary,
      background: colorBackground,
      card: colorSurface,
      text: colorForeground,
      border: colorBorder,
      notification: colorDanger,
    },
    fonts: DefaultTheme.fonts,
  };

  return <ThemeProvider value={navTheme}>{children}</ThemeProvider>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Literata_400Regular,
    Literata_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    RobotoMono_400Regular,
    RobotoMono_700Bold,
  });

  if (!loaded && !error) {
    return null;
  }

  return (
    <RootProviders
      providers={[
        (props) => <GestureHandlerRootView {...props} style={{ flex: 1 }} />,
        (props) => <ActiveColorSchemeProvider {...props} />,
        (props) => <HeroUINativeProvider {...props} />,
        (props) => <DatabaseProvider {...props} />,
        (props) => <KeyboardProvider {...props} />,
        (props) => <AppNavigationProvider {...props} />,
        (props) => <AIModelDownloadProvider {...props} />,
      ]}
    >
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </RootProviders>
  );
}
