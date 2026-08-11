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
  getCurrentUser,
  logoutUser,
} from "@/lib/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  user: AuthUser | null;
  login: (payload: AuthSuccess) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncAuthState() {
      try {
        const authenticatedUser = await getCurrentUser();

        if (isMounted) {
          setUser(authenticatedUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void syncAuthState();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: Boolean(user),
    isReady,
    user,
    login(payload) {
      setUser(payload.user);
    },
    async logout() {
      try {
        await logoutUser();
      } finally {
        setUser(null);
      }

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
