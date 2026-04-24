import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import {
  BottomSheet,
  Group,
  Host,
  RNHostView,
} from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
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
import { Dialog, Button, Separator, ListGroup } from "heroui-native";
import { VersionTap } from "@/components/molecules/VersionTap";
import { useCSSVariable } from "uniwind";
import { useSettingsSheetStore } from "@/stores/useSettingsSheetStore";

import { useUserStore } from "@/stores/useUserStore";
import { useAIStore } from "@/stores/useAIStore";
import { deleteDatabase } from "@/db/client";
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

const FINANCE_ITEMS: MenuItem[] = [
  {
    icon: Tag,
    label: "Manage Categories",
    description: "Add, edit, or reorder",
    onPress: () => router.push("/(main)/manage-categories"),
  },
  { icon: Wallet, label: "Budget Settings", description: "Monthly limits & alerts" },
  { icon: Repeat, label: "Recurring Bills", description: "Manage subscriptions" },
  { icon: ChartLine, label: "Finance Insight", description: "AI-powered analysis" },
];

function SettingsListGroup({
  items,
  close,
}: {
  items: MenuItem[];
  close: () => void;
}) {
  const [dangerColor, primaryColor] = useCSSVariable([
    "--color-danger",
    "--color-primary",
  ]);

  return (
    <ListGroup>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <React.Fragment key={item.label}>
            {i > 0 && <Separator className="mx-4" />}
            <ListGroup.Item
              onPress={() => {
                if (item.onPress) {
                  close();
                  item.onPress();
                }
              }}
            >
              <ListGroup.ItemPrefix>
                <View
                  className={`h-9 w-9 items-center justify-center rounded-lg ${
                    item.danger ? "bg-danger/15" : "bg-primary/10"
                  }`}
                >
                  <Icon
                    size={18}
                    weight="fill"
                    color={
                      item.danger
                        ? (dangerColor as string)
                        : (primaryColor as string)
                    }
                  />
                </View>
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle
                  className={item.danger ? "text-danger" : ""}
                >
                  {item.label}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {item.description}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              {!item.danger && <ListGroup.ItemSuffix />}
            </ListGroup.Item>
          </React.Fragment>
        );
      })}
    </ListGroup>
  );
}

export const SettingsSheet = () => {
  const { isOpen, close, activeTab } = useSettingsSheetStore();
  const setUserData = useUserStore((s) => s.setUserData);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAndReset = async () => {
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
    await deleteDatabase();
  };

  return (
    <>
      <Host style={{ position: "absolute", width: 0, height: 0 }}>
        <BottomSheet
          isPresented={isOpen}
          onIsPresentedChange={(presented) => {
            if (!presented) close();
          }}
        >
          <Group
            modifiers={[
              presentationDetents(["medium", "large"]),
              presentationDragIndicator("visible"),
            ]}
          >
            <RNHostView>
              <ScrollView style={{ flex: 1 }} contentContainerClassName="px-5 py-6 pb-10">
                <AppText size="xl" weight="bold" family="headline">
                  Settings
                </AppText>

                <View className="mt-5 gap-4">
                  {/* Finance settings — top on money tab */}
                  {activeTab === "money" && (
                    <View className="gap-1.5">
                      <AppText size="xs" color="primary" weight="bold" className="px-1 uppercase tracking-wide">
                        Finance
                      </AppText>
                      <SettingsListGroup items={FINANCE_ITEMS} close={close} />
                    </View>
                  )}

                  {/* Main navigation group */}
                  <SettingsListGroup items={MAIN_ITEMS} close={close} />

                  {/* Settings group */}
                  <SettingsListGroup items={SETTINGS_ITEMS} close={close} />

                  {/* Finance settings — below main on other tabs */}
                  {activeTab !== "money" && (
                    <View className="gap-1.5">
                      <AppText size="xs" color="primary" weight="bold" className="px-1 uppercase tracking-wide">
                        Finance
                      </AppText>
                      <SettingsListGroup items={FINANCE_ITEMS} close={close} />
                    </View>
                  )}

                  {/* Danger zone */}
                  <SettingsListGroup
                    items={[
                      {
                        icon: Trash,
                        label: "Delete Everything",
                        description: "Erase all data and restart",
                        danger: true,
                        onPress: () => setShowDeleteDialog(true),
                      },
                    ]}
                    close={close}
                  />

                  {/* Version / Channel Surfing */}
                  <View className="mt-2">
                    <VersionTap />
                  </View>
                </View>
              </ScrollView>
            </RNHostView>
          </Group>
        </BottomSheet>
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
