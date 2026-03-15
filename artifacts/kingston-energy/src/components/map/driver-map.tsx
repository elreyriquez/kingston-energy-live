import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export interface DriverStop {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  capacityPercent: number;
  priority: string;
  status: string;
}

interface DriverMapProps {
  stops: DriverStop[];
  truckLocation: { lat: number; lng: number };
  activeStop: DriverStop | null;
  routeCoords: [number, number][];
  onStopClick: (stop: DriverStop) => void;
}

// ── Icons ──────────────────────────────────────────────────────────────────

const TRUCK_ICON = L.divIcon({
  className: '',
  html: `<div style="
    background:#10b981;width:22px;height:22px;border-radius:50%;
    border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.6);
    display:flex;align-items:center;justify-content:center;">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
      <rect x="9" y="11" width="14" height="10" rx="2"/>
      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    </svg>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function stopIcon(stop: DriverStop): L.DivIcon {
  const colorMap: Record<string, string> = {
    pending:  stop.priority === 'critical' ? '#ef4444'
            : stop.priority === 'high'     ? '#f97316'
            : stop.priority === 'medium'   ? '#eab308'
            :                               '#64748b',
    en_route: '#f59e0b',
    arrived:  '#3b82f6',
    complete: '#334155',
  };
  const color = colorMap[stop.status] ?? '#64748b';
  const opacity = stop.status === 'complete' ? '0.45' : '1';
  const size = stop.status === 'en_route' ? 18 : 14;

  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};width:${size}px;height:${size}px;border-radius:50%;
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.5);
      opacity:${opacity};transition:all .3s;">
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ── MapController: handles flyTo when active stop changes ──────────────────

function MapController({ activeStop }: { activeStop: DriverStop | null }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!activeStop || activeStop.id === prevId.current) return;
    prevId.current = activeStop.id;

    const center: [number, number] = [activeStop.latitude, activeStop.longitude];
    map.flyTo(center, 15, { duration: 1.2 });

    // Snap to pixel-perfect center after animation
    map.once('moveend', () => {
      map.invalidateSize({ animate: false });
      requestAnimationFrame(() => {
        map.setView(center, map.getZoom(), { animate: false });
      });
    });
  }, [activeStop, map]);

  return null;
}

// ── MapSizeWatcher: fixes Leaflet grey tiles on first render ───────────────

function MapSizeWatcher() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 120); }, [map]);
  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────

export function DriverMap({ stops, truckLocation, activeStop, routeCoords, onStopClick }: DriverMapProps) {
  return (
    <div className="w-full h-full relative rounded-none overflow-hidden">
      <MapContainer
        center={[truckLocation.lat, truckLocation.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          className="dark-map-tiles"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapController activeStop={activeStop} />
        <MapSizeWatcher />

        {/* Route polyline */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#10b981', weight: 5, opacity: 0.85, dashArray: '10, 6' }}
          />
        )}

        {/* Truck marker */}
        <Marker position={[truckLocation.lat, truckLocation.lng]} icon={TRUCK_ICON}>
          <Popup>
            <div className="font-sans text-xs font-bold">Your Truck</div>
          </Popup>
        </Marker>

        {/* Stop markers */}
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.latitude, stop.longitude]}
            icon={stopIcon(stop)}
            eventHandlers={{ click: () => onStopClick(stop) }}
          >
            <Popup>
              <div className="font-sans w-40 p-1">
                <p className="font-bold text-sm leading-tight mb-1">{stop.name}</p>
                <p className="text-xs text-gray-500 mb-1">{stop.area}</p>
                <div className="flex justify-between text-xs">
                  <span>Capacity</span>
                  <span className="font-bold">{stop.capacityPercent}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${stop.capacityPercent}%`,
                      backgroundColor:
                        stop.capacityPercent >= 90 ? '#ef4444'
                        : stop.capacityPercent >= 75 ? '#f97316'
                        : stop.capacityPercent >= 50 ? '#eab308'
                        : '#10b981',
                    }}
                  />
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm p-3 rounded-lg border border-border shadow-xl z-[1000] text-xs">
        <p className="uppercase tracking-widest text-[10px] text-muted-foreground mb-2 font-bold">Stops</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Medium</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> En Route</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Arrived</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Truck</div>
        </div>
      </div>
    </div>
  );
}
