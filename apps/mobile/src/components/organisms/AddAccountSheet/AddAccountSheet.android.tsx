import { View, Pressable } from "react-native";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { router } from "expo-router";
import { AppText } from "@/components/atoms/Text";
import { Input } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useAddAccountSheetStore } from "@/stores/useAddAccountSheetStore";
import { Lightning, PencilSimpleLine, Microphone } from "phosphor-react-native";

export const AddAccountSheet = () => {
  const { isOpen, close } = useAddAccountSheetStore();

  const [primaryColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
  ]);

  const handleClose = () => {
    close();
  };

  const handleManual = () => {
    handleClose();
    router.push("/(main)/add-account");
  };

  if (!isOpen) return null;

  return (
    <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
      <ModalBottomSheet onDismissRequest={handleClose} showDragHandle>
        <RNHostView matchContents>
          <View className="px-5 py-6 gap-5">
            <AppText size="xl" weight="bold" family="headline">
              Add Account
            </AppText>

            <View className="gap-3">
              <AppText size="sm" color="muted">
                Describe your account
              </AppText>
              <View className="flex-row items-center">
                <Input
                  className="flex-1 pl-10 opacity-50"
                  placeholder="e.g. savings account with 5000"
                  editable={false}
                />
                <Lightning
                  size={16}
                  color={mutedColor as string}
                  weight="fill"
                  style={{ position: "absolute", left: 14 }}
                />
              </View>
              <AppText size="xs" color="muted" align="center">
                AI parsing coming soon
              </AppText>
            </View>

            <View className="items-center">
              <AppText size="xs" color="muted">
                or
              </AppText>
            </View>

            <View className="gap-3">
              <Pressable
                className="flex-row items-center gap-3 rounded-xl bg-surface p-4"
                onPress={handleManual}
              >
                <PencilSimpleLine
                  size={20}
                  color={primaryColor as string}
                  weight="bold"
                />
                <AppText size="sm" weight="medium">
                  Input Manually
                </AppText>
              </Pressable>
              <Pressable
                className="flex-row items-center gap-3 rounded-xl bg-surface p-4 opacity-50"
                disabled
              >
                <Microphone
                  size={20}
                  color={mutedColor as string}
                  weight="bold"
                />
                <View>
                  <AppText size="sm" weight="medium" color="muted">
                    Tap to Talk
                  </AppText>
                  <AppText size="xs" color="muted">
                    Coming soon
                  </AppText>
                </View>
              </Pressable>
            </View>
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
};
