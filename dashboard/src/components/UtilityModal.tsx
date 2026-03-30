import { useMemo } from 'react';
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { UtilityData } from '../types';
import { formatCurrency, MARKET_TYPE_LABELS, MARKET_TYPE_BADGE_COLORS, PV_TIER_COLORS } from '../utils/constants';
import { generateProjectTimeline } from '../utils/projectTimeline';

interface Props {
  utility: UtilityData;
  onClose: () => void;
}

const COST_COLORS = {
  development: '#9CA3AF',
  capex: '#EF4444',
  om: '#F59E0B',
  augmentation: '#FBBF24',
};

const REV_COLORS = {
  utilityProcurement: '#DC2626',
  capacity: '#3B82F6',
  arbitrage: '#A855F7',
  ancillary: '#06B6D4',
  stateIncentive: '#22C55E',
  demandResponse: '#F97316',
};

const fmtK = (v: number) => {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}M`;
  return `$${v.toFixed(0)}K`;
};

export default function UtilityModal({ utility, onClose }: Props) {
  const u = utility;
  const rev = u.revenue;
  const tierColor = PV_TIER_COLORS[u.pv_results.pv_tier];
  const timeline = useMemo(() => generateProjectTimeline(u), [u]);

  // Determine which revenue labels to show based on what's nonzero
  const hasUtilityProcurement = rev.utility_procurement !== null;
  const hasCapacity = !!(rev.iso_capacity_market?.value);
  const hasArbitrage = !!(rev.energy_arbitrage?.value);
  const hasAncillary = !!(rev.ancillary_services?.value);
  const hasStateIncentive = !!(rev.state_incentives?.value);
  const hasDR = !!(rev.demand_response?.value);

  // COD year index for reference line
  const codIdx = timeline.findIndex(d => d.phase === 'operations');
  const codYear = codIdx >= 0 ? timeline[codIdx].calendarYear : undefined;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between rounded-t-xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Mammoth Summit Power — {u.state} project economics
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              5 MW / 20 MWh · {u.utility_short_name} distribution interconnect · nominal USD thousands · {timeline[0].calendarYear}–{timeline[timeline.length - 1].calendarYear}
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-xl font-bold" style={{ color: tierColor.color }}>
              {formatCurrency(u.pv_results.pv_total)}
            </div>
            <div className="text-xs text-gray-500">20-yr PV of Revenue</div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${MARKET_TYPE_BADGE_COLORS[u.market_type]}`}>
              {MARKET_TYPE_LABELS[u.market_type]}
            </span>
          </div>
        </div>

        {/* Phase bar */}
        <div className="flex text-xs font-semibold tracking-wider">
          <div className="bg-gray-200 text-gray-600 px-4 py-1.5 uppercase">Development</div>
          <div className="bg-red-100 text-red-700 px-3 py-1.5 uppercase">COD</div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 flex-1 uppercase">
            Operations {codYear}–{timeline[timeline.length - 1].calendarYear}
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Chart 1: Annual Costs */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              1 · Annual Costs ($K)
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-1">
              <LegendDot color={COST_COLORS.development} label="Development" />
              <LegendDot color={COST_COLORS.capex} label="Capex" />
              <LegendDot color={COST_COLORS.om} label="O&M" />
              <LegendDot color={COST_COLORS.augmentation} label="Augmentation" />
              <span className="text-gray-400">--- Cost range</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={timeline} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="calendarYear" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtK} />
                <Tooltip formatter={(v) => fmtK(Number(v))} labelFormatter={(l) => `Year ${l}`} />
                <Area dataKey="costRangeHigh" stroke="none" fill="#FDE68A" fillOpacity={0.3} />
                <Area dataKey="costRangeLow" stroke="none" fill="#fff" fillOpacity={1} />
                <Bar dataKey="costDevelopment" stackId="cost" fill={COST_COLORS.development} />
                <Bar dataKey="costCapex" stackId="cost" fill={COST_COLORS.capex} />
                <Bar dataKey="costOM" stackId="cost" fill={COST_COLORS.om} />
                <Bar dataKey="costAugmentation" stackId="cost" fill={COST_COLORS.augmentation} />
                {codYear && <ReferenceLine x={codYear} stroke="#999" strokeDasharray="3 3" />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Annual Revenue */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              2 · Annual Revenue ($K)
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-1 flex-wrap">
              {hasStateIncentive && <LegendDot color={REV_COLORS.stateIncentive} label="ITC + State incentive" />}
              {!hasStateIncentive && <LegendDot color={REV_COLORS.stateIncentive} label="ITC" />}
              {hasCapacity && <LegendDot color={REV_COLORS.capacity} label={`${u.iso_rto} capacity`} />}
              {hasAncillary && <LegendDot color={REV_COLORS.ancillary} label="Regulation" />}
              {hasArbitrage && <LegendDot color={REV_COLORS.arbitrage} label={`Arbitrage (${u.utility_short_name})`} />}
              {hasUtilityProcurement && <LegendDot color={REV_COLORS.utilityProcurement} label={rev.utility_procurement!.source.split('(')[0].trim()} />}
              {hasDR && <LegendDot color={REV_COLORS.demandResponse} label={rev.demand_response?.programs?.[0] ?? 'DR'} />}
              <span className="text-gray-400">--- Revenue range</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={timeline} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="calendarYear" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtK} />
                <Tooltip formatter={(v) => fmtK(Number(v))} labelFormatter={(l) => `Year ${l}`} />
                <Area dataKey="revRangeHigh" stroke="none" fill="#BBF7D0" fillOpacity={0.3} />
                <Area dataKey="revRangeLow" stroke="none" fill="#fff" fillOpacity={1} />
                <Bar dataKey="revStateIncentive" stackId="rev" fill={REV_COLORS.stateIncentive} />
                {hasCapacity && <Bar dataKey="revCapacity" stackId="rev" fill={REV_COLORS.capacity} />}
                {hasAncillary && <Bar dataKey="revAncillary" stackId="rev" fill={REV_COLORS.ancillary} />}
                {hasArbitrage && <Bar dataKey="revArbitrage" stackId="rev" fill={REV_COLORS.arbitrage} />}
                {hasUtilityProcurement && <Bar dataKey="revUtilityProcurement" stackId="rev" fill={REV_COLORS.utilityProcurement} />}
                {hasDR && <Bar dataKey="revDemandResponse" stackId="rev" fill={REV_COLORS.demandResponse} />}
                {codYear && <ReferenceLine x={codYear} stroke="#999" strokeDasharray="3 3" />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Net Cash Flow + Cumulative */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              3 · Net Annual Cash Flow · Cumulative on Right Axis ($K)
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-1">
              <LegendDot color="#10B981" label="Net cash flow" />
              <span className="text-gray-400">--- Confidence band</span>
              <span className="text-amber-500">--- Cumulative (right)</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={timeline} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="calendarYear" tick={{ fontSize: 10 }} interval={2} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={fmtK} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#F59E0B' }} tickFormatter={fmtK} />
                <Tooltip formatter={(v) => fmtK(Number(v))} labelFormatter={(l) => `Year ${l}`} />
                <ReferenceLine yAxisId="left" y={0} stroke="#ddd" />
                <Area yAxisId="left" dataKey="cashFlowRangeHigh" stroke="none" fill="#A7F3D0" fillOpacity={0.3} />
                <Area yAxisId="left" dataKey="cashFlowRangeLow" stroke="none" fill="#fff" fillOpacity={1} />
                <Bar yAxisId="left" dataKey="netCashFlow" fill="#10B981" />
                <Line yAxisId="right" dataKey="cumulative" type="monotone" stroke="#F59E0B" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                {codYear && <ReferenceLine yAxisId="left" x={codYear} stroke="#999" strokeDasharray="3 3" />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Utility-specific assumptions */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Utility-Specific Assumptions
            </h3>

            <div className="text-sm">
              <h4 className="font-semibold text-gray-900 mb-2">Revenue Stack ($/kW-yr)</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {hasUtilityProcurement && (
                  <AssumptionRow
                    label={rev.utility_procurement!.source.split('(')[0].trim()}
                    value={`$${rev.utility_procurement!.value}`}
                    detail={`${rev.utility_procurement!.contract_term_years}yr term, ${(rev.utility_procurement!.escalation_rate * 100).toFixed(1)}% esc.`}
                  />
                )}
                {hasCapacity && <AssumptionRow label={`${u.iso_rto} capacity`} value={`$${rev.iso_capacity_market.value}`} detail={`${((rev.iso_capacity_market.erosion_rate ?? 0) * 100).toFixed(0)}%/yr erosion`} />}
                {hasArbitrage && <AssumptionRow label="Energy arbitrage" value={`$${rev.energy_arbitrage.value}`} detail={`${((rev.energy_arbitrage.erosion_rate ?? 0) * 100).toFixed(0)}%/yr erosion`} />}
                {hasAncillary && <AssumptionRow label="Ancillary services" value={`$${rev.ancillary_services.value}`} detail={`${((rev.ancillary_services.erosion_rate ?? 0) * 100).toFixed(0)}%/yr erosion`} />}
                {hasStateIncentive && <AssumptionRow label="State incentives" value={`$${rev.state_incentives.value}`} detail={rev.state_incentives.programs?.join(', ')} />}
                {hasDR && <AssumptionRow label={rev.demand_response?.programs?.[0] ?? 'DR'} value={`$${rev.demand_response!.value}`} detail={rev.demand_response?.notes} />}
              </div>
            </div>

            {/* State & utility factors */}
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Modifiers Applied</h4>
              <div className="flex flex-wrap gap-2">
                {u.state_factors.storage_mandate.exists && (
                  <ModifierBadge label={`Storage mandate: ${u.state_factors.storage_mandate.target_mw}MW by ${u.state_factors.storage_mandate.target_year}`} multiplier={u.state_factors.storage_mandate.npv_multiplier} />
                )}
                {u.state_factors.tax_incentives.npv_multiplier !== 1.0 && (
                  <ModifierBadge label="Tax incentives" multiplier={u.state_factors.tax_incentives.npv_multiplier} />
                )}
                {u.state_factors.labor_requirements.npv_multiplier !== 1.0 && (
                  <ModifierBadge label={u.state_factors.labor_requirements.prevailing_wage ? 'Prevailing wage' : 'Labor requirements'} multiplier={u.state_factors.labor_requirements.npv_multiplier} />
                )}
                {u.state_factors.permitting.npv_multiplier !== 1.0 && (
                  <ModifierBadge label="Permitting" multiplier={u.state_factors.permitting.npv_multiplier} />
                )}
                {u.utility_factors.interconnection_quality.npv_multiplier !== 1.0 && (
                  <ModifierBadge label={`IX Tier ${u.utility_factors.interconnection_quality.tier}`} multiplier={u.utility_factors.interconnection_quality.npv_multiplier} />
                )}
                {u.utility_factors.regulatory_posture.npv_multiplier !== 1.0 && (
                  <ModifierBadge label={`Regulatory: ${u.utility_factors.regulatory_posture.category}`} multiplier={u.utility_factors.regulatory_posture.npv_multiplier} />
                )}
                {u.risks.regulatory_uncertainty.npv_haircut > 0 && (
                  <ModifierBadge label="Regulatory risk" multiplier={1 - u.risks.regulatory_uncertainty.npv_haircut} />
                )}
              </div>
            </div>

            {/* Development context */}
            <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Development Status</h4>
                <div className="text-gray-700 space-y-1">
                  <div><span className="text-gray-500">Active RFP:</span> {u.development_status.active_rfp}</div>
                  <div><span className="text-gray-500">Mammoth sites:</span> {u.development_status.mammoth_sites}</div>
                  {u.development_status.notes && <div className="text-gray-500 italic text-xs">{u.development_status.notes}</div>}
                </div>
              </div>
              {u.development_status.key_dates && u.development_status.key_dates.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Key Dates</h4>
                  <div className="space-y-1">
                    {u.development_status.key_dates.map((d, i) => (
                      <div key={i} className="text-xs flex gap-2">
                        <span className="text-gray-400 shrink-0">{d.date}</span>
                        <span className="text-gray-700">{d.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom assumptions note */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
            Assumptions: COD {codYear} · ITC 30% x {formatCurrency(u.costs.capex_total * 5000)} capex
            {rev.utility_procurement && ` · ${rev.utility_procurement.source}`}
            {hasCapacity && ` · ${u.iso_rto} capacity $${rev.iso_capacity_market.value}/kW-yr`}
            {hasDR && ` · ${rev.demand_response?.programs?.[0]} $${rev.demand_response?.value}/kW-yr`}
            · Confidence bands: capex ±15%, merchant revenues ±25%
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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function AssumptionRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <div className="flex justify-between">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      {detail && <div className="text-xs text-gray-400">{detail}</div>}
    </div>
  );
}

function ModifierBadge({ label, multiplier }: { label: string; multiplier: number }) {
  const pct = ((multiplier - 1) * 100);
  const isPositive = pct >= 0;
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {label}: {isPositive ? '+' : ''}{pct.toFixed(0)}%
    </span>
  );
}
