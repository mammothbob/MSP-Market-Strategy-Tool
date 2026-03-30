import type { UtilityData, NPVResults } from '../types';

const PROJECT_SIZE_KW = 5000;
const USEFUL_LIFE_YEARS = 20;

function getRevenueForYear(data: UtilityData, year: number): number {
  const contractTerm = data.revenue.utility_procurement?.contract_term_years ?? 0;
  const isContractPeriod = year <= contractTerm;
  let revenue = 0;

  // Utility procurement (contract period only)
  if (isContractPeriod && data.revenue.utility_procurement) {
    const base = data.revenue.utility_procurement.value;
    const esc = data.revenue.utility_procurement.escalation_rate;
    revenue += base * Math.pow(1 + esc, year - 1);
  }

  // ISO capacity market
  if (data.revenue.iso_capacity_market?.value) {
    const base = data.revenue.iso_capacity_market.value;
    const erosion = data.revenue.iso_capacity_market.erosion_rate ?? 0;
    revenue += base * Math.pow(1 + erosion, year - 1);
  }

  // Energy arbitrage
  if (data.revenue.energy_arbitrage?.value) {
    const base = data.revenue.energy_arbitrage.value;
    const erosion = data.revenue.energy_arbitrage.erosion_rate ?? 0;
    revenue += base * Math.pow(1 + erosion, year - 1);
  }

  // Ancillary services
  if (data.revenue.ancillary_services?.value) {
    const base = data.revenue.ancillary_services.value;
    const erosion = data.revenue.ancillary_services.erosion_rate ?? 0;
    revenue += base * Math.pow(1 + erosion, year - 1);
  }

  // State incentives (flat)
  if (data.revenue.state_incentives?.value) {
    revenue += data.revenue.state_incentives.value;
  }

  // Demand response (flat)
  if (data.revenue.demand_response?.value) {
    revenue += data.revenue.demand_response.value;
  }

  return revenue;
}

function getOpExForYear(data: UtilityData, year: number): number {
  const escalation = 0.025;
  return data.costs.opex_total * Math.pow(1 + escalation, year - 1);
}

function getDiscountRate(data: UtilityData, year: number): number {
  const contractTerm = data.revenue.utility_procurement?.contract_term_years ?? 0;
  if (contractTerm > 0 && year <= contractTerm) {
    return data.risks.discount_rate;
  }
  return Math.max(data.risks.discount_rate, 0.08);
}

export function calculateNPV(data: UtilityData): NPVResults {
  // Development costs (pre-COD, simplified to t=0)
  const devCostFraction = 0.189;
  const devCosts = data.costs.capex_base * devCostFraction;
  const landOptionPerKw = (data.costs.land_option_annual / PROJECT_SIZE_KW) * 2.5;

  let npv = 0;
  npv -= devCosts;
  npv -= landOptionPerKw;
  npv -= data.costs.capex_total;

  const cashFlows: number[] = [];

  for (let year = 1; year <= USEFUL_LIFE_YEARS; year++) {
    const revenue = getRevenueForYear(data, year);
    const opex = getOpExForYear(data, year);
    const net = revenue - opex;
    cashFlows.push(net);

    let discountFactor = 1;
    for (let y = 1; y <= year; y++) {
      discountFactor *= (1 + getDiscountRate(data, y));
    }
    npv += net / discountFactor;
  }

  // Apply multipliers
  const multipliers = [
    data.state_factors.storage_mandate.npv_multiplier,
    data.state_factors.tax_incentives.npv_multiplier,
    data.state_factors.labor_requirements.npv_multiplier,
    data.state_factors.permitting.npv_multiplier,
    data.utility_factors.interconnection_quality.npv_multiplier,
    data.utility_factors.regulatory_posture.npv_multiplier,
  ];
  for (const m of multipliers) {
    npv *= m;
  }

  // Risk haircut
  npv *= (1 - data.risks.regulatory_uncertainty.npv_haircut);

  const npvPerKw = Math.round(npv);
  const npvTier: 1 | 2 | 3 | 4 | 5 =
    npvPerKw >= 1500 ? 1 :
    npvPerKw >= 1000 ? 2 :
    npvPerKw >= 500 ? 3 :
    npvPerKw >= 0 ? 4 : 5;

  // IRR approximation (Newton's method on NPV=0)
  const totalInvestment = devCosts + landOptionPerKw + data.costs.capex_total;
  const irr = approximateIRR(cashFlows, totalInvestment);

  // Payback
  let cumulative = -totalInvestment;
  let paybackYears = USEFUL_LIFE_YEARS;
  for (let i = 0; i < cashFlows.length; i++) {
    cumulative += cashFlows[i];
    if (cumulative >= 0) {
      paybackYears = i + 1 - (cumulative / cashFlows[i]);
      break;
    }
  }

  return {
    npv_per_kw: npvPerKw,
    npv_total_5mw: npvPerKw * PROJECT_SIZE_KW,
    irr: Math.round(irr * 1000) / 1000,
    payback_years: Math.round(paybackYears * 10) / 10,
    npv_tier: npvTier,
    sensitivity: {
      npv_capex_plus_10pct: Math.round(npvPerKw - data.costs.capex_total * 0.1),
      npv_revenue_minus_20pct: Math.round(npvPerKw * 0.65),
      npv_discount_8pct: Math.round(npvPerKw * 0.88),
    }
  };
}

function approximateIRR(cashFlows: number[], investment: number): number {
  let lo = -0.5, hi = 1.0;
  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    let npv = -investment;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + mid, i + 1);
    }
    if (npv > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
