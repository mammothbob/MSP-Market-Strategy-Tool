import type { UtilityData } from '../types';

export interface YearData {
  year: number;
  calendarYear: number;
  phase: 'development' | 'construction' | 'operations';
  revenueByStream: Record<string, number>;
  revTotal: number;
  revRangeLow: number;
  revRangeHigh: number;
  netCashFlow: number;
  cumulative: number;
  cashFlowRangeLow: number;
  cashFlowRangeHigh: number;
  costDevelopment: number;
  costCapex: number;
  costOM: number;
  costAugmentation: number;
  costTotal: number;
  costRangeLow: number;
  costRangeHigh: number;
}

const PROJECT_KW = 5000;
const OPEX_ESCALATION = 0.025;

export function generateProjectTimeline(utility: UtilityData): YearData[] {
  const devMonths = utility.costs.development_timeline_months;
  const devYears = Math.ceil(devMonths / 12);
  const totalYears = devYears + 20;
  const startYear = 2026;

  const streams = utility.revenue_v2?.streams ?? [];
  const useLegacy = !utility.revenue_v2;

  const timeline: YearData[] = [];
  let cumulative = 0;

  for (let i = 0; i <= totalYears; i++) {
    const calendarYear = startYear + i;
    const operatingYear = i - devYears;

    let phase: 'development' | 'construction' | 'operations' = 'operations';
    if (i < devYears - 1) phase = 'development';
    else if (i === devYears - 1 || i === devYears) phase = 'construction';

    // ── Costs ($K) ──
    let costDevelopment = 0;
    let costCapex = 0;
    let costOM = 0;
    let costAugmentation = 0;

    if (i < devYears) {
      costDevelopment = (utility.costs.land_option_annual + 150000) / 1000;
    }
    if (i === devYears - 1) {
      costCapex = (utility.costs.capex_total * PROJECT_KW * 0.3) / 1000;
    } else if (i === devYears) {
      costCapex = (utility.costs.capex_total * PROJECT_KW * 0.7) / 1000;
    }
    if (operatingYear >= 1) {
      costOM = (utility.costs.opex_total * PROJECT_KW * Math.pow(1 + OPEX_ESCALATION, operatingYear - 1)) / 1000;
      if (operatingYear === 10) costAugmentation = 1500;
    }

    const costTotal = costDevelopment + costCapex + costOM + costAugmentation;

    // ── Revenue ($K) ──
    const revenueByStream: Record<string, number> = {};
    let revTotal = 0;

    if (!useLegacy && streams.length > 0) {
      for (const stream of streams) {
        let val = 0;
        if (stream.type === 'one_time') {
          if (stream.timing === 'development' && i === 0 && stream.amount) {
            val = stream.amount / 1000;
          } else if (stream.timing === 'cod' && operatingYear === 1 && stream.amount) {
            val = stream.amount / 1000;
          } else if (!stream.timing && operatingYear === 1 && stream.amount) {
            val = stream.amount / 1000;
          }
        } else if (stream.type === 'annual' && operatingYear >= 1) {
          const base = (stream.near_term_annual ?? 0) / 1000;
          const rate = stream.annual_growth_rate ?? 0;
          val = base * Math.pow(1 + rate, operatingYear - 1);
        }
        if (val !== 0) {
          revenueByStream[stream.name] = rd(val);
          revTotal += val;
        }
      }
    } else if (operatingYear >= 1) {
      // Legacy model
      const rev = utility.revenue;
      const contractTerm = rev.utility_procurement?.contract_term_years ?? 0;
      const hasContract = rev.utility_procurement !== null && contractTerm > 0;

      if (hasContract && operatingYear <= contractTerm) {
        const base = rev.utility_procurement!.value;
        const esc = rev.utility_procurement!.escalation_rate;
        const val = (base * Math.pow(1 + esc, operatingYear - 1) * PROJECT_KW) / 1000;
        revenueByStream[rev.utility_procurement!.source.split('(')[0].trim()] = rd(val);
        revTotal += val;
      }
      if (!hasContract || operatingYear > contractTerm) {
        if (rev.iso_capacity_market?.value) {
          const val = (rev.iso_capacity_market.value * Math.pow(1 + (rev.iso_capacity_market.erosion_rate ?? 0), operatingYear - 1) * PROJECT_KW) / 1000;
          revenueByStream['Capacity'] = rd(val);
          revTotal += val;
        }
        if (rev.energy_arbitrage?.value) {
          const val = (rev.energy_arbitrage.value * Math.pow(1 + (rev.energy_arbitrage.erosion_rate ?? 0), operatingYear - 1) * PROJECT_KW) / 1000;
          revenueByStream['Arbitrage'] = rd(val);
          revTotal += val;
        }
        if (rev.ancillary_services?.value) {
          const val = (rev.ancillary_services.value * Math.pow(1 + (rev.ancillary_services.erosion_rate ?? 0), operatingYear - 1) * PROJECT_KW) / 1000;
          revenueByStream['Ancillary'] = rd(val);
          revTotal += val;
        }
      }
      if (rev.state_incentives?.value) {
        const val = (rev.state_incentives.value * PROJECT_KW) / 1000;
        revenueByStream['State Incentive'] = rd(val);
        revTotal += val;
      }
      if (rev.demand_response?.value) {
        const val = (rev.demand_response.value * PROJECT_KW) / 1000;
        revenueByStream[rev.demand_response.programs?.[0] ?? 'DR'] = rd(val);
        revTotal += val;
      }
      if (operatingYear === 1) {
        const itc = (utility.costs.capex_total * PROJECT_KW * 0.30) / 1000;
        revenueByStream['ITC'] = rd(itc);
        revTotal += itc;
      }
    }

    const netCashFlow = revTotal - costTotal;
    cumulative += netCashFlow;

    const costRangeLow = costTotal * 0.85;
    const costRangeHigh = costTotal * 1.15;
    const revRangeLow = revTotal * 0.75;
    const revRangeHigh = revTotal * 1.15;

    timeline.push({
      year: i,
      calendarYear,
      phase,
      revenueByStream,
      revTotal: rd(revTotal),
      revRangeLow: rd(revRangeLow),
      revRangeHigh: rd(revRangeHigh),
      netCashFlow: rd(netCashFlow),
      cumulative: rd(cumulative),
      cashFlowRangeLow: rd(revRangeLow - costRangeHigh),
      cashFlowRangeHigh: rd(revRangeHigh - costRangeLow),
      costDevelopment: rd(costDevelopment),
      costCapex: rd(costCapex),
      costOM: rd(costOM),
      costAugmentation: rd(costAugmentation),
      costTotal: rd(costTotal),
      costRangeLow: rd(costRangeLow),
      costRangeHigh: rd(costRangeHigh),
    });
  }

  return timeline;
}

function rd(v: number): number {
  return Math.round(v * 10) / 10;
}
