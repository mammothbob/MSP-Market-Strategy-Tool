import { useState, useCallback, useMemo } from 'react';
import type { FilterState, IsoRto, UtilityData } from '../types';

const DEFAULT_FILTERS: FilterState = {
  layers: { iso: true, states: true, utilities: true },
  opacity: { iso: 0.4, utilities: 0.85 },
  isoFilter: 'all',
  stateFilter: 'all',
  npvTiers: new Set([1, 2, 3]),
  marketTypes: new Set(['contract_based', 'merchant_incentive']),
};

export function useFilters(utilities: UtilityData[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const toggleLayer = useCallback((layer: keyof FilterState['layers']) => {
    setFilters(f => ({ ...f, layers: { ...f.layers, [layer]: !f.layers[layer] } }));
  }, []);

  const setIsoFilter = useCallback((iso: IsoRto | 'all') => {
    setFilters(f => ({ ...f, isoFilter: iso }));
  }, []);

  const setStateFilter = useCallback((state: string) => {
    setFilters(f => ({ ...f, stateFilter: state }));
  }, []);

  const toggleNpvTier = useCallback((tier: number) => {
    setFilters(f => {
      const next = new Set(f.npvTiers);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return { ...f, npvTiers: next };
    });
  }, []);

  const toggleMarketType = useCallback((type: string) => {
    setFilters(f => {
      const next = new Set(f.marketTypes);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { ...f, marketTypes: next };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const filteredUtilities = useMemo(() => {
    return utilities.filter(u => {
      if (filters.isoFilter !== 'all' && u.iso_rto !== filters.isoFilter) return false;
      if (filters.stateFilter !== 'all' && u.state_abbr !== filters.stateFilter) return false;
      if (!filters.npvTiers.has(u.pv_results.pv_tier)) return false;
      if (!filters.marketTypes.has(u.market_type)) return false;
      return true;
    });
  }, [utilities, filters]);

  const availableStates = useMemo(() => {
    const states = [...new Set(utilities.map(u => u.state_abbr))].sort();
    return states;
  }, [utilities]);

  return {
    filters,
    filteredUtilities,
    availableStates,
    toggleLayer,
    setIsoFilter,
    setStateFilter,
    toggleNpvTier,
    toggleMarketType,
    resetFilters,
  };
}
