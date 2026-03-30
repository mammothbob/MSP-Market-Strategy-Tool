import { useState, useCallback } from 'react';
import MapView from './components/MapView';
import FilterSidebar from './components/FilterSidebar';
import StatsSidebar from './components/StatsSidebar';
import UtilityModal from './components/UtilityModal';
import BaseAssumptionsModal from './components/BaseAssumptionsModal';
import { utilities } from './data/utilities';
import { useFilters } from './hooks/useFilters';
import type { UtilityData } from './types';
import { formatCurrency } from './utils/constants';

function App() {
  const {
    filters, filteredUtilities, availableStates,
    toggleLayer, setIsoFilter, setStateFilter,
    toggleNpvTier, toggleMarketType, resetFilters,
  } = useFilters(utilities);

  const [selectedUtility, setSelectedUtility] = useState<UtilityData | null>(null);
  const [showBaseAssumptions, setShowBaseAssumptions] = useState(false);

  const handleUtilityClick = useCallback((utility: UtilityData) => {
    setSelectedUtility(utility);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedUtility(null);
  }, []);

  const tier1Utilities = utilities.filter(u => u.pv_results.pv_tier === 1);
  const avgTier1PV = tier1Utilities.length > 0
    ? Math.round(tier1Utilities.reduce((s, u) => s + u.pv_results.pv_total, 0) / tier1Utilities.length)
    : 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            MSP Market Research Dashboard
          </h1>
          <p className="text-xs text-gray-500">
            Distribution-Connected 5 MW / 20 MWh Projects
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <HeaderStat label="Utilities Modeled" value={String(utilities.length)} />
          <HeaderStat label="Avg PV Rev (Tier 1)" value={formatCurrency(avgTier1PV)} />
          <button
            onClick={() => setShowBaseAssumptions(true)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors"
          >
            Base Assumptions
          </button>
          <div className="text-xs text-gray-400">Data as of Mar 29, 2026</div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <FilterSidebar
          filters={filters}
          availableStates={availableStates}
          toggleLayer={toggleLayer}
          setIsoFilter={setIsoFilter}
          setStateFilter={setStateFilter}
          toggleNpvTier={toggleNpvTier}
          toggleMarketType={toggleMarketType}
          resetFilters={resetFilters}
        />

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            filters={filters}
            filteredUtilities={filteredUtilities}
            utilities={utilities}
            onUtilityClick={handleUtilityClick}
          />
        </div>

        {/* Right sidebar */}
        <StatsSidebar
          filteredUtilities={filteredUtilities}
          allUtilities={utilities}
          onUtilityClick={handleUtilityClick}
        />
      </div>

      {/* Modals */}
      {selectedUtility && (
        <UtilityModal
          utility={selectedUtility}
          onClose={handleCloseModal}
        />
      )}
      {showBaseAssumptions && (
        <BaseAssumptionsModal onClose={() => setShowBaseAssumptions(false)} />
      )}
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

export default App;
