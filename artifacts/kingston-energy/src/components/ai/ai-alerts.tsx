import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wrench, Route, Zap, ShieldAlert, CloudRain, TrendingDown, AlertTriangle } from 'lucide-react';
import { useUiStore } from '@/store/ui-store';
import { useGetAiAlerts, AiAlert } from '@workspace/api-client-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '../ui/all';

const ICON_MAP: Record<string, React.ElementType> = {
  'MAINTENANCE': Wrench,
  'ROUTE': Route,
  'CAPACITY': Zap,
  'SAFETY': ShieldAlert,
  'WEATHER': CloudRain,
  'EFFICIENCY': TrendingDown,
};

export function AiAlertsPanel() {
  const { isAlertsOpen, closeAlerts } = useUiStore();
  const { data } = useGetAiAlerts({ query: { refetchInterval: 30000, enabled: isAlertsOpen } });
  
  return (
    <AnimatePresence>
      {isAlertsOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAlerts}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl leading-none">System Alerts</h3>
                  <p className="text-sm text-muted-foreground">AI Monitoring Engine</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={closeAlerts} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(!data?.alerts || data.alerts.length === 0) ? (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                  <Zap className="w-8 h-8 mb-2 opacity-20" />
                  No active alerts at this time.
                </div>
              ) : (
                data.alerts.map((alert: AiAlert) => {
                  const Icon = ICON_MAP[alert.type] || AlertTriangle;
                  
                  let borderClass = 'border-blue-500/30';
                  let bgClass = 'bg-blue-500/5';
                  let iconColor = 'text-blue-500';
                  
                  if (alert.priority === 'critical') {
                    borderClass = 'border-destructive/50';
                    bgClass = 'bg-destructive/10';
                    iconColor = 'text-destructive';
                  } else if (alert.priority === 'high') {
                    borderClass = 'border-amber-500/50';
                    bgClass = 'bg-amber-500/10';
                    iconColor = 'text-amber-500';
                  } else if (alert.priority === 'medium') {
                    borderClass = 'border-yellow-500/30';
                    bgClass = 'bg-yellow-500/5';
                    iconColor = 'text-yellow-500';
                  }

                  return (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("p-4 rounded-xl border relative overflow-hidden group", borderClass, bgClass)}
                    >
                      <div className="flex gap-4 relative z-10">
                        <div className={cn("mt-1", iconColor)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm">{alert.title}</h4>
                            <span className="text-[10px] uppercase font-bold opacity-60">
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 leading-snug">{alert.message}</p>
                          {alert.truck_id && (
                            <div className="mt-2 inline-block px-2 py-0.5 rounded bg-background border border-border text-[10px] font-mono">
                              UNIT: {alert.truck_id}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
