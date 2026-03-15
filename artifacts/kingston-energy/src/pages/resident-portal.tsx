import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui/all';
import { Link } from 'wouter';
import { Calendar, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import { useGetStats } from '@workspace/api-client-react';

export default function ResidentPortal() {
  const { user } = useAuth();
  const { data: stats } = useGetStats();

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-2xl p-8 md:p-12">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 blur-3xl rounded-full mix-blend-screen pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <Badge variant="success" className="mb-4">Resident Portal</Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
              Welcome back to <span className="text-primary">Kingston Energy</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Your waste contributes to powering our city. View your schedule, report issues, and track our collective impact.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/reports">
                <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25">
                  <AlertCircle className="w-4 h-4 mr-2" /> Report an Issue
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:border-primary/50 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-primary mb-4 border border-border">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">My Collection Schedule</h3>
                <p className="text-muted-foreground text-sm mb-6">Your registered zone is <strong className="text-foreground">{user?.zone || 'Downtown Kingston'}</strong>. Trucks arrive between 7 AM and 1 PM.</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-4 font-bold text-center text-lg text-primary">
                Every Monday & Thursday
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-blue-500 mb-4 border border-border">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">City Energy Impact</h3>
                <p className="text-muted-foreground text-sm mb-6">The municipal waste-to-energy conversion totals for this month across Kingston.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background border border-border rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Homes Powered</p>
                  <p className="text-xl font-mono font-bold text-blue-500">{stats?.homes_powered?.toLocaleString() || '14,250'}</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">CO2 Offset (kg)</p>
                  <p className="text-xl font-mono font-bold text-emerald-500">{(stats?.co2_offset_kg || 48500).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </MainLayout>
  );
}

// Inline Badge for local use in portal to prevent import conflicts
function Badge({ children, variant="default", className }: any) {
  return <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variant==='success' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' : 'bg-primary text-primary-foreground'} ${className}`}>{children}</div>
}
