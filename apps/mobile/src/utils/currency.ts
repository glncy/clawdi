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
  return new Intl.NumberFormat(locale ?? device.locale, {
    style: "currency",
    currency: currencyCode ?? device.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencySymbol(
  currencyCode?: string,
  locale?: string
): string {
  const device = getDeviceCurrency();
  return (
    new Intl.NumberFormat(locale ?? device.locale, {
      style: "currency",
      currency: currencyCode ?? device.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? device.symbol
  );
}
