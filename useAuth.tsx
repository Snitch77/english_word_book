"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  signInWithGoogle,
  signOut,
  subscribeAuth,
} from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  mode: "firebase" | "local";
  error: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
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

    const unsubscribe = subscribeAuth(
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
        setError(null);
      },
      (authError) => {
        setError(authError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [configured]);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Google 로그인에 실패했습니다.",
      );
      throw authError;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setError(null);
    await signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      mode: configured ? "firebase" : "local",
      error,
      signIn,
      signOutUser,
    }),
    [configured, error, loading, signIn, signOutUser, user],
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
