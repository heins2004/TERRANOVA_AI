"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  AuthSuccess,
  AuthUser,
  clearAuthSession,
  getStoredUser,
  hasStoredSession,
  persistAuthSession,
} from "@/lib/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  user: AuthUser | null;
  login: (payload: AuthSuccess) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      if (!hasStoredSession()) {
        setUser(null);
        setIsReady(true);
        return;
      }

      setUser(getStoredUser());
      setIsReady(true);
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: Boolean(user),
    isReady,
    user,
    login(payload) {
      persistAuthSession(payload);
      setUser(payload.user);
    },
    logout() {
      clearAuthSession();
      setUser(null);
      router.replace("/login");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
