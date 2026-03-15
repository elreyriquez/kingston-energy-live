import React, { useEffect } from 'react';
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from '@/lib/auth';
import { setupFetchInterceptor } from '@/lib/fetch-interceptor';

// Pages
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import Reports from '@/pages/reports';
import Schedule from '@/pages/schedule';
import SmartBins from '@/pages/smart-bins';
import Stats from '@/pages/stats';
import DriverPortal from '@/pages/driver-portal';
import ResidentPortal from '@/pages/resident-portal';
import NotFound from "@/pages/not-found";

// Initialize Interceptor before API calls are made
setupFetchInterceptor();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    } else if (!isLoading && isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Basic role redirect fallback
      if (user.role === 'admin' || user.role === 'manager') setLocation('/dashboard');
      else if (user.role === 'driver') setLocation('/driver');
      else setLocation('/resident');
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, setLocation]);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background text-primary">Initializing Link...</div>;
  }

  if (!isAuthenticated) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <Component />;
}

// Redirect root based on login status
function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation('/login');
      } else {
        if (user?.role === 'admin' || user?.role === 'manager') setLocation('/dashboard');
        else if (user?.role === 'driver') setLocation('/driver');
        else setLocation('/resident');
      }
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  return <div className="h-screen w-full flex items-center justify-center bg-background text-primary">Routing...</div>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      
      {/* Admin / Manager Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} allowedRoles={['admin', 'manager']} />}
      </Route>
      <Route path="/schedule">
        {() => <ProtectedRoute component={Schedule} allowedRoles={['admin', 'manager']} />}
      </Route>
      <Route path="/bins">
        {() => <ProtectedRoute component={SmartBins} allowedRoles={['admin', 'manager']} />}
      </Route>
      <Route path="/stats">
        {() => <ProtectedRoute component={Stats} allowedRoles={['admin', 'manager']} />}
      </Route>

      {/* Driver Route */}
      <Route path="/driver">
        {() => <ProtectedRoute component={DriverPortal} allowedRoles={['driver']} />}
      </Route>

      {/* Resident Route */}
      <Route path="/resident">
        {() => <ProtectedRoute component={ResidentPortal} allowedRoles={['user']} />}
      </Route>

      {/* Shared Route */}
      <Route path="/reports">
        {() => <ProtectedRoute component={Reports} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
