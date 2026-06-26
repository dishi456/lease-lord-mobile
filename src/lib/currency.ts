// App-wide display currency. Backend amounts are stored in INR (base), so we
// convert with simple static rates for demo purposes (real FX would need a live
// rate feed). Set on login + when the tenant changes their preference; money()
// reads the current value at render time.

type Info = { symbol: string; rate: number; locale: string; label: string };
// Amounts are stored as plain "rent-sized" numbers (e.g. 2500), so the app shows
// them directly with a $ — USD rate is 1 (number unchanged, just a dollar sign).
export const CURRENCIES: Record<string, Info> = {
  USD: { symbol: "$", rate: 1, locale: "en-US", label: "US Dollar" },
  AUD: { symbol: "A$", rate: 1, locale: "en-AU", label: "Australian Dollar" },
  CAD: { symbol: "C$", rate: 1, locale: "en-CA", label: "Canadian Dollar" },
  GBP: { symbol: "£", rate: 1, locale: "en-GB", label: "British Pound" },
  EUR: { symbol: "€", rate: 1, locale: "en-IE", label: "Euro" },
  INR: { symbol: "₹", rate: 1, locale: "en-IN", label: "Indian Rupee" },
};
export const CURRENCY_CODES = Object.keys(CURRENCIES);

// The app presents prices in USD ($) by default across every role. A stored INR
// preference (from older accounts) must NOT force the rupee back on.
let current = "USD";
export function setCurrency(code?: string | null) {
  if (code === "INR") code = "USD";
  if (code && CURRENCIES[code]) current = code;
}
export function getCurrency() {
  return current;
}

// Format an INR-base amount in the active currency.
export function formatMoney(amount: number): string {
  const c = CURRENCIES[current] ?? CURRENCIES.INR;
  const v = (amount ?? 0) * c.rate;
  return `${c.symbol}${v.toLocaleString(c.locale, { maximumFractionDigits: c.rate === 1 ? 0 : 2 })}`;
}
