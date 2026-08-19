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

// Shared across all AuthProvider instances (and StrictMode's double-invoke) so that
// concurrent refresh attempts share one in-flight request instead of each firing its
// own call against the single-use refresh token.
let inFlightRefresh: Promise<AuthResult> | null = null;

function refreshOnce(): Promise<AuthResult> {
  if (!inFlightRefresh) {
    inFlightRefresh = refreshSession().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    setRefreshHandler(async () => {
      try {
        const result = await refreshOnce();
        setAccessToken(result.accessToken);
        setUser(result.user);
        return result.accessToken;
      } catch {
        setAccessToken(null);
        setUser(null);
        return null;
      }
    });

    refreshOnce()
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
    try {
      await logoutApi();
    } finally {
      setAccessToken(null);
      setUser(null);
      queryClient.clear();
    }
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
