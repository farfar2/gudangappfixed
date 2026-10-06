import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/database';
import { SEED_PROFILES } from '../lib/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;          // shorthand for user?.profile
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_SESSION_KEY = 'gudangapp_auth_v2';

// Superadmin seed credentials (demo fallback only)
const SUPERADMIN_SEED = {
  id: 'usr-superadmin',
  email: 'superadmin@gudangapp.com',
  profile: { id: 'usr-superadmin', full_name: 'Super Admin', role: 'superadmin' as UserRole,
             created_at: new Date().toISOString() },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const su = data.session.user;
            const { data: pd } = await supabase.from('profiles').select('*').eq('id', su.id).single();
            const profile: Profile = pd ?? {
              id: su.id,
              full_name: su.email?.split('@')[0] ?? 'User',
              role: (su.user_metadata?.role as UserRole) ?? 'staff',
              created_at: new Date().toISOString(),
            };
            setUser({ id: su.id, email: su.email ?? '', profile });
            setLoading(false);
            return;
          }
          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              const { data: pd } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
              const profile: Profile = pd ?? {
                id: session.user.id,
                full_name: session.user.email?.split('@')[0] ?? 'User',
                role: 'staff' as UserRole,
                created_at: new Date().toISOString(),
              };
              setUser({ id: session.user.id, email: session.user.email ?? '', profile });
            } else {
              setUser(null);
            }
          });
        }
        // Demo fallback: restore from localStorage
        const saved = localStorage.getItem(LOCAL_SESSION_KEY);
        if (saved) setUser(JSON.parse(saved));
        else {
          // Auto-login as admin for demo
          const demo = { id: 'usr-admin', email: 'admin@gudangapp.com', profile: SEED_PROFILES[0] };
          setUser(demo);
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(demo));
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const clean = email.trim().toLowerCase();
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: clean, password });
        if (error) return error.message;
        if (data.user) {
          const { data: pd } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          const profile: Profile = pd ?? {
            id: data.user.id,
            full_name: data.user.email?.split('@')[0] ?? 'User',
            role: 'staff' as UserRole,
            created_at: new Date().toISOString(),
          };
          const au: AuthUser = { id: data.user.id, email: data.user.email ?? '', profile };
          setUser(au);
          return null;
        }
      }
      // Demo fallback
      const demoMap: Record<string, AuthUser> = {
        'superadmin@gudangapp.com': SUPERADMIN_SEED,
        'admin@gudangapp.com':      { id: 'usr-admin',  email: 'admin@gudangapp.com',  profile: SEED_PROFILES[0] },
        'staff@gudangapp.com':      { id: 'usr-staff',  email: 'staff@gudangapp.com',  profile: SEED_PROFILES[1] },
      };
      const passwordMap: Record<string, string> = {
        'superadmin@gudangapp.com': 'Super123!',
        'admin@gudangapp.com':      'Admin123!',
        'staff@gudangapp.com':      'Staff123!',
      };
      if (demoMap[clean] && passwordMap[clean] === password) {
        const au = demoMap[clean];
        setUser(au);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(au));
        return null;
      }
      return 'Email atau password salah';
    } catch (e: any) {
      return e?.message ?? 'Terjadi kesalahan';
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(LOCAL_SESSION_KEY);
  };

  const role = user?.profile.role;
  const isSuperAdmin = role === 'superadmin';
  const isAdmin      = role === 'admin' || isSuperAdmin;
  const isStaff      = role === 'staff';

  return (
    <AuthContext.Provider value={{
      user, profile: user?.profile ?? null, loading,
      signIn, signOut, isAdmin, isSuperAdmin, isStaff,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
