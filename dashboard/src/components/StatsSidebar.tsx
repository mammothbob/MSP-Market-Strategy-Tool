import type { UtilityData } from '../types';
import { PV_TIER_COLORS, formatCurrency, MARKET_TYPE_LABELS, MARKET_TYPE_BADGE_COLORS } from '../utils/constants';

interface Props {
  filteredUtilities: UtilityData[];
  allUtilities: UtilityData[];
  onUtilityClick: (utility: UtilityData) => void;
}

export default function StatsSidebar({ filteredUtilities, allUtilities, onUtilityClick }: Props) {
  const tierGroups = [1, 2, 3].map(tier => {
    const inTier = filteredUtilities.filter(u => u.pv_results.pv_tier === tier);
    const avg = inTier.length > 0
      ? Math.round(inTier.reduce((s, u) => s + u.pv_results.pv_total, 0) / inTier.length)
      : 0;
    return { tier, count: inTier.length, avg };
  });

  const topUtilities = [...filteredUtilities]
    .sort((a, b) => b.pv_results.pv_total - a.pv_results.pv_total)
    .slice(0, 5);

  const totalSites = filteredUtilities.reduce((s, u) => s + u.development_status.mammoth_sites, 0);

  // Collect upcoming dates across all filtered utilities
  const upcomingDates = filteredUtilities
    .flatMap(u => (u.development_status.key_dates ?? []).map(d => ({ ...d, utility: u.utility_short_name })))
    .filter(d => d.date >= '2026-03-30')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

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
          <Stat label="Pipeline Sites" value={String(totalSites)} />
          <Stat
            label="Avg PV Rev (Tier 1)"
            value={tierGroups[0].count > 0 ? formatCurrency(tierGroups[0].avg) : '—'}
          />
        </div>
      </div>

      {/* NPV distribution */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">PV Revenue Distribution</h3>
        <div className="space-y-2">
          {tierGroups.map(({ tier, count, avg }) => (
            <div key={tier} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: PV_TIER_COLORS[tier].color }}
              />
              <span className="text-gray-600 flex-1">Tier {tier}</span>
              <span className="text-gray-500">{count}</span>
              {count > 0 && (
                <span className="text-gray-400 text-xs">avg {formatCurrency(avg)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top opportunities */}
      <div className="p-4 border-b border-gray-100">
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

      {/* Key dates */}
      {upcomingDates.length > 0 && (
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Dates</h3>
          <div className="space-y-2">
            {upcomingDates.map((d, i) => (
              <div key={i} className="text-sm">
                <div className="text-xs text-gray-400">{formatDate(d.date)}</div>
                <div className="text-gray-700">{d.event}</div>
                <div className="text-xs text-gray-500">{d.utility}</div>
              </div>
            ))}
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

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
