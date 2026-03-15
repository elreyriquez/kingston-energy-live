import React from 'react';
import { Sidebar } from './sidebar';
import { AiChatWidget } from '../ai/ai-chat';
import { AiAlertsPanel } from '../ai/ai-alerts';
import { Menu } from 'lucide-react';
import { Button } from '../ui/all';
import { useAuth } from '@/lib/auth';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-4 md:px-6 shrink-0 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 border border-primary/50" />
            <span className="font-display font-bold text-lg">KE WMS</span>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="w-5 h-5" />
          </Button>
        </header>
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="h-full absolute inset-0">
            {children}
          </div>
        </main>

        <AiAlertsPanel />
        <AiChatWidget />
      </div>
    </div>
  );
}
