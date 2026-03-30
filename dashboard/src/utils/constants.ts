export const NPV_TIER_COLORS: Record<number, { color: string; label: string; min: number; max: number }> = {
  1: { color: '#2E7D32', label: 'Tier 1: ≥$1,500/kW', min: 1500, max: Infinity },
  2: { color: '#66BB6A', label: 'Tier 2: $1,000–1,499/kW', min: 1000, max: 1499 },
  3: { color: '#FDD835', label: 'Tier 3: $500–999/kW', min: 500, max: 999 },
  4: { color: '#FB8C00', label: 'Tier 4: $0–499/kW', min: 0, max: 499 },
  5: { color: '#BDBDBD', label: 'Tier 5: Negative NPV', min: -Infinity, max: -1 },
};

export const ISO_RTO_COLORS: Record<string, string> = {
  'PJM': '#4A90E2',
  'NYISO': '#7ED321',
  'ISO-NE': '#9013FE',
  'CAISO': '#F5A623',
  'non-ISO': '#E0E0E0',
};

export const MARKET_TYPE_LABELS: Record<string, string> = {
  contract_based: 'Contract-Based',
  merchant_incentive: 'Merchant + Incentive',
  pure_merchant: 'Pure Merchant',
};

export const MARKET_TYPE_BADGE_COLORS: Record<string, string> = {
  contract_based: 'bg-blue-100 text-blue-800',
  merchant_incentive: 'bg-purple-100 text-purple-800',
  pure_merchant: 'bg-gray-100 text-gray-800',
};

export function formatCurrency(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
