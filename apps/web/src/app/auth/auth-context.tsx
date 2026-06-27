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
import { isSupabaseConfigured, supabase } from './supabase-client';

type AuthMode = 'supabase' | 'dev';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** 'supabase' when client auth is configured, else the dev-login fallback. */
  mode: AuthMode;
  /** Email/password are used in 'supabase' mode and ignored in 'dev' mode. */
  signIn: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mode: AuthMode = isSupabaseConfigured ? 'supabase' : 'dev';

  // Restore an existing session on load.
  useEffect(() => {
    void (async () => {
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            tokenStore.set(data.session.access_token);
            setUser(await api.auth.me());
          }
        } else if (tokenStore.get()) {
          setUser(await api.auth.me());
        }
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email?: string, password?: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email ?? '',
        password: password ?? '',
      });
      if (error) throw new Error(error.message);
      tokenStore.set(data.session?.access_token ?? '');
      setUser(await api.auth.me()); // backend provisions the user row if new
    } else {
      const session = await api.auth.devLogin();
      tokenStore.set(session.accessToken);
      setUser(session.user);
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, mode, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
