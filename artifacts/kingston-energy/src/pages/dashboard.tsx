import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { LiveMap } from '@/components/map/live-map';
import { AiAnalyzer } from '@/components/ai/ai-analyzer';
import { useGetStats, useGetSmartBins, SmartBin } from '@workspace/api-client-react';
import { formatWeight, formatEnergy } from '@/lib/utils';
import { Truck, Zap, Activity, Trash2, AlertTriangle, Play, Pause, Battery, MapPin } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Badge, Card, CardContent } from '@/components/ui/all';
import { formatDistanceToNow } from 'date-fns';

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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'map' | 'analyzer' | 'bins'>('map');
  const { data: stats } = useGetStats({ query: { refetchInterval: 10000 } });
  const { data: binData } = useGetSmartBins({ query: { refetchInterval: 10000 } });
  const queryClient = useQueryClient();

  const bins = binData?.bins ?? [];
  const criticalBins = bins.filter(b => b.fill_level >= 85).length;

  return (
    <MainLayout>
      <div className="p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Command Center</h1>
            <p className="text-muted-foreground">Real-time Kingston operations & energy conversion matrix.</p>
          </div>

          <div className="flex p-1 bg-secondary rounded-lg border border-border">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'map' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Live Tracking
            </button>
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'analyzer' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              AI Analyzer
            </button>
            <button
              onClick={() => setActiveTab('bins')}
              className={`relative px-5 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'bins' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Smart Bins
              {criticalBins > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-destructive text-white rounded-full flex items-center justify-center">
                  {criticalBins}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Top Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Active Fleet</p>
              <p className="text-xl font-bold font-mono">{stats?.active_trucks || 0} / {stats?.total_trucks || 0}</p>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Waste Inbound</p>
              <p className="text-xl font-bold font-mono">{formatWeight(stats?.waste_collected_kg || 0)}</p>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Grid Output</p>
              <p className="text-xl font-bold font-mono">{formatEnergy(stats?.energy_generated_kwh || 0)}</p>
            </div>
          </div>
          <div
            className={`bg-card border p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-all hover:border-primary/50 ${criticalBins > 0 ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}
            onClick={() => setActiveTab('bins')}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${criticalBins > 0 ? 'bg-destructive/20 text-destructive' : 'bg-emerald-500/20 text-emerald-500'}`}>
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">IoT Bins</p>
              <p className={`text-xl font-bold font-mono ${criticalBins > 0 ? 'text-destructive' : ''}`}>
                {criticalBins > 0 ? `${criticalBins} Critical` : `${bins.length} Online`}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-2">
          {activeTab === 'map' && <LiveMap />}
          {activeTab === 'analyzer' && (
            <div className="h-full overflow-y-auto p-4">
              <AiAnalyzer />
            </div>
          )}
          {activeTab === 'bins' && (
            <div className="h-full overflow-y-auto p-4">
              <SmartBinsPanel bins={bins} queryClient={queryClient} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function SmartBinsPanel({ bins, queryClient }: { bins: SmartBin[]; queryClient: ReturnType<typeof useQueryClient> }) {
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

  const criticalBins = bins.filter(b => b.fill_level >= 85);
  const warningBins = bins.filter(b => b.fill_level >= 60 && b.fill_level < 85);

  return (
    <div className="space-y-6">
      {/* Simulation Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Activity className="w-4 h-4" />
          IoT Simulation
        </div>
        <div className="h-4 w-px bg-border" />
        <Button
          size="sm"
          variant="outline"
          className="border-primary/40 text-primary hover:bg-primary/10 h-8"
          onClick={runSimTick}
          disabled={simRunning}
        >
          <Activity className="w-3 h-3 mr-2" />
          {simRunning ? 'Running...' : 'Manual Tick'}
        </Button>
        <Button
          size="sm"
          variant={autoSim ? 'destructive' : 'outline'}
          className={`h-8 ${!autoSim ? 'border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10' : ''}`}
          onClick={() => setAutoSim(v => !v)}
        >
          {autoSim ? <><Pause className="w-3 h-3 mr-2" />Stop Auto</> : <><Play className="w-3 h-3 mr-2" />Auto (8s)</>}
        </Button>
        {autoSim && (
          <span className="text-xs text-emerald-500 font-bold animate-pulse">
            ● Simulation running — bins filling every 8s
          </span>
        )}
        {criticalBins.length > 0 && (
          <div className="ml-auto flex items-center gap-1 text-destructive text-xs font-bold">
            <AlertTriangle className="w-3 h-3" />
            {criticalBins.length} bins need immediate collection
          </div>
        )}
      </div>

      {/* Bins Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {bins.map((bin: SmartBin) => {
          const isCritical = bin.fill_level >= 85;
          const isWarning = bin.fill_level >= 60 && bin.fill_level < 85;

          return (
            <Card
              key={bin.id}
              className={`transition-all duration-300 ${isCritical ? 'border-destructive/70 shadow-md shadow-destructive/10' : isWarning ? 'border-amber-500/40' : ''}`}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono font-bold text-base">{bin.bin_id}</p>
                    <p className="text-xs text-muted-foreground flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-1 shrink-0" />{bin.location}
                    </p>
                  </div>
                  <Badge
                    variant={isCritical ? 'destructive' : isWarning ? 'warning' : 'success'}
                    className="text-[10px] uppercase"
                  >
                    {isCritical ? 'Critical' : isWarning ? 'Warning' : 'OK'}
                  </Badge>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground font-medium">Fill Level</span>
                    <span className={`font-bold ${isCritical ? 'text-destructive' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {bin.fill_level}%
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${isCritical ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${bin.fill_level}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Battery className={`w-3.5 h-3.5 ${bin.battery_level < 20 ? 'text-destructive' : ''}`} />
                    <span>{bin.battery_level}%</span>
                  </div>
                  <span className="text-right text-[10px]">
                    {bin.last_collected
                      ? `Emptied ${formatDistanceToNow(new Date(bin.last_collected), { addSuffix: true })}`
                      : 'Never emptied'}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className={`w-full h-7 text-xs ${isCritical ? 'border-destructive/50 text-destructive hover:bg-destructive/10' : 'hover:border-primary/40 hover:text-primary'}`}
                  disabled={collectingBin === bin.bin_id}
                  onClick={() => handleCollect(bin.bin_id)}
                >
                  <Truck className="w-3 h-3 mr-1.5" />
                  {collectingBin === bin.bin_id ? 'Dispatching...' : 'Dispatch Truck'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
