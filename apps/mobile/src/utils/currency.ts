import * as Localization from "expo-localization";

export interface CurrencyInfo {
  code: string;   // "PHP", "USD", "EUR"
  symbol: string; // "₱", "$", "€"
  locale: string; // "en-PH", "en-US"
}

export function getDeviceCurrency(): CurrencyInfo {
  const locale = Localization.getLocales()[0];
  return {
    code: locale?.currencyCode ?? "USD",
    symbol: locale?.currencySymbol ?? "$",
    locale: locale?.languageTag ?? "en-US",
  };
}

export function formatCurrency(
  amount: number,
  currencyCode?: string,
  locale?: string
): string {
  const device = getDeviceCurrency();
  try {
    return new Intl.NumberFormat(locale ?? device.locale, {
      style: "currency",
      currency: currencyCode ?? device.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for limited Intl support on Hermes
    const symbol = device.symbol;
    const formatted = Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  }
}

export function getCurrencySymbol(
  _currencyCode?: string,
  _locale?: string
): string {
  // expo-localization provides the device's currency symbol directly.
  // formatToParts is not available on Hermes, so we use the locale value.
  return getDeviceCurrency().symbol;
}
