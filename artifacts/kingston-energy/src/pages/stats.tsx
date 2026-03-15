import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useGetStats } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/all';
import { formatEnergy, formatWeight } from '@/lib/utils';
import { Zap, TrendingUp, Home, Leaf } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Mock historical data for charts
const monthlyData = [
  { name: 'Jan', energy: 120000, waste: 45000 },
  { name: 'Feb', energy: 135000, waste: 51000 },
  { name: 'Mar', energy: 125000, waste: 48000 },
  { name: 'Apr', energy: 150000, waste: 55000 },
  { name: 'May', energy: 145000, waste: 53000 },
  { name: 'Jun', energy: 160000, waste: 58000 },
];

export default function Stats() {
  const { data } = useGetStats();

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Analytics Hub</h1>
          <p className="text-muted-foreground">Historical performance and conversion metrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Energy Gen." value={formatEnergy(data?.energy_generated_kwh || 0)} icon={<Zap/>} color="text-primary" />
          <StatCard title="Waste Processed" value={formatWeight(data?.waste_collected_kg || 0)} icon={<TrendingUp/>} color="text-amber-500" />
          <StatCard title="Homes Powered" value={(data?.homes_powered || 0).toLocaleString()} icon={<Home/>} color="text-blue-500" />
          <StatCard title="CO2 Offset" value={formatWeight(data?.co2_offset_kg || 0)} icon={<Leaf/>} color="text-emerald-400" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Energy Generation Trend (kWh)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waste Collection Volume (kg)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} cursor={{ fill: '#1e293b' }} />
                  <Bar dataKey="waste" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border ${color}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        <div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold font-mono text-foreground mt-1">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
