import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  provider?: 'apple' | 'google';
};

type AuthCtx = {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUser: (u: AppUser | null) => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside provider');
  return v;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Try getSession first (more reliable for initial load)
      const { data: sessData } = await supabase.auth.getSession();
      
      if (!mounted) return;
      const u = sessData?.session?.user;
      
      if (!u) {
        // Fallback to getUser if no session
        const { data: userData } = await supabase.auth.getUser();
        const fallbackUser = userData?.user;
        setUser(
          fallbackUser
            ? {
                id: fallbackUser.id,
                name: (fallbackUser.user_metadata as any)?.name ?? null,
                email: fallbackUser.email ?? (fallbackUser.user_metadata as any)?.email ?? null,
                avatarUrl: (fallbackUser.user_metadata as any)?.picture ?? null,
              }
            : null
        );
      } else {
        setUser({
          id: u.id,
          name: (u.user_metadata as any)?.name ?? null,
          email: u.email ?? (u.user_metadata as any)?.email ?? null,
          avatarUrl: (u.user_metadata as any)?.picture ?? null,
        });
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(
        u
          ? {
              id: u.id,
              name: (u.user_metadata as any)?.name ?? null,
              email: u.email ?? (u.user_metadata as any)?.email ?? null,
              avatarUrl: (u.user_metadata as any)?.picture ?? null,
            }
          : null
      );
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        setUser,
        signOut: async () => {
          await supabase.auth.signOut();
          setUser(null);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}


