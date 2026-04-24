import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  ModalBottomSheet,
  Host,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { MoonStarsIcon } from "phosphor-react-native";
import { useDayStore } from "@/stores/useDayStore";
import { useDatabase } from "@/hooks/useDatabase";
import { useReflectionSheetStore } from "@/stores/useReflectionSheetStore";

export const EveningPromptSheet = () => {
  const hasChecked = useDayStore((s) => s.hasCheckedEveningPrompt);
  const check = useDayStore((s) => s.checkEveningPromptShouldShow);
  const dismiss = useDayStore((s) => s.dismissEveningPrompt);
  const markChecked = useDayStore((s) => s.markEveningPromptChecked);
  const openReflection = useReflectionSheetStore((s) => s.open);
  const { db } = useDatabase();

  const [isOpen, setIsOpen] = useState(false);
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  useEffect(() => {
    if (hasChecked || !db) return;
    void check(db).then((shouldShow) => {
      if (shouldShow) setIsOpen(true);
      else markChecked();
    });
  }, [hasChecked, db, check, markChecked]);

  const handleReflect = () => {
    setIsOpen(false);
    markChecked();
    openReflection();
  };

  const handleSkip = async () => {
    if (db) await dismiss(db);
    else markChecked();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Host style={{ position: "absolute", width: "100%", height: "100%" }}>
      <ModalBottomSheet onDismissRequest={() => void handleSkip()} showDragHandle>
        <RNHostView matchContents>
          <View className="px-5 py-6 gap-5">
            <View className="items-center gap-3">
              <MoonStarsIcon
                size={32}
                color={primaryColor as string}
                weight="fill"
              />
              <AppText size="xl" weight="bold" family="headline">
                Wind-down
              </AppText>
              <AppText size="sm" color="muted" className="text-center">
                Set tomorrow up for success. Takes under a minute.
              </AppText>
            </View>

            <View className="flex-row gap-3">
              <Button
                variant="tertiary"
                className="flex-1"
                onPress={handleSkip}
              >
                <Button.Label>Not tonight</Button.Label>
              </Button>
              <Button className="flex-1" onPress={handleReflect}>
                <Button.Label>Reflect &amp; Plan</Button.Label>
              </Button>
            </View>
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
};
