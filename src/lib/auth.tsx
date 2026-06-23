import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearToken, loadToken, saveToken, type Me } from "./api";

type AuthState = {
  user: Me | null;
  loading: boolean; // initial token bootstrap
  signIn: (email: string, password: string, otp?: string) => Promise<void>;
  signInWithToken: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // On launch, restore a stored token and fetch the profile.
  useEffect(() => {
    (async () => {
      try {
        const token = await loadToken();
        if (token) {
          try {
            setUser(await api.me());
          } catch {
            await clearToken();
          }
        }
      } finally {
        setLoading(false); // always leave the loading state, even on unexpected errors
      }
    })();
  }, []);

  async function signInWithToken(token: string) {
    await saveToken(token);
    setUser(await api.me());
  }

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      signIn: async (email, password, otp) => {
        const res = await api.login(email, password, otp);
        await signInWithToken(res.token);
      },
      signInWithToken,
      signOut: async () => {
        await clearToken();
        setUser(null);
      },
      refresh: async () => {
        try {
          setUser(await api.me());
        } catch {
          /* keep current */
        }
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
