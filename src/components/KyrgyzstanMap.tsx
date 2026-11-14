import React from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GeoObjectDto, PhenomenonMapObjectDto } from '../types/api';

const MAP_CENTER: [number, number] = [41.45, 74.85];
const MAP_ZOOM = 7;

interface MapClickHandlerProps {
  onPickPoint?: (lat: number, lon: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onPickPoint }) => {
  useMapEvents({
    click(e) {
      if (onPickPoint) {
        onPickPoint(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
      }
    },
  });
  return null;
};

const FitToMarkers: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  const pointsKey = points.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join('|');

  React.useEffect(() => {
    const apply = () => {
      map.invalidateSize();
      if (map.getSize().x < 480 && points.length > 0) {
        map.fitBounds(L.latLngBounds(points), {
          paddingTopLeft: [24, 32],
          paddingBottomRight: [76, 32],
          maxZoom: MAP_ZOOM,
        });
      } else if (map.getSize().x >= 480) {
        map.setView(MAP_CENTER, MAP_ZOOM);
      }
    };
    apply();
    const timer = window.setTimeout(apply, 120);
    window.addEventListener('resize', apply);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', apply);
    };
  }, [map, pointsKey]);

  return null;
};

interface KyrgyzstanMapProps {
  mode: 'phenomena' | 'picker';
  phenomenaObjects?: PhenomenonMapObjectDto[];
  catalogObjects?: GeoObjectDto[];
  selectedObjectCode?: string;
  pickedPoint?: { lat: number; lon: number } | null;
  onSelectObject?: (code: string) => void;
  onPickPoint?: (lat: number, lon: number) => void;
}

const SHORT_LABELS: Record<string, string> = {
  issyk_kul: 'Issyk-Kul',
  son_kul: 'Son-Kul',
  toktogul: 'Toktogul',
  naryn_basin: 'Naryn basin',
  enilchek: 'Enilchek',
  golubina: 'Golubina',
  chatyr_kul: 'Chatyr-Kul',
  petrova: 'Petrova',
  ak_shiyrak: 'Ak-Shiyrak',
};

/**
 * Directional label anchors fan the dense high-mountain stations apart.
 */
const LABEL_ANCHORS: Record<string, [number, number]> = {
  toktogul: [108, 8],
  golubina: [4, 56],
  son_kul: [62, -22],
  naryn_basin: [-24, -54],
  issyk_kul: [-98, 26],
  enilchek: [-54, 48],
  chatyr_kul: [70, -18],
  petrova: [-48, 32],
  ak_shiyrak: [48, 44],
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });

export const KyrgyzstanMap: React.FC<KyrgyzstanMapProps> = ({
  mode,
  phenomenaObjects = [],
  catalogObjects = [],
  selectedObjectCode,
  pickedPoint,
  onSelectObject,
  onPickPoint,
}) => {
  const centerKg: [number, number] = MAP_CENTER;
  const fitPoints: [number, number][] =
    mode === 'phenomena'
      ? phenomenaObjects.map((o) => o.marker)
      : catalogObjects.map((o) => o.marker);

  const makeTelemetryIcon = (obj: PhenomenonMapObjectDto, isSelected: boolean) => {
    const isCompact = typeof window !== 'undefined' && window.innerWidth < 640;
    const anchor: [number, number] = isCompact
      ? [0, 0]
      : LABEL_ANCHORS[obj.object_code] ?? [0, 44];
    const accent =
      !obj.is_significant || obj.trend === 'no_trend'
        ? '#64748B'
        : obj.trend === 'decreasing'
        ? '#B4462B'
        : '#0284C7';
    const arrow = obj.trend === 'increasing' ? '↑' : obj.trend === 'decreasing' ? '↓' : '–';
    const slopeText = obj.sen_slope !== null ? `${obj.sen_slope > 0 ? '+' : ''}${obj.sen_slope}` : '—';
    const name = SHORT_LABELS[obj.object_code] ?? obj.object_name;

    return L.divIcon({
      className: 'custom-telemetry-marker',
      html: `
        <div class="callout-pin ${isSelected ? 'is-selected' : ''}">
          <span class="callout-pin-name">${escapeHtml(name)}</span>
          <span class="callout-pin-value" style="color:${accent};">${arrow} ${slopeText} ${escapeHtml(
        obj.unit
      )}/yr</span>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: anchor,
    });
  };

  return (
    <div
      className={`map-shell relative h-[480px] w-full ${
        mode === 'picker' ? 'map-crosshair' : ''
      }`}
    >
      <MapContainer
        center={centerKg}
        zoom={MAP_ZOOM}
        minZoom={5}
        maxZoom={12}
        className="z-0 h-full w-full"
        scrollWheelZoom={true}
      >
        <FitToMarkers points={fitPoints} />
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, NASA, USGS'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          attribution=""
          opacity={0.55}
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        />

        {mode === 'picker' && <MapClickHandler onPickPoint={onPickPoint} />}

        {mode === 'phenomena' &&
          phenomenaObjects.map((obj) => {
            const isSelected = obj.object_code === selectedObjectCode;
            const fillColor = !obj.is_significant
              ? '#64748B'
              : obj.trend === 'decreasing'
              ? '#B4462B'
              : obj.trend === 'increasing'
              ? '#0284C7'
              : '#64748B';

            return (
              <React.Fragment key={obj.object_code}>
                {isSelected && (
                  <CircleMarker
                    center={obj.marker}
                    radius={13}
                    pathOptions={{
                      color: '#0B1F3A',
                      weight: 1.5,
                      fill: false,
                      dashArray: '3 3',
                    }}
                  />
                )}
                <CircleMarker
                  center={obj.marker}
                  radius={isSelected ? 8 : 6}
                  pathOptions={{
                    color: '#FFFFFF',
                    weight: 2,
                    fillColor,
                    fillOpacity: obj.is_significant ? 0.95 : 0.65,
                  }}
                  eventHandlers={{
                    click: () => onSelectObject && onSelectObject(obj.object_code),
                  }}
                />
                <Marker
                  position={obj.marker}
                  icon={makeTelemetryIcon(obj, isSelected)}
                  eventHandlers={{
                    click: () => onSelectObject && onSelectObject(obj.object_code),
                  }}
                />
              </React.Fragment>
            );
          })}

        {mode === 'picker' &&
          catalogObjects.map((obj) => {
            const isSelected = obj.code === selectedObjectCode;
            return (
              <CircleMarker
                key={obj.code}
                center={obj.marker}
                radius={isSelected ? 8 : 5.5}
                pathOptions={{
                  color: '#FFFFFF',
                  weight: 2,
                  fillColor: isSelected ? '#0B5FA5' : '#0284C7',
                  fillOpacity: 0.95,
                }}
                eventHandlers={{
                  click: () => onSelectObject && onSelectObject(obj.code),
                }}
              />
            );
          })}

        {mode === 'picker' && pickedPoint && (
          <CircleMarker
            center={[pickedPoint.lat, pickedPoint.lon]}
            radius={9}
            pathOptions={{
              color: '#FFFFFF',
              weight: 2,
              fillColor: '#0B1F3A',
              fillOpacity: 0.95,
            }}
          />
        )}
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded border border-earth-line bg-earth-raised/95 px-2.5 py-1 text-[11px] font-medium text-earth-slate">
        {mode === 'phenomena' ? 'Esri World Imagery' : 'Point picker, WGS84'}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-x-3 gap-y-1 rounded border border-earth-line bg-earth-raised/95 px-3 py-2 text-[11px] text-earth-slate">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-earth-rust" /> Decreasing
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-earth-hydro" /> Increasing
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-earth-muted" /> No significant trend
        </span>
        <span className="hidden text-earth-muted sm:inline">Marker color shows trend direction</span>
      </div>
    </div>
  );
};
