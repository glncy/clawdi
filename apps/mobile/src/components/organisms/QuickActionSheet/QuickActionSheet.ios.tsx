import { View, Pressable } from "react-native";
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
import { AppText } from "@/components/atoms/Text";
import {
  CurrencyDollar,
  Smiley,
  CheckSquare,
  ListBullets,
  Moon,
  ChatCircle,
} from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useQuickActionStore } from "@/stores/useQuickActionStore";
import { useAddTransactionSheetStore } from "@/stores/useAddTransactionSheetStore";
import type { Icon as PhosphorIcon } from "phosphor-react-native";

interface QuickAction {
  icon: PhosphorIcon;
  label: string;
  onPress?: () => void;
}

export const QuickActionSheet = () => {
  const { isOpen, close } = useQuickActionStore();
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  const actions: QuickAction[] = [
    {
      icon: CurrencyDollar,
      label: "Log expense",
      onPress: () => {
        close();
        useAddTransactionSheetStore.getState().open();
      },
    },
    { icon: Smiley, label: "Check in mood" },
    { icon: CheckSquare, label: "Tick a habit" },
    { icon: ListBullets, label: "Add priority" },
    { icon: Moon, label: "Log sleep" },
    { icon: ChatCircle, label: "Log a chat" },
  ];

  return (
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
            <View className="gap-4 px-4 py-6">
              <AppText size="lg" weight="bold" family="headline">
                Quick Actions
              </AppText>
              <View className="flex-row flex-wrap gap-3">
                {actions.map(({ icon: Icon, label, onPress }) => (
                  <Pressable
                    key={label}
                    className="w-[47%] items-center gap-2 rounded-xl bg-primary/10 p-4"
                    onPress={onPress}
                    disabled={!onPress}
                  >
                    <Icon
                      size={28}
                      weight="fill"
                      color={primaryColor as string}
                    />
                    <AppText size="xs" align="center" weight="medium">
                      {label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
