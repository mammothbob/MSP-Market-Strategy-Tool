import type { UtilityData } from '../types';
import { formatCurrency, MARKET_TYPE_LABELS, MARKET_TYPE_BADGE_COLORS, NPV_TIER_COLORS } from '../utils/constants';

interface Props {
  utility: UtilityData;
  onClose: () => void;
}

export default function UtilityModal({ utility, onClose }: Props) {
  const u = utility;
  const rev = u.revenue;
  const tierColor = NPV_TIER_COLORS[u.npv_results.npv_tier];

  // Revenue items for contract period
  const contractRevItems = [
    rev.utility_procurement && { label: 'Utility Procurement', value: rev.utility_procurement.value, source: rev.utility_procurement.source },
    rev.iso_capacity_market?.value && { label: 'ISO Capacity Market', value: rev.iso_capacity_market.value, source: rev.iso_capacity_market.source },
    rev.energy_arbitrage?.value && { label: 'Energy Arbitrage', value: rev.energy_arbitrage.value, source: rev.energy_arbitrage.source },
    rev.ancillary_services?.value && { label: 'Ancillary Services', value: rev.ancillary_services.value, source: rev.ancillary_services.source },
    rev.state_incentives?.value && { label: 'State Incentives', value: rev.state_incentives.value },
    rev.demand_response?.value && { label: 'Demand Response', value: rev.demand_response.value, source: rev.demand_response.programs?.join(', ') },
  ].filter(Boolean) as { label: string; value: number; source?: string }[];

  const totalContractRev = contractRevItems.reduce((s, i) => s + i.value, 0);

  // Merchant period: same minus utility procurement
  const merchantRevItems = contractRevItems.filter(i => i.label !== 'Utility Procurement');
  const totalMerchantRev = merchantRevItems.reduce((s, i) => s + i.value, 0);

  const maxRevValue = Math.max(...contractRevItems.map(i => i.value), 1);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between rounded-t-xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{u.utility_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{u.state} · {u.iso_rto}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${MARKET_TYPE_BADGE_COLORS[u.market_type]}`}>
                {MARKET_TYPE_LABELS[u.market_type]}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: tierColor.color }}>
              {formatCurrency(u.npv_results.npv_per_kw)}/kW
            </div>
            <div className="text-xs text-gray-500">{tierColor.label}</div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Revenue breakdown */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Revenue Breakdown ($/kW-year)
              {rev.utility_procurement && (
                <span className="font-normal text-gray-500 ml-2">Contract Period: Years 1–{rev.utility_procurement.contract_term_years}</span>
              )}
            </h3>
            <div className="space-y-2">
              {contractRevItems.map(item => (
                <RevenueBar key={item.label} label={item.label} value={item.value} max={maxRevValue} source={item.source} />
              ))}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-semibold">
                <span>Total (Contract Period)</span>
                <span>{formatCurrency(totalContractRev)}/kW-yr</span>
              </div>
            </div>

            {rev.utility_procurement && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-500 mb-2">
                  Merchant Period: Years {rev.utility_procurement.contract_term_years + 1}–20
                </h4>
                <div className="space-y-1">
                  {merchantRevItems.map(item => (
                    <RevenueBar key={item.label} label={item.label} value={item.value} max={maxRevValue} source={item.source} small />
                  ))}
                  <div className="border-t border-gray-200 pt-1 flex justify-between text-sm font-semibold">
                    <span>Total (Merchant Period)</span>
                    <span>{formatCurrency(totalMerchantRev)}/kW-yr</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cost summary */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Cost Summary</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <CostRow label="Base CapEx" value={`${formatCurrency(u.costs.capex_base)}/kW`} />
              <CostRow label="Total CapEx" value={`${formatCurrency(u.costs.capex_total)}/kW`} />
              <CostRow label="Total for 5 MW" value={formatCurrency(u.costs.capex_total * 5000)} />
              <CostRow label="OpEx (Year 1)" value={`${formatCurrency(u.costs.opex_total, 2)}/kW-yr`} />
              <CostRow label="Land Option" value={`${formatCurrency(u.costs.land_option_annual)}/yr`} />
              <CostRow label="Dev Timeline" value={`${u.costs.development_timeline_months} months`} />
            </div>
          </div>

          {/* NPV & Sensitivity */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">NPV Analysis</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <CostRow label="20-Year NPV" value={`${formatCurrency(u.npv_results.npv_per_kw)}/kW`} bold />
              <CostRow label="Total NPV (5 MW)" value={formatCurrency(u.npv_results.npv_total_5mw)} bold />
              <CostRow label="IRR" value={`${(u.npv_results.irr * 100).toFixed(1)}%`} />
              <CostRow label="Payback Period" value={`${u.npv_results.payback_years} years`} />
            </div>
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">Sensitivity Analysis</h4>
              <div className="space-y-1 text-sm">
                <SensitivityRow
                  label="CapEx +10%"
                  value={u.npv_results.sensitivity.npv_capex_plus_10pct}
                  base={u.npv_results.npv_per_kw}
                />
                <SensitivityRow
                  label="Revenue -20%"
                  value={u.npv_results.sensitivity.npv_revenue_minus_20pct}
                  base={u.npv_results.npv_per_kw}
                />
                <SensitivityRow
                  label="Discount Rate 8%"
                  value={u.npv_results.sensitivity.npv_discount_8pct}
                  base={u.npv_results.npv_per_kw}
                />
              </div>
            </div>
          </div>

          {/* Key factors */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Key Factors</h3>
            <div className="space-y-1.5 text-sm">
              {rev.utility_procurement && (
                <Factor positive label={`Utility procurement: ${rev.utility_procurement.source}`} />
              )}
              {u.iso_rto !== 'non-ISO' && (
                <Factor positive label={`${u.iso_rto} wholesale market access`} />
              )}
              {u.state_factors.storage_mandate.exists && (
                <Factor positive label={`Storage mandate: ${u.state_factors.storage_mandate.target_mw} MW by ${u.state_factors.storage_mandate.target_year}`} />
              )}
              {u.state_factors.tax_incentives.property_tax_exemption && (
                <Factor positive label="Property tax exemption" />
              )}
              {u.utility_factors.interconnection_quality.tier === 1 && (
                <Factor positive label="Tier 1 interconnection process" />
              )}
              {u.utility_factors.regulatory_posture.category === 'supportive' && (
                <Factor positive label="Supportive regulatory environment" />
              )}
              {u.state_factors.labor_requirements.prevailing_wage && (
                <Factor negative label="Prevailing wage requirements" />
              )}
              {u.utility_factors.interconnection_quality.tier >= 3 && (
                <Factor negative label={`Tier ${u.utility_factors.interconnection_quality.tier} interconnection (slow/costly)`} />
              )}
              {u.risks.regulatory_uncertainty.npv_haircut > 0 && (
                <Factor warning label={u.risks.regulatory_uncertainty.description ?? 'Regulatory uncertainty'} />
              )}
              {rev.utility_procurement?.status && (
                <Factor warning label={`Status: ${rev.utility_procurement.status}`} />
              )}
            </div>
          </div>

          {/* Development context */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Development Context</h3>
            <div className="text-sm space-y-1">
              <div className="text-gray-700"><span className="font-medium">Active RFP:</span> {u.development_status.active_rfp}</div>
              <div className="text-gray-700"><span className="font-medium">Mammoth sites:</span> {u.development_status.mammoth_sites}</div>
              {u.development_status.notes && (
                <div className="text-gray-500 italic">{u.development_status.notes}</div>
              )}
            </div>
            {u.development_status.key_dates && u.development_status.key_dates.length > 0 && (
              <div className="mt-3 space-y-1">
                <h4 className="text-xs font-semibold text-gray-500">Key Dates</h4>
                {u.development_status.key_dates.map((d, i) => (
                  <div key={i} className="text-sm flex gap-3">
                    <span className="text-gray-400 shrink-0">{d.date}</span>
                    <span className="text-gray-700">{d.event}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function RevenueBar({ label, value, max, source, small }: { label: string; value: number; max: number; source?: string; small?: boolean }) {
  const pct = (value / max) * 100;
  return (
    <div className={small ? 'text-xs' : 'text-sm'}>
      <div className="flex justify-between mb-0.5">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium">{formatCurrency(value)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full" style={{ height: small ? 6 : 8 }}>
        <div
          className="bg-green-500 rounded-full h-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {source && <div className="text-xs text-gray-400 mt-0.5">{source}</div>}
    </div>
  );
}

function CostRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={bold ? 'font-bold text-gray-900' : 'text-gray-900'}>{value}</span>
    </div>
  );
}

function SensitivityRow({ label, value, base }: { label: string; value: number; base: number }) {
  const pctChange = ((value - base) / base) * 100;
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span>
        <span className="font-medium">{formatCurrency(value)}/kW</span>
        <span className={`ml-2 text-xs ${pctChange < 0 ? 'text-red-500' : 'text-green-600'}`}>
          ({pctChange > 0 ? '+' : ''}{pctChange.toFixed(0)}%)
        </span>
      </span>
    </div>
  );
}

function Factor({ label, positive, negative }: { label: string; positive?: boolean; negative?: boolean; warning?: boolean }) {
  const icon = positive ? '✓' : negative ? '✗' : '⚠';
  const color = positive ? 'text-green-600' : negative ? 'text-red-500' : 'text-amber-500';
  return (
    <div className="flex items-start gap-2">
      <span className={`${color} font-bold shrink-0`}>{icon}</span>
      <span className="text-gray-700">{label}</span>
    </div>
  );
}
