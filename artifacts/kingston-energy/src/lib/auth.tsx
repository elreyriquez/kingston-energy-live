import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGetMe, User, UserRole } from '@workspace/api-client-react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('ke_auth_token'));

  const setToken = (newToken: string) => {
    localStorage.setItem('ke_auth_token', newToken);
    setTokenState(newToken);
  };

  const logout = () => {
    localStorage.removeItem('ke_auth_token');
    setTokenState(null);
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.location.href = `${base}/login`;
  };

  // Only run query if we have a token
  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) {
      logout(); // Invalid token
    }
  }, [isError]);

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      isLoading, 
      isAuthenticated: !!user,
      setToken,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
