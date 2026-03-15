import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { LiveMap } from '@/components/map/live-map';
import { AiAnalyzer } from '@/components/ai/ai-analyzer';
import { useGetStats } from '@workspace/api-client-react';
import { formatWeight, formatEnergy } from '@/lib/utils';
import { Truck, Zap, Activity } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'map' | 'analyzer'>('map');
  const { data: stats } = useGetStats({ query: { refetchInterval: 10000 } });

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
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'map' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Live Tracking
            </button>
            <button 
              onClick={() => setActiveTab('analyzer')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'analyzer' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              AI Analyzer
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
          <div className="bg-card border border-primary/30 p-4 rounded-xl flex items-center gap-4 bg-primary/5">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-primary uppercase font-bold tracking-wider">Homes Powered</p>
              <p className="text-xl font-bold font-mono text-primary">{stats?.homes_powered?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-2">
          {activeTab === 'map' ? (
            <LiveMap />
          ) : (
            <div className="h-full overflow-y-auto p-4">
              <AiAnalyzer />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
