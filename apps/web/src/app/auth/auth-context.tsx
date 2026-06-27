import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser } from 'shared-types';
import { tokenStore } from '../api/client';
import { api } from '../api/endpoints';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** Verify email/password via the backend (which checks Supabase Auth). */
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore an existing session on load.
  useEffect(() => {
    void (async () => {
      try {
        if (tokenStore.get()) {
          setUser(await api.auth.me());
        }
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const session = await api.auth.login(email, password);
    tokenStore.set(session.accessToken);
    setUser(session.user);
  };

  const logout = async () => {
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
