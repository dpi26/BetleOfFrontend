"/**
 * pricingStore — external subscribable store used with useSyncExternalStore.
 *
 * Re-render isolation strategy:
 *   The store lives outside React. Only components that explicitly subscribe
 *   via useSyncExternalStore re-render when state changes. The price <span>
 *   nodes subscribe individually so toggling currency/billing updates ONLY
 *   the numeric text nodes — the rest of the pricing card, header, bento,
 *   hero, etc. never re-render or reflow.
 */

// Multi-dimensional pricing matrix.
// Final = baseUSD * regionalTariff * billingMultiplier
export const PRICING_MATRIX = {
  // base monthly rate in USD per tier
  base: {
    rookie: 12,
    contender: 39,
    champion: 99,
  },
  // regional tariff (USD baseline = 1.0)
  region: {
    USD: { rate: 1.0,  symbol: \"$\",  code: \"USD\", locale: \"en-US\" },
    EUR: { rate: 0.92, symbol: \"€\",  code: \"EUR\", locale: \"de-DE\" },
    INR: { rate: 83.5, symbol: \"₹\",  code: \"INR\", locale: \"en-IN\" },
  },
  // billing multipliers (annual = flat 20% discount)
  billing: {
    monthly: { factor: 1.0, label: \"/mo\",   periodLabel: \"billed monthly\" },
    annual:  { factor: 0.8, label: \"/mo\",   periodLabel: \"billed annually\" },
  },
};

const listeners = new Set();
let state = { currency: \"USD\", billing: \"monthly\" };

export const pricingStore = {
  getState: () => state,
  setCurrency(currency) {
    if (state.currency === currency) return;
    state = { ...state, currency };
    listeners.forEach((l) => l());
  },
  setBilling(billing) {
    if (state.billing === billing) return;
    state = { ...state, billing };
    listeners.forEach((l) => l());
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// Compute final displayed price for a tier.
export function computePrice(tierKey) {
  const { currency, billing } = state;
  const base = PRICING_MATRIX.base[tierKey];
  const region = PRICING_MATRIX.region[currency];
  const bill = PRICING_MATRIX.billing[billing];
  const raw = base * region.rate * bill.factor;
  // INR shows whole rupees; USD/EUR show 2 decimals when annual yields cents
  const fractionDigits = currency === \"INR\" ? 0 : raw < 100 ? 2 : 0;
  const formatted = new Intl.NumberFormat(region.locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(raw);
  return { formatted, symbol: region.symbol, code: region.code, label: bill.label };
}
"
