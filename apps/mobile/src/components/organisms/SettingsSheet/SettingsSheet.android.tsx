import { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { router } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import {
  UsersThree,
  Crown,
  Brain,
  Bell,
  Gear,
  Export,
  Trash,
  Code,
  Tag,
  Wallet,
  Repeat,
  ChartLine,
} from "phosphor-react-native";
import { Separator, Dialog, Button } from "heroui-native";
import { VersionTap } from "@/components/molecules/VersionTap";
import { useCSSVariable } from "uniwind";
import { useSettingsSheetStore } from "@/stores/useSettingsSheetStore";
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

const FINANCE_ITEMS: MenuItem[] = [
  { icon: Tag, label: "Manage Categories", description: "Add, edit, or reorder" },
  { icon: Wallet, label: "Budget Settings", description: "Monthly limits & alerts" },
  { icon: Repeat, label: "Recurring Bills", description: "Manage subscriptions" },
  { icon: ChartLine, label: "Finance Insight", description: "AI-powered analysis" },
];

export const SettingsSheet = () => {
  const { isOpen, close, activeTab } = useSettingsSheetStore();
  const [foregroundColor, dangerColor] = useCSSVariable([
    "--color-foreground",
    "--color-danger",
  ]);
  const setUserData = useUserStore((s) => s.setUserData);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAndReset = () => {
    setShowDeleteDialog(false);
    close();
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
      currency: "",
      hasCompletedOnboarding: false,
    });
    useAIStore.getState().reset();
    router.replace("/(main)/onboarding");
  };

  const MENU_ITEMS: MenuItem[] = [
    {
      icon: UsersThree,
      label: "People",
      description: "Contacts & relationships",
      onPress: () => {
        close();
        router.push("/(main)/(tabs)/people" as never);
      },
    },
    { icon: Crown, label: "Premium", description: "Trial & purchase" },
    {
      icon: Brain,
      label: "Local AI",
      description: "Model & inference",
      onPress: () => {
        close();
        router.push("/home/ai-test" as never);
      },
    },
    { icon: Bell, label: "Notifications", description: "Reminders & alerts" },
    { icon: Gear, label: "Appearance", description: "Theme & display" },
    { icon: Export, label: "Export Data", description: "CSV or JSON" },
    {
      icon: Trash,
      label: "Delete Everything",
      description: "Erase all data and restart",
      danger: true,
      onPress: () => setShowDeleteDialog(true),
    },
    { icon: Code, label: "View Source Code", description: "GitHub repository" },
  ];

  if (!isOpen) return null;

  return (
    <>
      <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
        <ModalBottomSheet onDismissRequest={close} showDragHandle>
          <RNHostView matchContents>
            <ScrollView contentContainerClassName="gap-1 px-5 py-6 pb-10">
              <AppText size="xl" weight="bold" family="headline">
                Settings
              </AppText>
              {activeTab === "money" && (
                <View className="mt-4 gap-1.5">
                  <AppText size="xs" color="primary" weight="bold" className="px-1">
                    FINANCE
                  </AppText>
                  <View className="rounded-xl bg-surface">
                    {FINANCE_ITEMS.map((item, index) => (
                      <View key={item.label}>
                        {index > 0 && <Separator />}
                        <Pressable
                          className="flex-row items-center gap-3 px-3 py-3.5"
                          onPress={item.onPress}
                        >
                          <item.icon
                            size={20}
                            weight="regular"
                            color={foregroundColor as string}
                          />
                          <View className="flex-1">
                            <AppText size="base" weight="medium" color="foreground">
                              {item.label}
                            </AppText>
                            <AppText size="xs" color="muted">
                              {item.description}
                            </AppText>
                          </View>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <View className="mt-3 rounded-xl bg-surface">
                {MENU_ITEMS.map((item, index) => (
                  <View key={item.label}>
                    {index > 0 && <Separator />}
                    <Pressable
                      className="flex-row items-center gap-3 px-3 py-3.5"
                      onPress={item.onPress}
                    >
                      <item.icon
                        size={20}
                        weight="regular"
                        color={
                          item.danger
                            ? (dangerColor as string)
                            : (foregroundColor as string)
                        }
                      />
                      <View className="flex-1">
                        <AppText
                          size="base"
                          weight="medium"
                          color={item.danger ? "danger" : "foreground"}
                        >
                          {item.label}
                        </AppText>
                        <AppText size="xs" color="muted">
                          {item.description}
                        </AppText>
                      </View>
                    </Pressable>
                  </View>
                ))}
              </View>
              {activeTab !== "money" && (
                <View className="mt-4 gap-1.5">
                  <AppText size="xs" color="primary" weight="bold" className="px-1">
                    FINANCE
                  </AppText>
                  <View className="rounded-xl bg-surface">
                    {FINANCE_ITEMS.map((item, index) => (
                      <View key={item.label}>
                        {index > 0 && <Separator />}
                        <Pressable
                          className="flex-row items-center gap-3 px-3 py-3.5"
                          onPress={item.onPress}
                        >
                          <item.icon
                            size={20}
                            weight="regular"
                            color={foregroundColor as string}
                          />
                          <View className="flex-1">
                            <AppText size="base" weight="medium" color="foreground">
                              {item.label}
                            </AppText>
                            <AppText size="xs" color="muted">
                              {item.description}
                            </AppText>
                          </View>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Version / Channel Surfing */}
              <View className="mt-2">
                <VersionTap />
              </View>
            </ScrollView>
          </RNHostView>
        </ModalBottomSheet>
      </Host>

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
};
