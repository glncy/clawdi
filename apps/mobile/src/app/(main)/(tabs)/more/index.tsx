import { useState } from "react";
import { ScrollView, View, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import { Card, Separator, Dialog, Button } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { VersionTap } from "@/components/molecules/VersionTap";
import {
  Gear,
  Bell,
  Crown,
  Brain,
  Export,
  Trash,
  Code,
} from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useUserStore } from "@/stores/useUserStore";
import { useAIStore } from "@/stores/useAIStore";

interface MenuItem {
  icon: typeof Gear;
  label: string;
  description: string;
  route: string | null;
  danger?: boolean;
  onPress?: () => void;
}

export default function MoreScreen() {
  const [foregroundColor, dangerColor] = useCSSVariable([
    "--color-foreground",
    "--color-danger",
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

  const MENU_ITEMS: MenuItem[] = [
    { icon: Crown, label: "Premium", description: "Trial & purchase", route: null },
    { icon: Brain, label: "Local AI", description: "Model & inference", route: "/home/ai-test" },
    { icon: Bell, label: "Notifications", description: "Reminders & alerts", route: null },
    { icon: Gear, label: "Appearance", description: "Theme & display", route: null },
    { icon: Export, label: "Export Data", description: "CSV or JSON", route: null },
    { icon: Trash, label: "Delete Everything", description: "Erase all data and restart", route: null, danger: true, onPress: () => setShowDeleteDialog(true) },
    { icon: Code, label: "View Source Code", description: "GitHub repository", route: null },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "More" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pt-20 pb-32 gap-5"
      >
        <AppText size="2xl" weight="bold" family="headline">
          More
        </AppText>

        <Card className="bg-surface p-1">
          <Card.Body className="gap-0">
            {MENU_ITEMS.map((item, index) => (
              <View key={item.label}>
                {index > 0 && <Separator />}
                <Pressable
                  className="flex-row items-center gap-3 px-3 py-3.5"
                  onPress={() => {
                    if (item.onPress) {
                      item.onPress();
                    } else if (item.route) {
                      router.push(item.route as never);
                    }
                  }}
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
                      size="sm"
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
          </Card.Body>
        </Card>

        <VersionTap />
      </ScrollView>

      {/* Delete Everything confirmation */}
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
