import { Pressable } from "react-native";
import { GearSix } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useSettingsSheetStore } from "@/stores/useSettingsSheetStore";

type TabName = "home" | "money" | "day" | "life";

interface HeaderGearButtonProps {
  tab?: TabName;
}

/**
 * Gear icon button for the navigation header.
 * Opens the Settings sheet when pressed.
 * @level Molecule
 */
export function HeaderGearButton({ tab }: HeaderGearButtonProps) {
  const toggle = useSettingsSheetStore((s) => s.toggle);
  const [foregroundColor] = useCSSVariable(["--color-foreground"]);

  return (
    <Pressable onPress={() => toggle(tab)} hitSlop={8}>
      <GearSix size={22} weight="regular" color={foregroundColor as string} />
    </Pressable>
  );
}
