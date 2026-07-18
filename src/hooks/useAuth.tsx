"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { ensureSignedIn, subscribeAuth } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  mode: "firebase" | "local";
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let active = true;

    const unsubscribe = subscribeAuth(
      (nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setLoading(false);
      },
      (authError) => {
        if (!active) return;
        setError(authError.message);
        setLoading(false);
      },
    );

    ensureSignedIn().catch((authError: unknown) => {
      if (!active) return;
      setError(
        authError instanceof Error
          ? authError.message
          : "익명 로그인에 실패했습니다.",
      );
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      mode: configured ? "firebase" : "local",
      error,
    }),
    [configured, error, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
