import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useGetSmartBins, SmartBin } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui/all';
import { Trash2, Battery, MapPin, Play, Pause, Truck, Activity, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';

async function apiPost(path: string) {
  const res = await fetch(path, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPatch(path: string) {
  const res = await fetch(path, { method: 'PATCH' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function SmartBins() {
  const { user } = useAuth();
  const { data, isLoading } = useGetSmartBins({ query: { refetchInterval: 10000 } });
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const [autoSim, setAutoSim] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [collectingBin, setCollectingBin] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runSimTick = async () => {
    setSimRunning(true);
    try {
      await apiPost('/api/smartbin/simulate');
      queryClient.invalidateQueries({ queryKey: ['/api/smartbin'] });
    } finally {
      setSimRunning(false);
    }
  };

  useEffect(() => {
    if (autoSim) {
      intervalRef.current = setInterval(runSimTick, 8000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoSim]);

  const handleCollect = async (binId: string) => {
    setCollectingBin(binId);
    try {
      await apiPatch(`/api/smartbin/${binId}/collect`);
      queryClient.invalidateQueries({ queryKey: ['/api/smartbin'] });
    } finally {
      setCollectingBin(null);
    }
  };

  const bins = data?.bins ?? [];
  const criticalCount = bins.filter(b => b.fill_level >= 85).length;
  const warningCount = bins.filter(b => b.fill_level >= 60 && b.fill_level < 85).length;

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Smart Bins Network</h1>
            <p className="text-muted-foreground">IoT enabled receptacles requiring dynamic collection.</p>
          </div>

          {/* Summary badges */}
          <div className="flex gap-3">
            {criticalCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm font-bold">
                <AlertTriangle className="w-4 h-4" />
                {criticalCount} Critical
              </div>
            )}
            {warningCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-bold">
                <Activity className="w-4 h-4" />
                {warningCount} Warning
              </div>
            )}
          </div>
        </div>

        {/* Admin-only IoT Simulation Panel */}
        {isAdmin && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Activity className="w-4 h-4" />
                IoT Simulation Controls
                <span className="text-xs font-normal text-muted-foreground ml-1">(Admin only)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 items-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10"
                  onClick={runSimTick}
                  disabled={simRunning}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {simRunning ? 'Running tick...' : 'Run Single Tick'}
                </Button>

                <Button
                  size="sm"
                  variant={autoSim ? 'destructive' : 'outline'}
                  className={!autoSim ? 'border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10' : ''}
                  onClick={() => setAutoSim(v => !v)}
                >
                  {autoSim ? (
                    <><Pause className="w-4 h-4 mr-2" /> Stop Auto-Sim</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Start Auto-Sim (8s)</>
                  )}
                </Button>

                {autoSim && (
                  <span className="text-xs text-emerald-500 font-bold animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Simulation active — fill levels updating every 8 seconds
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Each tick raises fill levels by 5–20% and drains battery slightly. Use "Dispatch Truck" on individual bins to empty them.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-muted-foreground">Loading IoT network...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bins.map((bin: SmartBin) => {
              const isCritical = bin.fill_level >= 85;
              const isWarning = bin.fill_level >= 60 && bin.fill_level < 85;

              return (
                <Card
                  key={bin.id}
                  className={`transition-all ${isCritical ? 'border-destructive shadow-lg shadow-destructive/10 animate-pulse-slow' : ''}`}
                >
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">{bin.bin_id}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" /> {bin.location}
                      </p>
                    </div>
                    <Badge variant={bin.status === 'online' ? 'success' : 'secondary'} className="uppercase text-[10px]">
                      {bin.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    {/* Fill Level */}
                    <div>
                      <div className="flex justify-between text-sm mb-1 font-bold">
                        <span>Fill Level</span>
                        <span className={isCritical ? 'text-destructive' : isWarning ? 'text-amber-500' : 'text-emerald-500'}>
                          {bin.fill_level}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-secondary rounded-full overflow-hidden border border-border">
                        <div
                          className={`h-full transition-all duration-700 ${isCritical ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${bin.fill_level}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                      <div className="flex items-center">
                        <Battery className={`w-4 h-4 mr-1 ${bin.battery_level < 20 ? 'text-destructive' : ''}`} />
                        {bin.battery_level}%
                      </div>
                      <div>
                        {bin.last_collected
                          ? `Emptied ${formatDistanceToNow(new Date(bin.last_collected), { addSuffix: true })}`
                          : 'Never emptied'}
                      </div>
                    </div>

                    {/* Admin dispatch button */}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`w-full text-xs h-8 ${isCritical ? 'border-destructive/50 text-destructive hover:bg-destructive/10' : 'border-border text-muted-foreground hover:text-foreground'}`}
                        disabled={collectingBin === bin.bin_id}
                        onClick={() => handleCollect(bin.bin_id)}
                      >
                        <Truck className="w-3 h-3 mr-2" />
                        {collectingBin === bin.bin_id ? 'Dispatching...' : 'Dispatch Truck'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
