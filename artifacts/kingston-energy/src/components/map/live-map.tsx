import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useGetTrucks, Truck } from '@workspace/api-client-react';
import { formatWeight } from '@/lib/utils';
import { Battery, Zap, MapPin } from 'lucide-react';

// Fix leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons
const createTruckIcon = (color: string) => L.divIcon({
  className: 'custom-truck-icon',
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const PLANT_ICON = L.divIcon({
  className: 'custom-plant-icon',
  html: `<div style="background-color: #f59e0b; width: 24px; height: 24px; border-radius: 4px; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const getStatusColor = (status: string) => {
  switch(status) {
    case 'collecting': return '#10b981'; // emerald
    case 'enroute-to-disposal': return '#f59e0b'; // amber
    case 'disposing': return '#3b82f6'; // blue
    case 'returning': return '#06b6d4'; // cyan
    default: return '#64748b'; // slate
  }
};

const DISPOSAL_SITES = [
  { id: 1, name: 'Riverton City Power Plant', lat: 18.0154, lng: -76.8476 },
  { id: 2, name: 'Naggo Head Energy Facility', lat: 17.9647, lng: -76.8678 }
];

const ZONES = [
  { name: 'Downtown Kingston', lat: 17.9700, lng: -76.7900, r: 1500 },
  { name: 'Cross Roads', lat: 18.0000, lng: -76.7900, r: 1200 },
  { name: 'Half Way Tree', lat: 18.0100, lng: -76.8000, r: 1300 },
  { name: 'Constant Spring', lat: 18.0200, lng: -76.7800, r: 1100 },
  { name: 'Spanish Town', lat: 18.0100, lng: -76.7500, r: 1400 }
];

function MapUpdater() {
  const map = useMap();
  useEffect(() => {
    // Invalidate size after mount to fix weird rendering
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

export function LiveMap() {
  const { data } = useGetTrucks({ query: { refetchInterval: 2000 } });

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-border shadow-lg">
      <MapContainer 
        center={[17.9970, -76.7936]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          className="dark-map-tiles"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapUpdater />

        {/* Zones */}
        {ZONES.map(z => (
          <Circle 
            key={z.name}
            center={[z.lat, z.lng]} 
            radius={z.r} 
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.05, weight: 1, dashArray: '4' }} 
          />
        ))}

        {/* Disposal Sites */}
        {DISPOSAL_SITES.map(site => (
          <Marker key={site.id} position={[site.lat, site.lng]} icon={PLANT_ICON}>
            <Popup>
              <div className="font-sans">
                <h4 className="font-bold text-sm mb-1 text-primary">{site.name}</h4>
                <p className="text-xs text-muted-foreground">Waste-to-Energy Facility</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Trucks */}
        {data?.trucks.map((truck: Truck) => (
          <Marker 
            key={truck.id} 
            position={[truck.latitude, truck.longitude]} 
            icon={createTruckIcon(getStatusColor(truck.status))}
          >
            <Popup className="custom-popup">
              <div className="w-48 p-1 font-sans">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono font-bold text-sm bg-secondary px-2 py-0.5 rounded">{truck.truck_id}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: getStatusColor(truck.status) }}>
                    {truck.status.replace('-', ' ')}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1"><Battery className="w-3 h-3"/> Load</span>
                      <span className="font-bold">{formatWeight(truck.load_kg)} / {formatWeight(truck.capacity_kg)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(100, (truck.load_kg / truck.capacity_kg) * 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {truck.collection_zone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background p-2 rounded border border-border">
                      <MapPin className="w-3 h-3 text-primary" />
                      {truck.collection_zone}
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend Overlay */}
      <div className="absolute bottom-6 right-6 bg-card/80 backdrop-blur-md p-3 rounded-lg border border-border shadow-xl z-[1000] text-xs font-medium">
        <h4 className="uppercase tracking-widest text-[10px] text-muted-foreground mb-2">Fleet Status</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Collecting</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> En Route</div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Disposing</div>
        </div>
      </div>
    </div>
  );
}
