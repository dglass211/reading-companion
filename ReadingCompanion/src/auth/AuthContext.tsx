import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut as doSignOut, User } from './auth';

type AuthCtx = {
  user: User | null;
  setUser: (u: User | null) => void;
  signOut: () => Promise<void>;
  loading: boolean;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside provider');
  return v;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        setUser(await getCurrentUser());
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return (
    <Ctx.Provider value={{ user, setUser, signOut: async () => { await doSignOut(); setUser(null); }, loading }}>
      {children}
    </Ctx.Provider>
  );
}


