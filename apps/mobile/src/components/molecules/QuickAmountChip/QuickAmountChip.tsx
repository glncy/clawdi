import { Chip } from "heroui-native";
import { useCurrency } from "@/hooks/useCurrency";

interface QuickAmountChipProps {
  amount: number;
  onPress?: () => void;
}

export const QuickAmountChip = ({ amount, onPress }: QuickAmountChipProps) => {
  const { format } = useCurrency();

  return (
    <Chip variant="soft" className="px-1">
      <Chip.Label>{format(amount)}</Chip.Label>
    </Chip>
  );
};
