import type { FeatureCollection, Feature } from 'geojson';

// ── ISO/RTO Boundaries (simplified) ─────────────────────────────────────
export const isoBoundaries: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { iso: "PJM", name: "PJM Interconnection" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-90.5, 36.5], [-90.5, 42.5], [-86.0, 42.0], [-84.8, 41.7],
          [-83.5, 41.7], [-80.5, 42.3], [-79.8, 42.3], [-77.0, 42.0],
          [-75.5, 42.0], [-74.0, 41.5], [-74.0, 40.5], [-74.5, 39.5],
          [-75.0, 38.5], [-75.5, 38.0], [-76.0, 36.5], [-77.5, 36.5],
          [-80.0, 36.5], [-82.0, 36.5], [-84.0, 36.5], [-86.5, 36.5],
          [-90.5, 36.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { iso: "NYISO", name: "New York ISO" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-79.8, 42.3], [-79.8, 43.0], [-78.0, 43.5], [-76.0, 44.0],
          [-75.0, 45.0], [-73.3, 45.0], [-73.3, 42.0], [-74.0, 41.5],
          [-74.0, 40.5], [-73.7, 40.5], [-73.7, 40.6], [-74.0, 41.0],
          [-75.5, 42.0], [-77.0, 42.0], [-79.8, 42.3]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { iso: "ISO-NE", name: "ISO New England" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-73.7, 40.9], [-73.7, 42.0], [-73.3, 42.0], [-73.3, 45.0],
          [-71.5, 45.0], [-70.7, 43.2], [-69.8, 44.5], [-67.0, 44.8],
          [-66.9, 44.3], [-67.8, 43.5], [-69.5, 43.0], [-70.5, 42.0],
          [-71.0, 41.3], [-71.8, 41.3], [-72.0, 41.0], [-73.7, 40.9]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { iso: "CAISO", name: "California ISO" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-124.4, 42.0], [-124.2, 40.0], [-122.5, 37.8], [-122.0, 36.5],
          [-120.5, 35.0], [-118.5, 34.0], [-117.0, 32.5], [-114.6, 32.7],
          [-114.6, 34.5], [-117.5, 37.0], [-120.0, 39.0], [-121.0, 40.5],
          [-122.0, 42.0], [-124.4, 42.0]
        ]]
      }
    }
  ]
};

// ── US State Boundaries (simplified, contiguous states) ─────────────────
// Only states containing modeled utilities, plus neighbors for context
export const stateBoundaries: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // Maryland
    {
      type: "Feature",
      properties: { state: "MD", name: "Maryland" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-79.5, 39.7], [-79.0, 39.7], [-77.5, 39.3], [-76.2, 39.3],
          [-76.0, 39.5], [-75.8, 39.7], [-75.0, 38.5], [-75.6, 38.0],
          [-76.0, 38.0], [-76.3, 38.3], [-77.0, 38.4], [-77.2, 38.6],
          [-77.0, 38.9], [-77.2, 39.0], [-77.5, 39.1], [-78.0, 39.2],
          [-78.5, 39.5], [-79.5, 39.7]
        ]]
      }
    },
    // Washington
    {
      type: "Feature",
      properties: { state: "WA", name: "Washington" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-124.7, 48.4], [-123.0, 48.4], [-122.8, 49.0], [-117.0, 49.0],
          [-117.0, 46.0], [-117.0, 45.5], [-120.0, 45.5], [-122.8, 45.5],
          [-123.5, 46.3], [-124.0, 46.3], [-124.2, 47.0], [-124.7, 48.4]
        ]]
      }
    },
    // Illinois
    {
      type: "Feature",
      properties: { state: "IL", name: "Illinois" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-91.5, 42.5], [-87.5, 42.5], [-87.5, 41.7], [-87.5, 40.5],
          [-87.5, 39.0], [-88.0, 37.5], [-89.0, 37.0], [-89.5, 37.0],
          [-90.5, 38.0], [-90.7, 38.7], [-91.0, 39.5], [-91.2, 40.0],
          [-91.5, 40.5], [-91.0, 41.0], [-91.0, 42.0], [-91.5, 42.5]
        ]]
      }
    },
    // Massachusetts
    {
      type: "Feature",
      properties: { state: "MA", name: "Massachusetts" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-73.3, 42.7], [-72.0, 42.7], [-71.8, 42.7], [-71.0, 42.7],
          [-70.0, 42.7], [-69.9, 41.9], [-70.0, 41.6], [-70.7, 41.5],
          [-71.0, 41.8], [-71.2, 41.5], [-71.8, 41.3], [-73.0, 41.2],
          [-73.3, 42.0], [-73.3, 42.7]
        ]]
      }
    },
    // New Jersey
    {
      type: "Feature",
      properties: { state: "NJ", name: "New Jersey" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-75.6, 41.4], [-74.0, 41.4], [-74.0, 40.6], [-73.9, 40.3],
          [-74.2, 39.5], [-74.5, 39.0], [-75.0, 38.9], [-75.5, 39.5],
          [-75.2, 40.0], [-75.0, 40.4], [-75.2, 40.6], [-75.0, 41.0],
          [-75.6, 41.4]
        ]]
      }
    },
    // New York
    {
      type: "Feature",
      properties: { state: "NY", name: "New York" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-79.8, 42.3], [-79.8, 43.0], [-78.0, 43.5], [-76.0, 44.0],
          [-75.0, 45.0], [-73.3, 45.0], [-73.3, 42.7], [-73.3, 42.0],
          [-73.3, 41.2], [-74.0, 41.4], [-75.6, 41.4], [-76.0, 42.0],
          [-79.8, 42.3]
        ]]
      }
    },
    // Colorado
    {
      type: "Feature",
      properties: { state: "CO", name: "Colorado" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-109.05, 41.0], [-102.05, 41.0], [-102.05, 37.0],
          [-109.05, 37.0], [-109.05, 41.0]
        ]]
      }
    },
    // Virginia (context)
    {
      type: "Feature",
      properties: { state: "VA", name: "Virginia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-83.7, 36.6], [-79.5, 36.5], [-77.0, 36.5], [-75.9, 36.5],
          [-75.2, 37.2], [-75.8, 38.0], [-76.2, 38.3], [-77.0, 38.4],
          [-77.2, 38.6], [-77.0, 38.9], [-77.2, 39.0], [-77.5, 39.1],
          [-78.0, 39.2], [-78.5, 39.5], [-79.5, 39.7], [-80.5, 39.7],
          [-80.5, 39.0], [-82.0, 37.5], [-83.7, 36.6]
        ]]
      }
    },
    // Pennsylvania (context)
    {
      type: "Feature",
      properties: { state: "PA", name: "Pennsylvania" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-80.5, 42.3], [-79.8, 42.3], [-76.0, 42.0], [-75.6, 41.4],
          [-75.0, 41.0], [-75.2, 40.6], [-75.0, 40.4], [-75.2, 40.0],
          [-75.5, 39.9], [-76.0, 39.7], [-78.0, 39.7], [-79.5, 39.7],
          [-80.5, 39.7], [-80.5, 42.3]
        ]]
      }
    },
    // Connecticut (context)
    {
      type: "Feature",
      properties: { state: "CT", name: "Connecticut" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-73.7, 42.1], [-72.0, 42.0], [-71.8, 41.3], [-73.0, 41.2],
          [-73.7, 40.9], [-73.7, 42.1]
        ]]
      }
    },
    // Delaware (context)
    {
      type: "Feature",
      properties: { state: "DE", name: "Delaware" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-75.8, 39.7], [-75.5, 39.5], [-75.5, 38.9], [-75.0, 38.5],
          [-75.2, 38.5], [-75.8, 39.7]
        ]]
      }
    }
  ]
};

// ── Utility Service Territory Boundaries (simplified/approximate) ───────
// These will be replaced with real ORNL GeoJSON in Phase 2
export const utilityBoundaries: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // BGE - Baltimore metro area
    {
      type: "Feature",
      properties: { utility_id: "BGE_MD" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-77.0, 39.5], [-76.3, 39.5], [-76.2, 39.4], [-76.2, 39.1],
          [-76.3, 38.9], [-76.5, 38.7], [-76.8, 38.7], [-77.0, 38.9],
          [-77.1, 39.1], [-77.0, 39.3], [-77.0, 39.5]
        ]]
      }
    },
    // PSE - Puget Sound region
    {
      type: "Feature",
      properties: { utility_id: "PSE_WA" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-122.8, 48.5], [-122.0, 48.5], [-121.5, 48.0], [-121.5, 47.0],
          [-121.8, 46.8], [-122.2, 46.8], [-122.6, 47.0], [-122.8, 47.5],
          [-122.8, 48.5]
        ]]
      }
    },
    // ComEd - Northern Illinois / Chicago metro
    {
      type: "Feature",
      properties: { utility_id: "COMED_IL" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-90.5, 42.5], [-87.5, 42.5], [-87.5, 41.4], [-87.7, 41.0],
          [-88.0, 40.5], [-88.5, 40.2], [-89.5, 40.5], [-90.2, 41.0],
          [-90.5, 41.5], [-90.5, 42.5]
        ]]
      }
    },
    // Eversource - Eastern Massachusetts (Greater Boston, Cape Cod, SE MA)
    {
      type: "Feature",
      properties: { utility_id: "EVERSOURCE_MA" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.8, 42.7], [-70.8, 42.7], [-70.0, 42.5], [-69.9, 42.0],
          [-70.0, 41.6], [-70.7, 41.5], [-71.0, 41.8], [-71.2, 41.7],
          [-71.4, 42.0], [-71.5, 42.2], [-71.8, 42.4], [-71.8, 42.7]
        ]]
      }
    },
    // National Grid - Central/Western Massachusetts
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
    // PSE&G - Northern/Central New Jersey
    {
      type: "Feature",
      properties: { utility_id: "PSEG_NJ" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-74.9, 41.1], [-74.0, 41.1], [-74.0, 40.5], [-74.1, 40.0],
          [-74.4, 39.8], [-74.8, 39.8], [-75.0, 40.2], [-75.0, 40.6],
          [-74.9, 41.1]
        ]]
      }
    },
    // JCP&L - Western/Central NJ
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
    // Atlantic City Electric - Southern NJ
    {
      type: "Feature",
      properties: { utility_id: "ACE_NJ" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-74.6, 39.4], [-74.3, 39.5], [-74.1, 39.3], [-74.0, 39.0],
          [-74.5, 38.9], [-75.0, 38.9], [-75.5, 39.5], [-75.0, 39.5],
          [-74.6, 39.4]
        ]]
      }
    },
    // ConEd - NYC + Westchester
    {
      type: "Feature",
      properties: { utility_id: "CONED_NY" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-74.0, 41.1], [-73.5, 41.2], [-73.6, 40.9], [-73.7, 40.6],
          [-74.0, 40.5], [-74.3, 40.5], [-74.0, 40.8], [-74.0, 41.1]
        ]]
      }
    },
    // Xcel Energy - Colorado Front Range
    {
      type: "Feature",
      properties: { utility_id: "XCEL_CO" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-105.5, 40.8], [-104.5, 40.8], [-104.2, 40.2], [-104.2, 39.3],
          [-104.5, 38.8], [-105.0, 38.8], [-105.5, 39.3], [-105.5, 40.0],
          [-105.5, 40.8]
        ]]
      }
    }
  ]
};

// Helper to get utility feature by ID
export function getUtilityFeature(utilityId: string): Feature | undefined {
  return utilityBoundaries.features.find(
    f => f.properties?.utility_id === utilityId
  );
}
