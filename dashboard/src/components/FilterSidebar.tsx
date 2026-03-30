import type { FilterState, IsoRto } from '../types';
import { PV_TIER_COLORS, ISO_RTO_COLORS, MARKET_TYPE_LABELS } from '../utils/constants';

interface Props {
  filters: FilterState;
  availableStates: string[];
  toggleLayer: (layer: keyof FilterState['layers']) => void;
  setIsoFilter: (iso: IsoRto | 'all') => void;
  setStateFilter: (state: string) => void;
  toggleNpvTier: (tier: number) => void;
  toggleMarketType: (type: string) => void;
  resetFilters: () => void;
}

const ISO_OPTIONS: { value: IsoRto | 'all'; label: string }[] = [
  { value: 'all', label: 'All ISOs' },
  { value: 'PJM', label: 'PJM' },
  { value: 'NYISO', label: 'NYISO' },
  { value: 'ISO-NE', label: 'ISO-NE' },
  { value: 'non-ISO', label: 'Non-ISO' },
];

export default function FilterSidebar({
  filters, availableStates,
  toggleLayer, setIsoFilter, setStateFilter,
  toggleNpvTier, toggleMarketType, resetFilters,
}: Props) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Controls</h2>
      </div>

      {/* Layer visibility */}
      <Section title="Layers">
        <LayerToggle
          label="ISO/RTO Regions"
          checked={filters.layers.iso}
          onChange={() => toggleLayer('iso')}
        />
        <LayerToggle
          label="State Boundaries"
          checked={filters.layers.states}
          onChange={() => toggleLayer('states')}
        />
        <LayerToggle
          label="Utility Territories"
          checked={filters.layers.utilities}
          onChange={() => toggleLayer('utilities')}
        />
      </Section>

      {/* ISO Filter */}
      <Section title="ISO/RTO">
        <div className="space-y-1">
          {ISO_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setIsoFilter(opt.value)}
              className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-2 ${
                filters.isoFilter === opt.value
                  ? 'bg-blue-50 font-semibold text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.value !== 'all' && (
                <span
                  className="inline-block w-3 h-3 rounded-sm border border-blue-200"
                  style={{ backgroundColor: ISO_RTO_COLORS[opt.value] }}
                />
              )}
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      {/* State filter */}
      <Section title="State">
        <select
          value={filters.stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
        >
          <option value="all">All States</option>
          {availableStates.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Section>

      {/* PV Revenue Tier */}
      <Section title="PV Revenue Tier">
        <div className="space-y-1">
          {[1, 2, 3, 4].map(tier => (
            <label key={tier} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.npvTiers.has(tier)}
                onChange={() => toggleNpvTier(tier)}
                className="rounded"
              />
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: PV_TIER_COLORS[tier].color }}
              />
              <span className="text-gray-700">{PV_TIER_COLORS[tier].label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Market type */}
      <Section title="Market Type">
        <div className="space-y-1">
          {['contract_based', 'merchant_incentive'].map(type => (
            <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.marketTypes.has(type)}
                onChange={() => toggleMarketType(type)}
                className="rounded"
              />
              <span className="text-gray-700">{MARKET_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Reset */}
      <div className="p-4 mt-auto border-t border-gray-200">
        <button
          onClick={resetFilters}
          className="w-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

function LayerToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded" />
      <span className="text-gray-700">{label}</span>
    </label>
  );
}
