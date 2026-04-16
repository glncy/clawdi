import { View, Pressable } from "react-native";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
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
import { useLogInteractionSheetStore } from "@/stores/useLogInteractionSheetStore";
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
    {
      icon: ChatCircle,
      label: "Log a chat",
      onPress: () => {
        close();
        useLogInteractionSheetStore.getState().open();
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
      <ModalBottomSheet onDismissRequest={close} showDragHandle>
        <RNHostView matchContents>
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
      </ModalBottomSheet>
    </Host>
  );
};
