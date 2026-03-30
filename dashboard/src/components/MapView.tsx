import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { Layer, PathOptions } from 'leaflet';
import { useMemo, useCallback } from 'react';
import type { Feature } from 'geojson';
import { isoBoundaries, utilityBoundaries } from '../data/geojson';
import type { UtilityData, FilterState } from '../types';
import { PV_TIER_COLORS, formatCurrency } from '../utils/constants';

interface Props {
  filters: FilterState;
  filteredUtilities: UtilityData[];
  utilities: UtilityData[];
  onUtilityClick: (utility: UtilityData) => void;
}

export default function MapView({ filters, filteredUtilities, utilities, onUtilityClick }: Props) {
  const filteredIds = useMemo(
    () => new Set(filteredUtilities.map(u => u.utility_id)),
    [filteredUtilities]
  );

  const utilityMap = useMemo(() => {
    const m = new Map<string, UtilityData>();
    for (const u of utilities) m.set(u.utility_id, u);
    return m;
  }, [utilities]);

  // ISO style — same blue fill, thick dashed outline
  const isoStyle = useCallback((feature?: Feature): PathOptions => {
    const iso = feature?.properties?.iso as string;
    const dimmed = filters.isoFilter !== 'all' && filters.isoFilter !== iso;
    return {
      fillColor: '#3B82F6',
      fillOpacity: dimmed ? 0.02 : 0.08,
      color: '#2563EB',
      weight: 3,
      opacity: dimmed ? 0.15 : 0.7,
      dashArray: '8 6',
    };
  }, [filters.isoFilter]);

  // Utility style
  const utilityStyle = useCallback((feature?: Feature): PathOptions => {
    const uid = feature?.properties?.utility_id as string;
    const utility = utilityMap.get(uid);
    if (!utility || !filteredIds.has(uid)) {
      return { fillColor: '#BDBDBD', fillOpacity: 0.1, color: '#fff', weight: 1, opacity: 0.3 };
    }
    const tier = utility.pv_results.pv_tier;
    const color = PV_TIER_COLORS[tier]?.color ?? '#BDBDBD';
    return {
      fillColor: color,
      fillOpacity: 0.85,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
    };
  }, [utilityMap, filteredIds]);

  // Utility hover/click handlers
  const onEachUtility = useCallback((feature: Feature, layer: Layer) => {
    const uid = feature.properties?.utility_id as string;
    const utility = utilityMap.get(uid);
    if (!utility) return;

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        if (filteredIds.has(uid)) {
          l.setStyle({ weight: 3, fillOpacity: 0.95 });
          l.bringToFront();
        }
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(utilityStyle(feature));
      },
      click: () => {
        if (filteredIds.has(uid)) {
          onUtilityClick(utility);
        }
      },
    });
  }, [utilityMap, filteredIds, utilityStyle, onUtilityClick]);

  const isoKey = `iso-${filters.isoFilter}`;
  const utilKey = `util-${[...filteredIds].join(',')}`;

  return (
    <MapContainer
      center={[39.5, -98.0]}
      zoom={4}
      className="h-full w-full"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      />

      {/* ISO/RTO regions */}
      {filters.layers.iso && (
        <GeoJSON
          key={isoKey}
          data={isoBoundaries}
          style={isoStyle}
          onEachFeature={(feature, layer) => {
            const name = feature.properties?.name;
            if (name) {
              layer.bindTooltip(name, { sticky: true, className: 'iso-tooltip' });
            }
          }}
        />
      )}

      {/* Utility territories */}
      {filters.layers.utilities && (
        <GeoJSON
          key={utilKey}
          data={utilityBoundaries}
          style={utilityStyle}
          onEachFeature={(feature, layer) => {
            const uid = feature.properties?.utility_id as string;
            const utility = utilityMap.get(uid);
            onEachUtility(feature, layer);
            if (utility && filteredIds.has(uid)) {
              const tipContent = `<div class="text-sm">
                <div class="font-bold">${utility.utility_short_name}</div>
                <div>${utility.state} · ${utility.iso_rto}</div>
                <div class="font-semibold mt-1">PV Revenue: ${formatCurrency(utility.pv_results.pv_total)}</div>
              </div>`;
              layer.bindTooltip(tipContent, { sticky: true });
            }
          }}
        />
      )}

      {/* Label overlay */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
        pane="tooltipPane"
      />
    </MapContainer>
  );
}
