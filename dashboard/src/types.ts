export interface UtilityProcurement {
  value: number;
  source: string;
  contract_term_years: number;
  escalation_rate: number;
  status: string;
}

export interface MarketRevenue {
  value: number;
  source?: string;
  erosion_rate?: number;
  accreditation?: string;
}

export interface IncentiveRevenue {
  value: number;
  programs: string[];
  notes?: string;
}

export interface DemandResponse {
  value: number;
  programs: string[];
  notes?: string;
}

export interface Revenue {
  utility_procurement: UtilityProcurement | null;
  iso_capacity_market: MarketRevenue;
  energy_arbitrage: MarketRevenue;
  ancillary_services: MarketRevenue;
  state_incentives: IncentiveRevenue;
  demand_response?: DemandResponse;
  total_contracted_period: number;
  total_merchant_period: number;
}

// ── New flexible revenue model ──────────────────────────────────────────
export interface RevenueSource {
  label: string;
  url: string;
  section?: string;
  excerpt?: string;
}

export interface RevenueStream {
  name: string;
  category: 'tax_credit' | 'rebate' | 'capacity' | 'regulation' | 'arbitrage' | 'vpp' | 'other';
  type: 'one_time' | 'annual';
  color: string;

  // One-time items
  amount?: number;          // $ total for 5 MW project
  timing?: 'development' | 'cod';  // when it hits

  // Annual items ($ total for 5 MW project per year)
  near_term_annual?: number;
  long_term_annual?: number;  // stabilized level (if different)
  trend?: 'declining' | 'growing' | 'stable' | 'tbd';
  annual_growth_rate?: number; // positive = growing, negative = declining

  notes?: string;
  sources?: RevenueSource[];
}

export interface RevenueStackV2 {
  streams: RevenueStream[];
  first_year_total_annual: number;  // $ total annual revenue, year 1 of ops
  one_time_total: number;           // $ total one-time items
}

export interface Costs {
  capex_base: number;
  capex_total: number;
  opex_base: number;
  opex_total: number;
  development_timeline_months: number;
  land_option_annual: number;
}

export interface StateFactors {
  storage_mandate: { exists: boolean; target_mw?: number | null; target_year?: number | null; npv_multiplier: number };
  tax_incentives: { property_tax_exemption?: boolean; sales_tax_exemption?: boolean; npv_multiplier: number };
  labor_requirements: { prevailing_wage?: boolean; project_labor_agreement?: boolean; npv_multiplier: number };
  permitting: { streamlined?: boolean; complexity?: string; npv_multiplier: number };
}

export interface UtilityFactors {
  interconnection_quality: { tier: number; avg_timeline_months?: number; application_fee?: number; npv_multiplier: number };
  regulatory_posture: { category: string; npv_multiplier: number };
}

export interface Risks {
  regulatory_uncertainty: { description?: string; npv_haircut: number };
  iso_market_risk?: { description?: string; npv_haircut: number };
  discount_rate: number;
}

export interface NPVResults {
  pv_total: number;
  pv_tier: 1 | 2 | 3 | 4 | 5;
}

export interface KeyDate {
  date: string;
  event: string;
}

export interface DevelopmentStatus {
  active_rfp: string;
  mammoth_sites: number;
  key_dates?: KeyDate[];
  notes?: string;
}

export interface UtilityData {
  utility_id: string;
  utility_name: string;
  utility_short_name: string;
  state: string;
  state_abbr: string;
  iso_rto: string;
  market_type: 'contract_based' | 'merchant_incentive' | 'pure_merchant';
  inclusion_rationale: string;
  revenue: Revenue;
  revenue_v2?: RevenueStackV2;  // New flexible model (used when present)
  costs: Costs;
  state_factors: StateFactors;
  utility_factors: UtilityFactors;
  risks: Risks;
  pv_results: NPVResults;
  development_status: DevelopmentStatus;
}

export type IsoRto = 'PJM' | 'NYISO' | 'ISO-NE' | 'CAISO' | 'non-ISO';

export interface FilterState {
  layers: {
    iso: boolean;
    states: boolean;
    utilities: boolean;
  };
  opacity: {
    iso: number;
    utilities: number;
  };
  isoFilter: IsoRto | 'all';
  stateFilter: string;
  npvTiers: Set<number>;
  marketTypes: Set<string>;
}
