import type { FeatureCollection, Feature } from 'geojson';
import hifldTerritories from './utility_territories.json';
import isoBoundariesData from './iso_boundaries.json';
import stateBoundariesData from './state_boundaries.json';

// ── ISO/RTO Boundaries (from US Census state data) ──────────────────────
export const isoBoundaries = isoBoundariesData as FeatureCollection;

// ── US State Boundaries (US Census Bureau TIGER/Line via us-atlas) ──────
export const stateBoundaries = stateBoundariesData as FeatureCollection;

// ── Utility Service Territory Boundaries ─────────────────────────────────
// Real HIFLD boundaries for 8 utilities, approximate for JCP&L and National Grid
const hifldData = hifldTerritories as FeatureCollection;

// Approximate boundaries for utilities not in HIFLD dataset
const fallbackFeatures: Feature[] = [
  // National Grid - Central/Western Massachusetts (approximate)
  {
    type: "Feature",
    properties: { utility_id: "NGRID_MA" },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.3, 42.7], [-71.8, 42.7], [-71.8, 42.4], [-71.5, 42.2],
        [-71.4, 42.0], [-71.4, 41.8], [-71.8, 41.5], [-72.5, 41.5],
        [-73.0, 41.5], [-73.3, 42.0], [-73.3, 42.7]
      ]]
    }
  },
  // JCP&L - Western/Central NJ (approximate)
  {
    type: "Feature",
    properties: { utility_id: "JCPL_NJ" },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-75.2, 41.0], [-74.9, 41.1], [-74.8, 39.8], [-74.4, 39.8],
        [-74.3, 39.5], [-74.6, 39.4], [-75.0, 39.5], [-75.2, 39.8],
        [-75.3, 40.3], [-75.2, 41.0]
      ]]
    }
  },
];

export const utilityBoundaries: FeatureCollection = {
  type: "FeatureCollection",
  features: [...hifldData.features, ...fallbackFeatures],
};

// Helper to get utility feature by ID
export function getUtilityFeature(utilityId: string): Feature | undefined {
  return utilityBoundaries.features.find(
    f => f.properties?.utility_id === utilityId
  );
}
