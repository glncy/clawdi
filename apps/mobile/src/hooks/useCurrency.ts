import { useMemo } from "react";
import { useUserStore } from "@/stores/useUserStore";
import {
  getDeviceCurrency,
  formatCurrency,
  getCurrencySymbol,
} from "@/utils/currency";

export function useCurrency() {
  const storedCurrency = useUserStore((s) => s.currency);

  return useMemo(() => {
    const device = getDeviceCurrency();
    const code = storedCurrency || device.code;
    const locale = device.locale;

    return {
      code,
      symbol: getCurrencySymbol(code, locale),
      format: (amount: number) => formatCurrency(amount, code, locale),
    };
  }, [storedCurrency]);
}
