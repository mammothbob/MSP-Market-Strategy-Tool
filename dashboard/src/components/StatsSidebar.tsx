import { useState } from 'react';
import type { UtilityData } from '../types';
import { formatCurrency, MARKET_TYPE_LABELS, MARKET_TYPE_BADGE_COLORS } from '../utils/constants';

interface Props {
  filteredUtilities: UtilityData[];
  allUtilities: UtilityData[];
  onUtilityClick: (utility: UtilityData) => void;
}

export default function StatsSidebar({ filteredUtilities, allUtilities, onUtilityClick }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);

  const topUtilities = [...filteredUtilities]
    .sort((a, b) => b.pv_results.pv_total - a.pv_results.pv_total)
    .slice(0, 5);

  const tier1 = filteredUtilities.filter(u => u.pv_results.pv_tier === 1);
  const avgTier1 = tier1.length > 0
    ? Math.round(tier1.reduce((s, u) => s + u.pv_results.pv_total, 0) / tier1.length)
    : 0;

  // Collect upcoming dates across all filtered utilities
  const upcomingDates = filteredUtilities
    .flatMap(u => (u.development_status.key_dates ?? []).map(d => ({ ...d, utility: u.utility_short_name })))
    .filter(d => d.date >= '2026-03-30')
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Summary</h2>
      </div>

      {/* Quick stats */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Utilities Shown" value={String(filteredUtilities.length)} />
          <Stat label="Total Modeled" value={String(allUtilities.length)} />
          <Stat
            label="Avg PV Rev (Tier 1)"
            value={tier1.length > 0 ? formatCurrency(avgTier1) : '—'}
          />
          <div>
            <button
              onClick={() => setShowCalendar(true)}
              className="text-lg font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {upcomingDates.length}
            </button>
            <div className="text-xs text-gray-500">Key Dates</div>
          </div>
        </div>
      </div>

      {/* Top opportunities */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Opportunities</h3>
        <div className="space-y-2">
          {topUtilities.map((u, i) => (
            <button
              key={u.utility_id}
              onClick={() => onUtilityClick(u)}
              className="w-full text-left hover:bg-gray-50 rounded p-2 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-gray-400 mt-0.5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{u.utility_short_name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-semibold text-green-700">
                      {formatCurrency(u.pv_results.pv_total)}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${MARKET_TYPE_BADGE_COLORS[u.market_type]}`}>
                      {MARKET_TYPE_LABELS[u.market_type]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{u.state} · {u.iso_rto}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar popup */}
      {showCalendar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={() => setShowCalendar(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between rounded-t-xl">
              <h2 className="text-sm font-bold text-gray-900">Key Dates</h2>
              <button
                onClick={() => setShowCalendar(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-3">
              {upcomingDates.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No upcoming dates.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDates.map((d, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="shrink-0 w-16 text-center">
                        <div className="text-xs font-semibold text-blue-600 bg-blue-50 rounded px-1.5 py-1">
                          {formatDateShort(d.date)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{d.event}</div>
                        <div className="text-xs text-gray-500">{d.utility}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
