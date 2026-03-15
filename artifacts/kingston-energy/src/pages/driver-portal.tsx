import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { DriverMap, type DriverStop } from '@/components/map/driver-map';
import { Truck, Bell, LogOut, AlertTriangle, CheckCircle2, Navigation, MapPin, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ── Types ──────────────────────────────────────────────────────────────────

interface DriverInfo { driverName: string; truckId: string; shiftTime: string; }

interface DriverStopsResponse {
  stops: DriverStop[];
  truckLocation: { lat: number; lng: number };
  driverInfo: DriverInfo;
}

// ── API helpers ────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function driverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('ke_auth_token');
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> | undefined ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function fetchOsrmRoute(
  from: { lat: number; lng: number },
  to: { latitude: number; longitude: number },
): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json() as { code: string; routes: { geometry: { coordinates: [number, number][] } }[] };
    if (data.code === 'Ok' && data.routes[0]) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    }
  } catch { /* OSRM unavailable — route just won't show */ }
  return [];
}

// ── Priority / capacity helpers ────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/40',
  medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  low:      'bg-slate-500/20 text-slate-400 border-slate-500/40',
};

function capacityColor(pct: number) {
  if (pct >= 90) return '#ef4444';
  if (pct >= 75) return '#f97316';
  if (pct >= 50) return '#eab308';
  return '#10b981';
}

// ── StopCard ───────────────────────────────────────────────────────────────

interface StopCardProps {
  stop: DriverStop;
  isActive: boolean;
  onNavigate: (stop: DriverStop) => void;
  onStatusChange: (id: string, status: string) => void;
}

function StopCard({ stop, isActive, onNavigate, onStatusChange }: StopCardProps) {
  const isComplete = stop.status === 'complete';

  return (
    <div
      className={`rounded-xl p-3.5 transition-all border ${
        isActive          ? 'ring-2 ring-primary border-primary/50 bg-primary/5'
        : stop.status === 'en_route' ? 'border-amber-500/40 bg-amber-500/5'
        : stop.status === 'arrived'  ? 'border-blue-500/40 bg-blue-500/5'
        : isComplete      ? 'border-border/30 bg-card/40 opacity-50'
        : 'border-border bg-card'
      }`}
    >
      {/* Header row */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm truncate ${isComplete ? 'text-muted-foreground' : 'text-foreground'}`}>
            {stop.name}
          </p>
          <p className="text-xs text-muted-foreground">{stop.area}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 capitalize font-medium ${PRIORITY_COLORS[stop.priority] ?? PRIORITY_COLORS['low']}`}>
          {stop.priority}
        </span>
      </div>

      {/* Capacity bar */}
      <div className="mb-2.5">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Capacity</span>
          <span className="font-mono font-bold" style={{ color: capacityColor(stop.capacityPercent) }}>
            {stop.capacityPercent}%
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${stop.capacityPercent}%`, backgroundColor: capacityColor(stop.capacityPercent) }}
          />
        </div>
      </div>

      {/* Action buttons */}
      {!isComplete && (
        <div className="mt-2">
          {stop.status === 'pending' && (
            <Button
              size="sm"
              className="w-full h-8 text-xs gap-1.5"
              onClick={() => onNavigate(stop)}
            >
              <Navigation className="w-3 h-3" />
              Navigate
            </Button>
          )}

          {stop.status === 'en_route' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                onClick={() => onStatusChange(stop.id, 'arrived')}
              >
                Arrived
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => onStatusChange(stop.id, 'pending')}
              >
                Cancel
              </Button>
            </div>
          )}

          {stop.status === 'arrived' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-500"
                onClick={() => onStatusChange(stop.id, 'complete')}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => onStatusChange(stop.id, 'pending')}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {isComplete && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-500 mt-1">
          <CheckCircle2 className="w-3 h-3" />
          Collected
        </div>
      )}
    </div>
  );
}

// ── Alerts Panel ───────────────────────────────────────────────────────────

function AlertsPanel({ stops, onClose, onSelectStop }: {
  stops: DriverStop[];
  onClose: () => void;
  onSelectStop: (stop: DriverStop) => void;
}) {
  const critical = stops.filter(s => s.capacityPercent >= 90 && s.status === 'pending');

  return (
    <div className="shrink-0 bg-red-950/40 border-b border-red-500/40 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-red-500/20">
        <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          {critical.length} Critical Stop{critical.length !== 1 ? 's' : ''} — Immediate Attention Required
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors text-sm leading-none"
        >
          ×
        </button>
      </div>
      <div className="flex gap-2 px-3 py-2.5 overflow-x-auto scrollbar-none">
        {critical.map(stop => (
          <button
            key={stop.id}
            onClick={() => { onSelectStop(stop); onClose(); }}
            className="flex items-center gap-2.5 shrink-0 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 hover:bg-red-500/20 active:scale-95 transition-all text-left"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground whitespace-nowrap">{stop.name}</p>
              <p className="text-[10px] text-red-400">{stop.capacityPercent}% full · tap to navigate</p>
            </div>
            <ChevronRight className="w-3 h-3 text-red-400/70 ml-1" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── DriverPortal ───────────────────────────────────────────────────────────

export default function DriverPortal() {
  const { user, logout } = useAuth();

  const [stops, setStops]               = useState<DriverStop[]>([]);
  const [truckLocation, setTruckLocation] = useState({ lat: 18.0129, lng: -76.795 });
  const [driverInfo, setDriverInfo]     = useState<DriverInfo | null>(null);
  const [activeStop, setActiveStop]     = useState<DriverStop | null>(null);
  const [routeCoords, setRouteCoords]   = useState<[number, number][]>([]);
  const [showAlerts, setShowAlerts]     = useState(false);
  const hasFetchedRef = useRef(false);

  // ── Fetch stops ────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<DriverStopsResponse>({
    queryKey: ['driver-stops'],
    queryFn: () => driverFetch<DriverStopsResponse>('/driver/stops'),
    refetchInterval: 15_000,
  });

  // Sync server data into local state (without clobbering in-flight UI states)
  useEffect(() => {
    if (!data) return;
    setDriverInfo(data.driverInfo);
    setTruckLocation(data.truckLocation);

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setStops(data.stops);
      const criticalCount = data.stops.filter(s => s.capacityPercent >= 90 && s.status === 'pending').length;
      if (criticalCount > 0) setShowAlerts(true);
    } else {
      // Merge: keep local status, update capacities from server
      setStops(prev => prev.map(local => {
        const server = data.stops.find(s => s.id === local.id);
        return server ? { ...server, status: local.status } : local;
      }));
    }
  }, [data]);

  // ── Status mutation ────────────────────────────────────────────────────
  const patchStatus = useCallback(async (stopId: string, status: string) => {
    // Optimistic update
    setStops(prev => prev.map(s => s.id === stopId ? { ...s, status } : s));
    if (activeStop?.id === stopId) {
      setActiveStop(prev => prev ? { ...prev, status } : null);
    }
    if (status === 'complete' || status === 'pending') {
      setRouteCoords([]);
      if (activeStop?.id === stopId) setActiveStop(null);
    }
    // Fire-and-forget — failure is non-critical for demo
    driverFetch(`/driver/stops/${stopId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).catch(console.error);
  }, [activeStop]);

  // ── Navigate to stop ───────────────────────────────────────────────────
  const handleNavigate = useCallback(async (stop: DriverStop) => {
    await patchStatus(stop.id, 'en_route');
    setActiveStop({ ...stop, status: 'en_route' });
    const route = await fetchOsrmRoute(truckLocation, stop);
    setRouteCoords(route);
  }, [patchStatus, truckLocation]);

  // ── Computed ───────────────────────────────────────────────────────────
  const criticalCount = stops.filter(s => s.capacityPercent >= 90 && s.status === 'pending').length;
  const completedCount = stops.filter(s => s.status === 'complete').length;
  const pendingCount = stops.filter(s => s.status === 'pending').length;

  // ── Render ─────────────────────────────────────────────────────────────
  if (isLoading && stops.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-primary">
        <div className="text-center">
          <Truck className="w-10 h-10 mx-auto mb-3 opacity-40 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading route data…</p>
        </div>
      </div>
    );
  }

  if (isError && stops.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500 opacity-60" />
          <p className="text-sm">Could not load route data. Check your connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center">
            <Truck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold font-display leading-tight">{driverInfo?.truckId ?? '—'}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{driverInfo?.driverName ?? user?.name}</p>
          </div>
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        <p className="text-xs text-muted-foreground hidden sm:block">{driverInfo?.shiftTime}</p>

        <div className="ml-auto flex items-center gap-2">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{completedCount}/{stops.length} stops</span>
          </div>

          {/* Alerts button */}
          <button
            onClick={() => setShowAlerts(v => !v)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              criticalCount > 0
                ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                : 'bg-secondary/50 text-muted-foreground'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {criticalCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold">
                {criticalCount}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* ── Alerts banner (in-flow, below header) ── */}
      {showAlerts && criticalCount > 0 && (
        <AlertsPanel
          stops={stops}
          onClose={() => setShowAlerts(false)}
          onSelectStop={(stop) => { handleNavigate(stop); }}
        />
      )}

      {/* ── Body: sidebar + map ── */}
      <div className="flex-1 flex min-h-0">

        {/* Sidebar */}
        <div className="w-72 lg:w-80 border-r border-border flex flex-col shrink-0 bg-background">
          {/* Sidebar header */}
          <div className="px-3 py-2.5 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-display font-bold">Collection Stops</h2>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                {pendingCount} remaining
              </Badge>
            </div>
            <div className="flex gap-1.5 text-[10px] text-muted-foreground">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {criticalCount} critical
                </span>
              )}
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="w-3 h-3" />
                {completedCount} done
              </span>
            </div>
          </div>

          {/* Stop list */}
          <div
            className="flex-1 overflow-y-auto p-2 space-y-2"
            onWheel={e => e.stopPropagation()}
          >
            {stops.map(stop => (
              <StopCard
                key={stop.id}
                stop={stop}
                isActive={activeStop?.id === stop.id}
                onNavigate={handleNavigate}
                onStatusChange={patchStatus}
              />
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-w-0">
          {stops.length > 0 ? (
            <DriverMap
              stops={stops}
              truckLocation={truckLocation}
              activeStop={activeStop}
              routeCoords={routeCoords}
              onStopClick={(stop) => {
                if (stop.status === 'pending') handleNavigate(stop);
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MapPin className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No stops assigned</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
