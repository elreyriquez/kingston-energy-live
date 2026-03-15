import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useGetSmartBins, SmartBin } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui/all';
import { Trash2, Battery, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SmartBins() {
  const { data, isLoading } = useGetSmartBins({ query: { refetchInterval: 15000 } });

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Smart Bins Network</h1>
          <p className="text-muted-foreground">IoT enabled receptacles requiring dynamic collection.</p>
        </div>

        {isLoading ? (
          <div>Loading IoT network...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.bins.map((bin: SmartBin) => {
              const isCritical = bin.fill_level >= 85;
              const isWarning = bin.fill_level >= 60 && bin.fill_level < 85;
              
              return (
                <Card key={bin.id} className={isCritical ? 'border-destructive shadow-lg shadow-destructive/10' : ''}>
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
                          className={`h-full ${isCritical ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
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
                        {bin.last_collected ? `Emptied ${formatDistanceToNow(new Date(bin.last_collected), {addSuffix:true})}` : 'Never'}
                      </div>
                    </div>

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
