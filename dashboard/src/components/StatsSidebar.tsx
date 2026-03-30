import { useState, useMemo } from 'react';
import type { UtilityData } from '../types';
import { formatCurrency, MARKET_TYPE_LABELS, MARKET_TYPE_BADGE_COLORS } from '../utils/constants';

interface Props {
  filteredUtilities: UtilityData[];
  allUtilities: UtilityData[];
  onUtilityClick: (utility: UtilityData) => void;
}

export default function StatsSidebar({ filteredUtilities, onUtilityClick }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);

  const topUtilities = [...filteredUtilities]
    .sort((a, b) => b.pv_results.pv_total - a.pv_results.pv_total)
    .slice(0, 5);

  const upcomingDates = useMemo(() =>
    filteredUtilities
      .flatMap(u => (u.development_status.key_dates ?? []).map(d => ({ ...d, utility: u.utility_short_name })))
      .filter(d => d.date >= '2026-03-30')
      .sort((a, b) => a.date.localeCompare(b.date)),
    [filteredUtilities]
  );

  return (
    <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Summary</h2>
        <button
          onClick={() => setShowCalendar(true)}
          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded transition-colors flex items-center gap-1.5"
        >
          <CalendarIcon />
          Key Dates
        </button>
      </div>

      {/* Top opportunities */}
      <div className="p-4 flex-1">
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

      {/* Calendar modal */}
      {showCalendar && (
        <CalendarModal dates={upcomingDates} onClose={() => setShowCalendar(false)} />
      )}
    </div>
  );
}

// ── Monthly Calendar Modal ──────────────────────────────────────────────
interface CalendarDate {
  date: string;
  event: string;
  utility: string;
}

function CalendarModal({ dates, onClose }: { dates: CalendarDate[]; onClose: () => void }) {
  const [viewMonth, setViewMonth] = useState(() => {
    if (dates.length > 0) {
      const d = new Date(dates[0].date + 'T00:00:00');
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    return { year: 2026, month: 2 }; // March 2026
  });

  // Group dates by YYYY-MM-DD
  const dateMap = useMemo(() => {
    const m = new Map<string, CalendarDate[]>();
    for (const d of dates) {
      const key = d.date;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(d);
    }
    return m;
  }, [dates]);

  // Get months that have events for navigation dots
  const monthsWithEvents = useMemo(() => {
    const s = new Set<string>();
    for (const d of dates) {
      s.add(d.date.substring(0, 7));
    }
    return s;
  }, [dates]);

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewMonth.year, viewMonth.month, 1).getDay();
  const monthLabel = new Date(viewMonth.year, viewMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setViewMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  };
  const nextMonth = () => {
    setViewMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });
  };

  // Events for the currently viewed month
  const monthEvents = useMemo(() => {
    const prefix = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}`;
    return dates.filter(d => d.date.startsWith(prefix));
  }, [dates, viewMonth]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with month nav */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between rounded-t-xl">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="text-center">
            <h2 className="text-sm font-bold text-gray-900">{monthLabel}</h2>
            {monthsWithEvents.has(`${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}`) && (
              <div className="text-xs text-blue-600">{monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}</div>
            )}
          </div>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Calendar grid */}
        <div className="px-5 py-3">
          <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 text-center text-sm">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const events = dateMap.get(dateStr);
              const hasEvent = !!events;
              return (
                <div
                  key={day}
                  className={`py-1.5 rounded-lg relative ${hasEvent ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700'}`}
                  title={events?.map(e => `${e.event} (${e.utility})`).join('\n')}
                >
                  {day}
                  {hasEvent && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events list for this month */}
        {monthEvents.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100">
            <div className="space-y-2.5">
              {monthEvents.map((d, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="shrink-0 w-12 text-center">
                    <div className="text-xs font-semibold text-blue-600 bg-blue-50 rounded px-1.5 py-1">
                      {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">{d.event}</div>
                    <div className="text-xs text-gray-500">{d.utility}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
