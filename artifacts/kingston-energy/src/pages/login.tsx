import React, { useState } from 'react';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { Card, CardHeader, CardContent, Input, Label, Button } from '@/components/ui/all';
import { Zap, KeyRound, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setToken } = useAuth();
  const loginMut = useLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    loginMut.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          // Simple client-side redirect routing based on role
          setTimeout(() => {
            if (data.user.role === 'admin' || data.user.role === 'manager') window.location.href = '/dashboard';
            else if (data.user.role === 'driver') window.location.href = '/driver';
            else window.location.href = '/resident';
          }, 100);
        },
        onError: (err: any) => {
          setError(err?.response?.data?.error || 'Invalid credentials');
        }
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      
      {/* Background image & gradient wash */}
      <div 
        className="absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/login-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary/20 border border-primary/50 flex items-center justify-center rounded-2xl mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-2">Kingston Energy</h1>
          <p className="text-primary font-bold tracking-widest uppercase text-xs">Waste-to-Energy Tracking System</p>
        </div>

        <Card className="glass-panel">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm font-semibold text-center">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>Operator ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Enter username" 
                    className="pl-9 h-11"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Security Key</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Enter password" 
                    className="pl-9 h-11"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loginMut.isPending}>
                {loginMut.isPending ? "Authenticating..." : "Initialize Session"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p className="mb-2 font-bold uppercase tracking-wider">Demo Access Profiles</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="bg-secondary px-2 py-1 rounded border border-border font-mono">admin / admin123</span>
            <span className="bg-secondary px-2 py-1 rounded border border-border font-mono">driver / driver123</span>
            <span className="bg-secondary px-2 py-1 rounded border border-border font-mono">user / user123</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
