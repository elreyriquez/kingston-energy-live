import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/lib/auth';
import { useGetTrucks } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui/all';
import { Truck, MapPin, Battery, CheckCircle2 } from 'lucide-react';
import { formatWeight } from '@/lib/utils';

export default function DriverPortal() {
  const { user } = useAuth();
  // In a real app, we'd filter by assigned driver. Here we just take the first truck for demo.
  const { data } = useGetTrucks();
  const myTruck = data?.trucks[0];

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold">Driver Terminal</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>

        {myTruck ? (
          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/30">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <p className="text-sm text-primary font-bold uppercase tracking-wider mb-1">Active Assignment</p>
                  <CardTitle className="text-3xl font-mono">{myTruck.truck_id}</CardTitle>
                </div>
                <Badge variant="success" className="text-sm px-3 py-1 uppercase">{myTruck.status.replace('-', ' ')}</Badge>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                
                <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4">
                  <MapPin className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground font-bold uppercase">Current Zone</p>
                    <p className="text-xl font-bold">{myTruck.collection_zone || 'Unassigned'}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2 font-bold">
                    <span className="flex items-center text-muted-foreground"><Battery className="w-4 h-4 mr-1"/> Current Load</span>
                    <span className="font-mono">{formatWeight(myTruck.load_kg)} / {formatWeight(myTruck.capacity_kg)}</span>
                  </div>
                  <div className="h-4 bg-secondary rounded-full overflow-hidden border border-border">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${(myTruck.load_kg / myTruck.capacity_kg) * 100}%` }}
                    />
                  </div>
                  {myTruck.load_kg > myTruck.capacity_kg * 0.8 && (
                    <p className="text-amber-500 text-sm mt-2 font-bold animate-pulse">Approaching capacity. Prepare for disposal routing.</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 py-6 text-lg">Update Status</Button>
                  <Button variant="secondary" className="flex-1 py-6 text-lg">Report Issue</Button>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['Pre-trip vehicle inspection', 'Hydraulic system check', 'Route map synchronized'].map((task, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm">{task}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No active vehicle assignment found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
