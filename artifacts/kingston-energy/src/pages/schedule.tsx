import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useGetSchedule, ScheduleEntry } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/all';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Schedule() {
  const { data, isLoading } = useGetSchedule();

  // Group by zone
  const zones: Record<string, number[]> = {};
  if (data?.schedule) {
    data.schedule.forEach((s: ScheduleEntry) => {
      if (!zones[s.zone_name]) zones[s.zone_name] = [];
      zones[s.zone_name].push(s.day_of_week);
    });
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Collection Schedule</h1>
          <p className="text-muted-foreground">Weekly operational coverage by municipal zone.</p>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading schedule...</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-bold border-r border-border">Zone</th>
                    {DAYS.map(d => <th key={d} className="px-4 py-4 font-bold text-center">{d.slice(0,3)}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(zones).map(([zoneName, activeDays]) => (
                    <tr key={zoneName} className="hover:bg-secondary/20">
                      <td className="px-6 py-4 font-bold border-r border-border bg-card">{zoneName}</td>
                      {DAYS.map((_, i) => (
                        <td key={i} className="px-4 py-4 text-center">
                          {activeDays.includes(i) ? (
                            <div className="w-6 h-6 mx-auto rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 mx-auto rounded-full bg-secondary/30 border border-border" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
