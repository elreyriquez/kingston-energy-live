import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { 
  LayoutDashboard, 
  Map, 
  FileText, 
  Calendar, 
  Trash2, 
  BarChart3, 
  LogOut, 
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui-store';

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const toggleAlerts = useUiStore(s => s.toggleAlerts);

  if (!user) return null;

  const navItems = [];

  if (user.role === 'admin' || user.role === 'manager') {
    navItems.push(
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Reports', href: '/reports', icon: FileText },
      { label: 'Schedule', href: '/schedule', icon: Calendar },
      { label: 'Smart Bins', href: '/bins', icon: Trash2 },
      { label: 'Analytics', href: '/stats', icon: BarChart3 }
    );
  } else if (user.role === 'driver') {
    navItems.push(
      { label: 'My Routes', href: '/driver', icon: Map },
      { label: 'Reports', href: '/reports', icon: FileText }
    );
  } else if (user.role === 'user') {
    navItems.push(
      { label: 'Resident Portal', href: '/resident', icon: LayoutDashboard },
      { label: 'My Reports', href: '/reports', icon: FileText }
    );
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col hidden md:flex shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg tracking-tight leading-none text-foreground">Kingston</h2>
          <p className="text-primary text-xs font-semibold tracking-widest uppercase">Energy</p>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider px-2">Navigation</div>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}>
              <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-70")} />
              {item.label}
            </Link>
          );
        })}

        {(user.role === 'admin' || user.role === 'manager') && (
          <button 
            onClick={toggleAlerts}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-500/80 hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200 mt-2 border border-transparent hover:border-amber-500/20"
          >
            <div className="relative">
              <Zap className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive animate-pulse" />
            </div>
            System Alerts
          </button>
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground border border-border">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize truncate">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors border border-transparent hover:border-destructive/20"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
