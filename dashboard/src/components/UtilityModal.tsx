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

// Default colors for revenue streams (used when v2 streams don't specify)
const DEFAULT_STREAM_COLORS = [
  '#22C55E', '#3B82F6', '#06B6D4', '#A855F7', '#DC2626', '#F97316', '#86EFAC', '#FCA5A5',
];

const fmtK = (v: number) => {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}M`;
  return `$${v.toFixed(0)}K`;
};

export default function UtilityModal({ utility, onClose }: Props) {
  const u = utility;
  const tierColor = PV_TIER_COLORS[u.pv_results.pv_tier];
  const timeline = useMemo(() => generateProjectTimeline(u), [u]);

  // Collect all unique revenue stream names from the timeline
  const streamNames = useMemo(() => {
    const names = new Set<string>();
    for (const row of timeline) {
      for (const key of Object.keys(row.revenueByStream)) {
        names.add(key);
      }
    }
    return [...names];
  }, [timeline]);

  // Build color map for streams
  const streamColors = useMemo(() => {
    const colors: Record<string, string> = {};
    if (u.revenue_v2) {
      for (const s of u.revenue_v2.streams) {
        colors[s.name] = s.color;
      }
    }
    // Assign default colors to any streams not in v2
    let ci = 0;
    for (const name of streamNames) {
      if (!colors[name]) {
        colors[name] = DEFAULT_STREAM_COLORS[ci % DEFAULT_STREAM_COLORS.length];
        ci++;
      }
    }
    return colors;
  }, [u.revenue_v2, streamNames]);

  // Flatten revenueByStream into chart-friendly data
  const chartData = useMemo(() => {
    return timeline.map(row => ({
      ...row,
      ...row.revenueByStream,
    }));
  }, [timeline]);

  const codIdx = timeline.findIndex(d => d.phase === 'operations');
  const codYear = codIdx >= 0 ? timeline[codIdx].calendarYear : undefined;

  // Revenue summary table (from v2 streams or legacy)
  const revenueTable = useMemo(() => {
    if (u.revenue_v2) {
      return u.revenue_v2.streams.filter(s => (s.amount ?? 0) > 0 || (s.near_term_annual ?? 0) > 0);
    }
    return null;
  }, [u.revenue_v2]);

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
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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

          {/* Chart 2: Annual Revenue (dynamic streams) */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              2 · Annual Revenue ($K)
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-1 flex-wrap">
              {streamNames.map(name => (
                <LegendDot key={name} color={streamColors[name]} label={name} />
              ))}
              <span className="text-gray-400">--- Revenue range</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="calendarYear" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtK} />
                <Tooltip formatter={(v) => fmtK(Number(v))} labelFormatter={(l) => `Year ${l}`} />
                <Area dataKey="revRangeHigh" stroke="none" fill="#BBF7D0" fillOpacity={0.3} />
                <Area dataKey="revRangeLow" stroke="none" fill="#fff" fillOpacity={1} />
                {streamNames.map(name => (
                  <Bar key={name} dataKey={name} stackId="rev" fill={streamColors[name]} />
                ))}
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
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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

          {/* Revenue Summary Table */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Summary Revenue Stack
            </h3>
            {revenueTable ? (
              /* V2: structured table matching user's format */
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                      <th className="text-left py-2 pr-4 font-semibold">Revenue Stream</th>
                      <th className="text-right py-2 px-3 font-semibold">One-Time</th>
                      <th className="text-right py-2 px-3 font-semibold">Annual (Near)</th>
                      <th className="text-right py-2 px-3 font-semibold">Annual (Long)</th>
                      <th className="text-left py-2 pl-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.revenue_v2!.streams.map((s, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 pr-4 font-medium text-gray-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </td>
                        <td className="text-right py-2 px-3 text-gray-700">
                          {s.type === 'one_time' && s.amount ? formatCurrency(s.amount) : '—'}
                        </td>
                        <td className="text-right py-2 px-3 text-gray-700">
                          {s.type === 'annual' && (s.near_term_annual ?? 0) > 0 ? formatCurrency(s.near_term_annual!) : s.type === 'one_time' ? '—' : '—'}
                        </td>
                        <td className="text-right py-2 px-3 text-gray-700">
                          {s.type === 'annual' && s.trend === 'tbd' ? 'TBD' :
                           s.type === 'annual' && (s.long_term_annual ?? 0) > 0 ? `~${formatCurrency(s.long_term_annual!)}` :
                           s.type === 'annual' && s.trend ? s.trend.charAt(0).toUpperCase() + s.trend.slice(1) :
                           '—'}
                        </td>
                        <td className="text-left py-2 pl-3 text-xs text-gray-500">{s.notes ?? ''}</td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="border-t-2 border-gray-300 font-semibold">
                      <td className="py-2 pr-4 text-gray-900">TOTAL (first year of ops)</td>
                      <td className="text-right py-2 px-3 text-gray-900">~{formatCurrency(u.revenue_v2!.one_time_total)}</td>
                      <td className="text-right py-2 px-3 text-gray-900">~{formatCurrency(u.revenue_v2!.first_year_total_annual)}</td>
                      <td className="text-right py-2 px-3 text-gray-500">Declining + stabilizing</td>
                      <td className="text-left py-2 pl-3 text-xs text-gray-400">Excludes MACRS PV benefit</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              /* Legacy: simple list */
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {streamNames.map(name => {
                  // Find first non-zero value in timeline for this stream
                  const firstVal = timeline.find(r => (r.revenueByStream[name] ?? 0) > 0);
                  return (
                    <div key={name} className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: streamColors[name] }} />
                        {name}
                      </span>
                      <span className="font-medium text-gray-900">
                        {firstVal ? fmtK(firstVal.revenueByStream[name]) + '/yr' : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Development context */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Development Status</h4>
                <div className="text-gray-700 space-y-1">
                  <div><span className="text-gray-500">Active RFP:</span> {u.development_status.active_rfp}</div>
                  <div><span className="text-gray-500">Mammoth sites:</span> {u.development_status.mammoth_sites}</div>
                  {u.development_status.notes && <div className="text-gray-500 italic text-xs">{u.development_status.notes}</div>}
                </div>
              </div>
              {u.development_status.key_dates && u.development_status.key_dates.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Key Dates</h4>
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

          {/* Assumptions footnote */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
            Assumptions: COD {codYear} · Discount rate 7% · Confidence bands: capex ±15%, revenues ±25%
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
