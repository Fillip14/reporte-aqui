import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setAccessToken, setRefreshHandler } from '../api/client';
import { refreshSession, logout as logoutApi, type AuthUser, type AuthResult } from '../api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  setSession: (result: AuthResult) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    setRefreshHandler(async () => {
      try {
        const result = await refreshSession();
        setAccessToken(result.accessToken);
        setUser(result.user);
        return result.accessToken;
      } catch {
        setAccessToken(null);
        setUser(null);
        return null;
      }
    });

    refreshSession()
      .then((result) => {
        setAccessToken(result.accessToken);
        setUser(result.user);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  function setSession(result: AuthResult) {
    setAccessToken(result.accessToken);
    setUser(result.user);
  }

  async function logout() {
    await logoutApi();
    setAccessToken(null);
    setUser(null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setSession, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
