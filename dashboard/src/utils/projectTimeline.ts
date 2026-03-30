import type { UtilityData } from '../types';

export interface YearData {
  year: number;
  calendarYear: number;
  phase: 'development' | 'construction' | 'operations';

  // Costs ($K for 5 MW project)
  costDevelopment: number;
  costCapex: number;
  costOM: number;
  costAugmentation: number;
  costTotal: number;
  costRangeLow: number;
  costRangeHigh: number;

  // Revenue ($K for 5 MW project)
  revUtilityProcurement: number;
  revCapacity: number;
  revArbitrage: number;
  revAncillary: number;
  revStateIncentive: number;
  revDemandResponse: number;
  revTotal: number;
  revRangeLow: number;
  revRangeHigh: number;

  // Cash flow ($K for 5 MW project)
  netCashFlow: number;
  cumulative: number;
  cashFlowRangeLow: number;
  cashFlowRangeHigh: number;
}

const PROJECT_KW = 5000;
const OPEX_ESCALATION = 0.025;
const CAPEX_CONFIDENCE = 0.15; // +/- 15%
const REVENUE_CONFIDENCE = 0.25; // +/- 25%

export function generateProjectTimeline(utility: UtilityData): YearData[] {
  const devMonths = utility.costs.development_timeline_months;
  const devYears = Math.ceil(devMonths / 12);
  const totalYears = devYears + 20; // 20 years of operations

  // Assume start year = 2026
  const startYear = 2026;

  const timeline: YearData[] = [];
  let cumulative = 0;

  for (let i = 0; i <= totalYears; i++) {
    const calendarYear = startYear + i;
    const operatingYear = i - devYears; // 1-indexed operating year (negative = dev)

    let phase: 'development' | 'construction' | 'operations' = 'operations';
    if (i < devYears - 1) phase = 'development';
    else if (i === devYears - 1 || i === devYears) phase = 'construction';

    // ── Costs ──
    let costDevelopment = 0;
    let costCapex = 0;
    let costOM = 0;
    let costAugmentation = 0;

    if (i < devYears) {
      // Development phase: land option + soft costs spread across dev years
      costDevelopment = (utility.costs.land_option_annual + 150000) / 1000; // $K
    }

    if (i === devYears - 1) {
      // CapEx: 30% in year before COD
      costCapex = (utility.costs.capex_total * PROJECT_KW * 0.3) / 1000;
    } else if (i === devYears) {
      // CapEx: 70% at COD year
      costCapex = (utility.costs.capex_total * PROJECT_KW * 0.7) / 1000;
    }

    if (operatingYear >= 1) {
      // O&M escalating from base
      costOM = (utility.costs.opex_total * PROJECT_KW * Math.pow(1 + OPEX_ESCALATION, operatingYear - 1)) / 1000;

      // Battery augmentation in year 10
      if (operatingYear === 10) {
        costAugmentation = 1500; // ~$1.5M augmentation
      }
    }

    const costTotal = costDevelopment + costCapex + costOM + costAugmentation;

    // ── Revenue ──
    let revUtilityProcurement = 0;
    let revCapacity = 0;
    let revArbitrage = 0;
    let revAncillary = 0;
    let revStateIncentive = 0;
    let revDemandResponse = 0;

    if (operatingYear >= 1 && operatingYear <= 20) {
      const contractTerm = utility.revenue.utility_procurement?.contract_term_years ?? 0;
      const inContract = operatingYear <= contractTerm;

      // Utility procurement
      if (inContract && utility.revenue.utility_procurement) {
        const base = utility.revenue.utility_procurement.value;
        const esc = utility.revenue.utility_procurement.escalation_rate;
        revUtilityProcurement = (base * Math.pow(1 + esc, operatingYear - 1) * PROJECT_KW) / 1000;
      }

      // ISO capacity
      if (utility.revenue.iso_capacity_market?.value) {
        const base = utility.revenue.iso_capacity_market.value;
        const erosion = utility.revenue.iso_capacity_market.erosion_rate ?? 0;
        revCapacity = (base * Math.pow(1 + erosion, operatingYear - 1) * PROJECT_KW) / 1000;
      }

      // Energy arbitrage
      if (utility.revenue.energy_arbitrage?.value) {
        const base = utility.revenue.energy_arbitrage.value;
        const erosion = utility.revenue.energy_arbitrage.erosion_rate ?? 0;
        revArbitrage = (base * Math.pow(1 + erosion, operatingYear - 1) * PROJECT_KW) / 1000;
      }

      // Ancillary services
      if (utility.revenue.ancillary_services?.value) {
        const base = utility.revenue.ancillary_services.value;
        const erosion = utility.revenue.ancillary_services.erosion_rate ?? 0;
        revAncillary = (base * Math.pow(1 + erosion, operatingYear - 1) * PROJECT_KW) / 1000;
      }

      // State incentives
      if (utility.revenue.state_incentives?.value) {
        revStateIncentive = (utility.revenue.state_incentives.value * PROJECT_KW) / 1000;
      }

      // Demand response
      if (utility.revenue.demand_response?.value) {
        revDemandResponse = (utility.revenue.demand_response.value * PROJECT_KW) / 1000;
      }

      // Post-contract: no utility procurement
      if (!inContract) {
        revUtilityProcurement = 0;
      }
    }

    // ITC benefit in year 1 of operations (modeled as negative cost / revenue boost)
    let itcBenefit = 0;
    if (operatingYear === 1) {
      // 30% ITC on eligible CapEx
      itcBenefit = (utility.costs.capex_total * PROJECT_KW * 0.30) / 1000;
    }

    const revTotal = revUtilityProcurement + revCapacity + revArbitrage + revAncillary + revStateIncentive + revDemandResponse + itcBenefit;

    // ── Cash flow ──
    const netCashFlow = revTotal - costTotal;
    cumulative += netCashFlow;

    // ── Confidence bands ──
    const costRangeLow = costTotal * (1 - CAPEX_CONFIDENCE * 0.5);
    const costRangeHigh = costTotal * (1 + CAPEX_CONFIDENCE);
    const revRangeLow = revTotal * (1 - REVENUE_CONFIDENCE);
    const revRangeHigh = revTotal * (1 + REVENUE_CONFIDENCE * 0.6);
    const cashFlowRangeLow = revRangeLow - costRangeHigh;
    const cashFlowRangeHigh = revRangeHigh - costRangeLow;

    timeline.push({
      year: i,
      calendarYear,
      phase,
      costDevelopment: round(costDevelopment),
      costCapex: round(costCapex),
      costOM: round(costOM),
      costAugmentation: round(costAugmentation),
      costTotal: round(costTotal),
      costRangeLow: round(costRangeLow),
      costRangeHigh: round(costRangeHigh),
      revUtilityProcurement: round(revUtilityProcurement),
      revCapacity: round(revCapacity),
      revArbitrage: round(revArbitrage),
      revAncillary: round(revAncillary),
      revStateIncentive: round(revStateIncentive + itcBenefit),
      revDemandResponse: round(revDemandResponse),
      revTotal: round(revTotal),
      revRangeLow: round(revRangeLow),
      revRangeHigh: round(revRangeHigh),
      netCashFlow: round(netCashFlow),
      cumulative: round(cumulative),
      cashFlowRangeLow: round(cashFlowRangeLow),
      cashFlowRangeHigh: round(cashFlowRangeHigh),
    });
  }

  return timeline;
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
