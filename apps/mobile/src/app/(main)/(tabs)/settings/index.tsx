import { useState } from "react";
import { ScrollView, View, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import { Dialog, Button } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { VersionTap } from "@/components/molecules/VersionTap";
import {
  UsersThree,
  Crown,
  Brain,
  Bell,
  Gear,
  Export,
  Trash,
  Code,
  CaretRight,
} from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useUserStore } from "@/stores/useUserStore";
import { useAIStore } from "@/stores/useAIStore";
import type { ComponentType } from "react";
import type { IconProps } from "phosphor-react-native";

interface MenuItem {
  icon: ComponentType<IconProps>;
  label: string;
  description: string;
  danger?: boolean;
  onPress?: () => void;
}

const MAIN_ITEMS: MenuItem[] = [
  {
    icon: UsersThree,
    label: "People",
    description: "Contacts & relationships",
    onPress: () => router.push("/(main)/(tabs)/people" as never),
  },
  { icon: Crown, label: "Premium", description: "Trial & purchase" },
  {
    icon: Brain,
    label: "AI",
    description: "Provider & model settings",
    onPress: () => router.push("/(main)/ai-settings" as never),
  },
];

const SETTINGS_ITEMS: MenuItem[] = [
  { icon: Bell, label: "Notifications", description: "Reminders & alerts" },
  { icon: Gear, label: "Appearance", description: "Theme & display" },
  { icon: Export, label: "Export Data", description: "CSV or JSON" },
  { icon: Code, label: "View Source Code", description: "GitHub repository" },
];

export default function SettingsScreen() {
  const [primaryColor, dangerColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-danger",
    "--color-muted",
  ]);
  const setUserData = useUserStore((s) => s.setUserData);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAndReset = () => {
    setShowDeleteDialog(false);
    setUserData({
      name: "",
      income: "",
      moneyScore: null,
      timeScore: null,
      healthScore: null,
      peopleScore: null,
      mindScore: null,
      savingGoals: [],
      struggles: [],
      hasCompletedOnboarding: false,
    });
    useAIStore.getState().reset();
    router.replace("/(main)/onboarding");
  };

  const DANGER_ITEMS: MenuItem[] = [
    {
      icon: Trash,
      label: "Delete Everything",
      description: "Erase all data and restart",
      danger: true,
      onPress: () => setShowDeleteDialog(true),
    },
  ];

  const renderRow = (item: MenuItem, isLast: boolean) => {
    const { icon: Icon, label, description, danger, onPress } = item;
    return (
      <View key={label}>
        <Pressable
          className="flex-row items-center gap-3 px-3.5 py-3.5"
          onPress={onPress}
        >
          <View
            className={`h-9 w-9 items-center justify-center rounded-lg ${
              danger ? "bg-danger/15" : "bg-primary/10"
            }`}
          >
            <Icon
              size={18}
              weight="fill"
              color={
                danger
                  ? (dangerColor as string)
                  : (primaryColor as string)
              }
            />
          </View>
          <View className="flex-1">
            <AppText
              size="base"
              weight="medium"
              color={danger ? "danger" : "foreground"}
            >
              {label}
            </AppText>
            <AppText size="xs" color="muted">
              {description}
            </AppText>
          </View>
          {!danger && (
            <CaretRight
              size={14}
              weight="bold"
              color={mutedColor as string}
            />
          )}
        </Pressable>
        {!isLast && <View className="ml-14 h-px bg-default" />}
      </View>
    );
  };

  const renderGroup = (items: MenuItem[]) => (
    <View className="overflow-hidden rounded-xl bg-surface">
      {items.map((item, i) => renderRow(item, i === items.length - 1))}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-32 gap-4"
      >
        {renderGroup(MAIN_ITEMS)}
        {renderGroup(SETTINGS_ITEMS)}
        {renderGroup(DANGER_ITEMS)}
        <VersionTap />
      </ScrollView>

      <Dialog isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Delete Everything?</Dialog.Title>
            <Dialog.Description>
              This will erase all your data — scores, goals, habits, and
              preferences — and take you back to the onboarding setup. This
              cannot be undone.
            </Dialog.Description>
            <View className="flex-row gap-3 mt-4">
              <Button
                variant="tertiary"
                className="flex-1"
                onPress={() => setShowDeleteDialog(false)}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onPress={handleDeleteAndReset}
              >
                <Button.Label>Delete & Reset</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
