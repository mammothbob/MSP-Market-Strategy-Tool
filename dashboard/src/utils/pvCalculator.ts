import type { UtilityData } from '../types';

const PROJECT_SIZE_KW = 5000;
const USEFUL_LIFE_YEARS = 20;
const DISCOUNT_RATE = 0.07;

export interface PVResult {
  pv_total: number;
  pv_tier: 1 | 2 | 3 | 4 | 5;
  yearly_revenue: number[];  // nominal $/yr for the 5 MW project
  yearly_pv: number[];       // discounted $/yr
}

export function calculatePVRevenue(data: UtilityData): PVResult {
  const contractTerm = data.revenue.utility_procurement?.contract_term_years ?? 0;
  const hasContract = data.revenue.utility_procurement !== null && contractTerm > 0;

  const yearlyRevenue: number[] = [];
  const yearlyPV: number[] = [];
  let pvTotal = 0;

  for (let t = 1; t <= USEFUL_LIFE_YEARS; t++) {
    let yearRev = 0; // $/kW

    // Contract period: procurement payment only (replaces ISO market participation)
    if (hasContract && t <= contractTerm) {
      const base = data.revenue.utility_procurement!.value;
      const esc = data.revenue.utility_procurement!.escalation_rate;
      yearRev += base * Math.pow(1 + esc, t - 1);
    }

    // Merchant period: ISO markets with erosion (erosion runs from year 1 of project)
    if (!hasContract || t > contractTerm) {
      if (data.revenue.iso_capacity_market?.value) {
        yearRev += data.revenue.iso_capacity_market.value * Math.pow(1 + (data.revenue.iso_capacity_market.erosion_rate ?? 0), t - 1);
      }
      if (data.revenue.energy_arbitrage?.value) {
        yearRev += data.revenue.energy_arbitrage.value * Math.pow(1 + (data.revenue.energy_arbitrage.erosion_rate ?? 0), t - 1);
      }
      if (data.revenue.ancillary_services?.value) {
        yearRev += data.revenue.ancillary_services.value * Math.pow(1 + (data.revenue.ancillary_services.erosion_rate ?? 0), t - 1);
      }
    }

    // State incentives and DR: available all years (independent of contract)
    if (data.revenue.state_incentives?.value) {
      yearRev += data.revenue.state_incentives.value;
    }
    if (data.revenue.demand_response?.value) {
      yearRev += data.revenue.demand_response.value;
    }

    const nominalTotal = yearRev * PROJECT_SIZE_KW;
    const discounted = nominalTotal / Math.pow(1 + DISCOUNT_RATE, t);

    yearlyRevenue.push(Math.round(nominalTotal));
    yearlyPV.push(Math.round(discounted));
    pvTotal += discounted;
  }

  // Apply risk haircut
  pvTotal *= (1 - data.risks.regulatory_uncertainty.npv_haircut);

  pvTotal = Math.round(pvTotal);

  const pv_tier: 1 | 2 | 3 | 4 | 5 =
    pvTotal >= 15_000_000 ? 1 :
    pvTotal >= 10_000_000 ? 2 :
    pvTotal >= 7_000_000 ? 3 :
    pvTotal >= 5_000_000 ? 4 : 5;

  return { pv_total: pvTotal, pv_tier, yearly_revenue: yearlyRevenue, yearly_pv: yearlyPV };
}
