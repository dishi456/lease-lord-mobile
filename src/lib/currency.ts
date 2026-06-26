// App-wide display currency. Backend amounts are stored in INR (base), so we
// convert with simple static rates for demo purposes (real FX would need a live
// rate feed). Set on login + when the tenant changes their preference; money()
// reads the current value at render time.

type Info = { symbol: string; rate: number; locale: string; label: string };
export const CURRENCIES: Record<string, Info> = {
  INR: { symbol: "₹", rate: 1, locale: "en-IN", label: "Indian Rupee" },
  USD: { symbol: "$", rate: 0.012, locale: "en-US", label: "US Dollar" },
  CAD: { symbol: "C$", rate: 0.016, locale: "en-CA", label: "Canadian Dollar" },
  GBP: { symbol: "£", rate: 0.0095, locale: "en-GB", label: "British Pound" },
  EUR: { symbol: "€", rate: 0.011, locale: "en-IE", label: "Euro" },
  AUD: { symbol: "A$", rate: 0.018, locale: "en-AU", label: "Australian Dollar" },
};
export const CURRENCY_CODES = Object.keys(CURRENCIES);

let current = "USD";
export function setCurrency(code?: string | null) {
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
